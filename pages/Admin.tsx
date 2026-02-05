
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
  const [activeTab, setActiveTab] = useState<'LINKS' | 'NEWS' | 'PROFILE'>('PROFILE');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [showAddLinkForm, setShowAddLinkForm] = useState(false);
  const [showAddNewsForm, setShowAddNewsForm] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  const [newLink, setNewLink] = useState({ title: '', description: '', url: '', icon_url: '' });
  const [newPost, setNewPost] = useState({ title: '', content: '', image_url: '', link_url: '' });

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
    }, 4000);
  };

  const fetchUserData = async (userId: string) => {
    try {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (prof) setProfile(prof);
      
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

      const { error: uploadError } = await supabase.storage
        .from('teambot')
        .upload(fileName, file, { upsert: true });

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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setSession(data.session);
      fetchUserData(data.session!.user.id);
    } catch (err: any) { addNotification(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: session.user.id,
        ...profile,
        updated_at: new Date()
      });
      if (error) throw error;
      addNotification('Perfil atualizado!', 'success');
    } catch (err: any) { addNotification(err.message, 'error'); }
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
      addNotification('Link adicionado!', 'success');
    } catch (err: any) { addNotification(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingPostId) {
        const { error } = await supabase.from('news').update({ ...newPost }).eq('id', editingPostId);
        if (error) throw error;
        setNews(news.map(n => n.id === editingPostId ? { ...n, ...newPost } : n));
        addNotification('Postagem atualizada!', 'success');
      } else {
        const { data, error } = await supabase.from('news').insert([{ ...newPost, user_id: session.user.id }]).select();
        if (error) throw error;
        setNews([data[0], ...news]);
        addNotification('Notícia publicada!', 'success');
      }
      setNewPost({ title: '', content: '', image_url: '', link_url: '' });
      setEditingPostId(null);
      setShowAddNewsForm(false);
    } catch (err: any) { addNotification(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const startEditingNews = (n: News) => {
    setNewPost({ title: n.title, content: n.content, image_url: n.image_url, link_url: n.link_url || '' });
    setEditingPostId(n.id);
    setShowAddNewsForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteLink = async (id: string) => {
    if (!confirm('Excluir este link?')) return;
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
    const baseUrl = window.location.origin;
    const slug = profile.slug || 'teambot';
    return `${baseUrl}/?u=${slug}`;
  };

  const copyToClipboard = () => {
    const url = getPublicUrl();
    navigator.clipboard.writeText(url).then(() => {
      addNotification('Link copiado!', 'success');
    }).catch(() => {
      addNotification('Erro ao copiar link', 'error');
    });
  };

  return (
    <div className="relative min-h-[600px] pb-32 font-sans px-2 sm:px-0">
      {/* Notifications */}
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
        <div className="max-w-md mx-auto mt-10 p-10 glass rounded-[3rem] text-center shadow-2xl animate-in zoom-in-95">
            <h2 className="text-3xl font-black mb-10 text-white uppercase tracking-widest">TeamBot Admin</h2>
            <form onSubmit={handleAuth} className="space-y-5 text-left">
              <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-900 border border-white/5 p-5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500" required />
              <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-900 border border-white/5 p-5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500" required />
              <button disabled={loading} className="w-full bg-indigo-600 py-6 rounded-2xl font-black text-white uppercase tracking-[0.3em] text-[10px] active:scale-95 transition-all">
                {loading ? 'Processando...' : 'Acessar Painel'}
              </button>
            </form>
            <button onClick={() => setAuthMode(authMode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')} className="mt-8 text-[10px] text-slate-500 font-black uppercase tracking-widest hover:text-white transition-colors">
              {authMode === 'LOGIN' ? 'Não tem conta? Registre-se' : 'Já tem conta? Entre'}
            </button>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="flex justify-between items-end mb-10 px-2">
            <div>
               <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Workspace Premium</p>
               <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Painel</h1>
            </div>
            <button onClick={() => supabase.auth.signOut().then(() => setSession(null))} className="glass px-5 py-3 rounded-2xl text-red-500/40 font-black text-[10px] uppercase tracking-widest hover:text-red-500 transition-all">Sair</button>
          </div>

          <div className="flex gap-2 p-2 glass rounded-[2rem] mb-10 overflow-x-auto no-scrollbar shadow-inner">
            {(['LINKS', 'NEWS', 'PROFILE'] as const).map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`flex-grow min-w-[100px] py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}
              >
                {tab === 'LINKS' ? 'Links' : tab === 'NEWS' ? 'Notícias' : 'Perfil'}
              </button>
            ))}
          </div>

          <div className="space-y-10">
            {activeTab === 'PROFILE' && (
              <div className="space-y-8 animate-in slide-in-from-right-8 duration-600">
                <div className="glass p-8 rounded-[2.5rem] border-indigo-500/20 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Seu Perfil Público</label>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-grow bg-slate-950 p-4 rounded-2xl text-[11px] font-mono text-indigo-300 truncate border border-white/5 select-all">
                      {getPublicUrl()}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={copyToClipboard} className="flex-grow glass px-6 py-4 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all active:scale-90 group gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-white"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white">Copiar</span>
                      </button>
                      <a href={getPublicUrl()} target="_blank" className="glass px-5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all active:scale-90 group">
                         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-white"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="glass p-10 rounded-[3rem] space-y-8 border-white/5">
                  <div className="grid grid-cols-1 gap-8">
                    <div className="flex flex-col sm:flex-row gap-8">
                      <div className="flex-1 space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Avatar de Perfil</label>
                        <div className="flex items-center gap-5">
                          <img src={profile.avatar_url || 'https://i.ibb.co/v4pXp2F/teambot-mascot.png'} className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500/30" alt="Avatar" />
                          <label className="bg-indigo-600/10 text-indigo-400 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-indigo-600 hover:text-white transition-all">
                             Escolher Arquivo
                             <input type="file" className="hidden" onChange={async (e) => {
                               const file = e.target.files?.[0];
                               if (file) {
                                 const url = await handleFileUpload(file, 'avatars');
                                 if (url) setProfile({...profile, avatar_url: url});
                               }
                             }} />
                          </label>
                        </div>
                      </div>
                      <div className="flex-1 space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mascote Flutuante</label>
                        <div className="flex items-center gap-5">
                          <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-indigo-500/30 p-2">
                             <img src={profile.mascot_url || 'https://i.ibb.co/v4pXp2F/teambot-mascot.png'} className="w-full h-full object-contain" alt="Mascote" />
                          </div>
                          <label className="bg-indigo-600/10 text-indigo-400 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-indigo-600 hover:text-white transition-all">
                             Escolher Arquivo
                             <input type="file" className="hidden" onChange={async (e) => {
                               const file = e.target.files?.[0];
                               if (file) {
                                 const url = await handleFileUpload(file, 'mascots');
                                 if (url) setProfile({...profile, mascot_url: url});
                               }
                             }} />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Slug da URL (@usuario)</label>
                       <input value={profile.slug || ''} onChange={e => setProfile({...profile, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} placeholder="ex: meunome" className="w-full bg-slate-950 border border-white/5 p-6 rounded-3xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome de Exibição</label>
                       <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="Seu Nome ou Marca" className="w-full bg-slate-950 border border-white/5 p-6 rounded-3xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Biografia</label>
                       <textarea value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} placeholder="Uma frase impactante..." className="w-full bg-slate-950 border border-white/5 p-6 rounded-3xl text-sm font-medium text-slate-300 h-32 resize-none outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                  <button disabled={loading} onClick={saveProfile} className="w-full bg-indigo-600 hover:bg-indigo-500 py-7 rounded-[2.5rem] font-black text-white text-[12px] uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-95">
                    {loading ? 'Salvando...' : 'Salvar Perfil'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'LINKS' && (
              <div className="space-y-6 animate-in slide-in-from-right-8 duration-600">
                <button 
                  onClick={() => setShowAddLinkForm(!showAddLinkForm)}
                  className="w-full glass p-8 rounded-[2rem] flex flex-col items-center justify-center gap-3 text-indigo-400 hover:bg-indigo-600/10 transition-all border-dashed border-2 border-indigo-500/20"
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-600/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </div>
                  <span className="font-black text-[10px] uppercase tracking-widest">Criar Novo Link Estratégico</span>
                </button>

                {showAddLinkForm && (
                  <form onSubmit={addLink} className="glass p-8 rounded-[2.5rem] space-y-6 border-indigo-500/20 animate-in slide-in-from-top-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input placeholder="Título (ex: WhatsApp)" value={newLink.title} onChange={e => setNewLink({...newLink, title: e.target.value})} className="bg-slate-950 p-5 rounded-2xl text-sm font-bold outline-none" required />
                      <input placeholder="URL (https://...)" value={newLink.url} onChange={e => setNewLink({...newLink, url: e.target.value})} className="bg-slate-950 p-5 rounded-2xl text-sm outline-none" required />
                    </div>
                    <input placeholder="Descrição (opcional)" value={newLink.description} onChange={e => setNewLink({...newLink, description: e.target.value})} className="w-full bg-slate-950 p-5 rounded-2xl text-sm outline-none" />
                    <div className="flex flex-col sm:flex-row items-center gap-5">
                       <div className="flex-grow w-full relative">
                         <input placeholder="URL do Ícone" value={newLink.icon_url} onChange={e => setNewLink({...newLink, icon_url: e.target.value})} className="w-full bg-slate-950 p-5 rounded-2xl text-sm outline-none pr-12" />
                         {newLink.icon_url && <img src={newLink.icon_url} className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg object-contain" alt="" />}
                       </div>
                       <label className="shrink-0 bg-indigo-600/10 text-indigo-400 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-indigo-600 hover:text-white transition-all w-full sm:w-auto text-center">
                         Upload Ícone
                         <input type="file" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = await handleFileUpload(file, 'icons');
                              if (url) setNewLink({...newLink, icon_url: url});
                            }
                         }} />
                       </label>
                    </div>
                    <div className="flex gap-4">
                      <button type="button" onClick={() => setShowAddLinkForm(false)} className="flex-1 bg-white/5 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest">Cancelar</button>
                      <button className="flex-[2] bg-indigo-600 py-5 rounded-2xl font-black text-white text-[10px] uppercase tracking-widest shadow-xl">Adicionar Link</button>
                    </div>
                  </form>
                )}

                <div className="space-y-4">
                  {links.map(l => (
                    <div key={l.id} className="glass p-5 rounded-[2rem] flex items-center justify-between group">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/5 overflow-hidden shrink-0 flex items-center justify-center p-2">
                          <img src={l.icon_url || 'https://i.ibb.co/v4pXp2F/teambot-mascot.png'} className="w-full h-full object-contain" alt="" />
                        </div>
                        <div>
                          <p className="text-white font-black text-base uppercase tracking-tight truncate max-w-[150px] sm:max-w-xs">{l.title}</p>
                          <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">{l.click_count || 0} Cliques</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => deleteLink(l.id)} className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500/60 hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-90">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'NEWS' && (
              <div className="space-y-6 animate-in slide-in-from-right-8 duration-600">
                <button 
                  onClick={() => { setShowAddNewsForm(!showAddNewsForm); setEditingPostId(null); setNewPost({title:'', content:'', image_url:'', link_url: ''}); }}
                  className="w-full glass p-8 rounded-[2rem] flex flex-col items-center justify-center gap-3 text-indigo-400 hover:bg-indigo-600/10 transition-all border-dashed border-2 border-indigo-500/20"
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-600/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg>
                  </div>
                  <span className="font-black text-[10px] uppercase tracking-widest">Publicar Novo Conteúdo</span>
                </button>

                {showAddNewsForm && (
                  <form onSubmit={handleSavePost} className="glass p-10 rounded-[2.5rem] space-y-6 border-indigo-500/20 animate-in slide-in-from-top-4">
                    <h3 className="text-white font-black text-sm uppercase tracking-[0.2em]">{editingPostId ? 'Sincronizar Edição' : 'Novo Update'}</h3>
                    <input placeholder="Título do Post" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} className="w-full bg-slate-950 p-6 rounded-2xl text-sm font-bold outline-none border border-white/5" required />
                    <textarea placeholder="Escreva o conteúdo estratégico aqui..." value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} className="w-full bg-slate-950 p-6 rounded-2xl text-sm h-44 resize-none outline-none border border-white/5" required />
                    
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Link de Destino (Saiba Mais)</label>
                       <input placeholder="https://youtube.com/..." value={newPost.link_url} onChange={e => setNewPost({...newPost, link_url: e.target.value})} className="w-full bg-slate-950 p-5 rounded-2xl text-sm outline-none border border-white/5" />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-5">
                       <input placeholder="Link da Imagem Banner" value={newPost.image_url} onChange={e => setNewPost({...newPost, image_url: e.target.value})} className="flex-grow bg-slate-950 p-5 rounded-2xl text-sm outline-none w-full sm:w-auto" />
                       <label className="shrink-0 bg-indigo-600/10 text-indigo-400 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-indigo-600 hover:text-white transition-all w-full sm:w-auto text-center">
                         Upload Banner
                         <input type="file" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = await handleFileUpload(file, 'news');
                              if (url) setNewPost({...newPost, image_url: url});
                            }
                         }} />
                       </label>
                    </div>
                    <div className="flex gap-4 pt-2">
                      <button type="button" onClick={() => setShowAddNewsForm(false)} className="flex-1 bg-white/5 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">Cancelar</button>
                      <button className="flex-[2] bg-indigo-600 py-5 rounded-2xl font-black text-white text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Publicar Agora</button>
                    </div>
                  </form>
                )}

                <div className="space-y-4">
                  {news.map(n => (
                    <div key={n.id} className="glass p-5 rounded-[2rem] flex items-center justify-between border border-white/5 group">
                      <div className="flex items-center gap-5 overflow-hidden">
                        <img src={n.image_url || 'https://i.ibb.co/v4pXp2F/teambot-mascot.png'} className="w-20 h-20 rounded-2xl object-cover border border-white/10" alt="" />
                        <div className="min-w-0">
                          <p className="text-white font-black text-base uppercase tracking-tight truncate max-w-[120px] sm:max-w-xs">{n.title}</p>
                          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{new Date(n.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-3 pr-2">
                        <button onClick={() => startEditingNews(n)} className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all shadow-lg active:scale-90">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button onClick={() => deletePost(n.id)} className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500/60 hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-90">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <a 
            href={getPublicUrl()} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white text-slate-950 px-16 py-6 rounded-full font-black text-[11px] uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all z-[60] text-center"
          >
            Visualizar Online
          </a>
        </div>
      )}
    </div>
  );
};

export default Admin;
