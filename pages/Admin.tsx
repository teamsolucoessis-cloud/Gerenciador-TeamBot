
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
}

const Admin: React.FC<AdminProps> = ({ profile, setProfile, links, setLinks, news, setNews, onBack }) => {
  const [session, setSession] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'LINKS' | 'NEWS' | 'PROFILE'>('PROFILE');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [assistantMessage, setAssistantMessage] = useState<string>("Iniciando protocolo de comando. Aguardando credenciais...");
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
      if (session) fetchUserData(session.user.id);
    });
  }, []);

  const addNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  const uploadFile = async (file: File, path: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const fullPath = `${path}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('teambot')
        .upload(fullPath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('teambot').getPublicUrl(fullPath);
      return data.publicUrl;
    } catch (error: any) {
      addNotification(`Erro no upload: ${error.message}`, 'error');
      return null;
    }
  };

  const generateAIInsight = async (userName: string) => {
    const apiKey = (window as any).process?.env?.API_KEY;
    if (!apiKey) return;
    setIsAssistantLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Você é o TeamBot IA. Dê uma instrução curta (max 12 palavras) para o admin ${userName} sobre como melhorar o engajamento do seu dashboard premium hoje. Seja direto e técnico.`
      });
      setAssistantMessage(response.text?.trim() || assistantMessage);
    } catch (e) {
      console.warn("AI offline");
    } finally {
      setIsAssistantLoading(false);
    }
  };

  const fetchUserData = async (userId: string) => {
    try {
      setLoading(true);
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (prof) {
        setProfile(prof);
        if (!isAssistantLoading) generateAIInsight(prof.name);
      }
      const { data: lks } = await supabase.from('tools').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (lks) setLinks(lks);
      const { data: nws } = await supabase.from('news').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (nws) setNews(nws);
    } catch (e) { 
      console.error(e); 
    } finally {
      setLoading(false);
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
        await fetchUserData(data.session!.user.id);
        addNotification('Bem-vindo de volta!', 'success');
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        addNotification('Conta criada! Verifique seu email.', 'success');
      }
    } catch (err: any) {
      addNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    const { error } = await supabase.from('profiles').upsert({ ...profile, updated_at: new Date() });
    if (error) addNotification(error.message, 'error');
    else {
      addNotification('Perfil Atualizado!', 'success');
      await fetchUserData(session.user.id);
    }
    setLoading(false);
  };

  const handleDeleteLink = async (id: string) => {
    if(!confirm('Deseja excluir este link estrategicamente?')) return;
    const { error } = await supabase.from('tools').delete().eq('id', id);
    if (!error) {
      addNotification('Link Removido', 'info');
      await fetchUserData(session.user.id);
    }
  };

  const handleDeleteNews = async (id: string) => {
    if(!confirm('Deseja remover esta atualização?')) return;
    const { error } = await supabase.from('news').delete().eq('id', id);
    if (!error) {
      addNotification('Update Removido', 'info');
      await fetchUserData(session.user.id);
    }
  };

  return (
    <div className="relative pb-32 animate-in fade-in duration-700">
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xs space-y-2 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className="glass-premium p-3 rounded-2xl border-l-4 border-indigo-500 bg-slate-950/90 text-[10px] font-black uppercase text-white shadow-2xl pointer-events-auto">
            {n.message}
          </div>
        ))}
      </div>

      {!session ? (
        <div className="max-w-md mx-auto mt-10 p-10 glass-premium rounded-[3rem] border border-white/5 shadow-2xl animate-in zoom-in duration-500">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-indigo-600/10 rounded-[2rem] border border-indigo-500/20 flex items-center justify-center mb-6 animate-mascot">
               <img src={BRAND_CONFIG.OFFICIAL_MASCOTE_URL} className="w-12 h-12 object-contain" alt="" />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-widest text-center">{authMode === 'LOGIN' ? 'Acessar Central' : 'Criar minha Central'}</h2>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2 italic text-center">Protocolo de Identificação TeamBot</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" placeholder="E-mail Corporativo" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 p-4 rounded-xl border border-white/5 outline-none focus:border-indigo-500/50 text-white text-sm" required />
            <input type="password" placeholder="Chave de Acesso" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-950 p-4 rounded-xl border border-white/5 outline-none focus:border-indigo-500/50 text-white text-sm" required />
            <button disabled={loading} className="w-full bg-indigo-600 py-5 rounded-xl font-black text-white uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">
              {loading ? 'Sincronizando...' : authMode === 'LOGIN' ? 'Autenticar' : 'Finalizar Cadastro'}
            </button>
          </form>
          
          <button 
            onClick={() => setAuthMode(authMode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')}
            className="w-full mt-6 text-[9px] font-black uppercase text-slate-500 hover:text-white transition-colors tracking-widest"
          >
            {authMode === 'LOGIN' ? 'Novo por aqui? Iniciar meu Perfil' : 'Já sou um TeamBot? Acessar Conta'}
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="glass-premium p-5 rounded-[2rem] border-indigo-500/20 flex items-center gap-5 relative overflow-hidden shadow-[0_0_30px_rgba(79,70,229,0.1)]">
            <div className="w-14 h-14 shrink-0 animate-mascot">
              <img src={profile.mascot_url || BRAND_CONFIG.OFFICIAL_MASCOTE_URL} className="w-full h-full object-contain icon-glow" alt="IA" />
            </div>
            <div className="min-w-0">
              <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Status: {loading ? 'Sincronizando...' : 'Inteligência Ativa'}</p>
              <p className="text-white text-[11px] font-medium italic leading-relaxed">
                {isAssistantLoading ? "Calculando variáveis..." : `"${assistantMessage}"`}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-end px-2">
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Admin</h1>
            <button onClick={() => supabase.auth.signOut()} className="text-[9px] font-black uppercase text-slate-500 bg-white/5 px-4 py-2 rounded-lg hover:text-red-400 transition-colors">Logout</button>
          </div>

          <div className="flex gap-2 p-1.5 glass-premium rounded-2xl border border-white/5">
            {(['LINKS', 'NEWS', 'PROFILE'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-grow py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                {tab === 'LINKS' ? 'Links' : tab === 'NEWS' ? 'Updates' : 'Perfil'}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {activeTab === 'PROFILE' && (
              <div className="space-y-6">
                <div className="glass-premium p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Avatar de Elite</label>
                      <div className="relative group cursor-pointer h-32 bg-slate-900 rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center">
                        <img src={profile.avatar_url || BRAND_CONFIG.FALLBACK_URL} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" alt="" />
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if(file) {
                            const url = await uploadFile(file, 'avatars');
                            if(url) setProfile({...profile, avatar_url: url});
                          }
                        }} />
                        <span className="absolute text-[8px] font-black text-white uppercase pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">Trocar Foto</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Mascote IA</label>
                      <div className="relative group cursor-pointer h-32 bg-slate-900 rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center">
                        <img src={profile.mascot_url || BRAND_CONFIG.OFFICIAL_MASCOTE_URL} className="w-full h-full object-contain p-4 opacity-60 group-hover:opacity-40 transition-opacity" alt="" />
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if(file) {
                            const url = await uploadFile(file, 'mascots');
                            if(url) setProfile({...profile, mascot_url: url});
                          }
                        }} />
                        <span className="absolute text-[8px] font-black text-white uppercase pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">Trocar IA</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="Seu Nome" className="w-full bg-slate-950 p-4 rounded-xl text-sm font-bold text-white border border-white/5" />
                    <input value={profile.slug || ''} onChange={e => setProfile({...profile, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} placeholder="slug-da-url" className="w-full bg-slate-950 p-4 rounded-xl text-sm font-bold text-indigo-400 border border-white/5" />
                    <textarea value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} placeholder="Bio Estratégica" className="w-full bg-slate-950 p-4 rounded-xl text-xs font-medium text-slate-400 border border-white/5 h-24 resize-none" />
                  </div>
                  <button disabled={loading} onClick={handleSaveProfile} className="w-full bg-indigo-600 py-5 rounded-2xl font-black text-white text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Sincronizar Dados</button>
                </div>
              </div>
            )}
            
            {activeTab === 'LINKS' && (
              <div className="space-y-4">
                <button onClick={() => { setShowAddLinkForm(!showAddLinkForm); setEditingLinkId(null); setNewLink({ title: '', description: '', url: '', icon_url: '' }); }} className="w-full glass-premium p-6 rounded-2xl text-indigo-400 font-black text-[10px] uppercase tracking-widest border-dashed border-2 border-indigo-500/20 hover:bg-indigo-500/5 transition-colors">
                  {showAddLinkForm ? 'Fechar Formulário' : '+ Novo Link Estratégico'}
                </button>
                {showAddLinkForm && (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setLoading(true);
                    try {
                      if(editingLinkId) await supabase.from('tools').update(newLink).eq('id', editingLinkId);
                      else await supabase.from('tools').insert([{ ...newLink, user_id: session.user.id }]);
                      addNotification('Link Salvo!', 'success');
                      setShowAddLinkForm(false);
                      await fetchUserData(session.user.id);
                    } catch (err: any) {
                      addNotification(err.message, 'error');
                    } finally {
                      setLoading(false);
                    }
                  }} className="glass-premium p-8 rounded-[2.5rem] space-y-4 border border-indigo-500/20 shadow-2xl">
                    <div className="flex gap-4 items-start">
                       <div className="w-20 h-20 shrink-0 bg-slate-900 rounded-2xl overflow-hidden border border-white/5 relative flex items-center justify-center">
                         <img src={newLink.icon_url || BRAND_CONFIG.FALLBACK_URL} className="w-full h-full object-contain p-2" alt="" />
                         <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                           const file = e.target.files?.[0];
                           if(file) {
                             const url = await uploadFile(file, 'link-icons');
                             if(url) setNewLink({...newLink, icon_url: url});
                           }
                         }} />
                       </div>
                       <div className="flex-grow space-y-2">
                          <input placeholder="Título do Link" value={newLink.title} onChange={e => setNewLink({...newLink, title: e.target.value})} className="w-full bg-slate-950 p-3 rounded-xl text-sm font-bold text-white border border-white/5" required />
                          <input placeholder="URL (https://...)" value={newLink.url} onChange={e => setNewLink({...newLink, url: e.target.value})} className="w-full bg-slate-950 p-3 rounded-xl text-xs font-mono text-indigo-300 border border-white/5" required />
                       </div>
                    </div>
                    <textarea placeholder="Explicação rápida" value={newLink.description} onChange={e => setNewLink({...newLink, description: e.target.value})} className="w-full bg-slate-950 p-4 rounded-xl text-xs text-slate-400 border border-white/5 h-20 resize-none" />
                    <button disabled={loading} className="w-full bg-indigo-600 py-4 rounded-xl font-black text-white text-[9px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all">
                      {loading ? 'Sincronizando...' : 'Confirmar e Publicar'}
                    </button>
                  </form>
                )}
                <div className="space-y-3">
                  {links.map(l => (
                    <div key={l.id} className="glass-premium p-4 rounded-2xl flex items-center justify-between group border border-white/5 hover:border-indigo-500/30 transition-all shadow-lg">
                      <div className="flex items-center gap-4">
                         <img src={l.icon_url} className="w-10 h-10 object-contain rounded-lg bg-slate-900 p-1 border border-white/5" alt="" />
                         <div>
                            <p className="text-white font-black text-[10px] uppercase truncate max-w-[150px]">{l.title}</p>
                            <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest">{l.click_count || 0} Conversões</p>
                         </div>
                      </div>
                      <div className="flex gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setNewLink({...l}); setEditingLinkId(l.id); setShowAddLinkForm(true); }} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs">✎</button>
                        <button onClick={() => handleDeleteLink(l.id)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs hover:text-red-400">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'NEWS' && (
              <div className="space-y-4">
                <button onClick={() => { setShowAddNewsForm(!showAddNewsForm); setEditingPostId(null); setNewPost({ title: '', content: '', image_url: '', link_url: '' }); }} className="w-full glass-premium p-6 rounded-2xl text-indigo-400 font-black text-[10px] uppercase tracking-widest border-dashed border-2 border-indigo-500/20 hover:bg-indigo-500/5 transition-colors">
                  {showAddNewsForm ? 'Fechar Formulário' : '+ Nova Notícia de Impacto'}
                </button>
                {showAddNewsForm && (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setLoading(true);
                    try {
                      if(editingPostId) await supabase.from('news').update(newPost).eq('id', editingPostId);
                      else await supabase.from('news').insert([{ ...newPost, user_id: session.user.id }]);
                      addNotification('Notícia Publicada!', 'success');
                      setShowAddNewsForm(false);
                      await fetchUserData(session.user.id);
                    } catch (err: any) {
                      addNotification(err.message, 'error');
                    } finally {
                      setLoading(false);
                    }
                  }} className="glass-premium p-8 rounded-[2.5rem] space-y-4 border border-indigo-500/20 shadow-2xl">
                    <div className="relative h-40 bg-slate-900 rounded-3xl overflow-hidden border border-white/5 group cursor-pointer flex items-center justify-center">
                       <img src={newPost.image_url || BRAND_CONFIG.FALLBACK_URL} className="w-full h-full object-cover opacity-50" alt="" />
                       <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                         const file = e.target.files?.[0];
                         if(file) {
                           const url = await uploadFile(file, 'news-banners');
                           if(url) setNewPost({...newPost, image_url: url});
                         }
                       }} />
                       <span className="absolute text-[8px] font-black text-white uppercase group-hover:scale-110 transition-transform">Subir Banner 16:9</span>
                    </div>
                    <input placeholder="Título Chamativo" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} className="w-full bg-slate-950 p-4 rounded-xl text-sm font-bold text-white border border-white/5" required />
                    <textarea placeholder="Conteúdo da atualização..." value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} className="w-full bg-slate-950 p-4 rounded-xl text-xs text-slate-400 border border-white/5 h-32 resize-none" required />
                    <button disabled={loading} className="w-full bg-indigo-600 py-4 rounded-xl font-black text-white text-[9px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all">
                      {loading ? 'Sincronizando...' : 'Disparar Notícia'}
                    </button>
                  </form>
                )}
                <div className="space-y-3">
                  {news.map(n => (
                    <div key={n.id} className="glass-premium p-3 rounded-2xl flex items-center justify-between group border border-white/5 hover:border-indigo-500/30 transition-all shadow-lg">
                      <div className="flex items-center gap-4">
                         <img src={n.image_url} className="w-14 h-10 object-cover rounded-lg bg-slate-900 border border-white/5" alt="" />
                         <p className="text-white font-black text-[10px] uppercase truncate max-w-[150px]">{n.title}</p>
                      </div>
                      <div className="flex gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setNewPost({...n}); setEditingPostId(n.id); setShowAddNewsForm(true); }} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs">✎</button>
                        <button onClick={() => handleDeleteNews(n.id)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs hover:text-red-400">✕</button>
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
