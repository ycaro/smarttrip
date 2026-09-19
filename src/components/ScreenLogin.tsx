import React, { useState } from 'react';
import { ScreenType } from '../types';
import { useAuth } from '../hooks/useAuth';
import { getAuthErrorMessage } from '../services/authService';

interface ScreenLoginProps {
  onNavigate: (screen: ScreenType) => void;
  onLoginSuccess: () => void;
}

export const ScreenLogin: React.FC<ScreenLoginProps> = ({
  onNavigate,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('marcelo.costa@smarttrip.ai');
  const [password, setPassword] = useState('viajante123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { login, loginGoogle, forgotPassword, isLoading } = useAuth();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await login(email, password);
      onLoginSuccess();
      onNavigate('dashboard');
    } catch (err: any) {
      setErrorMessage(getAuthErrorMessage(err));
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    try {
      await loginGoogle();
      onLoginSuccess();
      onNavigate('dashboard');
    } catch (err: any) {
      setErrorMessage(getAuthErrorMessage(err));
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMessage('Digite seu e-mail para receber as instruções de recuperação.');
      return;
    }
    try {
      await forgotPassword(email);
      showToast('Instruções de redefinição enviadas para seu e-mail!');
    } catch (err: any) {
      setErrorMessage(getAuthErrorMessage(err));
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-5 pt-8 pb-10 flex flex-col justify-between min-h-screen relative text-left">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 border border-indigo-500/40">
          <span className="text-emerald-400 font-bold">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col items-center text-center">
        <div className="flex items-center justify-between w-full mb-6">
          <button
            aria-label="Voltar"
            onClick={() => onNavigate('landing')}
            className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors p-2 -ml-2 rounded-full"
          >
            ← Voltar
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            ✨ Planejamento Inteligente
          </div>
          <div className="w-8"></div>
        </div>

        {/* Brand Identity */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 font-bold text-lg">
            ST
          </div>
          <span className="text-2xl font-extrabold text-white tracking-tight">
            SmartTrip
          </span>
        </div>

        <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">
          Sua próxima jornada começa aqui
        </h1>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          Acesse sua conta para sincronizar roteiros, recomendações da IA e preferências.
        </p>
      </header>

      {/* Form Area */}
      <div className="mt-6 flex-1 flex flex-col">
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Social Quick Logins */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-[50px] px-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center gap-3 hover:bg-slate-800 transition-all text-xs font-bold text-white shadow-sm"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.8 5 12 5z" fill="#EA4335" />
              <path d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" fill="#4285F4" />
              <path d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z" fill="#FBBC05" />
              <path d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.4-6.7-5.3L1.6 16c1.9 3.8 5.8 7 10.4 7z" fill="#34A853" />
            </svg>
            <span>Continuar com Google</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center my-6">
          <div className="w-full border-t border-slate-800"></div>
          <span className="absolute bg-slate-950 px-3 text-[11px] text-slate-500 tracking-wider uppercase font-semibold">
            ou acesse com e-mail
          </span>
        </div>

        {/* Credentials Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs text-slate-300 mb-1 font-bold" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com"
              className="w-full h-[48px] px-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-slate-300 font-bold" htmlFor="password">
                Senha
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-indigo-400 hover:underline font-medium"
              >
                Esqueci minha senha
              </button>
            </div>
            <div className="relative flex items-center">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-[48px] pl-4 pr-12 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-1 text-slate-400 hover:text-white text-xs"
              >
                {showPassword ? 'Ocultar' : 'Exibir'}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[48px] rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Entrando...' : 'Entrar no SmartTrip'}
            </button>
          </div>
        </form>

        <div className="mt-5 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-left">
          <p className="text-xs font-bold text-white">🔒 Segurança & Privacidade</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Sua identidade é autenticada com segurança via Firebase Auth. Senhas e tokens jamais são expostos.
          </p>
        </div>
      </div>

      <footer className="mt-8 text-center space-y-3">
        <p className="text-xs text-slate-400">
          Não tem uma conta?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="font-bold text-indigo-400 hover:underline"
          >
            Cadastre-se grátis
          </button>
        </p>
      </footer>
    </div>
  );
};
