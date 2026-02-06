
import { createClient } from '@supabase/supabase-js';

// Credenciais de teste configuradas conforme solicitado
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://ywqjhjxiyvbimcbqjnnc.supabase.co'; 
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3cWpoanhpeXZiaW1jYnFqbm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MTg2MzQsImV4cCI6MjA4NTI5NDYzNH0.QPps2_18BzCw-ix0I_Svcz9IIgoEBc6OwsHJtiGE4-M';

// Mock robusto para evitar erros em chamadas aninhadas caso as chaves falhem
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
      resetPasswordForEmail: async () => ({ data: null, error: null }),
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
  console.warn("TeamBot: Chaves do Supabase ausentes. Usando Mock.");
}
