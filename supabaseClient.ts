
import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURAÇÃO SEGURA:
 * As chaves agora são lidas das variáveis de ambiente do Netlify/Vite.
 * Para funcionar, adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
 * no painel de Environment Variables do seu provedor de deploy.
 */
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || ''; 
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Mock robusto para evitar erros em chamadas aninhadas caso as chaves falhem (Modo de Desenvolvimento/Seguro)
const createMockClient = () => {
  const mockResponse = { data: null, error: null };
  const mockAsyncResponse = async () => mockResponse;

  const chain = {
    select: () => chain,
    insert: () => chain,
    update: () => chain,
    delete: () => chain,
    eq: () => chain,
    single: mockAsyncResponse,
    order: mockAsyncResponse,
    upsert: mockAsyncResponse,
    upload: mockAsyncResponse,
    getPublicUrl: () => ({ data: { publicUrl: "" } }),
  };

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ data: null, error: new Error("Chaves de conexão não configuradas no ambiente.") }),
      signUp: async () => ({ data: null, error: new Error("Chaves de conexão não configuradas no ambiente.") }),
      signOut: async () => ({ data: null, error: null }),
      resetPasswordForEmail: async () => ({ data: null, error: null }),
    },
    from: () => chain,
    storage: {
      from: () => chain
    },
    rpc: mockAsyncResponse,
  } as any;
};

// Inicializa o cliente real apenas se as chaves existirem no ambiente
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("TeamBot Security: Chaves do Supabase não encontradas no ambiente. Iniciando em modo de segurança (Mock).");
}
