import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseUrl !== 'https://your-project-url.supabase.co' &&
  supabaseAnonKey &&
  supabaseAnonKey !== 'your-anon-key'
);

if (!isSupabaseConfigured) {
  console.warn('Supabase chưa được cấu hình qua VITE_ env vars — đang dùng cấu hình tạm thời từ mã nguồn.');
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
