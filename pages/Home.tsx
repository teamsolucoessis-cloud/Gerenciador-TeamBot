
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
        <h1 className="text-3xl font-black mt-8 text-white tracking-tight drop-shadow-sm uppercase">{profile.name}</h1>
        <div className="max-w-md mx-auto">
          <p className="text-slate-400 text-sm mt-3 px-8 leading-relaxed font-medium">{profile.bio}</p>
        </div>
      </section>

      {/* Latest News Card */}
      {latestNews && (
        <section className="w-full mb-10 px-2">
          <button 
            onClick={() => onNavigate('NEWS_LIST')}
            className="w-full glass rounded-[2rem] p-5 flex items-center gap-5 hover:border-indigo-500/40 transition-all text-left group overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-3xl -z-10 rounded-full group-hover:bg-indigo-600/10 transition-colors"></div>
            <div className="relative shrink-0">
               <img 
                 src={latestNews.image_url || GET_FALLBACK("news")} 
                 onError={(e) => handleImageError(e, "news")}
                 className="w-20 h-20 rounded-2xl object-cover border border-white/10" 
                 alt="" 
               />
               <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center border-2 border-slate-950">
                  <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
               </div>
            </div>
            <div className="flex-grow min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Última Novidade</span>
              </div>
              <h3 className="text-white font-bold text-lg leading-tight group-hover:text-indigo-300 transition-colors line-clamp-1">{latestNews.title}</h3>
              <p className="text-slate-500 text-xs mt-1 line-clamp-1">{latestNews.content}</p>
            </div>
          </button>
        </section>
      )}

      {/* Links List */}
      <section className="w-full space-y-5 px-2">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 ml-4">Conexões Estratégicas</h2>
        {links.map((link) => (
          <a 
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleLinkClick(link.id)}
            className="glass rounded-[1.5rem] p-5 flex items-center gap-5 link-card group active:scale-[0.97]"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/5 overflow-hidden shrink-0 flex items-center justify-center p-2 group-hover:bg-slate-800 transition-colors">
              <img 
                src={link.icon_url || GET_FALLBACK(link.title)} 
                onError={(e) => handleImageError(e, link.title)}
                alt="" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div className="flex-grow min-w-0">
              <h3 className="text-white font-bold text-lg mb-1 group-hover:text-indigo-300 transition-colors">{link.title}</h3>
              <p className="text-slate-500 text-sm line-clamp-1 font-medium">{link.description}</p>
            </div>
            <div className="pr-2 text-slate-700 group-hover:text-indigo-500/50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
            </div>
          </a>
        ))}
      </section>

      {links.length === 0 && (
        <div className="mt-12 glass p-10 rounded-[2rem] text-center w-full border border-white/5">
          <p className="text-slate-500 italic text-sm font-medium tracking-wide">Nenhuma conexão ativa no momento.</p>
        </div>
      )}
    </div>
  );
};

export default Home;
