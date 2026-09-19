/**
 * Testes do Contrato de Saída do Roteiro SmartTrip
 * 
 * Executa os casos de teste CT-01 a CT-08 definidos na SPEC docs/spec-contrato-roteiro.md.
 */

import { validateItineraryContract, ValidationContext, SmartTripItineraryContract } from './itineraryValidator';
import { NormalizedPoi } from './places';

// Mocks de POIs factuais fornecidos pelo backend
const mockPois: NormalizedPoi[] = [
  {
    id: 'ChIJb9X7m_sZGQ0RkXb-Y2q7_1A',
    name: 'Castelo de São Jorge',
    category: 'pontos_historicos',
    address: 'R. de Santa Cruz do Castelo, 1100-129 Lisboa',
    latitude: 38.7139,
    longitude: -9.1335,
    rating: 4.6,
    userRatingsTotal: 45000,
    provider: 'google_places'
  },
  {
    id: 'ChIJc8Y8n_sZGQ0RkXb-Y2q7_2B',
    name: 'Pastéis de Belém',
    category: 'cafes',
    address: 'R. de Belém 84-92, 1300-085 Lisboa',
    latitude: 38.6975,
    longitude: -9.2032,
    rating: 4.8,
    userRatingsTotal: 62000,
    provider: 'google_places'
  }
];

const mockContext: ValidationContext = {
  tripStartDate: '2026-09-20',
  tripEndDate: '2026-09-22',
  providedPois: mockPois,
  currentDate: '2026-09-19'
};

