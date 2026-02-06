
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
          <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full scale-150 animate-pulse"></div>
          <div className="relative z-10 p-1.5 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-500 rounded-full shadow-[0_0_40px_rgba(79,70,229,0.4)] transition-transform hover:scale-105 duration-500">
            <img 
              src={profile.avatar_url || GET_FALLBACK(profile.name)} 
              alt={profile.name} 
              onError={(e) => handleImageError(e, profile.name)}
              className="w-24 h-24 rounded-full object-cover border-4 border-slate-950"
            />
          </div>
          <div className="absolute -top-4 -right-8 w-20 h-20 z-20 animate-mascot drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)]">
            <img 
              src={profile.mascot_url || GET_FALLBACK("mascot")} 
              alt="Mascot" 
              onError={(e) => handleImageError(e, "mascot")}
              className="w-full h-full object-contain" 
            />
          </div>
        </div>
        <h1 className="text-xl font-black mt-6 text-white tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
          {profile.name}
        </h1>
        <div className="max-w-xs mx-auto">
          <p className="text-slate-400 text-[10px] mt-2 px-4 leading-relaxed font-medium italic opacity-70">
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
            className="w-full glass-premium rounded-[2rem] flex flex-col hover:border-indigo-500/40 transition-all text-left group overflow-hidden relative shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(79,70,229,0.1)]"
          >
            <div className="h-32 w-full overflow-hidden relative border-b border-white/5">
              <img 
                src={latestNews.image_url || GET_FALLBACK("news")} 
                onError={(e) => handleImageError(e, "news")}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                alt="" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
              <div className="absolute bottom-3 left-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[8px] font-black text-white uppercase tracking-widest">Destaque</span>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-white font-black text-md mb-1 tracking-tight group-hover:text-indigo-300 transition-colors uppercase truncate">
                {latestNews.title}
              </h3>
              <div className="flex items-center gap-2 text-indigo-400 text-[8px] font-black uppercase tracking-widest">
                 Ler atualização
                 <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </div>
            </div>
          </button>
        ) : null}
      </section>

      {/* Links Section */}
      <section className="w-full space-y-3 px-2 pb-20">
        <div className="flex items-center gap-3 mb-4 px-4">
          <div className="w-6 h-6 rounded-lg bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20">
             <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-indigo-400"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
          </div>
          <h2 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Ferramentas</h2>
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
                className="glass-premium rounded-2xl p-4 flex items-center gap-4 group active:scale-[0.98] transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.3),0_0_15px_rgba(79,70,229,0.05)] border border-white/5 hover:border-indigo-500/40 hover:shadow-[0_4px_25px_rgba(0,0,0,0.4),0_0_20px_rgba(79,70,229,0.15)] overflow-hidden"
              >
                <div className="w-14 h-14 shrink-0 bg-slate-900/80 rounded-2xl flex items-center justify-center border border-white/5 overflow-hidden group-hover:border-indigo-500/40 transition-colors">
                  <img 
                    src={link.icon_url || GET_FALLBACK(link.title)} 
                    onError={(e) => handleImageError(e, link.title)}
                    alt="" 
                    className="w-9 h-9 object-contain icon-glow group-hover:scale-110 transition-transform duration-500" 
                  />
                </div>

                <div className="flex-grow min-w-0">
                  <h3 className="text-white font-black text-[12px] tracking-wide uppercase truncate group-hover:text-indigo-300 transition-colors">
                    {link.title}
                  </h3>
                  {link.description && (
                    <p className="text-slate-500 text-[9px] font-medium leading-tight mt-1 line-clamp-2">
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
          <div className="glass rounded-[2rem] p-8 border-dashed border-2 border-white/5 flex flex-col items-center text-center opacity-40">
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Vazio</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
