import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugKoreanCategory() {
  try {
    console.log('🔍 한국어 카테고리 디버깅...\n');
    
    // 1. 카테고리 확인
    const { data: categories } = await supabase
      .from('categories')
      .select('*');
    console.log('📋 모든 카테고리:', categories);
    
    // 2. KOREAN 카테고리 ID 찾기
    const { data: koreanCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('name', 'KOREAN')
      .single();
    
    if (!koreanCategory) {
      console.log('❌ KOREAN 카테고리를 찾을 수 없습니다.');
      return;
    }
    
    console.log('\n✅ KOREAN 카테고리 ID:', koreanCategory.id);
    
    // 3. word_categories 관계 확인
    const { data: wordCategories, count } = await supabase
      .from('word_categories')
      .select('word_id', { count: 'exact' })
      .eq('category_id', koreanCategory.id)
      .limit(10);
      
    console.log(`\n📊 word_categories 관계: ${count}개 발견`);
    console.log('처음 10개 word_id:', wordCategories?.map(wc => wc.word_id));
    
    // 4. 실제 단어들 확인
    if (wordCategories && wordCategories.length > 0) {
      const wordIds = wordCategories.map(wc => wc.word_id);
      const { data: words } = await supabase
        .from('words')
        .select('id, english, korean')
        .in('id', wordIds)
        .limit(5);
        
      console.log('\n📝 실제 단어들:');
      words?.forEach(word => {
        console.log(`ID: ${word.id}, 영어: ${word.english}, 한국어: ${word.korean}`);
      });
    }
    
    // 5. URL 길이 확인
    if (wordCategories && wordCategories.length > 0) {
      const wordIds = wordCategories.map(wc => wc.word_id);
      const queryUrl = `id=in.(${wordIds.join(',')})`;
      console.log(`\n📏 쿼리 URL 길이: ${queryUrl.length} 문자`);
      
      if (queryUrl.length > 8000) {
        console.log('⚠️  URL이 너무 깁니다! 브라우저 한계를 초과할 수 있습니다.');
      }
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

debugKoreanCategory();