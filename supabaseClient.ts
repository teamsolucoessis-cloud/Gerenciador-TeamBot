import { createClient } from '@supabase/supabase-js';

// Helper ultra-resiliente para buscar variáveis de ambiente em qualquer contexto (Vite, Netlify, Polyfill)
const getEnvVar = (key: string): string => {
  try {
    // 1. Tenta via import.meta (padrão Vite)
    const viteEnv = (import.meta as any).env?.[key];
    if (viteEnv) return viteEnv;

    // 2. Tenta via process.env (padrão Node/Netlify/Vite Define)
    const procEnv = (window as any).process?.env?.[key];
    if (procEnv) return procEnv;
    
    // 3. Tenta acesso direto ao process.env se o polyfill falhar
    if (typeof process !== 'undefined' && process.env && (process.env as any)[key]) {
      return (process.env as any)[key];
    }
  } catch (e) {
    console.warn(`Erro ao acessar variável ${key}`, e);
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
      signInWithPassword: async () => ({ data: null, error: new Error("Ambiente não configurado. Verifique as chaves VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.") }),
      signUp: async () => ({ data: null, error: new Error("Ambiente não configurado.") }),
      signOut: async () => ({ data: null, error: null }),
    },
    from: () => chain,
    storage: { from: () => chain },
    rpc: mockAsyncResponse,
  } as any;
};

// Verifica se a URL é válida antes de instanciar o cliente
const isValidUrl = (url: string) => {
  try { return new URL(url).protocol.startsWith('http'); } 
  catch { return false; }
};

export const supabase = (isValidUrl(supabaseUrl) && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();

if (isValidUrl(supabaseUrl) && supabaseAnonKey) {
  console.log('%c TeamBot: Cloud Synced ', 'color: #10b981; font-weight: bold;');
} else {
  console.warn('%c TeamBot: Local Mode Active (Missing Keys) ', 'color: #f59e0b; font-weight: bold;');
}