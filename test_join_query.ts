import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testJoinQuery() {
  try {
    console.log('🔍 JOIN 쿼리 테스트...\n');
    
    // KOREAN 카테고리 ID 가져오기
    const { data: koreanCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('name', 'KOREAN')
      .single();
    
    console.log('KOREAN 카테고리 ID:', koreanCategory?.id);
    
    // JOIN 쿼리 테스트
    const { data, error } = await supabase
      .from('words')
      .select(`
        id, english, korean, pronunciation, part_of_speech, tip, 
        is_toeic, is_toefl, is_gtelp, is_suneung, is_gongmuwon,
        word_categories!inner(category_id)
      `)
      .eq('word_categories.category_id', koreanCategory!.id)
      .order('id', { ascending: true })
      .range(0, 4);
      
    if (error) {
      console.log('❌ JOIN 쿼리 오류:', error);
    } else {
      console.log('✅ JOIN 쿼리 성공!');
      console.log(`반환된 단어 수: ${data?.length}`);
      
      data?.forEach((word, index) => {
        console.log(`${index + 1}. ID: ${word.id}, 영어: ${word.english}, 한국어: ${word.korean}`);
      });
    }
    
  } catch (error) {
    console.error('오류:', error);
  }
}

testJoinQuery();