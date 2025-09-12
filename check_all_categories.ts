import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllCategories() {
  try {
    // 1. 모든 카테고리와 단어 수 확인
    const { data: categories } = await supabase
      .from('categories')
      .select('*');
    
    console.log('📊 All Categories:');
    for (const category of categories || []) {
      const { count } = await supabase
        .from('word_categories')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id);
        
      console.log(`${category.name}: ${count || 0} words`);
    }
    
    // 2. 한국어 단어 샘플
    console.log('\n🇰🇷 Korean Words Sample:');
    const { data: koreanCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('name', 'KOREAN')
      .single();
      
    if (koreanCategory) {
      const { data: wordIds } = await supabase
        .from('word_categories')
        .select('word_id')
        .eq('category_id', koreanCategory.id)
        .limit(10);
        
      if (wordIds) {
        const { data: words } = await supabase
          .from('words')
          .select('korean, english')
          .in('id', wordIds.map(w => w.word_id));
          
        words?.forEach((word, index) => {
          console.log(`${index + 1}. ${word.korean} → ${word.english}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAllCategories();