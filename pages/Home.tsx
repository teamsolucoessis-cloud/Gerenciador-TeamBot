
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

  const truncateText = (text: string, limit: number) => {
    if (text.length <= limit) return text;
    return text.slice(0, limit) + "...";
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
              className="w-32 h-32 rounded-full object-cover border-4 border-slate-950"
            />
          </div>
          <div className="absolute -top-4 -right-10 w-24 h-24 z-20 animate-mascot drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)]">
            <img 
              src={profile.mascot_url || GET_FALLBACK("mascot")} 
              alt="Mascot" 
              onError={(e) => handleImageError(e, "mascot")}
              className="w-full h-full object-contain" 
            />
          </div>
        </div>
        <h1 className="text-3xl font-black mt-8 text-white tracking-tighter drop-shadow-md uppercase bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
          {profile.name}
        </h1>
        <div className="max-w-md mx-auto">
          <p className="text-slate-400 text-sm mt-3 px-8 leading-relaxed font-medium italic opacity-80">
            {profile.bio}
          </p>
        </div>
      </section>

      {/* Latest News Section */}
      <section className="w-full mb-12 px-2">
        <div className="flex items-center justify-between mb-6 px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-indigo-400"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path></svg>
            </div>
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Updates</h2>
          </div>
        </div>

        {latestNews ? (
          <button 
            onClick={() => onNavigate('NEWS_LIST')}
            className="w-full glass-premium rounded-[2.5rem] flex flex-col hover:border-indigo-500/40 transition-all text-left group overflow-hidden relative shimmer-effect shadow-2xl"
          >
            <div className="h-48 w-full overflow-hidden relative border-b border-white/5">
              <img 
                src={latestNews.image_url || GET_FALLBACK("news")} 
                onError={(e) => handleImageError(e, "news")}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                alt="" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
              <div className="absolute bottom-4 left-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Destaque Atual</span>
              </div>
            </div>

            <div className="p-8 relative z-10">
              <h3 className="text-white font-black text-2xl mb-2 tracking-tight group-hover:text-indigo-300 transition-colors">
                {latestNews.title}
              </h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed line-clamp-1">
                {latestNews.content}
              </p>
              <div className="mt-6 flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                 Ver todas as novidades
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </div>
            </div>
          </button>
        ) : (
          <div className="w-full glass rounded-[2.5rem] p-12 border-dashed border-2 border-white/5 flex flex-col items-center text-center group hover:border-indigo-500/20 transition-all">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 opacity-30 group-hover:opacity-60 transition-opacity">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"></path></svg>
            </div>
            <h3 className="text-white font-black text-[11px] uppercase tracking-[0.3em] mb-3">Feed de Atualizações</h3>
            <p className="text-slate-500 text-[11px] leading-relaxed max-w-[300px] font-medium opacity-60">
              Mantenha sua audiência por dentro. Publique lançamentos e comunicados importantes no seu painel Admin.
            </p>
          </div>
        )}
      </section>

      {/* Links Section */}
      <section className="w-full space-y-8 px-2 pb-12">
        <div className="flex items-center gap-3 mb-6 px-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-indigo-400"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Conexões Estratégicas</h2>
        </div>

        {links.length > 0 ? (
          <div className="grid grid-cols-1 gap-8">
            {links.map((link) => (
              <a 
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleLinkClick(link.id)}
                className="glass-premium rounded-[2.5rem] flex flex-col group active:scale-[0.98] transition-all duration-300 relative overflow-hidden shimmer-effect shadow-xl"
              >
                <div className="w-full h-40 bg-slate-900/50 flex items-center justify-center relative border-b border-white/5">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-purple-600/10 opacity-50"></div>
                  <img 
                    src={link.icon_url || GET_FALLBACK(link.title)} 
                    onError={(e) => handleImageError(e, link.title)}
                    alt="" 
                    className="relative w-20 h-20 object-contain icon-glow transform group-hover:scale-110 transition-transform duration-500" 
                  />
                </div>
                <div className="p-8">
                  <h3 className="text-white font-black text-2xl mb-2 tracking-tight group-hover:text-indigo-300 transition-colors">
                    {link.title}
                  </h3>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed">
                    {truncateText(link.description, 100)}
                  </p>
                  <div className="mt-8 flex items-center justify-between">
                     <span className="px-6 py-3 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl group-hover:bg-indigo-500 transition-all">
                        Acessar Canal
                     </span>
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-600 group-hover:text-indigo-400 transition-colors"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <div className="glass rounded-[2.5rem] p-12 border-dashed border-2 border-white/5 flex flex-col items-center text-center group hover:border-indigo-500/20 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 opacity-30">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-500"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </div>
              <h3 className="text-white font-black text-[11px] uppercase tracking-[0.2em] mb-4">Sua Vitrine de Links</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed max-w-sm font-medium opacity-60">
                Centralize seu WhatsApp, redes sociais, portfólio ou ferramentas exclusivas aqui. Configure seus botões premium através do painel.
              </p>
              <div className="mt-10 flex gap-3">
                {[1,2,3].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-white/5 group-hover:bg-indigo-500/20 transition-colors"></div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
