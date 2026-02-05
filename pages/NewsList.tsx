
import React from 'react';
import { News } from '../types';

interface NewsListProps {
  news: News[];
  onBack: () => void;
}

const NewsList: React.FC<NewsListProps> = ({ news, onBack }) => {
  return (
    <div className="animate-in fade-in slide-in-from-right-6 duration-500 pb-20">
      <div className="flex items-center gap-4 mb-10 px-2">
        <button 
          onClick={onBack}
          className="w-12 h-12 glass-premium rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all active:scale-90"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">Updates</h1>
          <p className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase">Arquivo de Novidades</p>
        </div>
      </div>

      <div className="space-y-10 px-2">
        {news.map((item) => (
          <article key={item.id} className="glass-premium rounded-[2.5rem] overflow-hidden group shadow-2xl">
            <div className="h-60 overflow-hidden relative border-b border-white/5">
              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
              <div className="absolute bottom-6 left-8">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-full border border-indigo-500/30 shadow-lg">
                  {new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
            <div className="p-10">
              <h2 className="text-2xl font-black text-white mb-5 group-hover:text-indigo-300 transition-colors leading-tight tracking-tight uppercase">{item.title}</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-8 whitespace-pre-wrap font-medium">
                {item.content}
              </p>
              
              {item.link_url ? (
                <a 
                  href={item.link_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all group/btn shadow-[0_10px_20px_rgba(79,70,229,0.3)] active:scale-95"
                >
                  Expandir Conteúdo
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover/btn:translate-x-2 transition-transform"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </a>
              ) : (
                <div className="inline-block px-5 py-2 rounded-full bg-white/5 border border-white/5 text-[10px] text-slate-500 font-black uppercase tracking-widest italic">Informativo Interno</div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default NewsList;
