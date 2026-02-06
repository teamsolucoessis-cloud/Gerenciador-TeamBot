
import { createClient } from '@supabase/supabase-js';

// Detecção segura de variáveis de ambiente (Vite standard)
const getEnv = (key: string): string => {
  return (import.meta as any).env?.[key] || (window as any).process?.env?.[key] || '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

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

// Inicialização condicional baseada na presença das chaves
export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl !== '') 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();

if (supabaseUrl && supabaseAnonKey) {
  console.log('%c TeamBot: Cloud Core Active ', 'background: #10b981; color: #fff; padding: 2px 5px; border-radius: 4px;');
}
