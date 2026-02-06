
import { createClient } from '@supabase/supabase-js';

// Função de detecção ultra-segura para evitar erros de referência no build
const getEnvVar = (key: string): string => {
  try {
    // Tenta Vite env
    const viteEnv = (import.meta as any).env?.[key];
    if (viteEnv) return viteEnv;

    // Tenta Netlify/Node process env (via window polyfill se necessário)
    const procEnv = (window as any).process?.env?.[key];
    if (procEnv) return procEnv;
  } catch (e) {
    // Silencia erros de acesso a ambiente no build
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

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

export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();

if (supabaseUrl && supabaseAnonKey) {
  console.log('%c TeamBot: Cloud Synced ', 'color: #10b981; font-weight: bold;');
}
