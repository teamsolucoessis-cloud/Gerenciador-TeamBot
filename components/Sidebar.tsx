
import React from 'react';
import { ViewType } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ViewType) => void;
  currentView: ViewType;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onNavigate, currentView }) => {
  const menuItems: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    { 
      id: 'HOME', 
      label: 'Início', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> 
    },
    { 
      id: 'NEWS_LIST', 
      label: 'Novidades', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"></path><path d="M18 14h-8"></path><path d="M15 18h-5"></path><path d="M10 6h8v4h-8V6Z"></path></svg> 
    },
    { 
      id: 'PRIVACY', 
      label: 'Privacidade', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path></svg> 
    },
    { 
      id: 'ADMIN', 
      label: 'Painel Admin', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> 
    },
  ];

  return (
    <>
      <div 
        className={`fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`fixed top-0 left-0 bottom-0 w-72 bg-slate-950 border-r border-white/5 z-50 transform transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-10">
            <span className="font-black text-lg tracking-widest text-white">MENU</span>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          
          <nav className="flex-grow space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${currentView === item.id ? 'bg-indigo-600/20 border border-indigo-500/30 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <span className={currentView === item.id ? 'text-indigo-400' : ''}>{item.icon}</span>
                <span className="font-semibold text-sm">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto glass p-5 rounded-2xl">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-2 tracking-widest">Status do Sistema</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-300 font-medium">Todos os sistemas operacionais</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
