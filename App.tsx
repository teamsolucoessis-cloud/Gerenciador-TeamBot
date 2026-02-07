
import React, { useState, useEffect, useCallback } from 'react';
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
  id: '', 
  name: 'TeamBot Official',
  bio: 'Carregando ecossistema digital...',
  avatar_url: BRAND_CONFIG.OFFICIAL_MASCOTE_URL,
  mascot_url: BRAND_CONFIG.OFFICIAL_MASCOTE_URL,
  slug: BRAND_CONFIG.SHOWCASE_SLUG
};

const App: React.FC = () => {
  const getInitialView = useCallback((): ViewType => {
    const path = window.location.pathname;
    if (path.includes('/admin')) return 'ADMIN';
    if (path.includes('/privacidade')) return 'PRIVACY';
    if (path.includes('/novidades')) return 'NEWS_LIST';
    return 'HOME';
  }, []);

  const [currentView, setCurrentView] = useState<ViewType>(getInitialView());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<Profile>(INITIAL_PROFILE);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(window.location.search);
      const urlSlug = params.get('u');
      
      const { data: { session } } = await supabase.auth.getSession();
      setIsGuest(!session);

      let targetUserId = null;
      let finalSlug = urlSlug;

      // Se NÃO houver slug na URL e o usuário estiver LOGADO, buscar o perfil DELE
      if (!urlSlug && session) {
        const { data: ownProf } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (ownProf) {
          setProfile(ownProf);
          targetUserId = ownProf.id;
        } else {
          // Fallback para vitrine se ele logou mas não tem perfil ainda
          finalSlug = BRAND_CONFIG.SHOWCASE_SLUG;
        }
      } 
      // Se houver slug na URL ou for GUEST (sem slug), buscar pelo slug (ou vitrine)
      else {
        const slugToSearch = urlSlug || BRAND_CONFIG.SHOWCASE_SLUG;
        const { data: profData } = await supabase.from('profiles').select('*').eq('slug', slugToSearch.toLowerCase()).single();
        if (profData) {
          setProfile(profData);
          targetUserId = profData.id;
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
      console.error("Fetch Data Failure:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const handlePop = (e: any) => {
      setCurrentView(e.state?.view || getInitialView());
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [fetchData, getInitialView]);

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

    try {
        window.history.pushState({ view }, '', finalPath);
    } catch (e) {
        console.warn("Navigation fallback");
    }
    
    setCurrentView(view);
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200">
      <Header 
        onMenuClick={() => setIsSidebarOpen(true)} 
        onAdminClick={() => navigateTo('ADMIN')}
        mascotUrl={profile.mascot_url}
      />
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNavigate={navigateTo} 
        currentView={currentView} 
      />

      <main className={`flex-grow pt-20 pb-32 px-4 max-w-2xl mx-auto w-full transition-opacity duration-500 ${loading ? 'opacity-50' : 'opacity-100'}`}>
        {currentView === 'HOME' && <Home profile={profile} links={links} news={news} onNavigate={navigateTo} isGuest={isGuest} />}
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
