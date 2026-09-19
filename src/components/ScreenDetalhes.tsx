import React, { useState } from 'react';
import { ScreenType } from '../types';
import { TORRE_BELEM_DETAILS } from '../data/mockData';

interface ScreenDetalhesProps {
  onNavigate: (screen: ScreenType) => void;
}

export const ScreenDetalhes: React.FC<ScreenDetalhesProps> = ({ onNavigate }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [addedToItinerary, setAddedToItinerary] = useState(false);
  const [likes, setLikes] = useState<{ [id: string]: number }>({
    'rev-1': 48,
    'rev-2': 19,
  });
  const [hasLiked, setHasLiked] = useState<{ [id: string]: boolean }>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleLike = (revId: string) => {
    setLikes((prev) => ({
      ...prev,
      [revId]: hasLiked[revId] ? prev[revId] - 1 : prev[revId] + 1,
    }));
    setHasLiked((prev) => ({
      ...prev,
      [revId]: !prev[revId],
    }));
  };

  const handleAddToItinerary = () => {
    setAddedToItinerary(true);
    showToast(`Torre de Belém adicionada ao Dia ${selectedDay}!`);
    setTimeout(() => {
      setAddedToItinerary(false);
    }, 2500);
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-surface-bright min-h-screen relative shadow-2xl overflow-hidden pb-32">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-primary text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-sm text-[#53d7ef]">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Image Header with Immersive Controls */}
      <header className="relative w-full h-80 sm:h-96">
        <img
          className="w-full h-full object-cover"
          alt="Torre de Belém em Lisboa banhada pela luz matinal no Rio Tejo"
          src={TORRE_BELEM_DETAILS.heroImage}
        />

        {/* Gradient Scrim for Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-primary/40 pointer-events-none"></div>

        {/* Floating Header Action Bar */}
        <div className="absolute top-4 left-0 right-0 px-5 flex items-center justify-between z-20">
          {/* Back Button */}
          <button
            aria-label="Voltar"
            onClick={() => onNavigate('roteiro')}
            className="w-11 h-11 rounded-full bg-surface-container-lowest/85 backdrop-blur-md shadow-md flex items-center justify-center text-primary active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>

          {/* Right Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              aria-label="Salvar nos favoritos"
              id="favorite-btn"
              onClick={() => {
                setIsBookmarked(!isBookmarked);
                showToast(
                  !isBookmarked
                    ? 'Adicionado aos seus favoritos!'
                    : 'Removido dos favoritos.'
                );
              }}
              className="w-11 h-11 rounded-full bg-surface-container-lowest/85 backdrop-blur-md shadow-md flex items-center justify-center text-on-surface active:scale-95 transition-transform"
            >
              <span
                className={`material-symbols-outlined transition-colors text-xl ${
                  isBookmarked ? 'text-secondary' : 'text-primary'
                }`}
                style={{
                  fontVariationSettings: isBookmarked
                    ? "'FILL' 1"
                    : "'FILL' 0",
                }}
              >
                bookmark
              </span>
            </button>

            <button
              aria-label="Compartilhar"
              onClick={() =>
                showToast('Link da Torre de Belém copiado!')
              }
              className="w-11 h-11 rounded-full bg-surface-container-lowest/85 backdrop-blur-md shadow-md flex items-center justify-center text-primary active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-xl">share</span>
            </button>
          </div>
        </div>

        {/* Image Pagination/Count Pill */}
        <div className="absolute bottom-4 right-5 z-10 bg-inverse-surface/75 text-inverse-on-surface backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-xs">
          <span className="material-symbols-outlined text-sm">photo_camera</span>
          <span>1/18 fotos</span>
        </div>
      </header>

      {/* Main Content Canvas */}
      <div className="px-5 -mt-6 relative z-10">
        {/* Primary Card: Title, Status & Rating */}
        <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_8px_24px_-4px_rgba(26,54,93,0.06),0_2px_6px_-1px_rgba(26,54,93,0.03)] border border-outline-variant/30">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="bg-surface-container text-primary text-xs px-2.5 py-1 rounded-full font-bold">
              {TORRE_BELEM_DETAILS.category}
            </span>
            <div className="flex items-center gap-1.5 bg-[#E6FCF5] text-[#0C8599] px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#0C8599] animate-pulse"></span>
              <span className="text-[11px] font-bold">
                {TORRE_BELEM_DETAILS.status}
              </span>
            </div>
          </div>

          <h1 className="font-headline-lg text-2xl sm:text-28 text-primary font-extrabold tracking-tight">
            {TORRE_BELEM_DETAILS.name}
          </h1>

          {/* Rating & Neighborhood */}
          <div className="flex items-center gap-2 mt-2 text-on-surface-variant flex-wrap text-sm">
            <div className="flex items-center gap-1 text-secondary">
              <span
                className="material-symbols-outlined text-base"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
              <span className="font-bold text-on-surface">
                {TORRE_BELEM_DETAILS.rating}
              </span>
            </div>
            <span className="text-outline">
              ({TORRE_BELEM_DETAILS.reviewsCount})
            </span>
            <span className="text-outline">•</span>
            <span className="text-on-surface-variant">
              {TORRE_BELEM_DETAILS.location}
            </span>
          </div>
        </section>

        {/* AI SmartTrip Insights Highlight (Bento Hero Feature) */}
        <section className="mt-4 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FFF5F2] via-surface-container-lowest to-[#F0F7FF] p-4 border border-secondary-container/30 shadow-[0_0_24px_0_rgba(255,107,74,0.14)]">
          {/* Floating Accent Glow */}
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-secondary-container/20 rounded-full blur-2xl pointer-events-none"></div>

          {/* Section Header */}
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-secondary-container text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-lg">
                  auto_awesome
                </span>
              </div>
              <div>
                <h2 className="text-sm font-bold text-primary">
                  Insights da IA SmartTrip
                </h2>
                <p className="text-[11px] text-on-surface-variant">
                  Otimizado para o seu perfil e horário
                </p>
              </div>
            </div>
            <span className="bg-[#FFF0ED] text-secondary px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">
              Tempo Real
            </span>
          </div>

          {/* Bento Grid for AI Data */}
          <div className="grid grid-cols-2 gap-2.5 mt-3.5">
            {/* Best Time Slot */}
            <div className="bg-surface-container-lowest/80 backdrop-blur-sm p-3 rounded-xl border border-outline-variant/20 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-secondary">
                <span className="material-symbols-outlined text-base">
                  schedule
                </span>
                <span className="text-[10px] text-outline uppercase tracking-wider font-bold">
                  Melhor Horário
                </span>
              </div>
              <div className="mt-2">
                <p className="text-sm font-extrabold text-primary">
                  {TORRE_BELEM_DETAILS.bestTime}
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {TORRE_BELEM_DETAILS.bestTimeDesc}
                </p>
              </div>
            </div>

            {/* Weather Projection */}
            <div className="bg-surface-container-lowest/80 backdrop-blur-sm p-3 rounded-xl border border-outline-variant/20 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-[#0C8599]">
                <span className="material-symbols-outlined text-base">sunny</span>
                <span className="text-[10px] text-outline uppercase tracking-wider font-bold">
                  Tempo Previsto
                </span>
              </div>
              <div className="mt-2">
                <p className="text-sm font-extrabold text-primary">
                  {TORRE_BELEM_DETAILS.weatherForecast}
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {TORRE_BELEM_DETAILS.weatherDesc}
                </p>
              </div>
            </div>

            {/* Cost Estimate */}
            <div className="col-span-2 bg-surface-container-lowest/80 backdrop-blur-sm p-3 rounded-xl border border-outline-variant/20 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-lg">
                    payments
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-outline uppercase font-bold">
                    Estimativa de Custo
                  </p>
                  <p className="text-xs sm:text-sm text-primary font-bold">
                    €9.00{' '}
                    <span className="text-xs text-on-surface-variant font-normal">
                      (~R$ 55) por pessoa
                    </span>
                  </p>
                </div>
              </div>
              <span className="bg-surface-container-low text-primary text-xs font-semibold px-2 py-1 rounded-lg">
                {TORRE_BELEM_DETAILS.costType}
              </span>
            </div>

            {/* Secret Tip Card */}
            <div className="col-span-2 bg-gradient-to-r from-[#FFF0ED] to-[#FFE5DF] p-3.5 rounded-xl border border-secondary-fixed flex items-start gap-3">
              <span className="material-symbols-outlined text-secondary text-xl shrink-0 mt-0.5">
                tips_and_updates
              </span>
              <div>
                <span className="text-[10px] text-secondary uppercase font-extrabold tracking-wider">
                  Dica Secreta do Algoritmo
                </span>
                <p className="text-xs sm:text-sm text-primary font-medium mt-0.5 leading-relaxed">
                  {TORRE_BELEM_DETAILS.secretTip}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Practical Information & Contextual Map */}
        <section className="mt-4 bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 shadow-xs">
          <h2 className="text-base font-bold text-primary mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">
              place
            </span>
            <span>Localização e Acesso</span>
          </h2>

          {/* Interactive Static Mini Map Container */}
          <div className="relative w-full h-44 rounded-xl overflow-hidden border border-outline-variant/40 group">
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              alt="Mapa de Belém e localização da Torre de Belém"
              src={TORRE_BELEM_DETAILS.mapImage}
            />

            {/* Map Overlay Details */}
            <div className="absolute inset-0 bg-primary/10 pointer-events-none"></div>

            {/* Landmark Pin Marker */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="bg-secondary text-white px-2 py-1 rounded-lg text-xs font-bold shadow-lg flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">castle</span>
                <span>Torre</span>
              </div>
              <div className="w-3 h-3 bg-secondary rotate-45 -mt-1.5 rounded-xs"></div>
            </div>

            {/* Walk distance badge overlay */}
            <div className="absolute bottom-2.5 left-2.5 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-2 border border-outline-variant/30">
              <span className="material-symbols-outlined text-secondary text-base">
                directions_walk
              </span>
              <span className="text-xs text-primary font-bold">
                {TORRE_BELEM_DETAILS.walkDistance}
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-on-surface-variant mt-3 flex items-start gap-2">
            <span className="material-symbols-outlined text-outline text-base mt-0.5 shrink-0">
              location_on
            </span>
            <span>{TORRE_BELEM_DETAILS.address}</span>
          </p>

          {/* Peak Hours and Duration Cards */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-outline-variant/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-lg">timer</span>
              </div>
              <div>
                <p className="text-[11px] text-outline">Duração média</p>
                <p className="text-sm text-primary font-bold">
                  {TORRE_BELEM_DETAILS.averageDuration}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-lg">bar_chart</span>
              </div>
              <div>
                <p className="text-[11px] text-outline">Pico de lotação</p>
                <p className="text-sm text-primary font-bold">
                  {TORRE_BELEM_DETAILS.peakHours}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Community Reviews & Traveler Highlights */}
        <section className="mt-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">
                forum
              </span>
              <span>Dicas da Comunidade</span>
            </h2>
            <button
              onClick={() => showToast('Exibindo todas as 342 avaliações')}
              className="text-xs text-secondary hover:underline font-bold"
            >
              Ver todas (342)
            </button>
          </div>

          {/* Review Cards Stack */}
          <div className="space-y-3">
            {TORRE_BELEM_DETAILS.reviews.map((rev) => (
              <article
                key={rev.id}
                className="bg-surface-container-lowest rounded-xl p-3.5 border border-outline-variant/30 shadow-xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs">
                      {rev.avatarInitials}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-primary">
                        {rev.author}
                      </h3>
                      <p className="text-[11px] text-outline">{rev.badge}</p>
                    </div>
                  </div>

                  <div className="flex text-secondary text-sm">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={`material-symbols-outlined text-xs ${
                          i < rev.stars ? 'text-secondary' : 'text-outline-variant'
                        }`}
                        style={{
                          fontVariationSettings:
                            i < rev.stars ? "'FILL' 1" : "'FILL' 0",
                        }}
                      >
                        star
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-on-surface-variant leading-relaxed">
                  "{rev.comment}"
                </p>

                <div className="mt-2.5 flex items-center gap-4 text-outline text-[11px]">
                  <button
                    onClick={() => handleToggleLike(rev.id)}
                    className={`flex items-center gap-1 hover:text-primary transition-colors ${
                      hasLiked[rev.id] ? 'text-secondary font-bold' : ''
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-sm"
                      style={{
                        fontVariationSettings: hasLiked[rev.id]
                          ? "'FILL' 1"
                          : "'FILL' 0",
                      }}
                    >
                      thumb_up
                    </span>
                    <span>{likes[rev.id]} acharam útil</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Quick Action Box: Day Selector & Itinerary CTA */}
        <section
          aria-label="Ações Rápidas"
          className="mt-6 mb-8 bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 shadow-sm"
        >
          {/* Quick Day Selector Strip */}
          <div className="flex items-center justify-between gap-2 px-1 mb-3">
            <span className="text-[11px] text-outline uppercase tracking-wider font-bold">
              Adicionar ao Dia:
            </span>
            <div className="flex items-center gap-1.5" id="day-selector">
              {[1, 2, 3].map((dayNum) => (
                <button
                  key={dayNum}
                  onClick={() => setSelectedDay(dayNum)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    selectedDay === dayNum
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  Dia {dayNum}
                </button>
              ))}
            </div>
          </div>

          {/* Main Action Buttons Duo */}
          <div className="grid grid-cols-5 gap-2.5">
            {/* Secondary Button: Ver Mapa */}
            <button
              onClick={() => showToast('Abrindo mapa interativo da região de Belém')}
              className="col-span-2 h-12 rounded-xl bg-surface-container text-primary font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-transform border border-outline-variant/40 hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-lg">map</span>
              <span>Ver Mapa</span>
            </button>

            {/* Primary CTA: Adicionar ao Meu Roteiro */}
            <button
              onClick={handleAddToItinerary}
              className={`col-span-3 h-12 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(253,106,73,0.35)] active:scale-95 transition-all ${
                addedToItinerary
                  ? 'bg-primary'
                  : 'bg-secondary-container hover:bg-secondary'
              }`}
            >
              <span className="material-symbols-outlined text-lg">
                {addedToItinerary ? 'check_circle' : 'add_circle'}
              </span>
              <span>
                {addedToItinerary
                  ? 'Adicionado ao Roteiro!'
                  : 'Adicionar ao Roteiro'}
              </span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
