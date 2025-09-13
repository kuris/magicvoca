import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

import fs from 'fs';

dotenv.config({ path: '.env.local' });

const logMsg = `[${new Date().toISOString()}] Connecting to Supabase: ${process.env.SUPABASE_URL}\n`;
fs.appendFileSync('server.log', logMsg);
console.log('Connecting to Supabase:', process.env.SUPABASE_URL);
console.log('Connecting to Supabase:', process.env.SUPABASE_URL);
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCategories() {
  try {
    console.log('📋 모든 카테고리 확인:');
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    categories?.forEach(cat => {
      console.log(`ID: ${cat.id}, Name: "${cat.name}"`);
    });
    
    console.log('\n🔍 kr-en-basic 관련 검색:');
    const { data: krCategories } = await supabase
      .from('categories')
      .select('*')
      .ilike('name', '%kr%');
      
    krCategories?.forEach(cat => {
      console.log(`Found: ID: ${cat.id}, Name: "${cat.name}"`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCategories();