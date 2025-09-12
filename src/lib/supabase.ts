import { createClient } from '@supabase/supabase-js';


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[Supabase] VITE_SUPABASE_URL:', supabaseUrl);
console.log('[Supabase] VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? supabaseAnonKey.slice(0, 8) + '...' : 'undefined');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing environment variables:', { supabaseUrl, supabaseAnonKey });
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      comments: {
        Row: {
          id: string;
          word_id: number;
          content: string;
          author: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          word_id: number;
          content: string;
          author?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          word_id?: number;
          content?: string;
          author?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};