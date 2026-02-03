
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
      // Garante que o nome do arquivo seja limpo e organizado por usuário
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/${fieldId}-${Date.now()}.${fileExt}`;
      const filePath = `${bucketPath}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('teambot')
        .upload(filePath, file, { 
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        if (uploadError.message.toLowerCase().includes('row-level security') || uploadError.message.toLowerCase().includes('policy')) {
          setShowSqlHelper(true);
          throw new Error('Bloqueio de Segurança (RLS): Você precisa autorizar o upload no painel do Supabase. Veja as instruções que apareceram na tela.');
        }
        throw uploadError;
      }

      const { data } = supabase.storage.from('teambot').getPublicUrl(filePath);
      addNotification('Upload concluído com sucesso!', 'success');
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
        addNotification('Acesso concedido!', 'success');
      } else if (authMode === 'SIGNUP') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          const defaultSlug = `user${Math.floor(Math.random() * 9999)}`;
          await supabase.from('profiles').insert([{ 
            id: data.user.id, 
            name: 'Novo Membro', 
            slug: defaultSlug,
            bio: 'Minha nova central inteligente.',
            avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${data.user.id}`
          }]);
          addNotification('Cadastro realizado! Verifique seu e-mail.', 'info');
          setAuthMode('LOGIN');
        }
      }
    } catch (err: any) { addNotification(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const cleanSlug = profile.slug?.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      const { error } = await supabase.from('profiles').upsert({
        id: session.user.id,
        ...profile,
        slug: cleanSlug,
        updated_at: new Date()
      });
      if (error) throw error;
      setProfile({...profile, slug: cleanSlug});
      addNotification('Perfil atualizado com sucesso!', 'success');
    } catch (err: any) { addNotification('Erro ao salvar: verifique se o slug já existe.', 'error'); }
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
      addNotification('Link adicionado à sua bio!', 'success');
    } catch (err: any) { addNotification(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const addPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.from('news').insert([{ ...newPost, user_id: session.user.id }]).select();
      if (error) throw error;
      setNews([data[0], ...news]);
      setNewPost({ title: '', content: '', image_url: '' });
      setShowAddNewsForm(false);
      addNotification('Nova postagem publicada!', 'success');
    } catch (err: any) { addNotification(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const deleteLink = async (id: string) => {
    if (!confirm('Excluir este link?')) return;
    await supabase.from('tools').delete().eq('id', id);
    setLinks(links.filter(l => l.id !== id));
    addNotification('Link removido.', 'info');
  };

  const deletePost = async (id: string) => {
    if (!confirm('Excluir esta postagem?')) return;
    await supabase.from('news').delete().eq('id', id);
    setNews(news.filter(n => n.id !== id));
    addNotification('Postagem removida.', 'info');
  };

  const sqlInstructions = `-- COPIE E COLE NO SQL EDITOR DO SUPABASE
-- 1. Cria o Bucket de Imagens
INSERT INTO storage.buckets (id, name, public) 
VALUES ('teambot', 'teambot', true) 
ON CONFLICT (id) DO NOTHING;

-- 2. Permite que QUALQUER PESSOA veja as imagens
CREATE POLICY "Leitura Publica" ON storage.objects FOR SELECT TO public USING (bucket_id = 'teambot');

-- 3. Permite que USUÁRIOS LOGADOS gerenciem seus arquivos
CREATE POLICY "Dono Gerencia Arquivos" ON storage.objects FOR ALL TO authenticated 
USING (bucket_id = 'teambot') WITH CHECK (bucket_id = 'teambot');

-- 4. Permite gerenciar a tabela de Perfis
CREATE POLICY "Gerenciar Perfil" ON public.profiles FOR ALL TO authenticated 
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 5. Permite gerenciar seus Links e News
CREATE POLICY "Gerenciar Links" ON public.tools FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Gerenciar News" ON public.news FOR ALL TO authenticated USING (auth.uid() = user_id);
`;

  return (
    <div className="relative min-h-[600px] pb-32">
      {/* Modal de Ajuda SQL */}
      {showSqlHelper && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="glass w-full max-w-xl p-8 rounded-[2.5rem] border-indigo-500/30 animate-in zoom-in-95">
            <h3 className="text-xl font-black text-white mb-4 flex items-center gap-3">
               <span className="text-indigo-400">⚡</span> Ajuste de Permissões
            </h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              O Supabase bloqueou o upload por segurança. Para liberar, copie o código abaixo e cole no <strong>SQL Editor</strong> do seu painel Supabase:
            </p>
            <pre className="bg-slate-900 p-4 rounded-xl text-[10px] font-mono text-emerald-400 overflow-x-auto border border-white/5 mb-6 max-h-48 overflow-y-auto">
              {sqlInstructions}
            </pre>
            <div className="flex gap-4">
               <button 
                  onClick={() => { navigator.clipboard.writeText(sqlInstructions); addNotification('Código SQL copiado!', 'success'); }}
                  className="flex-grow bg-indigo-600 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-white"
               >
                 Copiar Código SQL
               </button>
               <button onClick={() => setShowSqlHelper(false)} className="px-6 glass rounded-xl font-bold text-xs text-slate-400">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Notificações */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4 flex flex-col gap-3 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className={`glass p-5 rounded-[1.5rem] shadow-2xl flex items-start gap-4 border-l-4 pointer-events-auto animate-in slide-in-from-top-6 duration-500 ${
            n.type === 'success' ? 'border-emerald-500 bg-emerald-500/10' : 
            n.type === 'error' ? 'border-rose-500 bg-rose-500/10' : 'border-indigo-500 bg-indigo-500/10'
          }`}>
            <div className={`mt-0.5 shrink-0 ${n.type === 'success' ? 'text-emerald-400' : n.type === 'error' ? 'text-rose-400' : 'text-indigo-400'}`}>
               {n.type === 'error' ? '⚠️' : '✨'}
            </div>
            <p className="text-[11px] font-bold text-white leading-relaxed">{n.message}</p>
          </div>
        ))}
      </div>

      {!session ? (
        <div className="max-w-md mx-auto mt-10 p-10 glass rounded-[3rem] animate-in zoom-in-95 duration-500 shadow-2xl border border-white/5 text-center">
            <h2 className="text-3xl font-black mb-10 text-white tracking-tight uppercase tracking-widest">TeamBot Admin</h2>
            <form onSubmit={handleAuth} className="space-y-6 text-left">
              <div className="space-y-2">
                 <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-2">Identificação</label>
                 <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-900 border border-white/5 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm text-white" required />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-2">Chave de Acesso</label>
                 <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-900 border border-white/5 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm text-white" required />
              </div>
              <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 py-5 rounded-2xl font-black text-white uppercase tracking-[0.2em] text-[10px] transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
                {loading ? 'Validando...' : authMode === 'LOGIN' ? 'Acessar Painel' : 'Criar Conta Premium'}
              </button>
            </form>
            <button onClick={() => setAuthMode(authMode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')} className="mt-8 text-[10px] text-slate-500 font-bold uppercase tracking-widest hover:text-indigo-400 transition-colors">
              {authMode === 'LOGIN' ? 'Ainda não tem acesso? Clique aqui' : 'Já possui uma conta? Entrar'}
            </button>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="flex justify-between items-center mb-10">
            <div>
               <h1 className="text-2xl font-black text-white tracking-tight uppercase tracking-[0.2em]">Dashboard</h1>
               <div className="flex items-center gap-2 mt-1">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                 <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Sessão Ativa</p>
               </div>
            </div>
            <div className="flex gap-3">
               <button onClick={() => setShowSqlHelper(true)} className="glass px-4 py-2 rounded-xl text-indigo-400 font-black text-[10px] uppercase tracking-widest border-indigo-500/20">Config Banco</button>
               <button onClick={() => supabase.auth.signOut().then(() => setSession(null))} className="glass px-4 py-2 rounded-xl text-red-400 font-black text-[10px] uppercase tracking-widest border-red-500/20">Sair</button>
            </div>
          </div>

          <div className="flex gap-2 p-1.5 glass rounded-[1.5rem] mb-10 overflow-x-auto no-scrollbar">
            {(['LINKS', 'NEWS', 'PROFILE'] as const).map(tab => (
              <button key={tab} onClick={() => { setActiveTab(tab); setShowAddLinkForm(false); setShowAddNewsForm(false); }} className={`flex-grow min-w-[100px] py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>{tab === 'LINKS' ? 'Links' : tab === 'NEWS' ? 'Postagens' : 'Configurações'}</button>
            ))}
          </div>

          <div className="space-y-8">
            {/* ABA PERFIL */}
            {activeTab === 'PROFILE' && (
              <div className="glass p-8 rounded-[2.5rem] space-y-8 animate-in slide-in-from-right-6 duration-500">
                <div className="flex flex-col md:flex-row gap-8 items-center border-b border-white/5 pb-8">
                  <div className="relative group">
                    <div className={`w-24 h-24 rounded-full border-4 border-indigo-500/20 overflow-hidden relative shadow-2xl ${uploading === 'avatar' ? 'opacity-50 animate-pulse' : ''}`}>
                       <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity z-10">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                      <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                        if (e.target.files?.[0]) {
                          const url = await handleFileUpload(e.target.files[0], 'avatars', 'avatar');
                          if (url) setProfile({...profile, avatar_url: url});
                        }
                      }} />
                    </label>
                  </div>
                  <div className="flex-grow space-y-2 w-full">
                    <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Seu Nome de Usuário (@slug)</label>
                    <div className="flex items-center gap-3 bg-slate-900 p-5 rounded-2xl border border-white/5 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all shadow-inner">
                      <span className="text-indigo-500 font-black">@</span>
                      <input value={profile.slug || ''} onChange={e => setProfile({...profile, slug: e.target.value})} className="bg-transparent outline-none text-white text-sm font-bold w-full" placeholder="ex: seu-nome" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Nome de Exibição</label>
                    <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full bg-slate-900 border border-white/5 p-5 rounded-2xl text-sm font-bold text-white shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Sua Biografia</label>
                    <textarea value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} className="w-full bg-slate-900 border border-white/5 p-5 rounded-2xl text-sm font-medium text-slate-300 h-32 resize-none shadow-inner" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Mascote PNG Flutuante</label>
                    <div className="flex items-center gap-4">
                       <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center overflow-hidden border border-white/5 shadow-inner">
                          {profile.mascot_url ? <img src={profile.mascot_url} className="w-full h-full object-contain p-1" /> : <span className="text-slate-700 font-bold">?</span>}
                       </div>
                       <label className="flex-grow glass p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center cursor-pointer hover:bg-white/5 transition-all border-dashed border-2 border-white/10 active:scale-95 text-indigo-400">
                          {uploading === 'mascot' ? 'Aguarde Upload...' : 'Trocar Mascote'}
                          <input type="file" className="hidden" accept="image/png" onChange={async (e) => {
                            if (e.target.files?.[0]) {
                              const url = await handleFileUpload(e.target.files[0], 'mascots', 'mascot');
                              if (url) setProfile({...profile, mascot_url: url});
                            }
                          }} />
                       </label>
                    </div>
                  </div>
                </div>
                <button disabled={loading} onClick={saveProfile} className="w-full bg-indigo-600 hover:bg-indigo-500 py-6 rounded-[2rem] font-black text-white text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50">
                  {loading ? 'Sincronizando...' : 'Salvar Perfil Profissional'}
                </button>
              </div>
            )}

            {/* ABA LINKS */}
            {activeTab === 'LINKS' && (
              <div className="space-y-8 animate-in slide-in-from-right-6 duration-500">
                {!showAddLinkForm ? (
                  <button 
                    onClick={() => setShowAddLinkForm(true)}
                    className="w-full py-10 border-2 border-dashed border-indigo-500/20 rounded-[2.5rem] flex flex-col items-center gap-4 hover:bg-indigo-500/5 hover:border-indigo-500/40 transition-all group"
                  >
                    <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
                       <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-400">Novo Card de Link</span>
                  </button>
                ) : (
                  <form onSubmit={addLink} className="glass p-8 rounded-[2.5rem] space-y-6 animate-in zoom-in-95 border-emerald-500/20 shadow-emerald-500/5">
                    <div className="flex justify-between items-center mb-2">
                       <h3 className="text-white font-black text-[10px] uppercase tracking-[0.2em] text-emerald-400">Editor de Link Premium</h3>
                       <button type="button" onClick={() => setShowAddLinkForm(false)} className="text-slate-600 hover:text-white transition-colors">
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                       </button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="w-24 h-24 glass rounded-3xl flex items-center justify-center overflow-hidden shrink-0 border border-white/10 relative group shadow-inner bg-slate-900">
                        {newLink.icon_url ? <img src={newLink.icon_url} className="w-full h-full object-contain p-3" /> : <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="2"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7"></path><line x1="16" y1="19" x2="22" y2="19"></line><line x1="19" y1="16" x2="19" y2="22"></line></svg>}
                        <label className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                          <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                            if (e.target.files?.[0]) {
                              const url = await handleFileUpload(e.target.files[0], 'links', 'link_icon');
                              if (url) setNewLink({...newLink, icon_url: url});
                            }
                          }} />
                          <span className="text-[10px] text-white font-black uppercase">Trocar</span>
                        </label>
                      </div>
                      <div className="flex-grow space-y-4">
                        <input placeholder="Título do Botão" value={newLink.title} onChange={e => setNewLink({...newLink, title: e.target.value})} className="w-full bg-slate-900 p-5 rounded-2xl text-sm font-bold border border-white/5 text-white shadow-inner" required />
                        <input placeholder="https://link-de-destino.com" value={newLink.url} onChange={e => setNewLink({...newLink, url: e.target.value})} className="w-full bg-slate-900 p-5 rounded-2xl text-sm font-medium border border-white/5 text-slate-300 shadow-inner" required />
                      </div>
                    </div>
                    <input placeholder="Descrição Curta (ex: Grupo VIP de Alunos)" value={newLink.description} onChange={e => setNewLink({...newLink, description: e.target.value})} className="w-full bg-slate-900 p-5 rounded-2xl text-sm font-medium border border-white/5 text-slate-400 shadow-inner" />
                    <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 py-6 rounded-[2rem] font-black text-white text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all active:scale-95">Publicar no Perfil</button>
                  </form>
                )}

                <div className="space-y-5">
                  {links.length === 0 ? (
                    <div className="text-center p-16 glass rounded-[2.5rem] opacity-30 italic text-sm">Nenhum link configurado.</div>
                  ) : (
                    links.map(l => (
                      <div key={l.id} className="glass p-6 rounded-[2rem] flex items-center justify-between group hover:bg-white/[0.02] transition-all border border-white/5">
                        <div className="flex items-center gap-5">
                          <img src={l.icon_url} className="w-14 h-14 rounded-2xl object-contain bg-slate-900 p-2 shadow-inner border border-white/5" alt="" />
                          <div>
                            <p className="text-white font-black text-base">{l.title}</p>
                            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1">📈 {l.click_count || 0} acessos</p>
                          </div>
                        </div>
                        <button onClick={() => deleteLink(l.id)} className="w-12 h-12 flex items-center justify-center text-red-500/30 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all active:scale-90">
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ABA NOVIDADES */}
            {activeTab === 'NEWS' && (
              <div className="space-y-8 animate-in slide-in-from-right-6 duration-500">
                {!showAddNewsForm ? (
                  <button 
                    onClick={() => setShowAddNewsForm(true)}
                    className="w-full py-10 border-2 border-dashed border-purple-500/20 rounded-[2.5rem] flex flex-col items-center gap-4 hover:bg-purple-500/5 hover:border-purple-500/40 transition-all group"
                  >
                    <div className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
                       <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 21h16a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z"></path><polyline points="7 8 12 13 17 8"></polyline></svg>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.4em] text-purple-400">Novo Update de Notícia</span>
                  </button>
                ) : (
                  <form onSubmit={addPost} className="glass p-8 rounded-[2.5rem] space-y-6 animate-in zoom-in-95 border-purple-500/20">
                    <div className="flex justify-between items-center mb-2">
                       <h3 className="text-white font-black text-[10px] uppercase tracking-[0.2em] text-purple-400">Editor de Atualizações</h3>
                       <button type="button" onClick={() => setShowAddNewsForm(false)} className="text-slate-600 hover:text-white transition-colors">
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                       </button>
                    </div>
                    <div className="relative h-56 bg-slate-900 rounded-3xl border border-white/5 overflow-hidden group shadow-inner">
                       {newPost.image_url ? (
                         <img src={newPost.image_url} className="w-full h-full object-cover" alt="" />
                       ) : (
                         <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 italic text-xs gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                            <span>Selecione uma Imagem Impactante</span>
                         </div>
                       )}
                       <label className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-white z-10">
                          <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                            if (e.target.files?.[0]) {
                              const url = await handleFileUpload(e.target.files[0], 'news', 'news_capa');
                              if (url) setNewPost({...newPost, image_url: url});
                            }
                          }} />
                          <span className="text-[11px] font-black uppercase tracking-widest">{uploading === 'news_capa' ? 'Processando Imagem...' : 'Upload de Capa'}</span>
                       </label>
                    </div>
                    <input placeholder="Título da Novidade" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} className="w-full bg-slate-900 p-5 rounded-2xl text-sm font-bold border border-white/5 text-white shadow-inner" required />
                    <textarea placeholder="Conteúdo da postagem..." value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} className="w-full bg-slate-900 p-5 rounded-2xl text-sm font-medium border border-white/5 text-slate-300 h-40 resize-none shadow-inner" required />
                    <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 py-6 rounded-[2rem] font-black text-white text-[10px] uppercase tracking-widest shadow-xl shadow-purple-600/30 transition-all active:scale-95">Publicar Agora</button>
                  </form>
                )}

                <div className="space-y-5">
                  {news.map(n => (
                    <div key={n.id} className="glass p-6 rounded-[2rem] flex items-center justify-between group hover:bg-white/[0.02] transition-all border border-white/5">
                      <div className="flex items-center gap-5">
                        <img src={n.image_url} className="w-16 h-16 rounded-2xl object-cover bg-slate-900 shadow-xl border border-white/5" alt="" />
                        <span className="text-white font-black text-base truncate max-w-[180px]">{n.title}</span>
                      </div>
                      <button onClick={() => deletePost(n.id)} className="w-12 h-12 flex items-center justify-center text-red-500/30 hover:text-red-500 transition-all">
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={onBack} className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white text-slate-950 px-16 py-6 rounded-full font-black text-[11px] uppercase tracking-[0.4em] shadow-[0_25px_60px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95 transition-all z-[60]">Ver Minha Bio Online</button>
        </div>
      )}
    </div>
  );
};

export default Admin;
