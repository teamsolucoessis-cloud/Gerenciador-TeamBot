
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

  // Função para limitar caracteres
  const truncateText = (text: string, limit: number) => {
    if (text.length <= limit) return text;
    return text.slice(0, limit) + "...";
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

      {/* Latest News Card - Layout Vertical Premium com Resumo de 1 Linha */}
      {latestNews && (
        <section className="w-full mb-12 px-2">
          <div className="flex items-center gap-3 mb-6 px-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path></svg>
            </div>
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Destaque</h2>
          </div>

          <button 
            onClick={() => onNavigate('NEWS_LIST')}
            className="w-full glass-premium rounded-[2.5rem] flex flex-col hover:border-indigo-500/40 transition-all text-left group overflow-hidden relative shimmer-effect shadow-2xl"
          >
            {/* Imagem de Topo da Notícia */}
            <div className="h-48 w-full overflow-hidden relative border-b border-white/5">
              <img 
                src={latestNews.image_url || GET_FALLBACK("news")} 
                onError={(e) => handleImageError(e, "news")}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                alt="" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
              <div className="absolute bottom-4 left-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Novo Update</span>
              </div>
            </div>

            <div className="p-8 relative z-10">
              <h3 className="text-white font-black text-2xl leading-tight group-hover:text-indigo-300 transition-colors mb-2 tracking-tight">
                {latestNews.title}
              </h3>
              {/* Ajuste Sênior: Limitado a 1 linha para otimização de espaço */}
              <p className="text-slate-400 text-sm font-medium leading-relaxed line-clamp-1">
                {latestNews.content}
              </p>
              <div className="mt-6 flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                 Ler atualização completa
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </div>
            </div>
          </button>
        </section>
      )}

      {/* Links List - Layout Vertical Premium */}
      <section className="w-full space-y-8 px-2 pb-12">
        <div className="flex items-center gap-3 mb-6 px-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Ferramentas & Aplicativos</h2>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {links.map((link) => (
            <a 
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleLinkClick(link.id)}
              className="glass-premium rounded-[2.5rem] flex flex-col group active:scale-[0.98] transition-all duration-300 hover:bg-white/[0.04] relative overflow-hidden shimmer-effect shadow-xl"
            >
              {/* Área de Ícone / Topo do Link */}
              <div className="w-full h-40 bg-slate-900/50 flex items-center justify-center relative border-b border-white/5 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-purple-600/10 group-hover:opacity-100 opacity-50 transition-opacity"></div>
                <div className="relative w-20 h-20 icon-glow transform group-hover:scale-110 transition-transform duration-500">
                  <img 
                    src={link.icon_url || GET_FALLBACK(link.title)} 
                    onError={(e) => handleImageError(e, link.title)}
                    alt="" 
                    className="w-full h-full object-contain" 
                  />
                </div>
              </div>

              <div className="p-8 relative z-10">
                <h3 className="text-white font-black text-2xl mb-3 group-hover:text-indigo-300 transition-colors tracking-tight">
                  {link.title}
                </h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  {truncateText(link.description, 120)}
                </p>
                <div className="mt-8 flex items-center justify-between">
                   <div className="px-5 py-2.5 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-[0_5px_15px_rgba(79,70,229,0.4)] group-hover:bg-indigo-500 transition-all">
                      Acessar Agora
                   </div>
                   <div className="text-slate-600 group-hover:text-indigo-400 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                   </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {links.length === 0 && (
        <div className="mt-12 glass p-12 rounded-[2.5rem] text-center w-full border border-white/5">
          <p className="text-slate-500 italic text-sm font-bold tracking-widest uppercase">Nenhuma conexão ativa</p>
        </div>
      )}
    </div>
  );
};

export default Home;
