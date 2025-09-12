import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkKoreanWords() {
  try {
    // 카테고리별 단어 수 확인
    const { data: categoryCount } = await supabase
      .from('categories')
      .select(`
        name,
        word_categories(count)
      `);
    
    console.log('📊 Category word counts:');
    categoryCount?.forEach(cat => {
      console.log(`${cat.name}: ${cat.word_categories?.length || 0} words`);
    });
    
    // 한국어 단어 샘플 조회
    const { data, error } = await supabase
      .from('words')
      .select(`
        english,
        korean,
        word_categories(
          categories(name)
        )
      `)
      .eq('word_categories.categories.name', 'KOREAN')
      .limit(10);
      
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log('\n🇰🇷 Korean Words Sample:');
    console.log('=======================');
    data?.forEach((word, index) => {
      console.log(`${index + 1}. ${word.korean}`);
      console.log(`   English: ${word.english}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

checkKoreanWords();