import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { getUserProfile, updateUserPreferences } from '../services/firestoreService';
import { ScreenType } from '../types';
import { USER_PROFILE } from '../data/mockData';

interface ScreenPerfilProps {
  onNavigate: (screen: ScreenType) => void;
  onLogout: () => void;
}

export const ScreenPerfil: React.FC<ScreenPerfilProps> = ({
  onNavigate,
  onLogout,
}) => {
  const { user, updateUserPreferencesInContext } = useAuthContext();
  const sessionUserId = user?.uid;

  const [offlineSync, setOfflineSync] = useState(true);
  const [currency, setCurrency] = useState('BRL (R$)');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Preference Form State
  const [activeStyles, setActiveStyles] = useState<string[]>(
    user?.preferences?.styles || USER_PROFILE.travelDNA.styles
  );
  const [selectedBudget, setSelectedBudget] = useState<string>(
    user?.preferences?.budget || 'moderado'
  );
  const [selectedPace, setSelectedPace] = useState<string>(
    user?.preferences?.pace || 'tranquilo'
  );
  const [selectedTransport, setSelectedTransport] = useState<string>(
    user?.preferences?.transport || 'Avião'
  );
  const [selectedClimate, setSelectedClimate] = useState<string>(
    user?.preferences?.preferredClimate || 'Temperado'
  );
  const [selectedDistance, setSelectedDistance] = useState<string>(
    user?.preferences?.maxDistance || 'Internacional'
  );

  const availableStyles = [
    { id: 'Gastronomia', icon: 'restaurant' },
    { id: 'História', icon: 'account_balance' },
    { id: 'Fotografia', icon: 'photo_camera' },
    { id: 'Ritmo Relaxado', icon: 'self_improvement' },
    { id: 'Cidades a pé', icon: 'directions_walk' },
    { id: 'Ecoturismo', icon: 'forest' },
    { id: 'Aventura', icon: 'hiking' },
    { id: 'Praias', icon: 'beach_access' },
    { id: 'Compras', icon: 'shopping_bag' },
  ];

  // Carregar preferências do Firestore no mount ou quando o usuário mudar
  useEffect(() => {
    const fetchUserDoc = async () => {
      if (!sessionUserId) return;
      setIsLoadingProfile(true);
      try {
        const docData = await getUserProfile(sessionUserId);
        if (docData && docData.preferences) {
          if (docData.preferences.styles) setActiveStyles(docData.preferences.styles);
          if (docData.preferences.budget) setSelectedBudget(docData.preferences.budget);
          if (docData.preferences.pace) setSelectedPace(docData.preferences.pace);
          if (docData.preferences.transport) setSelectedTransport(docData.preferences.transport);
          if (docData.preferences.preferredClimate) setSelectedClimate(docData.preferences.preferredClimate);
          if (docData.preferences.maxDistance) setSelectedDistance(docData.preferences.maxDistance);
        }
      } catch (err) {
        console.warn('[ScreenPerfil] Não foi possível carregar do Firestore, usando fallback:', err);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchUserDoc();
  }, [sessionUserId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toggleStyle = (style: string) => {
    setErrorMessage(null);
    setActiveStyles((prev) => {
      if (prev.includes(style)) {
        return prev.filter((s) => s !== style);
      } else {
        if (prev.length >= 5) {
          setErrorMessage('Escolha no máximo 5 interesses de viagem.');
          return prev;
        }
        return [...prev, style];
      }
    });
  };

  // Salvar/Recalibrar Preferências no Firestore usando Session Identity
  const handleSavePreferences = async () => {
    setErrorMessage(null);

    if (!sessionUserId) {
      setErrorMessage('Identidade da sessão ausente. Faça login novamente.');
      return;
    }

    if (activeStyles.length === 0) {
      setErrorMessage('Selecione pelo menos 1 interesse de viagem.');
      return;
    }

    if (activeStyles.length > 5) {
      setErrorMessage('Escolha no máximo 5 interesses de viagem.');
      return;
    }

    setIsSaving(true);
    const updatedPref = {
      styles: activeStyles,
      budget: selectedBudget,
      pace: selectedPace,
      transport: selectedTransport,
      preferredClimate: selectedClimate,
      maxDistance: selectedDistance,
    };

    try {
      await updateUserPreferences(sessionUserId, updatedPref);
      updateUserPreferencesInContext(updatedPref);
      showToast('DNA de viagem e preferências salvas com sucesso!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar preferências.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-surface-bright min-h-screen pb-28 pt-3 px-4 sm:px-5 text-left">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-sm text-emerald-300">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 font-bold">✕</button>
        </div>
      )}

      {/* Top Header */}
      <header className="flex items-center justify-between py-2 mb-3">
        <button
          onClick={() => onNavigate('explorar')}
          aria-label="Voltar"
          className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>

        <h1 className="font-headline-md text-base sm:text-lg font-extrabold text-primary">
          Meu Perfil & Preferências
        </h1>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => showToast('Perfil compartilhado!')}
            aria-label="Compartilhar"
            className="w-9 h-9 rounded-full bg-surface-container-low flex items-center justify-center text-primary active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-lg">share</span>
          </button>
        </div>
      </header>

      {/* Profile Card */}
      <section className="bg-surface-container-lowest rounded-3xl p-4 border border-outline-variant/30 shadow-xs mb-5">
        <div className="flex items-start gap-3.5 mb-3.5">
          <div className="relative shrink-0">
            <img
              src={user?.photoURL || USER_PROFILE.avatar}
              alt={user?.displayName || USER_PROFILE.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-surface-container-high shadow-xs"
            />
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap shadow-xs">
              {user?.role === 'admin' ? 'ADMIN' : USER_PROFILE.level}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="font-headline-md text-base sm:text-lg font-extrabold text-primary truncate">
                {user?.displayName || USER_PROFILE.name}
              </h2>
              <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                SESSÃO VERIFICADA
              </span>
            </div>
            <p className="text-xs text-outline truncate mb-1">
              {user?.email || USER_PROFILE.email}
            </p>
            <p className="text-[11px] text-slate-400 font-mono">
              UID: {sessionUserId ? sessionUserId : 'Demonstração'}
            </p>
          </div>
        </div>
      </section>

      {/* DNA de Viagem IA & Preferências */}
      <section className="bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/30 shadow-xs mb-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-400 text-xl">
              psychology
            </span>
            <h3 className="font-bold text-primary text-base">
              Preferências de Viagem & DNA IA
            </h3>
          </div>
          {isLoadingProfile ? (
            <span className="text-xs text-slate-400 animate-pulse">Carregando...</span>
          ) : (
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              Sincronizado Firestore
            </span>
          )}
        </div>

        {/* 1. Seleção Múltipla de Interesses (1 a 5) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-primary">
              Interesses de Viagem (Seleção Múltipla: 1 a 5) *
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              {activeStyles.length}/5 Selecionados
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {availableStyles.map((item) => {
              const isSelected = activeStyles.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleStyle(item.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md border border-indigo-400'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {item.icon}
                  </span>
                  <span>{item.id}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Orçamento e Ritmo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <div>
            <label className="block font-bold text-slate-300 mb-1">Orçamento Preferido</label>
            <select
              value={selectedBudget}
              onChange={(e) => setSelectedBudget(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="econômico">Mochileiro / Econômico (R$)</option>
              <option value="moderado">Moderado / Confortável (R$$)</option>
              <option value="luxo">Luxo / Premium (R$$$)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">Ritmo de Viagem</label>
            <select
              value={selectedPace}
              onChange={(e) => setSelectedPace(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="tranquilo">Tranquilo (Sem pressa)</option>
              <option value="moderado">Equilibrado (Passeios + Descanso)</option>
              <option value="intenso">Intenso (Aproveitar cada minuto)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">Transporte Preferencial</label>
            <select
              value={selectedTransport}
              onChange={(e) => setSelectedTransport(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="Avião">Voos & Avião</option>
              <option value="Carro">Carro / Road Trip</option>
              <option value="Trem">Trem & Transporte Público</option>
              <option value="Caminhada">Caminhadas & Bike</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">Clima Preferido</label>
            <select
              value={selectedClimate}
              onChange={(e) => setSelectedClimate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="Ensolarado">Ensolarado & Quente</option>
              <option value="Temperado">Temperado & Agradável</option>
              <option value="Frio">Frio & Neve</option>
            </select>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleSavePreferences}
          disabled={isSaving}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {isSaving ? (
            <span>Salvando no Firestore...</span>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">save</span>
              <span>Salvar Preferências no Perfil</span>
            </>
          )}
        </button>
      </section>

      {/* Logout Button */}
      <section className="bg-surface-container-lowest rounded-3xl p-4 border border-outline-variant/30 shadow-xs mb-5">
        <div className="flex items-center justify-between">
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-rose-400 font-bold text-xs sm:text-sm hover:underline"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            <span>Encerrar Sessão</span>
          </button>
          <span className="text-[11px] text-slate-400 font-mono">SmartTrip v2.4.1</span>
        </div>
      </section>
    </div>
  );
};
