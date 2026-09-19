import React, { useState } from 'react';
import { MOCK_SAVED_TRIPS } from '../data/mockData';
import { SavedTripSummary, ScreenType } from '../types';

interface ScreenTripsProps {
  onNavigate: (screen: ScreenType) => void;
  onOpenTripDetails?: (tripId: string) => void;
}

export const ScreenTrips: React.FC<ScreenTripsProps> = ({ onNavigate, onOpenTripDetails }) => {
  const [trips, setTrips] = useState<SavedTripSummary[]>(MOCK_SAVED_TRIPS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);
  const [stateMode, setStateMode] = useState<'normal' | 'empty' | 'loading'>('normal');

  const filteredTrips = trips.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.destination.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'todos' || t.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const displayedTrips = stateMode === 'empty' ? [] : filteredTrips;

  const handleConfirmDelete = () => {
    if (deletingTripId) {
      setTrips(trips.filter((t) => t.id !== deletingTripId));
      setDeletingTripId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 max-w-6xl mx-auto pb-24 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <button
            onClick={() => onNavigate('dashboard')}
            className="text-slate-400 hover:text-white text-xs font-semibold mb-1"
          >
            ← Dashboard
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Minhas Viagens Salvas</h1>
          <p className="text-xs md:text-sm text-slate-400">Gerencie todos os seus roteiros e itinerários gerados</p>
        </div>

        {/* State Controls for Testing */}
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => setStateMode('normal')}
            className={`px-3 py-1.5 rounded-xl font-medium ${stateMode === 'normal' ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400'}`}
          >
            Normal
          </button>
          <button
            onClick={() => setStateMode('empty')}
            className={`px-3 py-1.5 rounded-xl font-medium ${stateMode === 'empty' ? 'bg-amber-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400'}`}
          >
            Vazio
          </button>
          <button
            onClick={() => setStateMode('loading')}
            className={`px-3 py-1.5 rounded-xl font-medium ${stateMode === 'loading' ? 'bg-purple-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400'}`}
          >
            Loading
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por destino ou título..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
        />
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
        >
          <option value="todos">Todos os Status</option>
          <option value="Roteiro Ativo">Roteiro Ativo</option>
          <option value="Em Rascunho">Em Rascunho</option>
          <option value="Lista de Desejos">Lista de Desejos</option>
        </select>
        <button
          onClick={() => onNavigate('explore')}
          className="px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 text-white text-xs shadow-lg shadow-indigo-500/20 whitespace-nowrap"
        >
          + Criar Nova Viagem
        </button>
      </div>

      {/* Content */}
      {stateMode === 'loading' ? (
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 bg-slate-900 animate-pulse rounded-2xl border border-slate-800" />
          ))}
        </div>
      ) : displayedTrips.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-2xl">
            ✈️
          </div>
          <h3 className="text-lg font-bold text-white">Nenhuma viagem encontrada</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Você ainda não possui viagens criadas com este filtro. Gere seu primeiro roteiro inteligente com a IA do Gemini!
          </p>
          <button
            onClick={() => onNavigate('explore')}
            className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs shadow-lg"
          >
            Gerar Meu Primeiro Roteiro
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {displayedTrips.map((trip) => (
            <div
              key={trip.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="h-40 relative overflow-hidden">
                  <img
                    src={trip.image}
                    alt={trip.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-indigo-300 border border-slate-700">
                      {trip.duration}
                    </span>
                  </div>
                  {trip.isUserEdited && (
                    <div className="absolute bottom-3 left-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        ✏️ Editado pelo Usuário
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {trip.status}
                  </span>
                  <h3 className="font-bold text-white text-base">{trip.title}</h3>
                  <p className="text-xs text-slate-400">{trip.nextStop}</p>
                </div>
              </div>

              <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-800/60 mt-4">
                <button
                  onClick={() => {
                    if (onOpenTripDetails) onOpenTripDetails(trip.id);
                    onNavigate('trip-details');
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                >
                  Ver Roteiro
                </button>
                <button
                  onClick={() => setDeletingTripId(trip.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Excluir Viagem"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTripId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto text-xl">
              ⚠️
            </div>
            <h3 className="font-bold text-white text-base">Excluir Viagem?</h3>
            <p className="text-xs text-slate-400">
              Esta ação removerá o roteiro permanentemente. Deseja continuar?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeletingTripId(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-600/20"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
