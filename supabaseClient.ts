
import { createClient } from '@supabase/supabase-js';

// Usando import.meta.env que é o padrão do Vite para variáveis expostas
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || ''; 
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

const createMockClient = () => {
  const mockResponse = { data: null, error: null };
  const mockAsyncResponse = async () => mockResponse;
  const chain = {
    select: () => chain, insert: () => chain, update: () => chain,
    delete: () => chain, eq: () => chain, single: mockAsyncResponse,
    order: mockAsyncResponse, upsert: mockAsyncResponse, upload: mockAsyncResponse,
    getPublicUrl: () => ({ data: { publicUrl: "" } }),
  };

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ data: null, error: new Error("Ambiente não configurado.") }),
      signUp: async () => ({ data: null, error: new Error("Ambiente não configurado.") }),
      signOut: async () => ({ data: null, error: null }),
    },
    from: () => chain,
    storage: { from: () => chain },
    rpc: mockAsyncResponse,
  } as any;
};

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();

// Silenciando logs técnicos em produção, mantendo apenas status essencial
if (supabaseUrl && supabaseAnonKey) {
  console.log('%c TeamBot Cloud: Connected ', 'color: #10b981; font-weight: bold;');
}
