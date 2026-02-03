
import React from 'react';

interface PrivacyProps {
  onBack: () => void;
}

const Privacy: React.FC<PrivacyProps> = ({ onBack }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="flex items-center gap-4 mb-10">
        <button 
          onClick={onBack}
          className="w-10 h-10 glass rounded-full flex items-center justify-center hover:bg-white/10 transition-all active:scale-90"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <h1 className="text-2xl font-black text-white tracking-tight">Privacidade e Dados</h1>
      </div>

      <div className="glass p-8 rounded-[2rem] space-y-6 text-slate-400 text-sm leading-relaxed">
        <section>
          <h2 className="text-white font-bold text-lg mb-3">Compromisso TeamBot</h2>
          <p>Priorizamos a segurança e a transparência. No TeamBot, seus dados são tratados com o máximo rigor técnico, utilizando criptografia de ponta e infraestrutura resiliente.</p>
        </section>

        <section>
          <h2 className="text-white font-bold text-lg mb-3">Coleta de Informações</h2>
          <p>Coletamos apenas o essencial para o funcionamento da plataforma: métricas anônimas de cliques para análise de performance e dados de autenticação seguros via Supabase Auth.</p>
        </section>

        <section>
          <h2 className="text-white font-bold text-lg mb-3">Cookies e LocalStorage</h2>
          <p>Utilizamos tecnologias de armazenamento local apenas para manter sua sessão ativa e salvar suas preferências visuais (como o tema dark ultra-moderno), garantindo uma experiência fluida.</p>
        </section>

        <div className="pt-6 border-t border-white/5 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-600">
          Última atualização: Maio de 2024
        </div>
      </div>
    </div>
  );
};

export default Privacy;
