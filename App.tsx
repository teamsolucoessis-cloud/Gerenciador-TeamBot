
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
  // Sênior: Forçamos sempre o HOME no estado inicial para evitar erros de rota física no refresh
  const [currentView, setCurrentView] = useState<ViewType>('HOME');
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

      if (!urlSlug && session) {
        const { data: ownProf } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (ownProf) {
          setProfile(ownProf);
          targetUserId = ownProf.id;
        } else {
          const { data: profData } = await supabase.from('profiles').select('*').eq('slug', BRAND_CONFIG.SHOWCASE_SLUG).single();
          if (profData) { setProfile(profData); targetUserId = profData.id; }
        }
      } 
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
        if (nRes.data) setNews(lRes.data);
      }
    } catch (err) {
      console.error("Fetch Data Failure:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Sênior: No carregamento, limpamos a rota física para evitar 404 em servidores sem redirecionamento
    const currentPath = window.location.pathname;
    if (currentPath !== '/') {
      window.history.replaceState({ view: 'HOME' }, '', '/');
    }

    fetchData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsGuest(!session);
      if (event === 'SIGNED_OUT') {
        setProfile(INITIAL_PROFILE);
        setCurrentView('HOME');
        // Ao deslogar, forçamos o redirecionamento para o perfil oficial (público)
        window.location.href = '/?u=' + BRAND_CONFIG.SHOWCASE_SLUG;
      }
    });

    const handlePop = (e: any) => {
      setCurrentView(e.state?.view || 'HOME');
    };
    window.addEventListener('popstate', handlePop);
    return () => {
      window.removeEventListener('popstate', handlePop);
      subscription.unsubscribe();
    };
  }, [fetchData]);

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
        onLogoClick={() => {
          window.location.href = '/?u=' + BRAND_CONFIG.SHOWCASE_SLUG;
        }}
      />
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNavigate={navigateTo} 
        currentView={currentView} 
      />

      <main className={`flex-grow pt-20 pb-40 px-4 max-w-2xl mx-auto w-full transition-opacity duration-500 ${loading ? 'opacity-50' : 'opacity-100'}`}>
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
