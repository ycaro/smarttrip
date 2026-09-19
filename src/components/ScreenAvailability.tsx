import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import {
  getVacationPeriods,
  addVacationPeriod,
  updateVacationPeriod,
  deleteVacationPeriod,
} from '../services/firestoreService';
import {
  runAvailabilityPreferencesTestSuite,
  TestReport,
} from '../services/availabilityPreferences.test';
import { MOCK_VACATION_PERIODS } from '../data/mockData';
import { ScreenType, VacationPeriod } from '../types';

interface ScreenAvailabilityProps {
  onNavigate: (screen: ScreenType) => void;
}

export const ScreenAvailability: React.FC<ScreenAvailabilityProps> = ({ onNavigate }) => {
  const { user } = useAuthContext();
  const [periods, setPeriods] = useState<VacationPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Test Runner State
  const [testResults, setTestResults] = useState<TestReport[] | null>(null);
  const [runningTests, setRunningTests] = useState(false);

  // Derive Session User Identity
  const sessionUserId = user?.uid;

  // Carregar Folgas do Firestore
  const fetchPeriods = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      if (sessionUserId) {
        const data = await getVacationPeriods(sessionUserId);
        setPeriods(data.length > 0 ? data : MOCK_VACATION_PERIODS);
      } else {
        setPeriods(MOCK_VACATION_PERIODS);
      }
    } catch (err: any) {
      console.error('[Availability] Erro ao carregar folgas:', err);
      setErrorMessage(err.message || 'Erro ao carregar folgas.');
      setPeriods(MOCK_VACATION_PERIODS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, [sessionUserId]);

  const clearMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // 1. ADICIONAR FOLGA (Com validação de datas e campos ausentes)
  const handleAddPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!sessionUserId) {
      setErrorMessage('Erro de autenticação: Sessão não encontrada.');
      return;
    }

    // Validação client-side explícita antes do serviço
    if (!title.trim() || !startDate || !endDate) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios (Título, Início e Término).');
      return;
    }

    if (startDate > endDate) {
      setErrorMessage('A data de início não pode ser posterior à data de término.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await addVacationPeriod(sessionUserId, {
        title: title.trim(),
        startDate,
        endDate,
        notes: notes.trim(),
        status: 'em_breve',
        daysCount: 0, // calculado pelo serviço
      });

      setSuccessMessage(`Folga "${created.title}" cadastrada com sucesso! (${created.daysCount} dias)`);
      setTitle('');
      setStartDate('');
      setEndDate('');
      setNotes('');
      await fetchPeriods();
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao cadastrar período de folga.');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. EDITAR FOLGA
  const startEdit = (period: VacationPeriod) => {
    setEditingId(period.id);
    setEditTitle(period.title);
    setEditStartDate(period.startDate);
    setEditEndDate(period.endDate);
    setEditNotes(period.notes || '');
    clearMessages();
  };

  const handleSaveEdit = async (id: string) => {
    clearMessages();

    if (!sessionUserId) {
      setErrorMessage('Erro de sessão ao atualizar.');
      return;
    }

    if (!editTitle.trim() || !editStartDate || !editEndDate) {
      setErrorMessage('Preencha os campos obrigatórios para editar.');
      return;
    }

    if (editStartDate > editEndDate) {
      setErrorMessage('Data de início não pode ser posterior à data de término.');
      return;
    }

    setSubmitting(true);
    try {
      await updateVacationPeriod(sessionUserId, id, {
        title: editTitle.trim(),
        startDate: editStartDate,
        endDate: editEndDate,
        notes: editNotes.trim(),
      });
      setSuccessMessage('Período de folga atualizado com sucesso!');
      setEditingId(null);
      await fetchPeriods();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao atualizar folga.');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. EXCLUIR FOLGA
  const handleDelete = async (id: string) => {
    clearMessages();

    if (!sessionUserId) {
      setErrorMessage('Erro de sessão ao excluir.');
      return;
    }

    if (!confirm('Deseja realmente remover esta folga?')) return;

    setSubmitting(true);
    try {
      await deleteVacationPeriod(sessionUserId, id);
      setSuccessMessage('Folga excluída com sucesso!');
      await fetchPeriods();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao excluir folga.');
    } finally {
      setSubmitting(false);
    }
  };

  // 4. TESTES AUTOMÁTICOS DA SPEC CONJUNTA
  const handleRunTests = async () => {
    setRunningTests(true);
    setTestResults(null);
    try {
      const results = await runAvailabilityPreferencesTestSuite();
      setTestResults(results);
    } catch (err: any) {
      setErrorMessage(`Erro ao executar suíte de testes: ${err.message}`);
    } finally {
      setRunningTests(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 max-w-5xl mx-auto pb-24 text-left">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => onNavigate('dashboard')}
              className="text-slate-400 hover:text-white text-xs font-semibold"
            >
              ← Dashboard
            </button>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Períodos de Folga & Férias</h1>
          <p className="text-xs md:text-sm text-slate-400">
            Cadastre suas datas disponíveis para planejar viagens ideais com IA.
            <span className="text-indigo-400 font-mono ml-1">
              (Sessão: {sessionUserId ? `UID ${sessionUserId.slice(0, 8)}...` : 'Demonstração'})
            </span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunTests}
            disabled={runningTests}
            className="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span>{runningTests ? '⏳ Executando...' : '🧪 Rodar Suíte de Testes SPEC'}</span>
          </button>
        </div>
      </div>

      {/* Global Toast / Messages */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-base">✓</span>
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Test Results Dashboard (If Triggered) */}
      {testResults && (
        <div className="mb-8 bg-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <span>📊 Resultado dos Testes Automatizados da SPEC</span>
              <span className="text-xs font-mono text-emerald-400">
                ({testResults.filter((r) => r.passed).length}/{testResults.length} PASSOU)
              </span>
            </h3>
            <button
              onClick={() => setTestResults(null)}
              className="text-xs text-slate-400 hover:text-white font-bold"
            >
              Fechar Painel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {testResults.map((res, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border flex flex-col justify-between ${
                  res.passed
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                    : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                }`}
              >
                <div className="flex items-center justify-between font-bold mb-1">
                  <span>{res.testName}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
                    res.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {res.passed ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                <p className="text-[11px] opacity-80">{res.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="md:col-span-1 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 h-fit">
          <h2 className="text-base font-bold text-white mb-4">Adicionar Nova Folga</h2>
          <form onSubmit={handleAddPeriod} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Título da Folga *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Férias de Outubro"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Data de Início *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Data de Término *</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Observações (Opcional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Viagem em família para Portugal"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 text-white text-xs shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
              {submitting ? 'Cadastrando...' : 'Cadastrar Folga'}
            </button>
          </form>
        </div>

        {/* List Column */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-white">Suas Folgas Cadastradas</h2>
            <button
              onClick={fetchPeriods}
              className="text-xs text-indigo-400 hover:underline font-semibold"
            >
              🔄 Recarregar
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-24 bg-slate-900 animate-pulse rounded-2xl border border-slate-800" />
              ))}
            </div>
          ) : periods.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-xl">
                🗓️
              </div>
              <p className="text-sm font-semibold text-white">Nenhum período de folga cadastrado</p>
              <p className="text-xs text-slate-400">
                Adicione suas férias ou feriados para que a IA sugira o roteiro perfeito para o seu tempo livre.
              </p>
            </div>
          ) : (
            periods.map((period) => (
              <div
                key={period.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-all"
              >
                {editingId === period.id ? (
                  /* Form de Edição Inline */
                  <div className="w-full space-y-3">
                    <div className="font-bold text-xs text-indigo-400 uppercase tracking-wide">
                      Editando Folga
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Título"
                        className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                      />
                      <input
                        type="date"
                        value={editStartDate}
                        onChange={(e) => setEditStartDate(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                      />
                      <input
                        type="date"
                        value={editEndDate}
                        onChange={(e) => setEditEndDate(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                      />
                    </div>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Observações (opcional)"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                    />
                    <div className="flex items-center gap-2 justify-end pt-1">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleSaveEdit(period.id)}
                        disabled={submitting}
                        className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                      >
                        {submitting ? 'Salvando...' : 'Salvar Alterações'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Exibição Normal */
                  <>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-white text-sm">{period.title}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          period.status === 'em_andamento'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : period.status === 'concluida'
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}>
                          {period.status === 'em_breve' ? 'Em Breve' : period.status === 'em_andamento' ? 'Em Andamento' : 'Concluída'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        📅 {period.startDate} até {period.endDate} ({period.daysCount} dias)
                      </p>
                      {period.notes && (
                        <p className="text-xs text-slate-500 italic mt-0.5">
                          💬 {period.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onNavigate('explore')}
                        className="px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors"
                      >
                        Gerar Roteiro
                      </button>
                      <button
                        onClick={() => startEdit(period)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 transition-colors"
                        title="Editar Folga"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(period.id)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Excluir Folga"
                      >
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
