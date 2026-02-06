
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
import { BRAND_CONFIG } from './brand';

const INITIAL_PROFILE: Profile = {
  id: '', // Deixando vazio para não disparar erro de UUID antes da sessão carregar
  name: 'Usuário TeamBot',
  bio: 'Personalize sua bio no painel para descrever sua autoridade e como você ajuda seus clientes.',
  avatar_url: BRAND_CONFIG.OFFICIAL_MASCOTE_URL,
  mascot_url: BRAND_CONFIG.OFFICIAL_MASCOTE_URL,
  slug: 'teambot'
};

const App: React.FC = () => {
  const getInitialView = (): ViewType => {
    const path = window.location.pathname;
    if (path.includes('/admin')) return 'ADMIN';
    if (path.includes('/privacidade')) return 'PRIVACY';
    if (path.includes('/novidades')) return 'NEWS_LIST';
    return 'HOME';
  };

  const [currentView, setCurrentView] = useState<ViewType>(getInitialView());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<Profile>(INITIAL_PROFILE);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [userNotFound, setUserNotFound] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(window.location.search);
      const slug = params.get('u');
      let targetUserId = null;

      if (slug) {
        const { data, error } = await supabase.from('profiles').select('*').eq('slug', slug.toLowerCase()).single();
        if (data) {
          setProfile(data);
          targetUserId = data.id;
        } else if (error && error.message !== "Supabase não configurado") {
          setUserNotFound(true);
        }
      } else {
        const sessionRes = await supabase.auth.getSession();
        const session = sessionRes?.data?.session;
        
        if (session) {
          const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          if (data) {
            setProfile(data);
            targetUserId = data.id;
          } else {
            setProfile(prev => ({ ...prev, id: session.user.id }));
            targetUserId = session.user.id;
          }
        }
      }

      if (targetUserId) {
        const [lRes, nRes] = await Promise.all([
          supabase.from('tools').select('*').eq('user_id', targetUserId).order('created_at', { ascending: false }),
          supabase.from('news').select('*').eq('user_id', targetUserId).order('created_at', { ascending: false })
        ]);
        if (lRes.data) setLinks(lRes.data);
        if (nRes.data) setNews(nRes.data);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handlePop = (e: any) => {
      if (e.state?.view) {
        setCurrentView(e.state.view);
      } else {
        setCurrentView(getInitialView());
      }
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const navigateTo = (view: ViewType) => {
    const paths: Record<ViewType, string> = {
      'HOME': '/',
      'ADMIN': '/admin',
      'PRIVACY': '/privacidade',
      'NEWS_LIST': '/novidades'
    };
    
    const params = new URLSearchParams(window.location.search);
    const u = params.get('u');
    const finalPath = u ? `${paths[view]}?u=${u}` : paths[view];

    window.history.pushState({ view }, '', finalPath);
    setCurrentView(view);
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (userNotFound) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-10 text-center">
        <h1 className="text-4xl font-black mb-4">404</h1>
        <p className="text-slate-400 mb-8">Perfil não encontrado no ecossistema TeamBot.</p>
        <button onClick={() => window.location.href = '/'} className="bg-indigo-600 px-8 py-4 rounded-2xl font-bold">Voltar</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200">
      <Header 
        onMenuClick={() => setIsSidebarOpen(true)} 
        onAdminClick={() => navigateTo('ADMIN')}
        mascotUrl={profile.mascot_url}
      />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onNavigate={navigateTo} currentView={currentView} />

      <main className={`flex-grow pt-20 pb-24 px-4 max-w-2xl mx-auto w-full transition-opacity ${loading && !links.length ? 'opacity-50' : 'opacity-100'}`}>
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
