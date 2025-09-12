import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUrlLength() {
  try {
    // KOREAN 카테고리의 모든 word_id 가져오기
    const { data: koreanCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('name', 'KOREAN')
      .single();
      
    const { data: wordCategories } = await supabase
      .from('word_categories')
      .select('word_id')
      .eq('category_id', koreanCategory!.id);
      
    const wordIds = wordCategories!.map(wc => wc.word_id);
    
    console.log(`총 단어 수: ${wordIds.length}`);
    
    // URL 길이 확인
    const queryParam = `id=in.(${wordIds.join(',')})`;
    const baseUrl = 'http://127.0.0.1:54321/rest/v1/words?select=id%2Cenglish%2Ckorean%2Cpronunciation%2Cpart_of_speech%2Ctip%2Cis_toeic%2Cis_toefl%2Cis_gtelp%2Cis_suneung%2Cis_gongmuwon&';
    const fullUrl = baseUrl + queryParam + '&order=id.asc&offset=0&limit=50';
    
    console.log(`\n쿼리 파라미터 길이: ${queryParam.length}`);
    console.log(`전체 URL 길이: ${fullUrl.length}`);
    
    if (fullUrl.length > 8000) {
      console.log('⚠️  URL이 너무 깁니다! 브라우저/서버 한계 초과');
    }
    
    // 실제 요청 테스트
    console.log('\n🔍 실제 API 요청 테스트...');
    const { data, error } = await supabase
      .from('words')
      .select('id, english, korean')
      .in('id', wordIds.slice(0, 50))
      .limit(5);
      
    if (error) {
      console.log('❌ API 오류:', error);
    } else {
      console.log('✅ API 성공:', data?.length, '개 단어 반환');
    }
    
  } catch (error) {
    console.error('오류:', error);
  }
}

checkUrlLength();