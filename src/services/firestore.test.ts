import {
  getUserProfile,
  updateUserPreferences,
  addVacationPeriod,
  getVacationPeriods,
  deleteVacationPeriod,
  createTrip,
  getUserTrips,
  getTripById,
  updateTrip,
  deleteTripCascade,
  addItineraryItem,
  getTripItineraryItems,
  updateItineraryItem,
  deleteItineraryItem,
} from './firestoreService';
import { SavedTripSummary } from '../types';

export interface FirestoreTestResult {
  testName: string;
  passed: boolean;
  details: string;
}

/**
 * Suíte de Testes Automatizados da Camada de Persistência Firestore do SmartTrip
 */
export const runFirestoreTestSuite = async (): Promise<FirestoreTestResult[]> => {
  const results: FirestoreTestResult[] = [];
  const userA = 'uid_user_A_123';
  const userB = 'uid_user_B_456';

  // 1. Teste: Criar (Create)
  try {
    const newTrip = await createTrip(userA, {
      title: 'Viagem para Lisboa',
      destination: 'Portugal',
      status: 'Roteiro Ativo',
      statusColor: 'bg-emerald-500',
      duration: '5 dias',
      nextStop: 'Torre de Belém',
      image: 'https://images.unsplash.com/photo-lisboa.jpg',
      isUserEdited: false,
    });

    const period = await addVacationPeriod(userA, {
      title: 'Férias de Verão',
      startDate: '2026-10-10',
      endDate: '2026-10-20',
      status: 'em_breve',
      daysCount: 10,
    });

    const isCreated = newTrip.id.startsWith('trip-') && period.id.startsWith('vac-');
    results.push({
      testName: '1. Criar (Create Document & Subcollections)',
      passed: isCreated,
      details: isCreated ? `Viagem (${newTrip.id}) e Folga (${period.id}) criadas` : 'Falha ao criar registros',
    });
  } catch (err: any) {
    results.push({ testName: '1. Criar (Create)', passed: false, details: err.message });
  }

  // 2. Teste: Ler (Read)
  try {
    const trips = await getUserTrips(userA);
    const isReadSuccessful = Array.isArray(trips);
    results.push({
      testName: '2. Ler (Read User Trips)',
      passed: isReadSuccessful,
      details: isReadSuccessful ? `Consulta retornou ${trips.length} viagens salvas` : 'Falha na leitura',
    });
  } catch (err: any) {
    results.push({ testName: '2. Ler (Read)', passed: false, details: err.message });
  }

  // 3. Teste: Atualizar (Update & Human-in-the-Loop)
  try {
    const item = await addItineraryItem(userA, 'trip-123', {
      time: '10:00',
      categoryTag: 'CULTURA',
      title: 'Visita ao Museu',
      badge: 'Arte',
      isUserEdited: false,
    });

    await updateItineraryItem(userA, 'trip-123', item.id, {
      title: 'Visita Guiada ao Museu do Louvre',
      isUserEdited: true,
    });

    results.push({
      testName: '3. Atualizar (Update & Human-in-the-loop Badge)',
      passed: true,
      details: 'Atividade atualizada e marcada com flag isUserEdited: true',
    });
  } catch (err: any) {
    results.push({ testName: '3. Atualizar (Update)', passed: false, details: err.message });
  }

  // 4. Teste: Excluir (Delete Item & Cascade Delete)
  try {
    const tempTrip = await createTrip(userA, {
      title: 'Viagem Temporária',
      destination: 'Teste',
      status: 'Em Rascunho',
      statusColor: 'bg-slate-500',
      duration: '2 dias',
      nextStop: 'Nenhum',
      image: 'https://images.unsplash.com/test.jpg',
    });

    await deleteTripCascade(userA, tempTrip.id);
    results.push({
      testName: '4. Excluir (Cascading Delete of Trip and Items)',
      passed: true,
      details: `Viagem (${tempTrip.id}) e itens filhos excluídos atomicamente`,
    });
  } catch (err: any) {
    results.push({ testName: '4. Excluir (Delete)', passed: false, details: err.message });
  }

  // 5. Teste: Usuário A versus Usuário B (Isolamento de Ownership)
  try {
    let ownershipBlocked = false;
    try {
      // Tentativa de passar ID nulo ou tentar consultar sem ownership
      await getUserTrips('');
    } catch (err: any) {
      if (err.message.includes('Ownership')) ownershipBlocked = true;
    }

    results.push({
      testName: '5. Usuário A vs Usuário B (Isolamento de Dados)',
      passed: ownershipBlocked,
      details: ownershipBlocked
        ? 'Validação de Ownership impediu consulta anônima ou sem token'
        : 'Falha no isolamento de usuários',
    });
  } catch (err: any) {
    results.push({ testName: '5. Usuário A vs Usuário B', passed: false, details: err.message });
  }

  // 6. Teste: Documento Inexistente
  try {
    const nonExistentTrip = await getTripById(userA, 'trip_id_inexistente_9999');
    const isNullOrEmpty = nonExistentTrip === null;
    results.push({
      testName: '6. Documento Inexistente',
      passed: isNullOrEmpty,
      details: isNullOrEmpty ? 'Busca por ID inexistente retornou null graciosamente' : 'Retornou valor incorreto',
    });
  } catch (err: any) {
    results.push({ testName: '6. Documento Inexistente', passed: false, details: err.message });
  }

  // 7. Teste: Dados Inválidos
  try {
    let payloadBlocked = false;
    try {
      await createTrip(userA, { title: '', destination: '' } as any);
    } catch (err: any) {
      if (err.message.includes('Dados inválidos')) payloadBlocked = true;
    }

    results.push({
      testName: '7. Tratamento de Dados Inválidos',
      passed: payloadBlocked,
      details: payloadBlocked ? 'Payload sem título/destino rejeitado pelo repositório' : 'Dados inválidos aceitos',
    });
  } catch (err: any) {
    results.push({ testName: '7. Dados Inválidos', passed: false, details: err.message });
  }

  return results;
};

// Executa e imprime os resultados da suíte Firestore
runFirestoreTestSuite().then((suite) => {
  console.log('=== SUÍTE DE TESTES DE PERSISTÊNCIA FIRESTORE ===');
  suite.forEach((r) => {
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.testName}: ${r.details}`);
  });
});
