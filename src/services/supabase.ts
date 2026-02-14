import { createClient } from '@supabase/supabase-js';

// Obtener credenciales desde variables de entorno
const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Siempre crear el cliente - no más modo demo
export const supabase = createClient(supabaseUrl, supabaseKey);
