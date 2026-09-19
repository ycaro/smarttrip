import React, { useState } from 'react';

interface ModalConvidarProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

export const ModalConvidar: React.FC<ModalConvidarProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    onSuccess(email.trim());
    setEmail('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-bright max-w-sm w-full rounded-3xl p-5 shadow-2xl border border-outline-variant/40 relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">group_add</span>
            </div>
            <h3 className="font-bold text-primary text-base">
              Convidar Viajantes
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-primary"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <p className="text-xs text-on-surface-variant mb-4">
          Compartilhe o roteiro com amigos para sincronizar enquetes, despesas e
          atividades em tempo real.
        </p>

        {/* Copy link */}
        <div className="p-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 flex items-center justify-between mb-4">
          <span className="text-xs text-outline truncate mr-2">
            smarttrip.ai/join/lisboa-2024-group
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1 rounded-lg bg-primary text-white text-xs font-bold shrink-0 hover:bg-primary-container"
          >
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>

        {/* Email invite */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-primary mb-1">
              Convidar por e-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="amigo@email.com"
              required
              className="w-full h-11 px-3 rounded-xl border border-outline-variant text-xs text-primary focus:outline-none focus:border-primary"
            />
          </div>

          <button
            type="submit"
            className="w-full h-11 rounded-xl bg-[#fd6a49] text-white font-bold text-xs shadow-xs hover:brightness-105 active:scale-95 transition-all"
          >
            Enviar Convite
          </button>
        </form>
      </div>
    </div>
  );
};
