
import React from 'react';

interface HeaderProps {
  onMenuClick: () => void;
  onAdminClick: () => void;
  mascotUrl?: string;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onAdminClick }) => {
  // Identidade Visual Oficial do TeamBot
  const BRAND_LOGO = "https://i.ibb.co/v4pXp2F/teambot-mascot.png";
  const FALLBACK_LOGO = "https://api.dicebear.com/7.x/bottts/svg?seed=TeamBot&backgroundColor=4f46e5";

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = FALLBACK_LOGO;
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5 z-50 px-4 flex items-center justify-between">
      {/* Lado Esquerdo: Menu de Navegação */}
      <button 
        onClick={onMenuClick}
        className="p-2.5 hover:bg-white/10 rounded-2xl transition-all active:scale-90 group"
        aria-label="Abrir Menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-white transition-colors">
          <line x1="4" x2="20" y1="12" y2="12"></line>
          <line x1="4" x2="20" y1="6" y2="6"></line>
          <line x1="4" x2="20" y1="18" y2="18"></line>
        </svg>
      </button>

      {/* Centro: Identidade TeamBot Master */}
      <div className="flex items-center gap-3 select-none group cursor-default">
        <div className="w-9 h-9 bg-indigo-600/20 rounded-xl flex items-center justify-center border border-indigo-500/30 overflow-hidden icon-glow transition-transform group-hover:scale-110 duration-500">
           <img 
             src={BRAND_LOGO} 
             alt="TeamBot Logo" 
             onError={handleImageError}
             className="w-full h-full object-contain p-1"
           />
        </div>
        <span className="font-black text-[11px] tracking-[0.4em] uppercase text-white drop-shadow-sm">
          TeamBot
        </span>
      </div>

      {/* Lado Direito: Acesso Administrativo */}
      <button 
        onClick={onAdminClick}
        className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-indigo-600/20 hover:border-indigo-500/40 transition-all active:scale-90 group shadow-inner"
        aria-label="Acessar Admin"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-indigo-400 transition-colors">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </button>
    </header>
  );
};

export default Header;
