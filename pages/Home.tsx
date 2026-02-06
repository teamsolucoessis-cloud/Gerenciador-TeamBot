
import React from 'react';
import { Profile, LinkItem, News, ViewType } from '../types';
import { supabase } from '../supabaseClient';

interface HomeProps {
  profile: Profile;
  links: LinkItem[];
  news: News[];
  onNavigate: (view: ViewType) => void;
  isGuest?: boolean;
}

const Home: React.FC<HomeProps> = ({ profile, links, news, onNavigate, isGuest }) => {
  const latestNews = news.length > 0 ? news[0] : null;
  const GET_FALLBACK = (seed: string) => `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=4f46e5`;

  const handleLinkClick = async (linkId: string) => {
    try {
      await supabase.rpc('increment_tool_clicks', { row_id: linkId });
    } catch (e) {
      console.error("Click track error", e);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, seed: string) => {
    e.currentTarget.src = GET_FALLBACK(seed);
  };

  return (
    <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-bottom-6 duration-1000 relative">
      
      {/* Profile Section */}
      <section className="relative mt-8 mb-12 w-full text-center">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full scale-150 animate-pulse"></div>
          <div className="relative z-10 p-1.5 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-500 rounded-full shadow-[0_0_40px_rgba(79,70,229,0.4)] transition-transform hover:scale-105 duration-500">
            <img 
              src={profile.avatar_url || GET_FALLBACK(profile.name)} 
              alt={profile.name} 
              onError={(e) => handleImageError(e, profile.name)}
              className="w-24 h-24 rounded-full object-cover border-4 border-slate-950 shadow-2xl"
            />
          </div>
          <div className="absolute -top-4 -right-8 w-20 h-20 z-20 animate-mascot drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)]">
            <img 
              src={profile.mascot_url || GET_FALLBACK("mascot")} 
              alt="Mascot" 
              onError={(e) => handleImageError(e, "mascot")}
              className="w-full h-full object-contain icon-glow" 
            />
          </div>
        </div>
        <h1 className="text-xl font-black mt-6 text-white tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
          {profile.name}
        </h1>
        <div className="max-w-xs mx-auto">
          <p className="text-slate-400 text-[10px] mt-2 px-4 leading-relaxed font-medium italic opacity-70 uppercase tracking-widest">
            {profile.bio}
          </p>
        </div>
      </section>

      {/* Latest News Section */}
      <section className="w-full mb-10 px-2">
        <div className="flex items-center gap-3 mb-4 px-4">
          <div className="w-6 h-6 rounded-lg bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20">
             <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-indigo-400"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path></svg>
          </div>
          <h2 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Novidades</h2>
        </div>

        {latestNews ? (
          <button 
            onClick={() => onNavigate('NEWS_LIST')}
            className="w-full glass-premium rounded-[2.2rem] flex flex-col hover:border-indigo-500/40 transition-all text-left group overflow-hidden relative shadow-[0_15px_40px_rgba(0,0,0,0.4),0_0_25px_rgba(79,70,229,0.05)]"
          >
            <div className="h-40 w-full overflow-hidden relative border-b border-white/5">
              <img 
                src={latestNews.image_url || GET_FALLBACK("news")} 
                onError={(e) => handleImageError(e, "news")}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100" 
                alt="" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
              <div className="absolute bottom-4 left-6 flex items-center gap-2">
                <div className="flex items-center gap-2 bg-indigo-600/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-indigo-500/30">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(129,140,248,0.8)]"></span>
                  <span className="text-[8px] font-black text-white uppercase tracking-widest">Destaque Oficial</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-white font-black text-lg mb-1 tracking-tight group-hover:text-indigo-300 transition-colors uppercase truncate">
                {latestNews.title}
              </h3>
              <div className="flex items-center gap-2 text-indigo-400 text-[8px] font-black uppercase tracking-[0.2em] mt-2 group-hover:translate-x-1 transition-transform">
                 Ler atualização completa
                 <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </div>
            </div>
          </button>
        ) : null}
      </section>

      {/* Links Section */}
      <section className="w-full space-y-4 px-2 pb-20">
        <div className="flex items-center gap-3 mb-4 px-4">
          <div className="w-6 h-6 rounded-lg bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20">
             <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-indigo-400"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
          </div>
          <h2 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Ecossistema</h2>
        </div>

        {links.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {links.map((link) => (
              <a 
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleLinkClick(link.id)}
                className="glass-premium rounded-2xl p-4 flex items-center gap-4 group active:scale-[0.98] transition-all duration-300 shadow-[0_5px_15px_rgba(0,0,0,0.3),0_0_10px_rgba(79,70,229,0.03)] border border-white/5 hover:border-indigo-500/40 hover:shadow-[0_8px_25px_rgba(0,0,0,0.4),0_0_20px_rgba(79,70,229,0.15)] overflow-hidden"
              >
                <div className="w-14 h-14 shrink-0 bg-slate-950 rounded-2xl flex items-center justify-center border border-white/5 overflow-hidden group-hover:border-indigo-500/40 transition-colors shadow-inner">
                  <img 
                    src={link.icon_url || GET_FALLBACK(link.title)} 
                    onError={(e) => handleImageError(e, link.title)}
                    alt="" 
                    className="w-10 h-10 object-contain icon-glow group-hover:scale-110 transition-transform duration-500" 
                  />
                </div>

                <div className="flex-grow min-w-0">
                  <h3 className="text-white font-black text-[11px] tracking-wide uppercase truncate group-hover:text-indigo-300 transition-colors">
                    {link.title}
                  </h3>
                  {link.description && (
                    <p className="text-slate-500 text-[9px] font-bold leading-tight mt-1 line-clamp-2 uppercase tracking-tight italic opacity-70 group-hover:opacity-100 transition-opacity">
                      {link.description}
                    </p>
                  )}
                </div>

                <div className="shrink-0 opacity-10 group-hover:opacity-100 group-hover:translate-x-1 transition-all pr-1">
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-indigo-400"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="glass-premium rounded-[2rem] p-8 border-dashed border-2 border-white/5 flex flex-col items-center text-center opacity-40">
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest italic">Nenhum dado ativo no momento.</p>
          </div>
        )}
      </section>

      {/* Floating CTA for Guests */}
      {isGuest && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-full max-w-[280px] animate-in slide-in-from-bottom-10 duration-1000">
          <button 
            onClick={() => onNavigate('ADMIN')}
            className="w-full glass-premium p-1 rounded-full group shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(79,70,229,0.2)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.6),0_0_40px_rgba(79,70,229,0.4)] transition-all duration-500 active:scale-95"
          >
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 py-4 px-6 rounded-full flex items-center justify-center gap-3 border border-white/10 group-hover:from-indigo-500 group-hover:to-purple-500 transition-all">
               <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] drop-shadow-md">⚡ Criar meu TeamBot</span>
               <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="text-white"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
               </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
