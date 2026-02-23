import { createClient } from '@supabase/supabase-js';


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qownbekxrymssgbnlmwy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvd25iZWt4cnltc3NnYm5sbXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjkzNDUsImV4cCI6MjA3Mzc0NTM0NX0.l_aQoD7czAbg5sOlg-hknN3znNUibdwT3b6eHXVYn1o';

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