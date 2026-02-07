import { createClient } from '@supabase/supabase-js';

// Helper ultra-resiliente para buscar variáveis de ambiente
const getEnvVar = (key: string): string => {
  try {
    // Lista de possíveis locais onde as chaves podem estar
    const sources = [
      (import.meta as any).env?.[key],
      (import.meta as any).env?.[`VITE_${key}`],
      (window as any).process?.env?.[key],
      (window as any).process?.env?.[`VITE_${key}`],
      (window as any).env?.[key],
      typeof process !== 'undefined' ? process.env?.[key] : undefined,
      typeof process !== 'undefined' ? process.env?.[`VITE_${key}`] : undefined,
    ];

    const value = sources.find(v => v !== undefined && v !== null && v !== '');
    return value || '';
  } catch (e) {
    return '';
  }
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY');

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
      signInWithPassword: async () => ({ data: null, error: new Error("Ambiente Offline") }),
      signUp: async () => ({ data: null, error: new Error("Ambiente Offline") }),
      signOut: async () => ({ data: null, error: null }),
    },
    from: () => chain,
    storage: { from: () => chain },
    rpc: mockAsyncResponse,
  } as any;
};

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
  console.warn('%c TeamBot: Local Mode ', 'color: #f59e0b; font-weight: bold;');
}