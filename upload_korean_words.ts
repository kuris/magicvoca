import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 환경변수 로드
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface KoreanWord {
  korean: string;
  english: string;
}

async function parseKoreanWordsFromCSV() {
  try {
    const fileContent = fs.readFileSync('koreanword_clean.csv', 'utf-8');
    
    // CSV 파싱
    const lines = fileContent.split('\n');
    const header = lines[0]; // korean,english
    const koreanWords: KoreanWord[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // CSV 파싱 (간단한 방식)
      const commaIndex = line.indexOf(',');
      if (commaIndex > 0) {
        const korean = line.substring(0, commaIndex).trim();
        const english = line.substring(commaIndex + 1).trim();
        
        if (korean && english) {
          koreanWords.push({
            korean: korean,
            english: english
          });
        }
      }
    }
    
    console.log(`Parsed ${koreanWords.length} Korean words`);
    return koreanWords;
    
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return [];
  }
}

async function insertKoreanWords() {
  try {
    const koreanWords = await parseKoreanWordsFromCSV();
    
    if (koreanWords.length === 0) {
      console.log('No words to insert');
      return;
    }
    
    // 1. KOREAN 카테고리 ID 가져오기
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('name', 'KOREAN')
      .single();
      
    if (categoryError || !categoryData) {
      console.error('KOREAN category not found:', categoryError);
      return;
    }
    
    const categoryId = categoryData.id;
    console.log(`KOREAN category ID: ${categoryId}`);
    
    // 2. 배치로 단어 삽입
    const BATCH_SIZE = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < koreanWords.length; i += BATCH_SIZE) {
      const batch = koreanWords.slice(i, i + BATCH_SIZE);
      
      // words 테이블에 삽입할 데이터 준비
      const wordsToInsert = batch.map(word => ({
        english: word.english, // 영어를 english 컬럼에 저장
        korean: word.korean,   // 한국어를 korean 컬럼에 저장
        pronunciation: null,
        part_of_speech: null,
        tip: null,
        category: 'KOREAN',
        is_toeic: false,
        is_toefl: false,
        is_gtelp: false,
        is_suneung: false,
        is_gongmuwon: false
      }));
      
      // 단어 삽입
      const { data: insertedWords, error: insertError } = await supabase
        .from('words')
        .insert(wordsToInsert)
        .select('id');
        
      if (insertError) {
        console.error(`Error inserting batch ${i / BATCH_SIZE + 1}:`, insertError);
        continue;
      }
      
      if (insertedWords) {
        // word_categories 테이블에 관계 삽입
        const wordCategories = insertedWords.map(word => ({
          word_id: word.id,
          category_id: categoryId
        }));
        
        const { error: relationError } = await supabase
          .from('word_categories')
          .insert(wordCategories);
          
        if (relationError) {
          console.error(`Error inserting word-category relations for batch ${i / BATCH_SIZE + 1}:`, relationError);
        } else {
          insertedCount += insertedWords.length;
          console.log(`Inserted batch ${i / BATCH_SIZE + 1}: ${insertedWords.length} words (Total: ${insertedCount})`);
        }
      }
    }
    
    console.log(`✅ Successfully inserted ${insertedCount} Korean words`);
    
  } catch (error) {
    console.error('Error inserting Korean words:', error);
  }
}

// 실행
insertKoreanWords().then(() => {
  console.log('Korean words insertion completed');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});