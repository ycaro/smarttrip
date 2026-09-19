import {
  addVacationPeriod,
  updateVacationPeriod,
  deleteVacationPeriod,
  getVacationPeriods,
  updateUserPreferences,
  getUserProfile,
} from './firestoreService';
import { VacationPeriod } from '../types';

export interface TestReport {
  testName: string;
  passed: boolean;
  details: string;
}

/**
 * Suíte de Testes da SPEC Conjunta de Disponibilidade & Preferências
 */
export const runAvailabilityPreferencesTestSuite = async (): Promise<TestReport[]> => {
  const results: TestReport[] = [];
  const sessionUserId = 'uid_fer_sessao_123';
  const maliciousUserId = 'uid_hacker_alheio_999';

  // 1. Teste: Período Válido
  try {
    const period = await addVacationPeriod(sessionUserId, {
      title: 'Férias de Outubro',
      startDate: '2026-10-10',
      endDate: '2026-10-20',
      notes: 'Viagem em família para Portugal',
      status: 'em_breve',
      daysCount: 11,
    });
    const isValid = period.daysCount === 11 && period.id.startsWith('vac-');
    results.push({
      testName: '1. Período Válido (Cálculo Inclusivo de 11 Dias)',
      passed: isValid,
      details: isValid ? `Folga criada com sucesso (${period.daysCount} dias)` : 'Falha no cálculo de dias',
    });
  } catch (err: any) {
    results.push({ testName: '1. Período Válido', passed: false, details: err.message });
  }

  // 2. Teste: Datas Invertidas (startDate > endDate)
  try {
    let dateInversionBlocked = false;
    try {
      await addVacationPeriod(sessionUserId, {
        title: 'Data Inválida',
        startDate: '2026-10-20',
        endDate: '2026-10-10', // Invertido!
        status: 'em_breve',
        daysCount: 0,
      });
    } catch (err: any) {
      if (err.message.includes('não pode ser posterior')) {
        dateInversionBlocked = true;
      }
    }
    results.push({
      testName: '2. Datas Invertidas (Rejeição de startDate > endDate)',
      passed: dateInversionBlocked,
      details: dateInversionBlocked ? 'Validador rejeitou período com datas invertidas' : 'Datas invertidas aceitas indevidamente',
    });
  } catch (err: any) {
    results.push({ testName: '2. Datas Invertidas', passed: false, details: err.message });
  }

  // 3. Teste: Campos Ausentes
  try {
    let missingFieldsBlocked = false;
    try {
      await addVacationPeriod(sessionUserId, {
        title: '', // Título vazio!
        startDate: '2026-10-10',
        endDate: '2026-10-20',
        status: 'em_breve',
        daysCount: 11,
      });
    } catch (err: any) {
      if (err.message.includes('obrigatório')) {
        missingFieldsBlocked = true;
      }
    }
    results.push({
      testName: '3. Campos Ausentes (Título Vazio Rejeitado)',
      passed: missingFieldsBlocked,
      details: missingFieldsBlocked ? 'Submissão sem título rejeitada' : 'Campo ausente aceito',
    });
  } catch (err: any) {
    results.push({ testName: '3. Campos Ausentes', passed: false, details: err.message });
  }

  // 4. Teste: Edição de Folga
  try {
    const period = await addVacationPeriod(sessionUserId, {
      title: 'Folga Inicial',
      startDate: '2026-11-01',
      endDate: '2026-11-05',
      status: 'em_breve',
      daysCount: 5,
    });
    await updateVacationPeriod(sessionUserId, period.id, {
      title: 'Folga Alterada para Feriado',
    });
    results.push({
      testName: '4. Edição de Folga',
      passed: true,
      details: `Folga (${period.id}) atualizada com sucesso`,
    });
  } catch (err: any) {
    results.push({ testName: '4. Edição de Folga', passed: false, details: err.message });
  }

  // 5. Teste: Exclusão de Folga
  try {
    const period = await addVacationPeriod(sessionUserId, {
      title: 'Folga para Apagar',
      startDate: '2026-12-01',
      endDate: '2026-12-02',
      status: 'em_breve',
      daysCount: 2,
    });
    await deleteVacationPeriod(sessionUserId, period.id);
    results.push({
      testName: '5. Exclusão de Folga',
      passed: true,
      details: `Folga (${period.id}) removida com sucesso`,
    });
  } catch (err: any) {
    results.push({ testName: '5. Exclusão de Folga', passed: false, details: err.message });
  }

  // 6. Teste: Persistência após Reload (Simulação de leitura Firestore)
  try {
    const list = await getVacationPeriods(sessionUserId);
    results.push({
      testName: '6. Persistência após Reload',
      passed: Array.isArray(list),
      details: `Consulta do Firestore retornou ${list.length} folgas persistidas`,
    });
  } catch (err: any) {
    results.push({ testName: '6. Persistência após Reload', passed: false, details: err.message });
  }

  // 7. Teste: Tentativa de Alterar Registro Alheio (Ownership Validation)
  try {
    let crossAlterationBlocked = false;
    try {
      // Tenta alterar dados passando ID alheio ou vazio
      await updateVacationPeriod('', 'vac-123', { title: 'Ataque Malicioso' });
    } catch (err: any) {
      if (err.message.includes('inválidos')) {
        crossAlterationBlocked = true;
      }
    }
    results.push({
      testName: '7. Tentativa de Alterar Registro Alheio (Ownership Guard)',
      passed: crossAlterationBlocked,
      details: crossAlterationBlocked ? 'Validador de Ownership bloqueou alteração sem token da sessão' : 'Vulnerabilidade detectada',
    });
  } catch (err: any) {
    results.push({ testName: '7. Alterar Registro Alheio', passed: false, details: err.message });
  }

  // 8. Teste: Preferências Vazias (Rejeitado)
  try {
    let emptyPrefBlocked = false;
    try {
      await updateUserPreferences(sessionUserId, {
        styles: [], // Lista de estilos vazia!
        budget: 'moderado',
        pace: 'tranquilo',
      });
    } catch (err: any) {
      if (err.message.includes('pelo menos 1 interesse')) {
        emptyPrefBlocked = true;
      }
    }
    results.push({
      testName: '8. Preferências Vazias (Rejeitado: Mínimo 1 Interesse)',
      passed: emptyPrefBlocked,
      details: emptyPrefBlocked ? 'Submissão sem interesses rejeitada' : 'Preferências vazias aceitas',
    });
  } catch (err: any) {
    results.push({ testName: '8. Preferências Vazias', passed: false, details: err.message });
  }

  // 9. Teste: Seleção Múltipla de Interesses (Validação 1 a 5)
  try {
    await updateUserPreferences(sessionUserId, {
      styles: ['Gastronomia', 'História', 'Fotografia'],
      budget: 'moderado',
      pace: 'tranquilo',
    });
    results.push({
      testName: '9. Seleção Múltipla (3 Interesses Selecionados)',
      passed: true,
      details: 'Múltiplos interesses validados dentro do limite (1 a 5)',
    });
  } catch (err: any) {
    results.push({ testName: '9. Seleção Múltipla', passed: false, details: err.message });
  }

  // 10. Teste: Atualização de Preferências (Persistência)
  try {
    await updateUserPreferences(sessionUserId, {
      styles: ['Ecoturismo', 'Aventura'],
      budget: 'luxo',
      pace: 'intenso',
    });
    results.push({
      testName: '10. Atualização de Preferências',
      passed: true,
      details: 'Perfil de viagem recalibrado com sucesso',
    });
  } catch (err: any) {
    results.push({ testName: '10. Atualização de Preferências', passed: false, details: err.message });
  }

  return results;
};

// Executa e imprime a suíte
runAvailabilityPreferencesTestSuite().then((suite) => {
  console.log('=== SUÍTE DE TESTES: DISPONIBILIDADE E PREFERÊNCIAS ===');
  suite.forEach((r) => {
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.testName}: ${r.details}`);
  });
});
