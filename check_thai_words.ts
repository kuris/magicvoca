import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkThaiWords() {
  try {
    // 태국어 단어 샘플 조회
    const { data, error } = await supabase
      .from('words')
      .select(`
        english,
        korean,
        pronunciation,
        word_categories(
          categories(name)
        )
      `)
      .eq('word_categories.categories.name', 'THAI')
      .limit(5);
      
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log('🇹🇭 Thai Words Sample:');
    console.log('=====================');
    data?.forEach((word, index) => {
      console.log(`${index + 1}. ${word.korean}`);
      console.log(`   Thai: ${word.english}`);
      console.log(`   Pronunciation: ${word.pronunciation}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

checkThaiWords();