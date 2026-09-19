import { useState, useEffect } from 'react';
import { ScreenType } from './types';
import { useAuth } from './hooks/useAuth';
import { ScreenLanding } from './components/ScreenLanding';
import { ScreenLogin } from './components/ScreenLogin';
import { ScreenRegister } from './components/ScreenRegister';
import { ScreenHub } from './components/ScreenHub';
import { ScreenPerfil } from './components/ScreenPerfil';
import { ScreenAvailability } from './components/ScreenAvailability';
import { ScreenExplorar } from './components/ScreenExplorar';
import { ScreenTrips } from './components/ScreenTrips';
import { ScreenTripDetails } from './components/ScreenTripDetails';
import { ScreenDetalhes } from './components/ScreenDetalhes';
import { BottomNavigation } from './components/Navigation';
import { ModalGerarRoteiro } from './components/ModalGerarRoteiro';
import { ModalConvidar } from './components/ModalConvidar';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('landing');
  const [isGeneratingModalOpen, setIsGeneratingModalOpen] = useState(false);
  const [generationDestination, setGenerationDestination] = useState('Lisboa & Porto, Portugal');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { isAuthenticated, user, logout, loginStub } = useAuth();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const privateScreens: ScreenType[] = [
    'dashboard', 'profile', 'availability', 'explore', 'trips', 'trip-details',
    'explorar', 'roteiro', 'detalhes', 'hub', 'perfil'
  ];

  // Route Guard Enforcement
  const handleNavigate = (targetScreen: ScreenType) => {
    if (privateScreens.includes(targetScreen) && !isAuthenticated) {
      showToast('Acesso restrito. Por favor, faça login para acessar.');
      setCurrentScreen('login');
      return;
    }
    setCurrentScreen(targetScreen);
  };

  useEffect(() => {
    if (privateScreens.includes(currentScreen) && !isAuthenticated) {
      setCurrentScreen('login');
    }
  }, [isAuthenticated, currentScreen]);

  const handleOpenGeneration = (destination: string) => {
    setGenerationDestination(destination);
    setIsGeneratingModalOpen(true);
  };

  const handleSelectGeneratedOption = (optionTitle: string) => {
    setIsGeneratingModalOpen(false);
    showToast(`Roteiro ativado: ${optionTitle}`);
    handleNavigate('trip-details');
  };

  const handleInviteSuccess = (email: string) => {
    showToast(`Convite enviado com sucesso para ${email}!`);
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'landing':
        return <ScreenLanding onNavigate={handleNavigate} />;
      case 'login':
        return (
          <ScreenLogin
            onNavigate={handleNavigate}
            onLoginSuccess={() => showToast('Login realizado com sucesso! Bem-vindo de volta.')}
          />
        );
      case 'register':
        return (
          <ScreenRegister
            onNavigate={handleNavigate}
            onRegisterSuccess={() => showToast('Conta criada com sucesso! Configure seu perfil.')}
          />
        );
      case 'dashboard':
      case 'hub':
        return (
          <ScreenHub
            onNavigate={handleNavigate}
            onOpenInviteModal={() => setIsInviteModalOpen(true)}
          />
        );
      case 'profile':
      case 'perfil':
        return (
          <ScreenPerfil
            onNavigate={handleNavigate}
            onLogout={async () => {
              await logout();
              showToast('Sessão encerrada.');
              handleNavigate('login');
            }}
          />
        );
      case 'availability':
        return <ScreenAvailability onNavigate={handleNavigate} />;
      case 'explore':
      case 'explorar':
        return (
          <ScreenExplorar
            onNavigate={handleNavigate}
            onOpenGenerationModal={handleOpenGeneration}
          />
        );
      case 'trips':
        return (
          <ScreenTrips
            onNavigate={handleNavigate}
            onOpenTripDetails={() => handleNavigate('trip-details')}
          />
        );
      case 'trip-details':
      case 'roteiro':
        return <ScreenTripDetails onNavigate={handleNavigate} onShowToast={showToast} />;
      case 'detalhes':
        return <ScreenDetalhes onNavigate={handleNavigate} />;
      default:
        return <ScreenLanding onNavigate={handleNavigate} />;
    }
  };

  const routesList: { id: ScreenType; label: string; isPrivate: boolean }[] = [
    { id: 'landing', label: '/', isPrivate: false },
    { id: 'login', label: '/login', isPrivate: false },
    { id: 'register', label: '/register', isPrivate: false },
    { id: 'dashboard', label: '/dashboard 🔒', isPrivate: true },
    { id: 'profile', label: '/profile 🔒', isPrivate: true },
    { id: 'availability', label: '/availability 🔒', isPrivate: true },
    { id: 'explore', label: '/explore 🔒', isPrivate: true },
    { id: 'trips', label: '/trips 🔒', isPrivate: true },
    { id: 'trip-details', label: '/trips/[id] 🔒', isPrivate: true },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Dev Route Navigation & Auth Status Bar */}
      <div className="bg-slate-900 border-b border-slate-800 py-1.5 px-3 flex flex-wrap items-center justify-between text-[11px] gap-2 z-50">
        <div className="flex items-center gap-2 font-mono text-slate-400">
          <span className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span className="font-bold text-white">
            {isAuthenticated ? `Logado: ${user?.displayName || user?.email}` : 'Visitante (Deslogado)'}
          </span>
          {isAuthenticated ? (
            <button
              onClick={() => logout()}
              className="text-rose-400 hover:underline text-[10px] ml-1 font-bold"
            >
              [Logout]
            </button>
          ) : (
            <button
              onClick={() => {
                loginStub();
                showToast('Sessão simulada ativada!');
              }}
              className="text-emerald-400 hover:underline text-[10px] ml-1 font-bold"
            >
              [Simular Login]
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {routesList.map((r) => (
            <button
              key={r.id}
              onClick={() => handleNavigate(r.id)}
              className={`px-2.5 py-1 rounded-md transition-all font-mono whitespace-nowrap ${
                currentScreen === r.id ||
                (r.id === 'dashboard' && currentScreen === 'hub') ||
                (r.id === 'explore' && currentScreen === 'explorar') ||
                (r.id === 'profile' && currentScreen === 'perfil') ||
                (r.id === 'trip-details' && (currentScreen === 'roteiro' || currentScreen === 'detalhes'))
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-indigo-500/40 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="text-emerald-400 text-sm">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Screen Render */}
      <main className="flex-1 w-full relative">
        {renderCurrentScreen()}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
      />

      {/* Modals */}
      <ModalGerarRoteiro
        isOpen={isGeneratingModalOpen}
        destination={generationDestination}
        onClose={() => setIsGeneratingModalOpen(false)}
        onSelectOption={handleSelectGeneratedOption}
      />

      <ModalConvidar
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={handleInviteSuccess}
      />
    </div>
  );
}
