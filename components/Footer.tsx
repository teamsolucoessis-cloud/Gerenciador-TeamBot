
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 p-4 z-30 pointer-events-none">
      <div className="max-w-2xl mx-auto flex flex-col items-center pointer-events-auto">
        <div className="glass-premium px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl border border-white/5 bg-slate-950/40 backdrop-blur-md">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">© 2024 TeamBot Premium</p>
          <div className="h-3 w-[1px] bg-white/10"></div>
          <div className="flex gap-4">
             <a href="#" className="text-slate-500 hover:text-white transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
             </a>
             <a href="#" className="text-slate-500 hover:text-white transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
             </a>
          </div>
        </div>
        {/* Marcador de Versão para Debug do Deploy */}
        <span className="text-[7px] text-indigo-500/50 font-bold mt-2 uppercase tracking-widest">Build 06.02.25-FINAL-APPROVED</span>
      </div>
    </footer>
  );
};

export default Footer;
