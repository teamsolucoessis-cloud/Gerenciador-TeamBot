
import { createClient } from '@supabase/supabase-js';

/**
 * Sênior, agora o código está 100% blindado para repositórios públicos.
 * As chaves são lidas exclusivamente das variáveis de ambiente (Environment Variables).
 * Se as variáveis não estiverem configuradas, o cliente não será inicializado com dados reais.
 */

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || ''; 
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Atenção: Chaves do Supabase não encontradas. Verifique as variáveis de ambiente no Netlify.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
