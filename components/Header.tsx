
import React from 'react';

interface HeaderProps {
  onMenuClick: () => void;
  onAdminClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onAdminClick }) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-slate-950/60 backdrop-blur-xl border-b border-white/5 z-40 px-6 flex items-center justify-between">
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

      <div className="flex items-center gap-3 select-none">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)]">
           <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="font-extrabold text-sm tracking-[0.2em] uppercase text-white">TeamBot</span>
      </div>

      <button 
        onClick={onAdminClick}
        className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-indigo-600/20 hover:border-indigo-500/30 transition-all active:scale-90"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 hover:text-indigo-400">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </button>
    </header>
  );
};

export default Header;
