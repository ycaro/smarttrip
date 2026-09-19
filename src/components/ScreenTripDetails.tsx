import React, { useState } from 'react';
import { LISBOA_DAY_3 } from '../data/mockData';
import { DaySchedule, ScreenType, TripActivity } from '../types';

interface ScreenTripDetailsProps {
  onNavigate: (screen: ScreenType) => void;
  onShowToast?: (msg: string) => void;
}

export const ScreenTripDetails: React.FC<ScreenTripDetailsProps> = ({ onNavigate, onShowToast }) => {
  const [schedule, setSchedule] = useState<DaySchedule>(LISBOA_DAY_3);
  const [activeDay, setActiveDay] = useState<number>(3);
  const [editingActivity, setEditingActivity] = useState<TripActivity | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editCost, setEditCost] = useState('');
  const [stateMode, setStateMode] = useState<'normal' | 'loading' | 'empty'>('normal');

  const handleOpenEditModal = (activity: TripActivity) => {
    setEditingActivity(activity);
    setEditTitle(activity.title);
    setEditTime(activity.time);
    setEditCost(activity.cost || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity) return;

    const updatedActivities = schedule.activities.map((act) => {
      if (act.id === editingActivity.id) {
        return {
          ...act,
          title: editTitle,
          time: editTime,
          cost: editCost,
          isUserEdited: true,
        };
      }
      return act;
    });

    setSchedule({ ...schedule, activities: updatedActivities });
    setEditingActivity(null);
    if (onShowToast) onShowToast('Atividade atualizada com sucesso pelo usuário!');
  };

  const handleDeleteActivity = (id: string) => {
    const updatedActivities = schedule.activities.filter((act) => act.id !== id);
    setSchedule({ ...schedule, activities: updatedActivities });
    if (onShowToast) onShowToast('Atividade removida do itinerário.');
  };

  const handleAddActivity = () => {
    const newAct: TripActivity = {
      id: `act-${Date.now()}`,
      time: '18:00',
      categoryTag: 'NOITE',
      title: 'Jantar em Restaurante Típico',
      cost: 'Custo: R$ 80',
      badge: 'Gastronomia',
      isUserEdited: true,
    };
    setSchedule({ ...schedule, activities: [...schedule.activities, newAct] });
    if (onShowToast) onShowToast('Nova atividade adicionada ao dia!');
  };

  const displayedActivities = stateMode === 'empty' ? [] : schedule.activities;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 max-w-5xl mx-auto pb-24 text-left">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => onNavigate('trips')}
            className="text-slate-400 hover:text-white text-xs font-semibold mb-1"
          >
            ← Voltar para Minhas Viagens
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Lisboa & Orla do Tejo</h1>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-2.5 py-0.5 rounded-full">
              Roteiro Ativo
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">10 de Outubro – 15 de Outubro (5 Dias)</p>
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

      {/* Days Selector */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        {[1, 2, 3, 4, 5].map((dayNum) => (
          <button
            key={dayNum}
            onClick={() => setActiveDay(dayNum)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeDay === dayNum
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Dia {dayNum} {dayNum === 3 ? '(Hoje)' : ''}
          </button>
        ))}
      </div>

      {/* Weather Widget */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg">
            ☀️
          </div>
          <div>
            <p className="text-xs font-bold text-white">Previsão para Dia {activeDay}: {schedule.weather.temp} • {schedule.weather.condition}</p>
            <p className="text-[11px] text-slate-400">{schedule.weather.summary}</p>
          </div>
        </div>
        <div className="text-xs text-slate-400 whitespace-nowrap">
          Vento: <span className="text-slate-200">{schedule.weather.wind}</span> • <span className="text-emerald-400">{schedule.weather.uv}</span>
        </div>
      </div>

      {/* Activities Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-white">{schedule.title}</h2>
        <button
          onClick={handleAddActivity}
          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
        >
          + Adicionar Atividade
        </button>
      </div>

      {/* Activities List */}
      {stateMode === 'loading' ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-slate-900 animate-pulse rounded-2xl border border-slate-800" />
          ))}
        </div>
      ) : displayedActivities.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-white">Nenhuma atividade agendada para este dia</p>
          <button
            onClick={handleAddActivity}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
          >
            Adicionar Primeira Atividade
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedActivities.map((activity) => (
            <div
              key={activity.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="px-3 py-1.5 rounded-xl bg-slate-800 text-indigo-300 font-mono text-xs font-bold whitespace-nowrap">
                  {activity.time}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-white text-sm">{activity.title}</h3>
                    {activity.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {activity.badge}
                      </span>
                    )}
                    {activity.isUserEdited && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        ✏️ Editado pelo Usuário
                      </span>
                    )}
                  </div>
                  {activity.description && <p className="text-xs text-slate-400">{activity.description}</p>}
                  {activity.cost && <p className="text-[11px] text-emerald-400 font-medium">{activity.cost}</p>}
                </div>
              </div>

              {/* Action Buttons - Human in the Loop */}
              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  onClick={() => handleOpenEditModal(activity)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleDeleteActivity(activity.id)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Remover Atividade"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal (Human-in-the-loop) */}
      {editingActivity && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-left">
            <h3 className="font-bold text-white text-base">Revisão Humana: Editar Atividade</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Horário</label>
                <input
                  type="text"
                  required
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Título da Atividade</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Estimativa de Custo</label>
                <input
                  type="text"
                  value={editCost}
                  onChange={(e) => setEditCost(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingActivity(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg"
                >
                  Salvar Edição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
