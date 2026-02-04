
/**
 * TEAMBOT BRAND ASSETS
 * 
 * Dica do Sênior: 
 * 1. Suba seu mascote azul no Bucket 'teambot' no painel do Supabase.
 * 2. Clique em 'Get Public URL'.
 * 3. Substitua o link abaixo em OFFICIAL_MASCOTE_URL.
 */

export const BRAND_CONFIG = {
  NAME: "TeamBot",
  TAGLINE: "Gerenciador Premium",
  // AQUI VOCÊ COLA O LINK QUE COPIOU DO SUPABASE:
  OFFICIAL_MASCOTE_URL: "https://ywqjhjxiyvbimcbqjnnc.supabase.co/storage/v1/object/public/teambot/Macote%20TeamBot.png", 
  
  // Este é o fallback caso o link acima quebre
  FALLBACK_URL: "https://api.dicebear.com/7.x/bottts/svg?seed=TeamBot&backgroundColor=4f46e5",
  
  COLORS: {
    PRIMARY: "#4f46e5", // Indigo-600
    BG_DARK: "#020617"  // Slate-950
  }
};
