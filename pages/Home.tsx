
import React from 'react';
import { Profile, LinkItem, News, ViewType } from '../types';
import { supabase } from '../supabaseClient';

interface HomeProps {
  profile: Profile;
  links: LinkItem[];
  news: News[];
  onNavigate: (view: ViewType) => void;
}

const Home: React.FC<HomeProps> = ({ profile, links, news, onNavigate }) => {
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
    <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-bottom-6 duration-1000">
      
      {/* Profile Section */}
      <section className="relative mt-8 mb-12 w-full text-center">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-indigo-500/30 blur-[40px] rounded-full scale-150 animate-pulse"></div>
          <div className="relative z-10 p-1 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-500 rounded-full shadow-[0_0_30px_rgba(79,70,229,0.5)]">
            <img 
              src={profile.avatar_url || GET_FALLBACK(profile.name)} 
              alt={profile.name} 
              onError={(e) => handleImageError(e, profile.name)}
              className="w-32 h-32 rounded-full object-cover border-4 border-slate-950"
            />
          </div>
          <div className="absolute -top-4 -right-10 w-24 h-24 z-20 animate-mascot drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
            <img 
              src={profile.mascot_url || GET_FALLBACK("mascot")} 
              alt="Mascot" 
              onError={(e) => handleImageError(e, "mascot")}
              className="w-full h-full object-contain" 
            />
          </div>
        </div>
        <h1 className="text-3xl font-black mt-8 text-white tracking-tighter drop-shadow-md uppercase">{profile.name}</h1>
        <div className="max-w-md mx-auto">
          <p className="text-slate-400 text-sm mt-3 px-8 leading-relaxed font-medium">{profile.bio}</p>
        </div>
      </section>

      {/* Latest News Card - Estilo Newsfeed Premium */}
      {latestNews && (
        <section className="w-full mb-12 px-2">
          <button 
            onClick={() => onNavigate('NEWS_LIST')}
            className="w-full glass-premium rounded-[2.5rem] p-6 flex items-center gap-6 hover:border-indigo-500/40 transition-all text-left group overflow-hidden relative shimmer-effect"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 blur-[80px] -z-10 rounded-full group-hover:bg-indigo-600/20 transition-colors duration-700"></div>
            <div className="relative shrink-0">
               <div className="p-1 bg-gradient-to-tr from-white/10 to-transparent rounded-2xl">
                 <img 
                   src={latestNews.image_url || GET_FALLBACK("news")} 
                   onError={(e) => handleImageError(e, "news")}
                   className="w-20 h-20 rounded-xl object-cover border border-white/5" 
                   alt="" 
                 />
               </div>
               <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-indigo-600 rounded-xl flex items-center justify-center border-2 border-slate-950 shadow-lg">
                  <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
               </div>
            </div>
            <div className="flex-grow min-w-0 pr-2">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2 block">Novidade em Destaque</span>
              <h3 className="text-white font-black text-xl leading-tight group-hover:text-indigo-300 transition-colors line-clamp-1">{latestNews.title}</h3>
              <p className="text-slate-500 text-xs mt-1.5 font-medium line-clamp-1">{latestNews.content}</p>
            </div>
          </button>
        </section>
      )}

      {/* Links List - REDESIGN PREMIUM */}
      <section className="w-full space-y-6 px-2 pb-12">
        <div className="flex items-center justify-between px-4 mb-6">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Conexões Estratégicas</h2>
          <div className="h-[1px] flex-grow ml-6 bg-gradient-to-r from-white/10 to-transparent"></div>
        </div>

        {links.map((link) => (
          <a 
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleLinkClick(link.id)}
            className="glass-premium rounded-[2rem] p-5 flex items-center gap-6 group active:scale-[0.96] transition-all duration-300 hover:bg-white/[0.04] relative overflow-hidden shimmer-effect"
          >
            {/* Efeito visual de hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-indigo-500/0 group-hover:from-indigo-500/[0.03] transition-all duration-500"></div>
            
            <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center p-2.5 group-hover:border-indigo-500/40 group-hover:scale-110 transition-all duration-500 icon-glow relative">
              <img 
                src={link.icon_url || GET_FALLBACK(link.title)} 
                onError={(e) => handleImageError(e, link.title)}
                alt="" 
                className="w-full h-full object-contain relative z-10" 
              />
              <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors"></div>
            </div>

            <div className="flex-grow min-w-0 py-1 relative z-10">
              <h3 className="text-white font-black text-lg mb-1 group-hover:text-indigo-300 transition-colors tracking-tight">{link.title}</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed line-clamp-2 group-hover:text-slate-300 transition-colors">{link.description}</p>
            </div>

            <div className="pr-2 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 group-hover:opacity-100">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </div>
          </a>
        ))}
      </section>

      {links.length === 0 && (
        <div className="mt-12 glass p-12 rounded-[2.5rem] text-center w-full border border-white/5">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <p className="text-slate-500 italic text-sm font-bold tracking-widest uppercase">Nenhuma conexão ativa</p>
        </div>
      )}
    </div>
  );
};

export default Home;
