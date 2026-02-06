
import React, { useState, useEffect } from 'react';
import { Profile, LinkItem, News } from '../types';
import { supabase } from '../supabaseClient';
import { GoogleGenAI } from "@google/genai";
import { BRAND_CONFIG } from '../brand';

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
  const [activeTab, setActiveTab] = useState<'LINKS' | 'NEWS' | 'PROFILE'>('PROFILE');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const [assistantMessage, setAssistantMessage] = useState<string | null>("Olá! Sou seu assistente TeamBot. Pronto para otimizar sua presença digital hoje?");
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
    
    const apiKey = (window as any).process?.env?.API_KEY || '';
    if (!apiKey) return;

    setIsAssistantLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const contextPrompt = `Dê um insight ultra-rápido (max 15 palavras) para o administrador ${profile.name}. Foco em: aumentar conversões de links. Seja sênior e direto.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contextPrompt,
      });

      if (response.text) {
        setAssistantMessage(response.text.trim());
      }
    } catch (error) {
      console.warn("AI Insight skip:", error);
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

      // Gera um insight ao carregar dados pela primeira vez
      setTimeout(generateAssistantInsight, 1000);
    } catch (e) {
      console.error("Fetch error", e);
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
        addNotification('Sessão Iniciada!', 'success');
      } else if (authMode === 'SIGNUP') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        addNotification('Conta criada! Verifique seu email.', 'success');
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
      addNotification('Sincronizado na Nuvem!', 'success');
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
        addNotification('Link criado!', 'success');
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
        addNotification('Post publicado!', 'success');
      }
      setNewPost({ title: '', content: '', image_url: '', link_url: '' });
      setEditingPostId(null);
      setShowAddNewsForm(false);
    } catch (err: any) { addNotification(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const deleteLink = async (id: string) => {
    if (!confirm('Deseja excluir este link permanentemente?')) return;
    await supabase.from('tools').delete().eq('id', id);
    setLinks(links.filter(l => l.id !== id));
    addNotification('Removido');
  };

  const deletePost = async (id: string) => {
    if (!confirm('Deseja excluir este post?')) return;
    await supabase.from('news').delete().eq('id', id);
    setNews(news.filter(n => n.id !== id));
    addNotification('Removido');
  };

  const getPublicUrl = () => `${window.location.origin}/?u=${profile.slug || 'teambot'}`;

  return (
    <div className="relative min-h-[600px] pb-32 font-sans px-2">
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4 flex flex-col gap-3 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className="glass-premium p-4 rounded-2xl shadow-2xl flex items-center border-l-4 border-indigo-500 bg-slate-950/95 backdrop-blur-xl pointer-events-auto animate-in slide-in-from-top-4">
            <p className="text-[10px] text-white font-bold uppercase tracking-widest">{n.message}</p>
          </div>
        ))}
      </div>

      {!session ? (
        <div className="max-w-md mx-auto mt-10 p-10 glass-premium rounded-[3rem] text-center shadow-2xl border border-white/5">
            <h2 className="text-2xl font-black mb-6 text-white uppercase tracking-widest tracking-tighter">TeamBot Admin</h2>
            <form onSubmit={handleAuth} className="space-y-4">
              <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-900/50 border border-white/5 p-4 rounded-xl text-white outline-none focus:border-indigo-500/50 transition-colors" required />
              <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-900/50 border border-white/5 p-4 rounded-xl text-white outline-none focus:border-indigo-500/50 transition-colors" required />
              <button disabled={loading} className="w-full bg-indigo-600 py-5 rounded-xl font-black text-white uppercase tracking-widest text-xs active:scale-95 transition-all shadow-lg shadow-indigo-500/20">
                {loading ? 'Aguarde...' : 'Acessar Central'}
              </button>
            </form>
            <button onClick={() => setAuthMode(authMode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')} className="mt-6 text-[9px] text-slate-500 font-black uppercase hover:text-white transition-colors">
              {authMode === 'LOGIN' ? 'Não tem conta? Criar Agora' : 'Já sou membro? Entrar'}
            </button>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          
          {/* AI Assistant Banner */}
          <div className="mb-10 relative group">
             <div className="absolute inset-0 bg-indigo-600/10 blur-2xl rounded-[2rem]"></div>
             <div className="relative glass-premium p-5 rounded-[2rem] border border-indigo-500/20 flex items-center gap-6 overflow-hidden">
                <div className="shrink-0 w-16 h-16 animate-mascot relative">
                   <div className="absolute inset-0 bg-indigo-500/30 blur-xl rounded-full"></div>
                   <img src={profile.mascot_url || BRAND_CONFIG.OFFICIAL_MASCOTE_URL} alt="IA Assistant" className="w-full h-full object-contain relative z-10" />
                </div>
                <div className="min-w-0">
                   <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Dica da Inteligência</p>
                   <p className="text-white text-xs font-medium leading-relaxed italic line-clamp-2">
                     {isAssistantLoading ? 'Analisando dados...' : `"${assistantMessage}"`}
                   </p>
                </div>
                <button onClick={generateAssistantInsight} className="absolute top-4 right-4 text-white/20 hover:text-indigo-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
                </button>
             </div>
          </div>

          <div className="flex justify-between items-end mb-10 px-2">
            <div>
               <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest mb-1">Membro Gold</p>
               <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Dashboard</h1>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="text-slate-500 hover:text-red-400 text-[10px] font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl transition-colors">Sair</button>
          </div>

          <div className="flex gap-2 p-1.5 glass-premium rounded-2xl mb-8 overflow-x-auto no-scrollbar border border-white/5">
            {(['LINKS', 'NEWS', 'PROFILE'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-grow py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-white'}`}>
                {tab === 'LINKS' ? 'Links' : tab === 'NEWS' ? 'Updates' : 'Perfil'}
              </button>
            ))}
          </div>

          <div className="space-y-8">
            {activeTab === 'PROFILE' && (
              <div className="space-y-6">
                <div className="glass-premium p-6 rounded-3xl border-indigo-500/20 space-y-3">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">URL Exclusiva</label>
                  <div className="flex gap-2">
                    <div className="flex-grow bg-slate-950 p-3 rounded-xl text-[10px] font-mono text-indigo-300 truncate border border-white/5">{getPublicUrl()}</div>
                    <button onClick={() => { navigator.clipboard.writeText(getPublicUrl()); addNotification('URL Copiada!', 'info'); }} className="bg-indigo-600 px-4 rounded-xl text-[9px] font-black uppercase text-white active:scale-95 transition-transform">Copiar</button>
                  </div>
                </div>
                <div className="glass-premium p-8 rounded-[2.5rem] space-y-6 border border-white/5 shadow-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Nome de Exibição</label>
                           <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full bg-slate-950/50 border border-white/5 p-4 rounded-2xl text-sm font-bold text-white outline-none focus:border-indigo-500/30" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Slug (URL)</label>
                           <input value={profile.slug || ''} onChange={e => setProfile({...profile, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} placeholder="ex: seu-nome" className="w-full bg-slate-950/50 border border-white/5 p-4 rounded-2xl text-sm font-bold text-white outline-none focus:border-indigo-500/30" />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">URL da Foto de Perfil</label>
                           <input value={profile.avatar_url} onChange={e => setProfile({...profile, avatar_url: e.target.value})} placeholder="Link da imagem no Bucket" className="w-full bg-slate-950/50 border border-white/5 p-4 rounded-2xl text-sm font-bold text-indigo-300 outline-none focus:border-indigo-500/30" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">URL do Mascote (IA)</label>
                           <input value={profile.mascot_url} onChange={e => setProfile({...profile, mascot_url: e.target.value})} placeholder="Link do PNG Transparente" className="w-full bg-slate-950/50 border border-white/5 p-4 rounded-2xl text-sm font-bold text-indigo-300 outline-none focus:border-indigo-500/30" />
                        </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Bio Curta</label>
                       <textarea value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} className="w-full bg-slate-950/50 border border-white/5 p-4 rounded-2xl text-sm font-medium text-slate-300 h-28 resize-none outline-none focus:border-indigo-500/30 transition-colors" />
                    </div>
                    <button disabled={loading} onClick={saveProfile} className="w-full bg-indigo-600 py-5 rounded-2xl font-black text-white text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                       {loading ? 'Sincronizando...' : 'Publicar Alterações'}
                    </button>
                </div>
              </div>
            )}

            {activeTab === 'LINKS' && (
              <div className="space-y-4">
                <button onClick={() => { setShowAddLinkForm(!showAddLinkForm); setEditingLinkId(null); }} className="w-full glass-premium p-6 rounded-2xl text-indigo-400 font-black text-[10px] uppercase tracking-widest border-dashed border-2 border-indigo-500/20 hover:bg-indigo-500/5 transition-colors">
                  + Novo Link Estratégico
                </button>
                {showAddLinkForm && (
                  <form onSubmit={handleSaveLink} className="glass-premium p-8 rounded-3xl space-y-4 border border-white/10 animate-in slide-in-from-top-2 shadow-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input placeholder="Título" value={newLink.title} onChange={e => setNewLink({...newLink, title: e.target.value})} className="w-full bg-slate-950 p-4 rounded-xl text-white border border-white/5 text-sm font-bold" required />
                        <input placeholder="Ícone URL" value={newLink.icon_url} onChange={e => setNewLink({...newLink, icon_url: e.target.value})} className="w-full bg-slate-950 p-4 rounded-xl text-indigo-300 border border-white/5 text-sm" />
                    </div>
                    <input placeholder="URL de Destino (https://...)" value={newLink.url} onChange={e => setNewLink({...newLink, url: e.target.value})} className="w-full bg-slate-950 p-4 rounded-xl text-white border border-white/5 text-sm" required />
                    <textarea placeholder="Pequena explicação (aparece no card)" value={newLink.description} onChange={e => setNewLink({...newLink, description: e.target.value})} className="w-full bg-slate-950 p-4 rounded-xl text-slate-400 border border-white/5 text-xs h-20 resize-none" />
                    <button className="w-full bg-indigo-600 py-4 rounded-xl font-black text-white text-[10px] uppercase shadow-lg active:scale-95 transition-transform">Confirmar Dados</button>
                  </form>
                )}
                <div className="space-y-3">
                  {links.map(l => (
                    <div key={l.id} className="glass-premium p-4 rounded-2xl flex items-center justify-between border border-white/5 group hover:border-indigo-500/30 transition-colors shadow-lg">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 bg-slate-950 rounded-lg flex items-center justify-center border border-white/5 shrink-0 overflow-hidden">
                           <img src={l.icon_url || BRAND_CONFIG.FALLBACK_URL} alt="" className="w-6 h-6 object-contain" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-black text-[11px] uppercase truncate">{l.title}</p>
                          <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest">{l.click_count || 0} Cliques</p>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setNewLink({...l}); setEditingLinkId(l.id); setShowAddLinkForm(true); }} className="w-8 h-8 rounded-lg bg-white/5 text-white/40 text-xs flex items-center justify-center hover:bg-indigo-600/20 hover:text-indigo-400 transition-all">✎</button>
                        <button onClick={() => deleteLink(l.id)} className="w-8 h-8 rounded-lg bg-white/5 text-white/40 text-xs flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 transition-all">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'NEWS' && (
              <div className="space-y-4">
                <button onClick={() => { setShowAddNewsForm(!showAddNewsForm); setEditingPostId(null); }} className="w-full glass-premium p-6 rounded-2xl text-indigo-400 font-black text-[10px] uppercase tracking-widest border-dashed border-2 border-indigo-500/20 hover:bg-indigo-500/5 transition-colors">
                  + Nova Notícia de Impacto
                </button>
                {showAddNewsForm && (
                  <form onSubmit={handleSavePost} className="glass-premium p-8 rounded-3xl space-y-4 border border-white/10 animate-in slide-in-from-top-2 shadow-2xl">
                    <input placeholder="Título Chamativo" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} className="w-full bg-slate-950 p-4 rounded-xl text-white border border-white/5 text-sm font-bold" required />
                    <input placeholder="Imagem URL (Banner)" value={newPost.image_url} onChange={e => setNewPost({...newPost, image_url: e.target.value})} className="w-full bg-slate-950 p-4 rounded-xl text-indigo-300 border border-white/5 text-sm" />
                    <input placeholder="Link Externo (Opcional)" value={newPost.link_url} onChange={e => setNewPost({...newPost, link_url: e.target.value})} className="w-full bg-slate-950 p-4 rounded-xl text-white border border-white/5 text-sm" />
                    <textarea placeholder="Conteúdo da notícia..." value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} className="w-full bg-slate-950 p-4 rounded-xl text-slate-400 border border-white/5 text-xs h-32 resize-none" required />
                    <button className="w-full bg-indigo-600 py-4 rounded-xl font-black text-white text-[10px] uppercase shadow-lg active:scale-95 transition-transform">Publicar Agora</button>
                  </form>
                )}
                <div className="space-y-3">
                  {news.map(n => (
                    <div key={n.id} className="glass-premium p-4 rounded-2xl flex items-center justify-between border border-white/5 group hover:border-indigo-500/30 transition-colors shadow-lg">
                      <div className="flex items-center gap-4 min-w-0">
                         <div className="w-12 h-8 bg-slate-950 rounded-lg overflow-hidden border border-white/5 shrink-0">
                            <img src={n.image_url || BRAND_CONFIG.FALLBACK_URL} alt="" className="w-full h-full object-cover opacity-50" />
                         </div>
                         <p className="text-white font-black text-[11px] uppercase truncate">{n.title}</p>
                      </div>
                      <div className="flex gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setNewPost({...n}); setEditingPostId(n.id); setShowAddNewsForm(true); }} className="w-8 h-8 rounded-lg bg-white/5 text-white/40 text-xs flex items-center justify-center hover:bg-indigo-600/20 hover:text-indigo-400">✎</button>
                        <button onClick={() => deletePost(n.id)} className="w-8 h-8 rounded-lg bg-white/5 text-white/40 text-xs flex items-center justify-center hover:bg-red-500/20 hover:text-red-500">✕</button>
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
