
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

  useEffect(() => {
    // Verificação robusta para evitar disparar a IA com ID inválido
    const isValidId = session?.user?.id && profile.id === session.user.id;
    if (isValidId && !assistantMessage && !isAssistantLoading) {
      generateAssistantInsight();
    }
  }, [profile.id, session]);

  const generateAssistantInsight = async () => {
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

  const handleFileUpload = async (file: File, bucketPath: string) => {
    if (!session) return null;
    setUploading(bucketPath);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/${bucketPath}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('teambot').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('teambot').getPublicUrl(fileName);
      addNotification('Upload concluído!', 'success');
      return data.publicUrl;
    } catch (error: any) {
      addNotification(error.message, 'error');
      return null;
    } finally {
      setUploading(null);
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
      } else if (authMode === 'RECOVER') {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        addNotification('E-mail enviado!', 'info');
        setAuthMode('LOGIN');
      }
    } catch (err: any) { addNotification(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const saveProfile = async () => {
    if (!session?.user?.id) {
        addNotification('Sessão expirada. Faça login novamente.', 'error');
        return;
    }
    setLoading(true);
    try {
      // MAPEAMENTO EXPLÍCITO: Ignoramos o profile.id antigo e forçamos o ID da sessão.
      const payload = {
        id: session.user.id,
        name: profile.name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        mascot_url: profile.mascot_url,
        slug: profile.slug,
        updated_at: new Date()
      };
      
      const { error } = await supabase.from('profiles').upsert(payload);
      if (error) throw error;
      
      setProfile({ ...profile, id: session.user.id });
      addNotification('Configurações salvas!', 'success');
      generateAssistantInsight();
    } catch (err: any) { 
        console.error("Save error:", err);
        addNotification(err.message, 'error'); 
    }
    finally { setLoading(false); }
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingLinkId) {
        await supabase.from('tools').update({ ...newLink }).eq('id', editingLinkId);
        setLinks(links.map(l => l.id === editingLinkId ? { ...l, ...newLink } : l));
        addNotification('Link atualizado!', 'success');
      } else {
        const { data } = await supabase.from('tools').insert([{ ...newLink, user_id: session.user.id }]).select();
        setLinks([data![0], ...links]);
        addNotification('Link adicionado!', 'success');
      }
      setNewLink({ title: '', description: '', url: '', icon_url: '' });
      setEditingLinkId(null);
      setShowAddLinkForm(false);
      generateAssistantInsight();
    } catch (err: any) { addNotification(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingPostId) {
        await supabase.from('news').update({ ...newPost }).eq('id', editingPostId);
        setNews(news.map(n => n.id === editingPostId ? { ...n, ...newPost } : n));
        addNotification('Post atualizado!', 'success');
      } else {
        const { data } = await supabase.from('news').insert([{ ...newPost, user_id: session.user.id }]).select();
        setNews([data![0], ...news]);
        addNotification('Notícia publicada!', 'success');
      }
      setNewPost({ title: '', content: '', image_url: '', link_url: '' });
      setEditingPostId(null);
      setShowAddNewsForm(false);
      generateAssistantInsight();
    } catch (err: any) { addNotification(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const deleteLink = async (id: string) => {
    if (!confirm('Excluir link?')) return;
    await supabase.from('tools').delete().eq('id', id);
    setLinks(links.filter(l => l.id !== id));
    addNotification('Removido.', 'info');
  };

  const deletePost = async (id: string) => {
    if (!confirm('Remover novidade?')) return;
    await supabase.from('news').delete().eq('id', id);
    setNews(news.filter(n => n.id !== id));
    addNotification('Removido.', 'info');
  };

  const getPublicUrl = () => `${window.location.origin}/?u=${profile.slug || 'teambot'}`;

  return (
    <div className="relative min-h-[600px] pb-32 font-sans px-2 sm:px-0">
      
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4 flex flex-col gap-3 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className={`glass-premium p-6 rounded-3xl shadow-2xl flex items-start gap-4 border-l-4 pointer-events-auto animate-in slide-in-from-top-10 duration-500 ${
            n.type === 'success' ? 'border-emerald-500 bg-emerald-500/10' : n.type === 'error' ? 'border-rose-500 bg-rose-500/10' : 'border-indigo-500 bg-indigo-500/10'
          }`}>
            <div className="flex-1">
              <p className="text-[11px] font-black text-white uppercase tracking-widest mb-1">{n.type}</p>
              <p className="text-[10px] text-slate-400 font-medium">{n.message}</p>
            </div>
          </div>
        ))}
      </div>

      {!session ? (
        <div className="max-w-md mx-auto mt-10 p-10 glass rounded-[3.5rem] text-center shadow-2xl animate-in zoom-in-95 relative overflow-hidden">
            <h2 className="text-3xl font-black mb-4 text-white uppercase tracking-widest">TeamBot Admin</h2>
            <form onSubmit={handleAuth} className="space-y-4 text-left">
              <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-900/50 border border-white/5 p-5 rounded-2xl text-white outline-none focus:ring-indigo-500/50" required />
              {authMode !== 'RECOVER' && <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-900/50 border border-white/5 p-5 rounded-2xl text-white outline-none focus:ring-indigo-500/50" required />}
              <button disabled={loading} className="w-full bg-indigo-600 py-6 rounded-2xl font-black text-white uppercase tracking-[0.3em] text-[10px] active:scale-95 transition-all shadow-xl mt-4">
                {loading ? 'Aguarde...' : authMode === 'LOGIN' ? 'Entrar' : authMode === 'SIGNUP' ? 'Criar Conta' : 'Recuperar'}
              </button>
            </form>
            <div className="mt-10">
              <button onClick={() => setAuthMode(authMode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')} className="text-[10px] text-slate-500 font-black uppercase tracking-widest hover:text-white transition-colors">
                {authMode === 'LOGIN' ? 'Não tem conta? Registre-se' : 'Já tem conta? Login'}
              </button>
            </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          
          <div className="relative mb-12 flex justify-center items-start pt-12">
            <div className="relative z-10 p-1 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.3)] shrink-0 group">
               <img src={profile.mascot_url || 'https://i.ibb.co/v4pXp2F/teambot-mascot.png'} className="w-20 h-20 rounded-full object-cover border-2 border-slate-950" alt="" />
               <button onClick={generateAssistantInsight} className="absolute -bottom-1 -right-1 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-slate-950 text-white shadow-lg">
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><polyline points="21 3 21 8 16 8"></polyline></svg>
               </button>
            </div>

            {assistantMessage && (
              <div className="absolute left-[50%] ml-12 top-0 max-w-[220px] glass-premium p-5 rounded-[1.8rem] rounded-tl-none border-indigo-500/30 shadow-2xl animate-in zoom-in-50 slide-in-from-left-4 duration-700">
                <p className="text-[10px] text-slate-300 font-medium leading-relaxed italic">"{assistantMessage}"</p>
              </div>
            )}
            
            {isAssistantLoading && (
              <div className="absolute left-[50%] ml-12 top-8 glass-premium px-5 py-3 rounded-full border-white/5 animate-pulse">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">TeamBot IA analisando...</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mb-10 px-2">
            <div>
               <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Logado como {profile.name.split(' ')[0]}</p>
               <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Painel</h1>
            </div>
            <button onClick={() => supabase.auth.signOut().then(() => { setSession(null); setProfile({ ...profile, id: '' }); })} className="glass px-5 py-3 rounded-2xl text-red-500/40 font-black text-[10px] uppercase tracking-widest hover:text-red-500 transition-all">Sair</button>
          </div>

          <div className="flex gap-2 p-2 glass rounded-[2rem] mb-10 overflow-x-auto no-scrollbar">
            {(['LINKS', 'NEWS', 'PROFILE'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-grow min-w-[100px] py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>
                {tab === 'LINKS' ? 'Links' : tab === 'NEWS' ? 'Notícias' : 'Perfil'}
              </button>
            ))}
          </div>

          <div className="space-y-10">
            {activeTab === 'PROFILE' && (
              <div className="space-y-8 animate-in slide-in-from-right-8 duration-600">
                <div className="glass p-8 rounded-[2.5rem] border-indigo-500/20 space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Link Público</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-grow bg-slate-950 p-4 rounded-2xl text-[11px] font-mono text-indigo-300 truncate border border-white/5 select-all">{getPublicUrl()}</div>
                    <button onClick={() => { navigator.clipboard.writeText(getPublicUrl()); addNotification('Link copiado!', 'success'); }} className="glass px-6 py-4 rounded-2xl text-[10px] font-black uppercase text-white active:scale-90 transition-all">Copiar</button>
                  </div>
                </div>
                <div className="glass p-10 rounded-[3rem] space-y-8 border-white/5">
                    <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome Completo / Marca</label>
                         <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="Seu Nome" className="w-full bg-slate-950 border border-white/5 p-6 rounded-3xl text-sm font-bold text-white outline-none" />
                    </div>
                    <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Slug (@identificador)</label>
                         <input value={profile.slug || ''} onChange={e => setProfile({...profile, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} placeholder="ex: meunome" className="w-full bg-slate-950 border border-white/5 p-6 rounded-3xl text-sm font-bold text-white outline-none" />
                    </div>
                    <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Bio Estratégica</label>
                         <textarea value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} placeholder="Sua bio premium..." className="w-full bg-slate-950 border border-white/5 p-6 rounded-3xl text-sm font-medium text-slate-300 h-32 resize-none outline-none" />
                    </div>
                    <button disabled={loading} onClick={saveProfile} className="w-full bg-indigo-600 hover:bg-indigo-500 py-7 rounded-[2.5rem] font-black text-white text-[12px] uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-95">{loading ? 'Gravando...' : 'Salvar Perfil Premium'}</button>
                </div>
              </div>
            )}

            {activeTab === 'LINKS' && (
              <div className="space-y-6">
                <button onClick={() => { setShowAddLinkForm(!showAddLinkForm); setEditingLinkId(null); }} className="w-full glass p-8 rounded-[2rem] text-indigo-400 font-black text-[10px] uppercase tracking-widest border-dashed border-2 border-indigo-500/20">
                  + Novo Link Estratégico
                </button>
                {showAddLinkForm && (
                  <form onSubmit={handleSaveLink} className="glass p-8 rounded-[2.5rem] space-y-6 animate-in slide-in-from-top-4">
                    <input placeholder="Título (Ex: WhatsApp)" value={newLink.title} onChange={e => setNewLink({...newLink, title: e.target.value})} className="w-full bg-slate-950 p-5 rounded-2xl text-white outline-none border border-white/5" required />
                    <input placeholder="URL (https://...)" value={newLink.url} onChange={e => setNewLink({...newLink, url: e.target.value})} className="w-full bg-slate-950 p-5 rounded-2xl text-white outline-none border border-white/5" required />
                    <button className="w-full bg-indigo-600 py-5 rounded-2xl font-black text-white text-[10px] uppercase">Salvar Link</button>
                  </form>
                )}
                {links.map(l => (
                    <div key={l.id} className="glass p-5 rounded-[2rem] flex items-center justify-between border border-white/5">
                      <div className="min-w-0">
                        <p className="text-white font-black uppercase truncate">{l.title}</p>
                        <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">{l.click_count || 0} Acessos</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setNewLink({...l}); setEditingLinkId(l.id); setShowAddLinkForm(true); }} className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center">✎</button>
                        <button onClick={() => deleteLink(l.id)} className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500/60 flex items-center justify-center">✕</button>
                      </div>
                    </div>
                ))}
              </div>
            )}

            {activeTab === 'NEWS' && (
              <div className="space-y-6">
                <button onClick={() => { setShowAddNewsForm(!showAddNewsForm); setEditingPostId(null); }} className="w-full glass p-8 rounded-[2rem] text-indigo-400 font-black text-[10px] uppercase tracking-widest border-dashed border-2 border-indigo-500/20">
                  + Publicar Update
                </button>
                {showAddNewsForm && (
                  <form onSubmit={handleSavePost} className="glass p-10 rounded-[2.5rem] space-y-6 animate-in slide-in-from-top-4">
                    <input placeholder="Título" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} className="w-full bg-slate-950 p-6 rounded-2xl text-white outline-none border border-white/5" required />
                    <textarea placeholder="Conteúdo..." value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} className="w-full bg-slate-950 p-6 rounded-2xl text-white h-32 resize-none border border-white/5" required />
                    <button className="w-full bg-indigo-600 py-5 rounded-2xl font-black text-white text-[10px] uppercase">Publicar</button>
                  </form>
                )}
                {news.map(n => (
                    <div key={n.id} className="glass p-5 rounded-[2rem] flex items-center justify-between border border-white/5">
                      <p className="text-white font-black uppercase truncate">{n.title}</p>
                      <div className="flex gap-2">
                        <button onClick={() => { setNewPost({...n}); setEditingPostId(n.id); setShowAddNewsForm(true); }} className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center">✎</button>
                        <button onClick={() => deletePost(n.id)} className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500/60 flex items-center justify-center">✕</button>
                      </div>
                    </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
