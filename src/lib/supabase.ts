import { createClient } from '@supabase/supabase-js';

function getRequiredEnv(name: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY') {
  const value = import.meta.env[name]?.trim();

  if (!value) {
    console.warn(
      `Missing ${name}. Configure it in your .env file before starting the app.`
    );
    return '';
  }

  return value;
}

const supabaseUrl = getRequiredEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getRequiredEnv('VITE_SUPABASE_ANON_KEY');

let isConfigured = false;
let supabaseConfigMessage =
  'O Supabase nao esta configurado. Preencha o arquivo .env.local com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.';

try {
  if (supabaseUrl && supabaseAnonKey) {
    new URL(supabaseUrl);
    isConfigured = true;
    supabaseConfigMessage = '';
  }
} catch {
  supabaseConfigMessage =
    'A VITE_SUPABASE_URL esta invalida. Use a URL completa do projeto, por exemplo: https://your-project-id.supabase.co';
  console.warn(
    'Invalid VITE_SUPABASE_URL. Use the full project URL, for example: https://your-project-id.supabase.co'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

export { isConfigured };
export { supabaseConfigMessage };
