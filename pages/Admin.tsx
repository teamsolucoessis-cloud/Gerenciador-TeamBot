
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
    if (session && profile.id !== 'default' && !assistantMessage && !isAssistantLoading) {
      generateAssistantInsight();
    }
  }, [profile, links, news, session]);

  const generateAssistantInsight = async () => {
    setIsAssistantLoading(true);
    setAssistantMessage(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const totalClicks = links.reduce((acc, curr) => acc + (curr.click_count || 0), 0);
      
      const contextPrompt = `
        Você é o TeamBot, um consultor sênior de branding e performance digital.
        Seu objetivo é dar uma ÚNICA dica técnica, curta (máx 140 chars) e encorajadora para o usuário.
        DADOS ATUAIS:
        - Nome: ${profile.name}
        - Bio: ${profile.bio || 'Vazia'}
        - Qtd Links: ${links.length}
        - Cliques Totais: ${totalClicks}
        - Qtd Novidades: ${news.length}
        
        SITUAÇÃO:
        - Se links < 3: Recomende adicionar mais canais de contato.
        - Se cliques > 50: Parabenize pela autoridade e sugira um novo update.
        - Se bio vazia: Destaque a importância de uma promessa clara.
        - Se news = 0: Explique que updates recorrentes geram confiança.
        
        ESTILO: Profissional, premium, minimalista. Sem hashtags. Use português do Brasil.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contextPrompt,
      });

      if (response.text) {
        setAssistantMessage(response.text.trim());
      }
    } catch (error) {
      setAssistantMessage("Pronto para elevar seu posicionamento digital hoje?");
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
        addNotification('Bem-vindo ao TeamBot!', 'success');
      } else if (authMode === 'SIGNUP') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user && !data.session) {
          addNotification('CONTA CRIADA! Verifique seu e-mail.', 'success', 10000);
          setAuthMode('LOGIN');
        } else if (data.session) {
          setSession(data.session);
          fetchUserData(data.session.user.id);
          addNotification('Bem-vindo!', 'success');
        }
      } else if (authMode === 'RECOVER') {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        addNotification('E-mail enviado!', 'info', 7000);
        setAuthMode('LOGIN');
      }
    } catch (err: any) { addNotification(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').upsert({ id: session.user.id, ...profile, updated_at: new Date() });
      if (error) throw error;
      addNotification('Perfil atualizado!', 'success');
      generateAssistantInsight();
    } catch (err: any) { addNotification(err.message, 'error'); }
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
        addNotification('Postagem atualizada!', 'success');
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
      
      {/* Notificações Premium */}
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
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
            <h2 className="text-3xl font-black mb-4 text-white uppercase tracking-widest">TeamBot Admin</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mb-10">
              {authMode === 'LOGIN' ? 'Acesse sua conta premium' : authMode === 'SIGNUP' ? 'Crie seu cadastro exclusivo' : 'Recupere seu acesso'}
            </p>
            <form onSubmit={handleAuth} className="space-y-4 text-left">
              <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-900/50 border border-white/5 p-5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500/50" required />
              {authMode !== 'RECOVER' && <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-900/50 border border-white/5 p-5 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500/50" required />}
              <button disabled={loading} className="w-full bg-indigo-600 py-6 rounded-2xl font-black text-white uppercase tracking-[0.3em] text-[10px] active:scale-95 transition-all shadow-xl mt-4">
                {loading ? '...' : authMode === 'LOGIN' ? 'Entrar' : authMode === 'SIGNUP' ? 'Criar Conta' : 'Recuperar'}
              </button>
            </form>
            <div className="mt-10 flex flex-col gap-4">
              <button onClick={() => setAuthMode(authMode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')} className="text-[10px] text-slate-500 font-black uppercase tracking-widest hover:text-white transition-colors">
                {authMode === 'LOGIN' ? 'Não tem conta? Registre-se' : 'Já tem conta? Login'}
              </button>
            </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          
          {/* Assistente IA - Mascote & Balão */}
          <div className="relative mb-12 flex justify-center items-start pt-12">
            <div className="relative z-10 p-1 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.3)] shrink-0 group">
               <img src={profile.avatar_url || 'https://i.ibb.co/v4pXp2F/teambot-mascot.png'} className="w-20 h-20 rounded-full object-cover border-2 border-slate-950" alt="" />
               <button onClick={generateAssistantInsight} className="absolute -bottom-1 -right-1 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-slate-950 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><polyline points="21 3 21 8 16 8"></polyline></svg>
               </button>
            </div>

            {assistantMessage && (
              <div className="absolute left-[50%] ml-12 top-0 max-w-[220px] glass-premium p-5 rounded-[1.8rem] rounded-tl-none border-indigo-500/30 shadow-2xl animate-in zoom-in-50 slide-in-from-left-4 duration-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></span>
                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em]">TeamBot IA</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-300 font-medium leading-relaxed italic">"{assistantMessage}"</p>
                <div className="absolute -left-2 top-0 w-4 h-4 bg-indigo-500/10 border-l border-t border-indigo-500/30 -skew-x-[45deg]"></div>
              </div>
            )}
            
            {isAssistantLoading && (
              <div className="absolute left-[50%] ml-12 top-8 glass-premium px-5 py-3 rounded-full border-white/5 animate-pulse flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-.5s]"></div>
                </div>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Analisando dados...</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mb-10 px-2">
            <div>
               <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Olá, {profile.name.split(' ')[0]}</p>
               <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Painel</h1>
            </div>
            <button onClick={() => supabase.auth.signOut().then(() => setSession(null))} className="glass px-5 py-3 rounded-2xl text-red-500/40 font-black text-[10px] uppercase tracking-widest hover:text-red-500 transition-all">Sair</button>
          </div>

          <div className="flex gap-2 p-2 glass rounded-[2rem] mb-10 overflow-x-auto no-scrollbar shadow-inner">
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
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Link Público</label>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-grow bg-slate-950 p-4 rounded-2xl text-[11px] font-mono text-indigo-300 truncate border border-white/5 select-all">{getPublicUrl()}</div>
                    <button onClick={() => { navigator.clipboard.writeText(getPublicUrl()); addNotification('Link copiado!', 'success'); }} className="glass px-6 py-4 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all active:scale-90 gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">Copiar</span>
                    </button>
                  </div>
                </div>
                <div className="glass p-10 rounded-[3rem] space-y-8 border-white/5">
                    <div className="grid grid-cols-1 gap-8">
                      <div className="flex flex-col sm:flex-row gap-8">
                        <div className="flex-1 space-y-4">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avatar do Perfil</label>
                          <div className="flex items-center gap-5">
                            <img src={profile.avatar_url || 'https://i.ibb.co/v4pXp2F/teambot-mascot.png'} className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500/30 shadow-lg" alt="" />
                            <label className="bg-indigo-600/10 text-indigo-400 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-indigo-600 hover:text-white transition-all">
                               Upload Foto
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
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Slug (@identificador)</label>
                         <input value={profile.slug || ''} onChange={e => setProfile({...profile, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} placeholder="ex: meunome" className="w-full bg-slate-950 border border-white/5 p-6 rounded-3xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome Completo / Marca</label>
                         <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="Seu Nome" className="w-full bg-slate-950 border border-white/5 p-6 rounded-3xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Bio Estratégica</label>
                         <textarea value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} placeholder="Sua bio premium..." className="w-full bg-slate-950 border border-white/5 p-6 rounded-3xl text-sm font-medium text-slate-300 h-32 resize-none outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                    </div>
                    <button disabled={loading} onClick={saveProfile} className="w-full bg-indigo-600 hover:bg-indigo-500 py-7 rounded-[2.5rem] font-black text-white text-[12px] uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-95">{loading ? 'Salvando...' : 'Salvar Configurações'}</button>
                </div>
              </div>
            )}

            {activeTab === 'LINKS' && (
              <div className="space-y-6 animate-in slide-in-from-right-8 duration-600">
                <button onClick={() => { setShowAddLinkForm(!showAddLinkForm); setEditingLinkId(null); setNewLink({title:'', description:'', url:'', icon_url:''}); }} className="w-full glass p-8 rounded-[2rem] flex flex-col items-center justify-center gap-3 text-indigo-400 hover:bg-indigo-600/10 transition-all border-dashed border-2 border-indigo-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  <span className="font-black text-[10px] uppercase tracking-widest">Novo Link Estratégico</span>
                </button>
                {showAddLinkForm && (
                  <form onSubmit={handleSaveLink} className="glass p-8 rounded-[2.5rem] space-y-6 border-indigo-500/20 animate-in slide-in-from-top-4">
                    <input placeholder="Título (Ex: WhatsApp)" value={newLink.title} onChange={e => setNewLink({...newLink, title: e.target.value})} className="w-full bg-slate-950 p-5 rounded-2xl text-sm font-bold outline-none text-white border border-white/5" required />
                    <input placeholder="URL Completa (https://...)" value={newLink.url} onChange={e => setNewLink({...newLink, url: e.target.value})} className="w-full bg-slate-950 p-5 rounded-2xl text-sm outline-none text-white border border-white/5" required />
                    <div className="flex gap-4">
                      <button type="button" onClick={() => setShowAddLinkForm(false)} className="flex-1 bg-white/5 py-5 rounded-2xl font-black text-[10px] uppercase text-slate-400">Cancelar</button>
                      <button className="flex-[2] bg-indigo-600 py-5 rounded-2xl font-black text-white text-[10px] uppercase shadow-lg shadow-indigo-600/20">Salvar Link</button>
                    </div>
                  </form>
                )}
                <div className="space-y-4">
                  {links.map(l => (
                    <div key={l.id} className="glass p-5 rounded-[2rem] flex items-center justify-between group border border-white/5 hover:border-indigo-500/30 transition-all">
                      <div className="flex items-center gap-5 overflow-hidden">
                        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center p-2">
                          <img src={l.icon_url || 'https://i.ibb.co/v4pXp2F/teambot-mascot.png'} className="w-full h-full object-contain" alt="" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-black text-base uppercase truncate max-w-[120px] sm:max-w-xs">{l.title}</p>
                          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{l.click_count || 0} Cliques</p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => { setNewLink({...l}); setEditingLinkId(l.id); setShowAddLinkForm(true); window.scrollTo({top:0, behavior:'smooth'}); }} className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                        <button onClick={() => deleteLink(l.id)} className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500/60 hover:bg-red-500 hover:text-white transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'NEWS' && (
              <div className="space-y-6 animate-in slide-in-from-right-8 duration-600">
                <button onClick={() => { setShowAddNewsForm(!showAddNewsForm); setEditingPostId(null); setNewPost({title:'', content:'', image_url:'', link_url: ''}); }} className="w-full glass p-8 rounded-[2rem] flex flex-col items-center justify-center gap-3 text-indigo-400 hover:bg-indigo-600/10 transition-all border-dashed border-2 border-indigo-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  <span className="font-black text-[10px] uppercase tracking-widest">Publicar Novo Update</span>
                </button>
                {showAddNewsForm && (
                  <form onSubmit={handleSavePost} className="glass p-10 rounded-[2.5rem] space-y-6 border-indigo-500/20 animate-in slide-in-from-top-4">
                    <input placeholder="Título do Update" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} className="w-full bg-slate-950 p-6 rounded-2xl text-sm font-bold outline-none text-white border border-white/5" required />
                    <textarea placeholder="Conteúdo do post..." value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} className="w-full bg-slate-950 p-6 rounded-2xl text-sm h-44 resize-none outline-none text-white border border-white/5" required />
                    <div className="flex gap-4">
                      <button type="button" onClick={() => setShowAddNewsForm(false)} className="flex-1 bg-white/5 py-5 rounded-2xl font-black text-[10px] uppercase text-slate-400">Cancelar</button>
                      <button className="flex-[2] bg-indigo-600 py-5 rounded-2xl font-black text-white text-[10px] uppercase shadow-lg shadow-indigo-600/20">Publicar Agora</button>
                    </div>
                  </form>
                )}
                <div className="space-y-4">
                  {news.map(n => (
                    <div key={n.id} className="glass p-5 rounded-[2rem] flex items-center justify-between border border-white/5 group hover:border-indigo-500/30 transition-all">
                      <div className="flex items-center gap-5 overflow-hidden">
                        <img src={n.image_url || 'https://i.ibb.co/v4pXp2F/teambot-mascot.png'} className="w-20 h-20 rounded-2xl object-cover border border-white/5" alt="" />
                        <div className="min-w-0">
                          <p className="text-white font-black text-base uppercase truncate max-w-[120px] sm:max-w-xs">{n.title}</p>
                          <p className="text-slate-500 text-[10px] font-bold uppercase">{new Date(n.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-3 shrink-0">
                        <button onClick={() => { setNewPost({...n}); setEditingPostId(n.id); setShowAddNewsForm(true); window.scrollTo({top:0, behavior:'smooth'}); }} className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                        <button onClick={() => deletePost(n.id)} className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500/60 hover:bg-red-500 hover:text-white transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
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
