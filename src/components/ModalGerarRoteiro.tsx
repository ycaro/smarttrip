import React, { useState, useEffect } from 'react';

interface ModalGerarRoteiroProps {
  isOpen: boolean;
  destination: string;
  onClose: () => void;
  onSelectOption: (optionTitle: string) => void;
}

export const ModalGerarRoteiro: React.FC<ModalGerarRoteiroProps> = ({
  isOpen,
  destination,
  onClose,
  onSelectOption,
}) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setStep(0);
      return;
    }

    const timer1 = setTimeout(() => setStep(1), 600);
    const timer2 = setTimeout(() => setStep(2), 1200);
    const timer3 = setTimeout(() => setStep(3), 1800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-bright max-w-md w-full rounded-3xl p-5 shadow-2xl border border-secondary-fixed/60 relative overflow-hidden">
        {/* Floating gradient accent */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#fd6a49]/20 rounded-full blur-2xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#fd6a49] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-lg">auto_awesome</span>
            </div>
            <div>
              <h3 className="font-bold text-primary text-base leading-tight">
                IA SmartTrip 2.4
              </h3>
              <p className="text-[11px] text-outline">
                Sintetizando roteiro para {destination}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-primary"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Progress simulation if generating */}
        {step < 3 ? (
          <div className="py-8 text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-surface-container border-t-[#fd6a49] animate-spin"></div>
              <span className="material-symbols-outlined text-secondary text-2xl absolute">
                explore
              </span>
            </div>

            <div>
              <h4 className="font-bold text-primary text-sm mb-1">
                {step === 0 && 'Analisando clima histórico e condições de luz...'}
                {step === 1 && 'Cruzando melhores atrações com seu DNA de viagem...'}
                {step === 2 && 'Otimizando deslocamentos e janelas sem filas...'}
              </h4>
              <p className="text-xs text-outline">
                Gera 3 opções completas em menos de 12 segundos
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            <div className="p-2.5 rounded-xl bg-[#FFF0ED] border border-secondary-fixed text-xs text-secondary font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>3 Opções geradas com base no seu perfil!</span>
            </div>

            {/* Option 1 */}
            <div
              onClick={() => onSelectOption('Lisboa & Porto: Roteiro Clássico & Gastronômico')}
              className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 hover:border-secondary transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="bg-[#E6FCF5] text-[#0C8599] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Mais Recomendado
                </span>
                <span className="text-xs font-bold text-secondary">R$ 8.500</span>
              </div>
              <h5 className="font-bold text-primary text-sm group-hover:text-secondary transition-colors">
                Roteiro Clássico & Gastronomia Autêntica
              </h5>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Pastéis tradicionais, Mosteiro dos Jerónimos, orla do Tejo e bodegas do Douro.
              </p>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-outline">
                <span>7 dias</span>
                <span>•</span>
                <span>4 atividades/dia</span>
                <span>•</span>
                <span className="text-emerald-600 font-semibold">Economia ~R$ 420</span>
              </div>
            </div>

            {/* Option 2 */}
            <div
              onClick={() => onSelectOption('Lisboa & Costa: Rota Cênica & Miradouros')}
              className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 hover:border-secondary transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="bg-surface-container text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Visual & Fotografia
                </span>
                <span className="text-xs font-bold text-secondary">R$ 7.900</span>
              </div>
              <h5 className="font-bold text-primary text-sm group-hover:text-secondary transition-colors">
                Rota Cênica dos Miradouros & Sintra
              </h5>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Palácio da Pena, Cabo da Roca, bondinhos históricos e pôr do sol em Alfama.
              </p>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-outline">
                <span>6 dias</span>
                <span>•</span>
                <span>3 atividades/dia</span>
              </div>
            </div>

            {/* Option 3 */}
            <div
              onClick={() => onSelectOption('Lisboa Contemporânea & Noite Cultural')}
              className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 hover:border-secondary transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="bg-surface-container text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Urbano & Noite
                </span>
                <span className="text-xs font-bold text-secondary">R$ 9.200</span>
              </div>
              <h5 className="font-bold text-primary text-sm group-hover:text-secondary transition-colors">
                Lisboa Contemporânea, Casas de Fado & Rooftops
              </h5>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Mercado da Ribeira, LX Factory, Fado intimista e gastronomia moderna.
              </p>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-outline">
                <span>7 dias</span>
                <span>•</span>
                <span>Flexível</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
