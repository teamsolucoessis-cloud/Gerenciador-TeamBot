
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || ''; 
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Mock robusto para evitar erros tipo "is not a function" em chamadas aninhadas
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
      signInWithPassword: async () => ({ data: null, error: new Error("Supabase não configurado") }),
      signUp: async () => ({ data: null, error: new Error("Supabase não configurado") }),
      signOut: async () => ({ data: null, error: null }),
    },
    from: () => chain,
    storage: {
      from: () => chain
    },
    rpc: mockAsyncResponse,
  } as any;
};

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("TeamBot: Chaves do Supabase ausentes. Configure as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no seu provedor de hospedagem.");
}
