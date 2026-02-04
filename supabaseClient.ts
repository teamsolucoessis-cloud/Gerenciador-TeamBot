
import { createClient } from '@supabase/supabase-js';

/**
 * Ajuste de Estabilidade:
 * O cliente agora verifica se as chaves existem antes de inicializar.
 * Isso evita o erro "supabaseUrl is required" que causa tela branca.
 */

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || ''; 
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Se as chaves estiverem vazias, criamos um proxy ou apenas não exportamos o cliente real
// para evitar que o app quebre no ambiente de preview do Studio.
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : new Proxy({} as any, {
      get: () => () => ({ data: null, error: { message: "Supabase não configurado" } })
    });

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("TeamBot: Chaves do Supabase ausentes. Configure as variáveis de ambiente.");
}
