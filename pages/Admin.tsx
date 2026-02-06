
import React, { useState, useEffect } from 'react';
import { Profile, LinkItem, News } from '../types';
import { supabase } from '../supabaseClient';
import { GoogleGenAI } from "@google/genai";

interface AdminProps {
  profile: Profile;
  setProfile: (p: Profile) => void;
  links: LinkItem[];
  setLinks: (l: LinkItem[]) => void;
  news: News[];
  setNews: (n: News[]) => void;
  onBack: () => void;
}

interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
  id: number;
  duration?: number;
}

const Admin: React.FC<AdminProps> = ({ profile, setProfile, links, setLinks, news, setNews, onBack }) => {
  const [session, setSession] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP' | 'RECOVER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'LINKS' | 'NEWS' | 'PROFILE'>('PROFILE');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const [assistantMessage, setAssistantMessage] = useState<string | null>(null);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);

  const [showAddLinkForm, setShowAddLinkForm] = useState(false);
  const [showAddNewsForm, setShowAddNewsForm] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);

  const [newLink, setNewLink] = useState({ title: '', description: '', url: '', icon_url: '' });
  const [newPost, setNewPost] = useState({ title: '', content: '', image_url: '', link_url: '' });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserData(session.user.id);
      }
    });
  }, []);

  const generateAssistantInsight = async () => {
    if (!session?.user?.id) return;
    setIsAssistantLoading(true);
    setAssistantMessage(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const totalClicks = links.reduce((acc, curr) => acc + (curr.click_count || 0), 0);
      
      const contextPrompt = `
        Você é o TeamBot, consultor de branding.
        Dê uma dica curta e premium para:
        - Nome: ${profile.name}
        - Bio: ${profile.bio}
        - Cliques: ${totalClicks}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contextPrompt,
      });

      if (response.text) {
        setAssistantMessage(response.text.trim());
      }
    } catch (error) {
      setAssistantMessage("Pronto para elevar seu posicionamento digital?");
    } finally {
      setIsAssistantLoading(false);
    }
  };

  const addNotification = (message: string, type: 'success' | 'error' | 'info' = 'info', duration = 4000) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  };

  const fetchUserData = async (userId: string) => {
    try {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (prof) {
        setProfile(prof);
      } else {
        setProfile(prev => ({ ...prev, id: userId }));
      }
      
      const { data: lks } = await supabase.from('tools').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (lks) setLinks(lks || []);

      const { data: nws } = await supabase.from('news').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (nws) setNews(nws || []);
    } catch (e) {
      console.error("Erro ao buscar dados", e);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMode === 'LOGIN') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setSession(data.session);
        fetchUserData(data.session!.user.id);
        addNotification('Acesso autorizado!', 'success');
      } else if (authMode === 'SIGNUP') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user && !data.session) {
          addNotification('Verifique seu e-mail!', 'success', 10000);
          setAuthMode('LOGIN');
        } else if (data.session) {
          setSession(data.session);
          fetchUserData(data.session.user.id);
          addNotification('Bem-vindo!', 'success');
        }
      }
    } catch (err: any) { addNotification(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const saveProfile = async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: session.user.id,
        name: profile.name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        mascot_url: profile.mascot_url,
        slug: profile.slug,
        updated_at: new Date()
      });
      if (error) throw error;
      addNotification('Perfil atualizado!', 'success');
      generateAssistantInsight();
    } catch (err: any) { addNotification(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      if (editingLinkId) {
        await supabase.from('tools').update({ ...newLink }).eq('id', editingLinkId);
        setLinks(links.map(l => l.id === editingLinkId ? { ...l, ...newLink } : l));
        addNotification('Link atualizado!', 'success');
      } else {
        const { data } = await supabase.from('tools').insert([{ ...newLink, user_id: session.user.id }]).select();
        if (data) setLinks([data[0], ...links]);
        addNotification('Link adicionado!', 'success');
      }
      setNewLink({ title: '', description: '', url: '', icon_url: '' });
      setEditingLinkId(null);
      setShowAddLinkForm(false);
    } catch (err: any) { addNotification(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      if (editingPostId) {
        await supabase.from('news').update({ ...newPost }).eq('id', editingPostId);
        setNews(news.map(n => n.id === editingPostId ? { ...n, ...newPost } : n));
        addNotification('Post atualizado!', 'success');
      } else {
        const { data } = await supabase.from('news').insert([{ ...newPost, user_id: session.user.id }]).select();
        if (data) setNews([data[0], ...news]);
        addNotification('Publicado!', 'success');
      }
      setNewPost({ title: '', content: '', image_url: '', link_url: '' });
      setEditingPostId(null);
      setShowAddNewsForm(false);
    } catch (err: any) { addNotification(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const deleteLink = async (id: string) => {
    if (!confirm('Excluir?')) return;
    await supabase.from('tools').delete().eq('id', id);
    setLinks(links.filter(l => l.id !== id));
  };

  const deletePost = async (id: string) => {
    if (!confirm('Remover?')) return;
    await supabase.from('news').delete().eq('id', id);
    setNews(news.filter(n => n.id !== id));
  };

  const getPublicUrl = () => `${window.location.origin}/?u=${profile.slug || 'teambot'}`;

  return (
    <div className="relative min-h-[600px] pb-32 font-sans px-2">
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4 flex flex-col gap-3 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className="glass-premium p-4 rounded-2xl shadow-2xl flex items-center border-l-4 border-indigo-500 bg-indigo-500/10 pointer-events-auto">
            <p className="text-[10px] text-white font-bold uppercase tracking-widest">{n.message}</p>
          </div>
        ))}
      </div>

      {!session ? (
        <div className="max-w-md mx-auto mt-10 p-10 glass rounded-[3rem] text-center shadow-2xl">
            <h2 className="text-2xl font-black mb-6 text-white uppercase tracking-widest">Painel TeamBot</h2>
            <form onSubmit={handleAuth} className="space-y-4">
              <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-900 border border-white/5 p-4 rounded-xl text-white outline-none" required />
              <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-900 border border-white/5 p-4 rounded-xl text-white outline-none" required />
              <button disabled={loading} className="w-full bg-indigo-600 py-5 rounded-xl font-black text-white uppercase tracking-widest text-xs active:scale-95 transition-all">
                {loading ? 'Entrando...' : 'Acessar'}
              </button>
            </form>
            <button onClick={() => setAuthMode(authMode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')} className="mt-6 text-[10px] text-slate-500 font-black uppercase hover:text-white">
              {authMode === 'LOGIN' ? 'Criar nova conta' : 'Já tenho conta'}
            </button>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="flex justify-between items-end mb-10 px-2">
            <div>
               <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest mb-1">Logado</p>
               <h1 className="text-3xl font-black text-white uppercase">Painel</h1>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-500/10 px-4 py-2 rounded-xl">Sair</button>
          </div>

          <div className="flex gap-2 p-1.5 glass rounded-2xl mb-8 overflow-x-auto no-scrollbar">
            {(['LINKS', 'NEWS', 'PROFILE'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-grow py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                {tab === 'LINKS' ? 'Links' : tab === 'NEWS' ? 'Updates' : 'Perfil'}
              </button>
            ))}
          </div>

          <div className="space-y-8">
            {activeTab === 'PROFILE' && (
              <div className="space-y-6">
                <div className="glass p-6 rounded-3xl border-indigo-500/20 space-y-3">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Seu Link</label>
                  <div className="flex gap-2">
                    <div className="flex-grow bg-slate-950 p-3 rounded-xl text-[10px] font-mono text-indigo-300 truncate border border-white/5">{getPublicUrl()}</div>
                    <button onClick={() => { navigator.clipboard.writeText(getPublicUrl()); addNotification('Copiado!'); }} className="bg-indigo-600 px-4 rounded-xl text-[9px] font-black uppercase text-white">Copiar</button>
                  </div>
                </div>
                <div className="glass p-8 rounded-[2.5rem] space-y-6 border-white/5">
                    <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="Seu Nome" className="w-full bg-slate-950 border border-white/5 p-4 rounded-2xl text-sm font-bold text-white outline-none" />
                    <input value={profile.slug || ''} onChange={e => setProfile({...profile, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} placeholder="slug-da-url" className="w-full bg-slate-950 border border-white/5 p-4 rounded-2xl text-sm font-bold text-white outline-none" />
                    <textarea value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} placeholder="Sua bio..." className="w-full bg-slate-950 border border-white/5 p-4 rounded-2xl text-sm font-medium text-slate-300 h-28 resize-none outline-none" />
                    <button disabled={loading} onClick={saveProfile} className="w-full bg-indigo-600 py-5 rounded-2xl font-black text-white text-[11px] uppercase tracking-widest shadow-xl active:scale-95">{loading ? 'Salvando...' : 'Salvar Perfil'}</button>
                </div>
              </div>
            )}

            {activeTab === 'LINKS' && (
              <div className="space-y-4">
                <button onClick={() => { setShowAddLinkForm(!showAddLinkForm); setEditingLinkId(null); }} className="w-full glass p-6 rounded-2xl text-indigo-400 font-black text-[10px] uppercase tracking-widest border-dashed border-2 border-indigo-500/20">
                  + Adicionar Link
                </button>
                {showAddLinkForm && (
                  <form onSubmit={handleSaveLink} className="glass p-6 rounded-3xl space-y-4">
                    <input placeholder="Título" value={newLink.title} onChange={e => setNewLink({...newLink, title: e.target.value})} className="w-full bg-slate-950 p-4 rounded-xl text-white outline-none border border-white/5 text-sm" required />
                    <input placeholder="URL" value={newLink.url} onChange={e => setNewLink({...newLink, url: e.target.value})} className="w-full bg-slate-950 p-4 rounded-xl text-white outline-none border border-white/5 text-sm" required />
                    <button className="w-full bg-indigo-600 py-4 rounded-xl font-black text-white text-[10px] uppercase">Confirmar Link</button>
                  </form>
                )}
                <div className="space-y-3">
                  {links.map(l => (
                    <div key={l.id} className="glass p-4 rounded-2xl flex items-center justify-between border border-white/5">
                      <div className="min-w-0">
                        <p className="text-white font-black text-[11px] uppercase truncate">{l.title}</p>
                        <p className="text-slate-500 text-[8px] font-bold uppercase">{l.click_count || 0} cliques</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setNewLink({...l}); setEditingLinkId(l.id); setShowAddLinkForm(true); }} className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-400 text-xs flex items-center justify-center">✎</button>
                        <button onClick={() => deleteLink(l.id)} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500/60 text-xs flex items-center justify-center">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'NEWS' && (
              <div className="space-y-4">
                <button onClick={() => { setShowAddNewsForm(!showAddNewsForm); setEditingPostId(null); }} className="w-full glass p-6 rounded-2xl text-indigo-400 font-black text-[10px] uppercase tracking-widest border-dashed border-2 border-indigo-500/20">
                  + Nova Notícia
                </button>
                {showAddNewsForm && (
                  <form onSubmit={handleSavePost} className="glass p-6 rounded-3xl space-y-4">
                    <input placeholder="Título" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} className="w-full bg-slate-950 p-4 rounded-xl text-white outline-none border border-white/5 text-sm" required />
                    <textarea placeholder="Texto..." value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} className="w-full bg-slate-950 p-4 rounded-xl text-white h-24 resize-none border border-white/5 text-sm" required />
                    <button className="w-full bg-indigo-600 py-4 rounded-xl font-black text-white text-[10px] uppercase">Publicar Notícia</button>
                  </form>
                )}
                <div className="space-y-3">
                  {news.map(n => (
                    <div key={n.id} className="glass p-4 rounded-2xl flex items-center justify-between border border-white/5">
                      <p className="text-white font-black text-[11px] uppercase truncate">{n.title}</p>
                      <div className="flex gap-2">
                        <button onClick={() => { setNewPost({...n}); setEditingPostId(n.id); setShowAddNewsForm(true); }} className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-400 text-xs flex items-center justify-center">✎</button>
                        <button onClick={() => deletePost(n.id)} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500/60 text-xs flex items-center justify-center">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
