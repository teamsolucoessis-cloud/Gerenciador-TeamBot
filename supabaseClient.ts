
import { createClient } from '@supabase/supabase-js';

/**
 * INSTRUÇÕES PARA VOCÊ:
 * 1. Vá no painel do seu Supabase.
 * 2. Clique em 'Project Settings' (Engrenagem) -> 'API'.
 * 3. Copie a 'Project URL' e cole no lugar de 'SUA_URL_AQUI'.
 * 4. Copie a 'anon public' (chave API) e cole no lugar de 'SUA_CHAVE_AQUI'.
 */

const supabaseUrl = 'https://ywqjhjxiyvbimcbqjnnc.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3cWpoanhpeXZiaW1jYnFqbm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MTg2MzQsImV4cCI6MjA4NTI5NDYzNH0.QPps2_18BzCw-ix0I_Svcz9IIgoEBc6OwsHJtiGE4-M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
