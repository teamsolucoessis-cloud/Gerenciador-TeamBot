
import { createClient } from '@supabase/supabase-js';

/**
 * Sênior, para segurança máxima no deploy:
 * As chaves agora são lidas das variáveis de ambiente do Netlify.
 * Se elas não existirem (localmente), ele usará os valores de fallback.
 */

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://ywqjhjxiyvbimcbqjnnc.supabase.co'; 
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3cWpoanhpeXZiaW1jYnFqbm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MTg2MzQsImV4cCI6MjA4NTI5NDYzNH0.QPps2_18BzCw-ix0I_Svcz9IIgoEBc6OwsHJtiGE4-M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
