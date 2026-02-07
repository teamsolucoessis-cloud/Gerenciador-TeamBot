
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
  // Sênior: Iniciamos sempre no HOME. O roteamento agora é via query param 'v'
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

      // Limpamos dados antigos para evitar vazamento de informações entre perfis
      setLinks([]);
      setNews([]);

      let targetUserId = null;

      // Prioridade 1: Slug na URL (Visualização de perfil específico)
      if (urlSlug) {
        const { data: profData } = await supabase.from('profiles').select('*').eq('slug', urlSlug.toLowerCase()).single();
        if (profData) {
          setProfile(profData);
          targetUserId = profData.id;
        }
      } 
      // Prioridade 2: Usuário Logado sem slug na URL (Ver seu próprio perfil)
      else if (session) {
        const { data: ownProf } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (ownProf) {
          setProfile(ownProf);
          targetUserId = ownProf.id;
        }
      }

      // Fallback: Se nada acima funcionar, carrega o perfil oficial TeamBot
      if (!targetUserId) {
        const { data: officialProf } = await supabase.from('profiles').select('*').eq('slug', BRAND_CONFIG.SHOWCASE_SLUG).single();
        if (officialProf) {
          setProfile(officialProf);
          targetUserId = officialProf.id;
        }
      }

      // Busca dados específicos do usuário identificado
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
    // Sênior: Lógica de Reset no F5. 
    // Sempre que o app carrega, limpamos o parâmetro de visualização 'v', forçando a volta para HOME.
    const params = new URLSearchParams(window.location.search);
    if (params.has('v')) {
      params.delete('v');
      const newUrl = params.toString() ? `/?${params.toString()}` : '/';
      window.history.replaceState({ view: 'HOME' }, '', newUrl);
    }

    fetchData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsGuest(!session);
      if (event === 'SIGNED_OUT') {
        setProfile(INITIAL_PROFILE);
        setCurrentView('HOME');
        // Redirecionamento forçado para a vitrine oficial após logout
        window.location.href = '/?u=' + BRAND_CONFIG.SHOWCASE_SLUG;
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchData]);

  const navigateTo = (view: ViewType) => {
    const params = new URLSearchParams(window.location.search);
    
    // Atualiza o parâmetro de visualização na URL sem mudar o path (evita 404)
    if (view === 'HOME') params.delete('v');
    else params.set('v', view);
    
    const newUrl = params.toString() ? `/?${params.toString()}` : '/';
    window.history.pushState({ view }, '', newUrl);
    
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

      <main className={`flex-grow pt-20 pb-44 px-4 max-w-2xl mx-auto w-full transition-opacity duration-500 ${loading ? 'opacity-50' : 'opacity-100'}`}>
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
