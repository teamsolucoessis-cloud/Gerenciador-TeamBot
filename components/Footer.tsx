
import React from 'react';

const Footer: React.FC = () => {
  const getEnv = (key: string) => {
    return (import.meta as any).env?.[key] || (window as any).process?.env?.[key] || (window as any).process?.env?.[`VITE_${key}`];
  };
  
  const isSecure = !!(getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL'));

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-16 bg-slate-950 border-t border-white/5 z-50 px-4 flex items-center justify-center">
      <div className="w-full max-w-2xl flex items-center justify-between">
        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${isSecure ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-amber-500'} animate-pulse`}></div>
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">
            {isSecure ? 'SECURE LINK' : 'LOCAL MODE'}
          </p>
        </div>

        {/* Brand Copyright */}
        <div className="text-center">
          <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">
            © 2026 <span className="text-indigo-500/60">TEAMBOT SYSTEM</span>
          </p>
        </div>

        {/* Version / Meta */}
        <div className="hidden sm:block">
          <p className="text-[7px] text-slate-700 font-bold uppercase tracking-widest">
            V1.4.7 CLOUD_SECURED
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
