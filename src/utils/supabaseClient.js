import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Pastikan kredensial telah diisi dan bukan placeholder
const isConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-supabase-url.supabase.co' && 
  supabaseAnonKey !== 'your-anon-key' &&
  supabaseUrl.trim() !== '' &&
  supabaseAnonKey.trim() !== '';

if (!isConfigured) {
  console.warn(
    "Kredensial Supabase belum diatur secara valid di .env.local.\n" +
    "Silakan isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY dengan kredensial proyek Supabase Anda."
  );
}

export const supabase = isConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;
