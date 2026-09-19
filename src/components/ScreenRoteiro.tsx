import React, { useState } from 'react';
import { ScreenType } from '../types';
import { LISBOA_DAY_3 } from '../data/mockData';

interface ScreenRoteiroProps {
  onNavigate: (screen: ScreenType) => void;
  onOpenActivityDetails?: (activityId: string) => void;
  onAddActivity?: () => void;
}

export const ScreenRoteiro: React.FC<ScreenRoteiroProps> = ({
  onNavigate,
  onOpenActivityDetails,
  onAddActivity,
}) => {
  const [selectedDay, setSelectedDay] = useState(3);
  const [showFadoTips, setShowFadoTips] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [weatherAdjusted, setWeatherAdjusted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAdjustWeather = () => {
    setWeatherAdjusted(!weatherAdjusted);
    showToast(
      weatherAdjusted
        ? 'Roteiro restaurado para dia ensolarado'
        : 'IA reorganizou atividades para espaços cobertos caso chova'
    );
  };

  const handleShortenRoutes = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      showToast('Deslocamentos otimizados: economia de 22 minutos!');
    }, 800);
  };

  const days = [
    { day: 1, label: 'Seg', dNum: 'D1', icon: 'cloud' },
    { day: 2, label: 'Ter', dNum: 'D2', icon: 'sunny' },
    { day: 3, label: 'Hoje', dNum: 'D3', icon: 'sunny' },
    { day: 4, label: 'Qui', dNum: 'D4', icon: 'sunny' },
    { day: 5, label: 'Sex', dNum: 'D5', icon: 'water_drop' },
  ];

  return (
    <div className="w-full max-w-lg mx-auto bg-surface-bright min-h-screen pb-28 pt-3 px-4 sm:px-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-primary text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-sm text-[#53d7ef]">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="flex items-center justify-between py-2 mb-3">
        <button
          onClick={() => onNavigate('explorar')}
          aria-label="Voltar"
          className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>

        <div className="flex flex-col items-center">
          <button className="flex items-center gap-1 font-headline-md text-base sm:text-lg font-extrabold text-primary hover:text-secondary transition-colors">
            <span>Lisboa em 7 Dias</span>
            <span className="material-symbols-outlined text-sm">
              expand_more
            </span>
          </button>
          <div className="flex items-center gap-1.5 text-[11px] text-outline font-semibold">
            <span className="text-secondary font-bold flex items-center gap-0.5">
              <span
                className="material-symbols-outlined text-xs"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
              <span>IA ATIVA</span>
            </span>
            <span>•</span>
            <span>12 a 18 de Outubro</span>
          </div>
        </div>

        <button
          onClick={() => showToast('Link do roteiro copiado para compartilhar!')}
          aria-label="Compartilhar"
          className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-xl">ios_share</span>
        </button>
      </header>

      {/* Weather Condition Banner */}
      <section className="bg-gradient-to-br from-[#eff4ff] to-[#e5eeff] rounded-2xl p-3.5 border border-outline-variant/30 mb-4 shadow-xs">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-lg">
              sunny
            </span>
            <span className="font-bold text-sm text-primary">
              Dia 3 • Ensolarado 22°C
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-primary">
            <span className="flex items-center gap-0.5 bg-white/70 px-2 py-0.5 rounded-full">
              <span className="material-symbols-outlined text-xs">air</span> 12
              km/h
            </span>
            <span className="bg-white/70 px-2 py-0.5 rounded-full">
              UV 4 Moderado
            </span>
          </div>
        </div>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Condições perfeitas para caminhadas ao ar livre em Belém. Baixa
          incidência de vento à beira-rio.
        </p>
      </section>

      {/* CRONOGRAMA Day Selector */}
      <section className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
            CRONOGRAMA
          </span>
          <button
            onClick={() => onNavigate('detalhes')}
            className="text-xs font-bold text-secondary hover:underline flex items-center gap-1"
          >
            <span>Ver mapa do dia</span>
            <span className="material-symbols-outlined text-xs">map</span>
          </button>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {days.map((item) => {
            const isCurrent = selectedDay === item.day;
            return (
              <button
                key={item.day}
                onClick={() => setSelectedDay(item.day)}
                className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition-all ${
                  isCurrent
                    ? 'bg-primary text-white shadow-md scale-[1.02]'
                    : 'bg-surface-container-lowest border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-tight opacity-80">
                  {item.label}
                </span>
                <span className="font-headline-md text-base font-extrabold my-0.5">
                  {item.dNum}
                </span>
                <span
                  className={`material-symbols-outlined text-sm ${
                    isCurrent ? 'text-amber-300' : 'text-outline'
                  }`}
                >
                  {item.icon}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Otimizadores da IA */}
      <section className="mb-5">
        <div className="flex items-center gap-1 text-xs font-bold text-secondary uppercase tracking-wider mb-2">
          <span
            className="material-symbols-outlined text-xs"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
          <span>OTIMIZADORES DA IA</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={handleAdjustWeather}
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap shadow-xs ${
              weatherAdjusted
                ? 'bg-primary text-white'
                : 'bg-surface-container-lowest border border-outline-variant/50 text-primary hover:bg-surface-container'
            }`}
          >
            <span>🌧️</span>
            <span>{weatherAdjusted ? 'Chuva Ativada' : 'Ajustar se chover'}</span>
          </button>
          <button
            onClick={handleShortenRoutes}
            disabled={isOptimizing}
            className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 bg-surface-container-lowest border border-outline-variant/50 text-primary hover:bg-surface-container transition-all whitespace-nowrap shadow-xs"
          >
            <span className="text-amber-500">⚡</span>
            <span>
              {isOptimizing ? 'Otimizando...' : 'Encurtar deslocamentos'}
            </span>
          </button>
        </div>
      </section>

      {/* Roteiro Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-headline-md text-lg font-extrabold text-primary">
          Roteiro de Belém & Tejo
        </h2>
        <span className="bg-surface-container text-primary font-semibold text-[11px] px-2.5 py-1 rounded-full">
          4 Atividades • ~6.5 km
        </span>
      </div>

      {/* Timeline Activities List */}
      <div className="relative pl-6 space-y-5 mb-6">
        {/* Continuous vertical timeline connector line */}
        <div className="absolute left-[11px] top-3 bottom-3 w-[2px] bg-outline-variant/60 border-l border-dashed border-outline-variant"></div>

        {/* Activity 1: Café da manhã na 'Pastéis de Belém' */}
        <article className="relative bg-surface-container-lowest rounded-2xl p-3.5 border border-outline-variant/40 shadow-xs">
          {/* Dot marker */}
          <div className="absolute -left-[29px] top-4 w-3.5 h-3.5 rounded-full bg-[#fd6a49] border-2 border-white shadow-xs"></div>

          <div className="flex items-center justify-between text-xs text-outline font-semibold mb-1">
            <span className="text-secondary font-bold">09:00 • MANHÃ</span>
            <button
              aria-label="Mais opções"
              className="text-outline hover:text-primary"
            >
              <span className="material-symbols-outlined text-base">
                more_vert
              </span>
            </button>
          </div>

          <h3 className="font-bold text-primary text-base mb-2">
            Café da manhã na 'Pastéis de Belém'
          </h3>

          {/* Activity Photo */}
          <div className="relative h-36 rounded-xl overflow-hidden mb-2.5">
            <img
              src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80"
              alt="Pastéis de Belém"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[11px] font-semibold">
              45 min sugeridos
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="bg-surface-container text-primary px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">
                restaurant
              </span>
              <span>Gastronomia</span>
            </span>
            <span className="bg-surface-container-low text-on-surface-variant px-2.5 py-1 rounded-full font-medium">
              Custo: R$ 45
            </span>
          </div>

          <div className="mt-2 text-xs font-semibold text-secondary flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">bolt</span>
            <span>Evite filas antes das 09:30</span>
          </div>
        </article>

        {/* Activity 2: Torre de Belém & Orla do Tejo (Clicking leads to Screen 3!) */}
        <article
          onClick={() => onNavigate('detalhes')}
          className="relative bg-surface-container-lowest rounded-2xl p-3.5 border border-secondary-fixed shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          {/* Dot marker */}
          <div className="absolute -left-[29px] top-4 w-3.5 h-3.5 rounded-full bg-primary border-2 border-white shadow-xs"></div>

          <div className="flex items-center justify-between text-xs text-outline font-semibold mb-1">
            <span className="text-secondary font-bold">10:30 • CAMINHADA</span>
            <button
              aria-label="Mais opções"
              className="text-outline hover:text-primary"
            >
              <span className="material-symbols-outlined text-base">
                more_vert
              </span>
            </button>
          </div>

          <h3 className="font-bold text-primary text-base mb-1.5 group-hover:text-secondary transition-colors flex items-center justify-between">
            <span>Torre de Belém & Orla do Tejo</span>
            <span className="text-xs text-secondary font-bold flex items-center">
              <span>Ver Detalhes</span>
              <span className="material-symbols-outlined text-sm">
                chevron_right
              </span>
            </span>
          </h3>

          <div className="inline-flex items-center gap-1 text-xs text-primary bg-surface-container-low px-2.5 py-1 rounded-full font-medium mb-3">
            <span className="material-symbols-outlined text-xs">
              directions_walk
            </span>
            <span>15 min a pé do café (~1.1 km pela orla)</span>
          </div>

          {/* AI Smart Alert box */}
          <div className="bg-[#FFF0ED] border border-secondary-fixed rounded-xl p-3 mb-3 text-xs text-on-surface">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-secondary text-base shrink-0 mt-0.5">
                notifications_active
              </span>
              <div>
                <span className="font-bold text-secondary block mb-0.5">
                  Alerta Inteligente da IA
                </span>
                <p className="text-on-surface-variant leading-relaxed">
                  Compre ingressos digitais com antecedência para evitar cerca de
                  40 min de fila na bilheteria física.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('detalhes');
              }}
              className="px-2.5 py-1 rounded-lg bg-surface-container text-primary text-xs font-bold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">history</span>
              <span>Histórico</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('detalhes');
              }}
              className="text-xs font-bold text-secondary hover:underline flex items-center gap-1"
            >
              <span>Comprar Ingresso Express</span>
              <span className="material-symbols-outlined text-xs">
                arrow_forward
              </span>
            </button>
          </div>
        </article>

        {/* Activity 3: Almoço no Mercado da Ribeira (Time Out) */}
        <article className="relative bg-surface-container-lowest rounded-2xl p-3.5 border border-outline-variant/40 shadow-xs">
          {/* Dot marker */}
          <div className="absolute -left-[29px] top-4 w-3.5 h-3.5 rounded-full bg-primary border-2 border-white shadow-xs"></div>

          <div className="flex items-center justify-between text-xs text-outline font-semibold mb-1">
            <span className="text-secondary font-bold">13:00 • ALMOÇO</span>
            <button
              aria-label="Mais opções"
              className="text-outline hover:text-primary"
            >
              <span className="material-symbols-outlined text-base">
                more_vert
              </span>
            </button>
          </div>

          <h3 className="font-bold text-primary text-base mb-1.5">
            Almoço no Mercado da Ribeira (Time Out)
          </h3>

          <div className="flex items-center gap-2 text-xs text-outline mb-2">
            <span className="flex items-center gap-0.5 text-secondary font-bold">
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
              <span>4.8</span>
            </span>
            <span>(2.4k avaliações)</span>
            <span>•</span>
            <span className="font-semibold text-primary">Custo médio: R$ 90</span>
          </div>

          <p className="text-xs text-on-surface-variant leading-relaxed mb-3">
            Espaço gastronômico dinâmico reunindo pratos assinados pelos melhores
            chefs portugueses a preços acessíveis.
          </p>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="bg-[#eff4ff] text-primary px-2.5 py-1 rounded-full font-semibold">
              Bacalhau à Brás sugerido
            </span>
            <span className="bg-[#eff4ff] text-primary px-2.5 py-1 rounded-full font-semibold">
              Sobremesa inclusa
            </span>
          </div>
        </article>

        {/* Activity 4: Mosteiro dos Jerónimos */}
        <article className="relative bg-surface-container-lowest rounded-2xl p-3.5 border border-outline-variant/40 shadow-xs">
          {/* Dot marker */}
          <div className="absolute -left-[29px] top-4 w-3.5 h-3.5 rounded-full bg-primary border-2 border-white shadow-xs"></div>

          <div className="flex items-center justify-between text-xs text-outline font-semibold mb-1">
            <span className="text-secondary font-bold">
              15:30 • TARDE CULTURAL
            </span>
            <button
              aria-label="Mais opções"
              className="text-outline hover:text-primary"
            >
              <span className="material-symbols-outlined text-base">
                more_vert
              </span>
            </button>
          </div>

          <h3 className="font-bold text-primary text-base mb-2">
            Mosteiro dos Jerónimos
          </h3>

          <div className="relative h-36 rounded-xl overflow-hidden mb-2.5">
            <img
              src="https://images.unsplash.com/photo-1588614959060-4d144f28b207?auto=format&fit=crop&w=800&q=80"
              alt="Mosteiro dos Jerónimos"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[11px] font-semibold">
              1h30 duração sugerida
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="bg-surface-container text-primary px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">
                account_balance
              </span>
              <span>Patrimônio UNESCO</span>
            </span>
            <span className="text-outline text-[11px]">
              Perto do Padrão dos Descobrimentos
            </span>
          </div>
        </article>
      </div>

      {/* AI Exploration Suggestion Banner */}
      <section className="bg-gradient-to-r from-[#FFF0ED] via-[#F0F7FF] to-[#E6FCF5] rounded-2xl p-3.5 border border-secondary-fixed mb-5 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#fd6a49] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <span className="material-symbols-outlined text-lg">auto_fix_high</span>
          </div>
          <div>
            <h4 className="font-bold text-primary text-xs sm:text-sm">
              Quer explorar a noite lisboeta?
            </h4>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              A IA encontrou 3 casas de fado tradicionais a 10 min do seu hotel.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowFadoTips(!showFadoTips)}
          className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shrink-0 hover:bg-primary-container transition-colors shadow-xs"
        >
          {showFadoTips ? 'Ocultar' : 'Ver Dicas'}
        </button>
      </section>

      {/* Expanded Fado Tips if toggled */}
      {showFadoTips && (
        <div className="bg-surface-container-lowest rounded-2xl p-3 border border-outline-variant/40 mb-5 space-y-2 text-xs">
          <div className="font-bold text-primary">
            Casas de Fado selecionadas pelo seu perfil:
          </div>
          <div className="p-2 rounded-xl bg-surface-container-low flex justify-between items-center">
            <div>
              <p className="font-bold text-primary">Clube de Fado (Alfama)</p>
              <p className="text-[11px] text-outline">Ambiente autêntico sob abóbadas históricas</p>
            </div>
            <span className="text-secondary font-bold">Reserva online</span>
          </div>
          <div className="p-2 rounded-xl bg-surface-container-low flex justify-between items-center">
            <div>
              <p className="font-bold text-primary">Tasca do Chico (Bairro Alto)</p>
              <p className="text-[11px] text-outline">Fado vadio intimista com petiscos</p>
            </div>
            <span className="text-secondary font-bold">Chegar cedo</span>
          </div>
        </div>
      )}

      {/* Action Buttons Pair */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => showToast('Tarde recalculada com novas atrações')}
          className="h-12 rounded-2xl bg-surface-container text-primary font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-outline-variant/40 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          <span>Regenerar tarde</span>
        </button>
        <button
          onClick={() => {
            if (onAddActivity) onAddActivity();
            else showToast('Modal para adicionar atividade aberto');
          }}
          className="h-12 rounded-2xl bg-[#fd6a49] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-[0_4px_16px_rgba(253,106,73,0.30)] active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          <span>Adicionar atividade</span>
        </button>
      </div>
    </div>
  );
};
