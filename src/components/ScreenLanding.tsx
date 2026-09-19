import React from 'react';
import { ScreenType } from '../types';

interface ScreenLandingProps {
  onNavigate: (screen: ScreenType) => void;
}

export const ScreenLanding: React.FC<ScreenLandingProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 md:p-12 relative overflow-hidden">
      {/* Glow background effects */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="flex justify-between items-center z-10 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
            ST
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            SmartTrip
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('login')}
            className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Entrar
          </button>
          <button
            onClick={() => onNavigate('register')}
            className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]"
          >
            Cadastrar
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="z-10 max-w-6xl mx-auto w-full my-auto py-12 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Assistente Pessoal com Google Gemini AI
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Seu Roteiro de Viagem Perfeito em <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Segundos</span>
          </h1>
          <p className="text-slate-400 text-base md:text-lg leading-relaxed">
            Consolide períodos de folga, previsão do tempo, pontos de interesse e suas preferências em um itinerário inteligente ajustado à sua medida.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              onClick={() => onNavigate('register')}
              className="px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-xl shadow-indigo-500/30 transition-all hover:scale-[1.02] text-center"
            >
              Criar Roteiro Grátis
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-8 py-4 rounded-xl font-semibold bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 transition-colors text-center"
            >
              Explorar Demo
            </button>
          </div>
        </div>

        {/* Interactive Feature Card Preview */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>
            <span className="text-xs font-mono text-slate-500">gemini-3.6-flash</span>
          </div>

          <div className="mt-6 space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-left">
              <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold mb-1">
                <span>Roteiro Inteligente • Lisboa (5 Dias)</span>
                <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Clima: 22°C Ensolarado</span>
              </div>
              <p className="text-sm text-slate-200 font-medium">Dia 3: Belém & Orla do Tejo</p>
            </div>

            <div className="space-y-2 text-left">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">09:00 • Gastronomia</p>
                  <p className="text-sm font-semibold text-white">Pastéis de Belém</p>
                </div>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-lg">IA Recomendado</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">10:30 • Histórico</p>
                  <p className="text-sm font-semibold text-white">Torre de Belém & Orla</p>
                </div>
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-lg">Revisado pelo Usuário</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="z-10 text-center text-xs text-slate-500 py-4 border-t border-slate-900">
        © 2026 SmartTrip. Projeto Final de Curso de IA Generativa.
      </footer>
    </div>
  );
};
