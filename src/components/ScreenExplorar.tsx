import React, { useState } from 'react';
import { ScreenType } from '../types';
import { USER_PROFILE } from '../data/mockData';
import { DestinationAutocomplete } from './DestinationAutocomplete';

interface ScreenExplorarProps {
  onNavigate: (screen: ScreenType) => void;
  onOpenGenerationModal: (destination: string) => void;
}

export const ScreenExplorar: React.FC<ScreenExplorarProps> = ({
  onNavigate,
  onOpenGenerationModal,
}) => {
  const [destination, setDestination] = useState('Lisboa & Porto, Portugal');
  const [travelPeriod, setTravelPeriod] = useState('12 a 18 de Outubro');
  const [budgetLevel, setBudgetLevel] = useState<number>(50); // 0 to 100
  const [selectedStyles, setSelectedStyles] = useState<string[]>([
    'Gastronomia',
    'História',
  ]);

  const travelStyles = [
    { id: 'Gastronomia', label: 'Gastronomia', icon: 'restaurant' },
    { id: 'História', label: 'História', icon: 'account_balance' },
    { id: 'Natureza', label: 'Natureza', icon: 'forest' },
    { id: 'Ritmo Relaxado', label: 'Ritmo Relaxado', icon: 'self_improvement' },
    { id: 'Fotografia', label: 'Fotografia', icon: 'photo_camera' },
  ];

  const toggleStyle = (styleId: string) => {
    setSelectedStyles((prev) =>
      prev.includes(styleId)
        ? prev.filter((s) => s !== styleId)
        : [...prev, styleId]
    );
  };

  const getBudgetText = () => {
    if (budgetLevel < 35) return 'R$ 4.200 total (Econômico)';
    if (budgetLevel < 70) return 'R$ 8.500 total (Moderado Confort)';
    return 'R$ 16.800 total (Luxo / Exclusivo)';
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-surface-bright min-h-screen pb-28 pt-4 px-4 sm:px-5">
      {/* Top Header */}
      <header className="flex items-center justify-between py-2 mb-3">
        {/* User greeting */}
        <div
          onClick={() => onNavigate('perfil')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="relative">
            <img
              src={USER_PROFILE.avatar}
              alt={USER_PROFILE.name}
              className="w-11 h-11 rounded-full object-cover border-2 border-surface-container-high group-hover:scale-105 transition-transform"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider text-outline uppercase">
              OLÁ, MARCELO
            </p>
            <p className="font-bold text-primary text-base leading-none">
              Explorador
            </p>
          </div>
        </div>

        {/* Brand */}
        <div className="flex items-center gap-1">
          <span className="font-headline-lg text-xl font-extrabold text-primary tracking-tight">
            SmartTrip
          </span>
        </div>

        {/* Notification Bell */}
        <button
          onClick={() => onNavigate('hub')}
          aria-label="Notificações"
          className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary relative active:scale-95 transition-transform hover:bg-surface-container"
        >
          <span className="material-symbols-outlined text-[22px]">
            notifications
          </span>
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-secondary"></span>
        </button>
      </header>

      {/* AI Micro-Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0ED] text-secondary font-semibold text-xs mb-3 border border-secondary-fixed/50">
        <span
          className="material-symbols-outlined text-sm"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          auto_awesome
        </span>
        <span className="tracking-wide">ASSISTENTE COGNITIVO 2.4</span>
      </div>

      {/* Hero Title & Subtitle */}
      <h1 className="font-headline-lg text-[26px] sm:text-[28px] font-extrabold text-primary leading-tight tracking-tight mb-2">
        Para onde a sua curiosidade vai te levar?
      </h1>
      <p className="text-on-surface-variant text-sm leading-relaxed mb-4">
        Deixe nossa inteligência conectar roteiros autênticos, reservas em
        sincronia e experiências fora do comum.
      </p>

      {/* Search Input Box */}
      <div className="relative mb-3">
        <div className="w-full h-[52px] pl-11 pr-14 rounded-2xl bg-surface-container-lowest border border-outline-variant/50 shadow-xs flex items-center">
          <span className="material-symbols-outlined absolute left-3.5 text-outline text-xl pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Ex: 5 dias de vinho e arquitetura no D..."
            className="w-full bg-transparent text-sm text-primary placeholder:text-outline focus:outline-none"
          />
          <button
            onClick={() => onOpenGenerationModal(destination)}
            aria-label="Buscar roteiro"
            className="absolute right-2 w-9 h-9 rounded-xl bg-[#8c1900] text-white flex items-center justify-center font-bold text-xs active:scale-95 transition-transform shadow-xs"
          >
            <span>RH</span>
          </button>
        </div>
      </div>

      {/* Quick Inspirations Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 mb-5 text-xs">
        <span className="text-outline font-medium shrink-0">Inspirações:</span>
        <button
          onClick={() => {
            setDestination('Viena, Áustria');
            onOpenGenerationModal('Viena, Áustria');
          }}
          className="px-3 py-1.5 rounded-full bg-surface-container-low text-primary font-medium hover:bg-surface-container transition-colors shrink-0"
        >
          Cafés históricos em Viena
        </button>
        <button
          onClick={() => {
            setDestination('Açores, Portugal');
            onOpenGenerationModal('Açores, Portugal');
          }}
          className="px-3 py-1.5 rounded-full bg-surface-container-low text-primary font-medium hover:bg-surface-container transition-colors shrink-0"
        >
          Rota dos Vulcões
        </button>
        <button
          onClick={() => {
            setDestination('Paris, França');
            onOpenGenerationModal('Paris, França');
          }}
          className="px-3 py-1.5 rounded-full bg-surface-container-low text-primary font-medium hover:bg-surface-container transition-colors shrink-0"
        >
          Boutiques em Paris
        </button>
      </div>

      {/* Generative Planner Card (Criar Novo Roteiro com IA) */}
      <section className="bg-gradient-to-br from-[#FFF5F2] via-surface-container-lowest to-[#F0F7FF] rounded-3xl p-4 sm:p-5 border border-secondary-fixed shadow-[0_4px_24px_rgba(253,106,73,0.10)] mb-6 relative overflow-hidden">
        {/* Glowing badge */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-secondary text-xs font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">psychology</span>
            <span>PLANEJADOR GENERATIVO</span>
          </div>
          <span className="bg-[#f2dfdb] text-[#551d14] px-2.5 py-0.5 rounded-full text-[11px] font-bold">
            Modo Pro
          </span>
        </div>

        <h2 className="font-headline-md text-xl font-extrabold text-primary mb-3.5">
          Criar Novo Roteiro com IA
        </h2>

        {/* Input: Destino Principal (Com Autocomplete e Normalização) */}
        <div className="mb-3.5">
          <label className="block text-xs font-bold text-primary mb-1">
            Destino Principal (Busca Normalizada)
          </label>
          <DestinationAutocomplete
            value={destination}
            onChange={(val) => setDestination(val)}
            placeholder="Ex: Lisboa, Paris, Tóquio, Santiago..."
          />
        </div>

        {/* Input: Período de Viagem */}
        <div className="mb-3.5">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-primary">
              Período de Viagem
            </label>
            <span className="text-[11px] text-outline">
              Datas flexíveis (+/- 2 dias)
            </span>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-3 flex items-center justify-between shadow-2xs">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-xl mt-0.5">
                calendar_month
              </span>
              <div>
                <p className="text-sm font-bold text-primary">{travelPeriod}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  7 dias de exploração • Clima de outono agradável
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const newDates = prompt(
                  'Digite o novo período:',
                  '12 a 18 de Outubro'
                );
                if (newDates) setTravelPeriod(newDates);
              }}
              className="text-xs font-bold text-primary hover:text-secondary px-2.5 py-1 rounded-lg hover:bg-surface-container transition-colors"
            >
              Alterar
            </button>
          </div>
        </div>

        {/* Input: Estilo de Viagem */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-primary mb-1.5">
            Estilo de Viagem
          </label>
          <div className="flex flex-wrap gap-2">
            {travelStyles.map((style) => {
              const isSelected = selectedStyles.includes(style.id);
              return (
                <button
                  key={style.id}
                  onClick={() => toggleStyle(style.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/40 hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {style.icon}
                  </span>
                  <span>{style.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input: Faixa Estimada de Orçamento */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-primary">
              Faixa Estimada de Orçamento
            </span>
            <span className="text-sm font-bold text-[#ae3115]">
              {getBudgetText()}
            </span>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-3 border border-outline-variant/40">
            <input
              type="range"
              min="0"
              max="100"
              value={budgetLevel}
              onChange={(e) => setBudgetLevel(Number(e.target.value))}
              className="w-full accent-[#fd6a49] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-outline mt-1 font-medium">
              <span className={budgetLevel < 35 ? 'text-primary font-bold' : ''}>
                Econômico
              </span>
              <span
                className={
                  budgetLevel >= 35 && budgetLevel < 70
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                Moderado Confort
              </span>
              <span
                className={budgetLevel >= 70 ? 'text-primary font-bold' : ''}
              >
                Luxo / Exclusivo
              </span>
            </div>
          </div>
        </div>

        {/* CTA Button: Gerar Roteiro Personalizado */}
        <button
          onClick={() => onOpenGenerationModal(destination)}
          className="w-full h-13 rounded-2xl bg-gradient-to-r from-[#fd6a49] to-[#ff5226] text-white font-bold text-base flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(253,106,73,0.38)] active:scale-[0.98] hover:brightness-105 transition-all"
        >
          <span className="material-symbols-outlined text-xl">auto_awesome</span>
          <span>Gerar Roteiro Personalizado</span>
        </button>

        <div className="flex items-center justify-center gap-1.5 mt-2.5 text-[11px] text-outline">
          <span className="material-symbols-outlined text-xs">lock</span>
          <span>Gera 3 opções completas em menos de 12 segundos</span>
        </div>
      </section>

      {/* Sua Próxima Viagem */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-headline-md text-lg font-extrabold text-primary">
            Sua Próxima Viagem
          </h2>
          <button
            onClick={() => onNavigate('roteiro')}
            className="text-xs font-bold text-secondary hover:underline"
          >
            Ver todas (2)
          </button>
        </div>

        {/* Destination Featured Card */}
        <div
          onClick={() => onNavigate('roteiro')}
          className="relative rounded-3xl overflow-hidden shadow-md cursor-pointer group transition-all duration-300 hover:shadow-xl"
        >
          {/* Edge to edge scenic photo */}
          <div className="h-56 w-full relative">
            <img
              src="https://images.unsplash.com/photo-1509840841025-9088ba78a826?auto=format&fit=crop&w=1000&q=80"
              alt="Lisboa vista aérea"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/40 to-transparent"></div>

            {/* Corner Badges */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-primary shadow-xs">
              <span className="material-symbols-outlined text-amber-500 text-sm">
                sunny
              </span>
              <span>Clima favorável • 24°C</span>
            </div>

            <div className="absolute top-3 right-3 bg-[#8c1900] text-white px-2.5 py-1 rounded-full text-[11px] font-extrabold tracking-wide uppercase shadow-xs">
              EM 28 DIAS
            </div>

            {/* Card Content Overlay */}
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <p className="text-xs text-surface-variant font-medium tracking-wide uppercase">
                Portugal Continental
              </p>
              <h3 className="font-headline-md text-xl sm:text-22 font-extrabold leading-tight text-white mb-2">
                Lisboa, Sintra & Costa Vicentina
              </h3>

              <div className="flex items-center gap-2 text-xs text-white/90 mb-2">
                <span>📅 14 a 22 de Nov</span>
                <span>•</span>
                <span>8 dias</span>
                <span>•</span>
                <span className="text-[#53d7ef] font-semibold">
                  ✓ Roteiro 75% concluído
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-white/30 h-1.5 rounded-full overflow-hidden mb-3">
                <div className="bg-[#fd6a49] h-full w-[75%] rounded-full"></div>
              </div>

              {/* Bottom footer inside card */}
              <div className="flex items-center justify-between pt-1 border-t border-white/20">
                <div className="flex items-center -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-[#1a365d] border border-white text-white flex items-center justify-center text-[10px] font-bold">
                    MC
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#ffdad2] border border-white text-[#ae3115] flex items-center justify-center text-[10px] font-bold">
                    CL
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-white group-hover:translate-x-1 transition-transform">
                  <span>Continuar edição</span>
                  <span className="material-symbols-outlined text-sm">
                    arrow_forward
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sugestões Rápidas da IA */}
      <section className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 text-primary font-bold text-base">
            <span className="material-symbols-outlined text-secondary text-lg">
              bolt
            </span>
            <span>Sugestões Rápidas da IA</span>
          </div>
          <span className="text-[11px] text-outline">Baseado no seu perfil</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Fim de Semana nas Serras */}
          <div
            onClick={() => onNavigate('roteiro')}
            className="bg-surface-container-lowest p-3.5 rounded-2xl border border-outline-variant/40 shadow-2xs hover:border-secondary/50 cursor-pointer transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-xl bg-[#FFF0ED] text-secondary flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-base">
                  cabin
                </span>
              </div>
              <span className="bg-[#E6FCF5] text-[#0C8599] text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-1.5">
                Escapada Curta
              </span>
              <h4 className="font-bold text-primary text-sm leading-tight mb-1">
                Fim de Semana nas Serras
              </h4>
              <p className="text-[11px] text-on-surface-variant leading-relaxed line-clamp-3">
                Cabana com lareira, trilhas tranquilas e gastronomia artesanal.
              </p>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-outline-variant/30 text-xs font-bold text-secondary">
              <span>2 dias • R$ 1.800</span>
              <span className="material-symbols-outlined text-sm">
                chevron_right
              </span>
            </div>
          </div>

          {/* Card 2: Roteiro Express de 3 dias */}
          <div
            onClick={() => onNavigate('detalhes')}
            className="bg-surface-container-lowest p-3.5 rounded-2xl border border-outline-variant/40 shadow-2xs hover:border-secondary/50 cursor-pointer transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-xl bg-[#eff4ff] text-primary flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-base">
                  auto_mode
                </span>
              </div>
              <span className="bg-[#e5eeff] text-primary text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-1.5">
                Roteiro Express
              </span>
              <h4 className="font-bold text-primary text-sm leading-tight mb-1">
                Roteiro Express de 3 dias
              </h4>
              <p className="text-[11px] text-on-surface-variant leading-relaxed line-clamp-3">
                Metrópole cultural: museus noturnos, rooftops e cafés secretos.
              </p>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-outline-variant/30 text-xs font-bold text-secondary">
              <span>3 dias • R$ 2.400</span>
              <span className="material-symbols-outlined text-sm">
                chevron_right
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