async function runItineraryContractTests() {
  console.log('=== SUÍTE DE TESTES: CONTRATO DE SAÍDA DO ROTEIRO SMARTTRIP ===\n');

  let passedTests = 0;
  const totalTests = 8;

  // CT-01: Roteiro Completo Válido
  const ct01Itinerary: SmartTripItineraryContract = {
    title: 'Lisboa Histórica & Gastronômica',
    summary: 'Um roteiro de 2 dias explorando monumentos emblemáticos, gastronomia local e miradouros em Lisboa.',
    alerts: [
      'O Castelo de São Jorge requer caminhada em ladeiras íngremes; use calçados confortáveis.'
    ],
    days: [
      {
        date: '2026-09-20',
        weatherSummary: {
          condition: 'Ensolarado',
          tempMin: 16,
          tempMax: 24,
          rainProbability: 10
        },
        activities: [
          {
            placeId: 'ChIJb9X7m_sZGQ0RkXb-Y2q7_1A',
            name: 'Castelo de São Jorge',
            periodOrTime: 'manhã',
            justification: 'Atende ao interesse em pontos históricos e proporciona vista panorâmica da cidade.'
          }
        ]
      }
    ]
  };

  const res1 = validateItineraryContract(ct01Itinerary, mockContext);
  if (res1.isValid) {
    console.log('[PASS] CT-01: Roteiro Completo Válido (Aprovado sem erros)');
    passedTests++;
  } else {
    console.error('[FAIL] CT-01: Roteiro Válido rejeitado incorretamente:', res1.errors);
  }

  // CT-02: Lista Vazia de Alertas
  const ct02Itinerary = {
    ...ct01Itinerary,
    alerts: []
  };

  const res2 = validateItineraryContract(ct02Itinerary, mockContext);
  if (res2.isValid) {
    console.log('[PASS] CT-02: Lista Vazia de Alertas (alerts: [] aceito com sucesso)');
    passedTests++;
  } else {
    console.error('[FAIL] CT-02: Lista vazia de alertas rejeitada:', res2.errors);
  }

  // CT-03: Data Fora do Intervalo da Viagem
  const ct03Itinerary = {
    ...ct01Itinerary,
    days: [
      {
        date: '2026-09-30', // Viagem é de 20 a 22/09
        weatherSummary: null,
        activities: ct01Itinerary.days[0].activities
      }
    ]
  };

  const res3 = validateItineraryContract(ct03Itinerary, mockContext);
  if (!res3.isValid && res3.errors.some(e => e.includes('fora do intervalo da viagem'))) {
    console.log('[PASS] CT-03: Data Fora da Viagem (Rejeitada com erro específico)');
    passedTests++;
  } else {
    console.error('[FAIL] CT-03: Rejeição de data fora da viagem falhou:', res3);
  }

  // CT-04: placeId Fictício / Inexistente
  const ct04Itinerary = {
    ...ct01Itinerary,
    days: [
      {
        date: '2026-09-20',
        weatherSummary: null,
        activities: [
          {
            placeId: 'ID_INVENTADO_FANTASIA',
            name: 'Local Inventado',
            periodOrTime: 'tarde',
            justification: 'Local agradável.'
          }
        ]
      }
    ]
  };

  const res4 = validateItineraryContract(ct04Itinerary, mockContext);
  if (!res4.isValid && res4.errors.some(e => e.includes('não existe no catálogo factual'))) {
    console.log('[PASS] CT-04: placeId Fictício (Rejeitado por ausência de origem factual)');
    passedTests++;
  } else {
    console.error('[FAIL] CT-04: Rejeição de placeId fictício falhou:', res4);
  }

  // CT-05: Clima Inventado Fora do Horizonte (> 14 dias)
  const futureContext: ValidationContext = {
    ...mockContext,
    tripStartDate: '2026-11-01',
    tripEndDate: '2026-11-05'
  };

  const ct05Itinerary = {
    ...ct01Itinerary,
    days: [
      {
        date: '2026-11-02',
        weatherSummary: {
          condition: 'Quente e Ensolarado',
          tempMin: 22,
          tempMax: 30,
          rainProbability: 0
        },
        activities: ct01Itinerary.days[0].activities
      }
    ]
  };

  const res5 = validateItineraryContract(ct05Itinerary, futureContext);
  if (!res5.isValid && res5.errors.some(e => e.includes('Previsão meteorológica numérica proibida'))) {
    console.log('[PASS] CT-05: Clima Inventado Fora do Horizonte (Rejeitado por preencher valores numéricos fora do horizonte)');
    passedTests++;
  } else {
    console.error('[FAIL] CT-05: Rejeição de clima inventado falhou:', res5);
  }

  // CT-06: Justificativa Prolixa (> 150 caracteres)
  const ct06Itinerary = {
    ...ct01Itinerary,
    days: [
      {
        date: '2026-09-20',
        weatherSummary: null,
        activities: [
          {
            ...ct01Itinerary.days[0].activities[0],
            justification: 'Este lugar foi escolhido porque o usuário demonstrou um interesse extremamente profundo em monumentos antigos durante o preenchimento do formulário de preferências e também porque o castelo possui uma história fascinante que remonta aos séculos passados.'
          }
        ]
      }
    ]
  };

  const res6 = validateItineraryContract(ct06Itinerary, mockContext);
  if (!res6.isValid && res6.errors.some(e => e.includes('excede 150 caracteres'))) {
    console.log('[PASS] CT-06: Justificativa Prolixa (Rejeitada por exceder 150 caracteres)');
    passedTests++;
  } else {
    console.error('[FAIL] CT-06: Rejeição de justificativa prolixa falhou:', res6);
  }

  // CT-07: Ausência de Atividades (Dia Vazio)
  const ct07Itinerary = {
    ...ct01Itinerary,
    days: [
      {
        date: '2026-09-20',
        weatherSummary: null,
        activities: []
      }
    ]
  };

  const res7 = validateItineraryContract(ct07Itinerary, mockContext);
  if (!res7.isValid && res7.errors.some(e => e.includes('Deve conter ao menos 1 atividade'))) {
    console.log('[PASS] CT-07: Ausência de Atividades (Dia sem atividades rejeitado)');
    passedTests++;
  } else {
    console.error('[FAIL] CT-07: Rejeição de dia sem atividades falhou:', res7);
  }

  // CT-08: Nome do Local Alterado / Incoerente com POI Factual
  const ct08Itinerary = {
    ...ct01Itinerary,
    days: [
      {
        date: '2026-09-20',
        weatherSummary: null,
        activities: [
          {
            placeId: 'ChIJb9X7m_sZGQ0RkXb-Y2q7_1A', // ID do Castelo de São Jorge
            name: 'Nome Inventado Diferente', // Nome alterado
            periodOrTime: 'manhã',
            justification: 'Ponto histórico.'
          }
        ]
      }
    ]
  };

  const res8 = validateItineraryContract(ct08Itinerary, mockContext);
  if (!res8.isValid && res8.errors.some(e => e.includes('não corresponde ao nome factual'))) {
    console.log('[PASS] CT-08: Nome do Local Alterado (Rejeitado por incompatibilidade com nome do POI)');
    passedTests++;
  } else {
    console.error('[FAIL] CT-08: Rejeição de nome alterado falhou:', res8);
  }

  console.log(`\nRESULTADO DA SUÍTE DE CONTRATO DO ROTEIRO: ${passedTests}/${totalTests} testes aprovados.`);

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runItineraryContractTests().catch(err => {
  console.error('Erro na suíte de testes de contrato:', err);
  process.exit(1);
});
