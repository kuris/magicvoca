import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 환경변수 로드
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface ThaiWord {
  korean: string;
  thai: string; 
  pronunciation: string;
}

async function parseThaiWordsFromCSV() {
  try {
    const fileContent = fs.readFileSync('thaiword_db.csv', 'utf-8');
    
    // HTML 테이블 파싱
    const rows = fileContent.split('<tr>').slice(1); // 첫 번째 빈 부분 제거
    const thaiWords: ThaiWord[] = [];
    
    for (const row of rows) {
      const cells = row.match(/<td[^>]*>(.*?)<\/td>/g);
      if (cells && cells.length >= 3) {
        const korean = cells[0].replace(/<td[^>]*>/, '').replace(/<\/td>/, '').trim();
        const thai = cells[1].replace(/<td[^>]*>/, '').replace(/<\/td>/, '').trim();
        const pronunciation = cells[2].replace(/<td[^>]*>/, '').replace(/<\/td>/, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/＾/g, '^')
          .replace(/↘/g, '↘')
          .replace(/↗/g, '↗')
          .trim();
        
        if (korean && thai && pronunciation) {
          // 한국어에서 번호 제거 (예: "1.뭐하는 중이야." -> "뭐하는 중이야.")
          const cleanKorean = korean.replace(/^\d+\.?\s*/, '');
          
          thaiWords.push({
            korean: cleanKorean,
            thai: thai,
            pronunciation: pronunciation.replace(/[()]/g, '') // 괄호 제거
          });
        }
      }
    }
    
    console.log(`Parsed ${thaiWords.length} Thai words`);
    return thaiWords;
    
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return [];
  }
}

async function insertThaiWords() {
  try {
    const thaiWords = await parseThaiWordsFromCSV();
    
    if (thaiWords.length === 0) {
      console.log('No words to insert');
      return;
    }
    
    // 1. THAI 카테고리 ID 가져오기
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('name', 'THAI')
      .single();
      
    if (categoryError || !categoryData) {
      console.error('THAI category not found:', categoryError);
      return;
    }
    
    const categoryId = categoryData.id;
    console.log(`THAI category ID: ${categoryId}`);
    
    // 2. 배치로 단어 삽입
    const BATCH_SIZE = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < thaiWords.length; i += BATCH_SIZE) {
      const batch = thaiWords.slice(i, i + BATCH_SIZE);
      
      // words 테이블에 삽입할 데이터 준비
      const wordsToInsert = batch.map(word => ({
        english: word.thai, // 태국어를 english 컬럼에 저장
        korean: word.korean,
        pronunciation: word.pronunciation,
        part_of_speech: null,
        tip: null,
        category: 'THAI',
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
    
    console.log(`✅ Successfully inserted ${insertedCount} Thai words`);
    
  } catch (error) {
    console.error('Error inserting Thai words:', error);
  }
}

// 실행
insertThaiWords().then(() => {
  console.log('Thai words insertion completed');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});