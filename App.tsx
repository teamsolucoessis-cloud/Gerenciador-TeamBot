
import React, { useState, useEffect } from 'react';
import { ViewType, Profile, LinkItem, News } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Privacy from './pages/Privacy';
import Admin from './pages/Admin';
import NewsList from './pages/NewsList';
import { supabase } from './supabaseClient';

const INITIAL_PROFILE: Profile = {
  id: 'default',
  name: 'TeamBot Master',
  bio: 'Seu assistente inteligente para centralizar conexões premium e ferramentas de alta tecnologia.',
  avatar_url: 'https://picsum.photos/400/400?random=1',
  mascot_url: 'https://img.icons8.com/color/512/bot.png',
  slug: 'teambot'
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('HOME');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<Profile>(INITIAL_PROFILE);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [userNotFound, setUserNotFound] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setUserNotFound(false);
    
    // Pega o nome de usuário da URL (ex: site.com/?u=joao)
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('u');

    try {
      let targetUserId = null;

      if (slug) {
        // MODO PÚBLICO: Buscando quem o link pertence
        const { data: profData, error: profError } = await supabase
          .from('profiles')
          .select('*')
          .eq('slug', slug.toLowerCase().trim())
          .single();

        if (profData) {
          setProfile(profData);
          targetUserId = profData.id;
        } else {
          setUserNotFound(true);
          setLoading(false);
          return;
        }
      } else {
        // MODO LANDING/ADMIN: Tentando ver se o dono da página está logado
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          if (profData) {
            setProfile(profData);
            targetUserId = profData.id;
          }
        }
      }

      // Se achamos um perfil, carregamos os links e as novidades DELE
      if (targetUserId) {
        const { data: linkData } = await supabase.from('tools').select('*').eq('user_id', targetUserId).order('created_at', { ascending: false });
        if (linkData) setLinks(linkData);

        const { data: newsData } = await supabase.from('news').select('*').eq('user_id', targetUserId).order('created_at', { ascending: false });
        if (newsData) setNews(newsData);
      }
    } catch (e) {
      console.error("Erro ao carregar dados do banco:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.history.replaceState({ view: 'HOME' }, '');
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) setCurrentView(event.state.view);
      else setCurrentView('HOME');
    };
    window.addEventListener('popstate', handlePopState);
    fetchData();
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (view: ViewType) => {
    if (view !== currentView) {
      window.history.pushState({ view: view }, '');
      setCurrentView(view);
    }
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (view === 'HOME') fetchData();
  };

  if (userNotFound) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="glass p-12 rounded-[3rem] max-w-sm border-red-500/20 shadow-2xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <h1 className="text-white font-black text-2xl mb-4 tracking-tight">Bio Inexistente</h1>
          <p className="text-slate-400 text-sm mb-10 leading-relaxed font-medium">Este endereço não pertence a nenhum TeamBot ativo. Verifique se o nome do usuário está correto.</p>
          <button onClick={() => window.location.href = window.location.origin} className="w-full bg-indigo-600 hover:bg-indigo-500 py-5 rounded-2xl font-black text-white uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-indigo-600/20">Criar Minha Própria Bio</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200 selection:bg-indigo-500/30 font-sans">
      <Header onMenuClick={() => setIsSidebarOpen(true)} onAdminClick={() => navigateTo('ADMIN')} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onNavigate={navigateTo} currentView={currentView} />

      <main className={`flex-grow pt-20 pb-24 px-4 max-w-2xl mx-auto w-full transition-all duration-500 ${loading && currentView !== 'ADMIN' ? 'opacity-50 blur-sm' : 'opacity-100'}`}>
        {currentView === 'HOME' && <Home profile={profile} links={links} news={news} onNavigate={navigateTo} />}
        {currentView === 'NEWS_LIST' && <NewsList news={news} onBack={() => navigateTo('HOME')} />}
        {currentView === 'PRIVACY' && <Privacy onBack={() => navigateTo('HOME')} />}
        {currentView === 'ADMIN' && (
          <Admin 
            profile={profile} setProfile={setProfile}
            links={links} setLinks={setLinks}
            news={news} setNews={setNews}
            onBack={() => { navigateTo('HOME'); fetchData(); }}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;
