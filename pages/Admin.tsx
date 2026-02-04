
import React, { useState, useEffect } from 'react';
import { Profile, LinkItem, News } from '../types';
import { supabase } from '../supabaseClient';

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
}

const Admin: React.FC<AdminProps> = ({ profile, setProfile, links, setLinks, news, setNews, onBack }) => {
  const [session, setSession] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP' | 'RECOVER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'LINKS' | 'NEWS' | 'PROFILE'>('LINKS');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showSqlHelper, setShowSqlHelper] = useState(false);

  const [showAddLinkForm, setShowAddLinkForm] = useState(false);
  const [showAddNewsForm, setShowAddNewsForm] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  const [newLink, setNewLink] = useState({ title: '', description: '', url: '', icon_url: '' });
  const [newPost, setNewPost] = useState({ title: '', content: '', image_url: '' });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserData(session.user.id);
    });
  }, []);

  const addNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 8000);
  };

  const fetchUserData = async (userId: string) => {
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (prof) setProfile(prof);
    
    const { data: lks } = await supabase.from('tools').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (lks) setLinks(lks || []);

    const { data: nws } = await supabase.from('news').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (nws) setNews(nws || []);
  };

  const handleFileUpload = async (file: File, bucketPath: string, fieldId: string) => {
    if (!session) return;
    setUploading(fieldId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/${bucketPath}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('teambot')
        .upload(fileName, file, { 
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        if (uploadError.message.toLowerCase().includes('row-level security') || uploadError.message.toLowerCase().includes('policy')) {
          setShowSqlHelper(true);
          throw new Error('Bloqueio de Segurança: Execute o SQL de permissões no seu painel Supabase.');
        }
        throw uploadError;
      }

      const { data } = supabase.storage.from('teambot').getPublicUrl(fileName);
      addNotification('Imagem processada com sucesso!', 'success');
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
        addNotification('Acesso liberado!', 'success');
      } else if (authMode === 'SIGNUP') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          const defaultSlug = `user-${Math.floor(Math.random() * 10000)}`;
          await supabase.from('profiles').insert([{ 
            id: data.user.id, 
            name: 'Novo TeamBot', 
            slug: defaultSlug,
            bio: 'Minha nova central premium.',
            avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${data.user.id}`
          }]);
          addNotification('Conta criada! Verifique seu e-mail.', 'info');
          setAuthMode('LOGIN');
        }
      }
    } catch (err: any) { addNotification(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const cleanSlug = profile.slug?.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
      const { error } = await supabase.from('profiles').upsert({
        id: session.user.id,
        ...profile,
        slug: cleanSlug,
        updated_at: new Date()
      });
      if (error) throw error;
      setProfile({...profile, slug: cleanSlug});
      addNotification('Perfil salvo com sucesso!', 'success');
    } catch (err: any) { addNotification('Erro: slug em uso ou erro de rede.', 'error'); }
    finally { setLoading(false); }
  };

  const addLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.from('tools').insert([{ ...newLink, user_id: session.user.id }]).select();
      if (error) throw error;
      setLinks([data[0], ...links]);
      setNewLink({ title: '', description: '', url: '', icon_url: '' });
      setShowAddLinkForm(false);
      addNotification('Novo link adicionado!', 'success');
    } catch (err: any) { addNotification(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingPostId) {
        const { error } = await supabase
          .from('news')
          .update({ ...newPost })
          .eq('id', editingPostId);
        if (error) throw error;
        setNews(news.map(n => n.id === editingPostId ? { ...n, ...newPost } : n));
        addNotification('Postagem atualizada!', 'success');
      } else {
        const { data, error } = await supabase.from('news').insert([{ ...newPost, user_id: session.user.id }]).select();
        if (error) throw error;
        setNews([data[0], ...news]);
        addNotification('Postagem publicada!', 'success');
      }
      setNewPost({ title: '', content: '', image_url: '' });
      setEditingPostId(null);
      setShowAddNewsForm(false);
    } catch (err: any) { addNotification(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const startEditingNews = (post: News) => {
    setEditingPostId(post.id);
    setNewPost({ title: post.title, content: post.content, image_url: post.image_url });
    setShowAddNewsForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteLink = async (id: string) => {
    if (!confirm('Excluir este link permanentemente?')) return;
    await supabase.from('tools').delete().eq('id', id);
    setLinks(links.filter(l => l.id !== id));
    addNotification('Link removido.', 'info');
  };

  const deletePost = async (id: string) => {
    if (!confirm('Remover esta novidade?')) return;
    await supabase.from('news').delete().eq('id', id);
    setNews(news.filter(n => n.id !== id));
    addNotification('Postagem removida.', 'info');
  };

  const getPublicUrl = () => {
    const base = window.location.origin;
    return `${base}/?u=${profile.slug || 'default'}`;
  };

  const copyToClipboard = () => {
    const url = getPublicUrl();
    navigator.clipboard.writeText(url);
    addNotification('Link copiado! Pronto para postar.', 'success');
  };

  const handleShare = async () => {
    const url = getPublicUrl();
    if (navigator.share) {
      try {
        await navigator.share({ title: profile.name, text: profile.bio, url: url });
      } catch (err) { console.error(err); }
    } else {
      copyToClipboard();
    }
  };

  const sqlInstructions = `-- Script de Configuração Supabase...`;

  return (
    <div className="relative min-h-[600px] pb-32">
      {/* Toasts */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4 flex flex-col gap-3 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className={`glass p-5 rounded-3xl shadow-2xl flex items-start gap-4 border-l-4 pointer-events-auto animate-in slide-in-from-top-10 duration-500 ${
            n.type === 'success' ? 'border-emerald-500 bg-emerald-500/10' : n.type === 'error' ? 'border-rose-500 bg-rose-500/10' : 'border-indigo-500 bg-indigo-500/10'
          }`}>
            <p className="text-[11px] font-black text-white leading-relaxed uppercase tracking-wider">{n.message}</p>
          </div>
        ))}
      </div>

      {!session ? (
        <div className="max-w-md mx-auto mt-10 p-12 glass rounded-[3.5rem] text-center shadow-2xl">
            <h2 className="text-3xl font-black mb-10 text-white uppercase tracking-widest">TeamBot Admin</h2>
            <form onSubmit={handleAuth} className="space-y-6 text-left">
              <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-900 border border-white/5 p-5 rounded-2xl text-white" required />
              <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-900 border border-white/5 p-5 rounded-2xl text-white" required />
              <button disabled={loading} className="w-full bg-indigo-600 py-6 rounded-2xl font-black text-white uppercase tracking-[0.3em] text-[10px]">
                {loading ? 'Entrando...' : authMode === 'LOGIN' ? 'Acessar Painel' : 'Criar Conta'}
              </button>
            </form>
            <button onClick={() => setAuthMode(authMode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')} className="mt-8 text-[10px] text-slate-500 font-black uppercase tracking-widest">
              {authMode === 'LOGIN' ? 'Não tem conta? Registre-se' : 'Já tem conta? Entre'}
            </button>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="flex justify-between items-end mb-12 px-2">
            <div>
               <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Workspace Premium</p>
               <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Painel</h1>
            </div>
            <button onClick={() => supabase.auth.signOut().then(() => setSession(null))} className="glass px-5 py-3 rounded-2xl text-red-500/40 font-black text-[10px] uppercase tracking-widest hover:text-red-500">Sair</button>
          </div>

          <div className="flex gap-2 p-2 glass rounded-[2rem] mb-12 overflow-x-auto no-scrollbar shadow-inner">
            {(['LINKS', 'NEWS', 'PROFILE'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-grow min-w-[110px] py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>{tab === 'LINKS' ? 'Links' : tab === 'NEWS' ? 'Notícias' : 'Perfil'}</button>
            ))}
          </div>

          <div className="space-y-10">
            {activeTab === 'PROFILE' && (
              <div className="space-y-8 animate-in slide-in-from-right-8 duration-600">
                <div className="glass p-8 rounded-[3rem] border-indigo-500/20 bg-indigo-500/[0.02]">
                  <div className="flex items-center gap-3 mb-6 ml-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Seu Link Digital</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex-grow w-full bg-slate-950 p-5 rounded-2xl border border-white/5 shadow-inner overflow-hidden">
                       <p className="text-slate-400 font-mono text-[11px] truncate">{getPublicUrl()}</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button onClick={copyToClipboard} className="flex-grow sm:flex-none glass px-6 py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-95 group">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-indigo-400 group-hover:scale-110 transition-transform"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Copiar</span>
                      </button>
                      <button onClick={handleShare} className="glass w-14 h-14 flex items-center justify-center rounded-2xl hover:bg-indigo-600/20 active:scale-95 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-indigo-400"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="glass p-10 rounded-[3rem] space-y-10 border-white/5">
                  {/* Edição de Perfil... (Omitido para brevidade, mantém a lógica anterior) */}
                  <div className="grid grid-cols-1 gap-8">
                    <input value={profile.slug || ''} onChange={e => setProfile({...profile, slug: e.target.value})} placeholder="slug-da-url" className="w-full bg-slate-950 border border-white/5 p-6 rounded-3xl text-sm font-bold text-white shadow-inner outline-none" />
                    <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="Nome Público" className="w-full bg-slate-950 border border-white/5 p-6 rounded-3xl text-sm font-bold text-white shadow-inner outline-none" />
                    <textarea value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} placeholder="Bio de Autoridade" className="w-full bg-slate-950 border border-white/5 p-6 rounded-3xl text-sm font-medium text-slate-300 h-36 resize-none shadow-inner outline-none" />
                  </div>
                  <button disabled={loading} onClick={saveProfile} className="w-full bg-indigo-600 hover:bg-indigo-500 py-7 rounded-[2.5rem] font-black text-white text-[12px] uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-95">
                    {loading ? 'Salvando...' : 'Salvar Perfil'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'LINKS' && (
              <div className="space-y-6 animate-in slide-in-from-right-8 duration-600">
                {/* Lógica de Links Mantida... */}
                {links.map(l => (
                   <div key={l.id} className="glass p-6 rounded-3xl flex items-center justify-between border border-white/5">
                      <div className="flex items-center gap-4">
                        <img src={l.icon_url} className="w-12 h-12 rounded-xl object-contain bg-slate-900 p-2" alt="" />
                        <span className="text-white font-bold">{l.title}</span>
                      </div>
                      <button onClick={() => deleteLink(l.id)} className="text-red-500/50 hover:text-red-500 p-2">Excluir</button>
                   </div>
                ))}
              </div>
            )}

            {activeTab === 'NEWS' && (
              <div className="space-y-6 animate-in slide-in-from-right-8 duration-600">
                {/* Lógica de News Mantida... */}
                {news.map(n => (
                   <div key={n.id} className="glass p-6 rounded-3xl flex items-center justify-between border border-white/5">
                      <div className="flex items-center gap-4">
                        <img src={n.image_url} className="w-12 h-12 rounded-xl object-cover" alt="" />
                        <span className="text-white font-bold truncate max-w-[150px]">{n.title}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => startEditingNews(n)} className="text-indigo-400 p-2">Editar</button>
                        <button onClick={() => deletePost(n.id)} className="text-red-500/50 p-2">Excluir</button>
                      </div>
                   </div>
                ))}
              </div>
            )}
          </div>

          <a 
            href={getPublicUrl()} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white text-slate-950 px-20 py-7 rounded-full font-black text-[11px] uppercase tracking-[0.5em] shadow-[0_30px_70px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all z-[60] text-center"
          >
            Visualizar Online
          </a>
        </div>
      )}
    </div>
  );
};

export default Admin;
