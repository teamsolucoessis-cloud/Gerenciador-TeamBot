
import React from 'react';
import { News } from '../types';

interface NewsListProps {
  news: News[];
  onBack: () => void;
}

const NewsList: React.FC<NewsListProps> = ({ news, onBack }) => {
  return (
    <div className="animate-in fade-in slide-in-from-right-6 duration-500">
      <div className="flex items-center gap-4 mb-10">
        <button 
          onClick={onBack}
          className="w-10 h-10 glass rounded-full flex items-center justify-center hover:bg-white/10 transition-all active:scale-90"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <h1 className="text-2xl font-black text-white tracking-tight">Novidades e Updates</h1>
      </div>

      <div className="space-y-8">
        {news.map((item) => (
          <article key={item.id} className="glass rounded-[2rem] overflow-hidden group">
            <div className="h-56 overflow-hidden relative">
              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
              <div className="absolute bottom-4 left-6">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-indigo-500/30">
                  {new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </span>
              </div>
            </div>
            <div className="p-8">
              <h2 className="text-xl font-black text-white mb-4 group-hover:text-indigo-300 transition-colors leading-tight">{item.title}</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                {item.content}
              </p>
              <button className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors group/btn">
                Saiba Mais 
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover/btn:translate-x-2 transition-transform"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default NewsList;
