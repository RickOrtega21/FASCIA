import { createClient } from '@supabase/supabase-js';

// Reemplaza estas URLs y Claves con las de tu proyecto en Supabase.
// Generalmente se guardan en un archivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'TU_SUPABASE_URL_AQUI';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'TU_SUPABASE_ANON_KEY_AQUI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
