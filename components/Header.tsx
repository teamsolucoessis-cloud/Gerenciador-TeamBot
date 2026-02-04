
import React from 'react';

interface HeaderProps {
  onMenuClick: () => void;
  onAdminClick: () => void;
  mascotUrl?: string; // Mantemos para compatibilidade, mas priorizamos o oficial no centro
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onAdminClick }) => {
  // Ícone oficial da marca TeamBot
  const officialBrandIcon = "https://i.ibb.co/v4pXp2F/teambot-mascot.png";

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-slate-950/60 backdrop-blur-xl border-b border-white/5 z-40 px-6 flex items-center justify-between">
      {/* Lado Esquerdo: Menu */}
      <button 
        onClick={onMenuClick}
        className="p-2 hover:bg-white/10 rounded-xl transition-all active:scale-90 group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-white">
          <line x1="4" x2="20" y1="12" y2="12"></line>
          <line x1="4" x2="20" y1="6" y2="6"></line>
          <line x1="4" x2="20" y1="18" y2="18"></line>
        </svg>
      </button>

      {/* Centro: Marca Oficial TeamBot */}
      <div className="flex items-center gap-3 select-none">
        <div className="w-9 h-9 bg-indigo-600/10 rounded-xl flex items-center justify-center border border-indigo-500/30 overflow-hidden icon-glow">
           <img 
             src={officialBrandIcon} 
             alt="TeamBot Official Logo" 
             className="w-full h-full object-contain p-1"
           />
        </div>
        <span className="font-black text-xs tracking-[0.3em] uppercase text-white">TeamBot</span>
      </div>

      {/* Lado Direito: Login/Admin */}
      <button 
        onClick={onAdminClick}
        className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-indigo-600/20 hover:border-indigo-500/30 transition-all active:scale-90 group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-indigo-400 transition-colors">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </button>
    </header>
  );
};

export default Header;
