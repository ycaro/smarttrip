/**
 * TESTES DO CONTRATO DE SAÍDA DO ROTEIRO SMARTTRIP
 * 
 * Executa a suíte de testes de validação do contrato estruturado antes da integração com o Gemini.
 * Cobre todos os 9 cenários obrigatórios definidos no requisito do usuário.
 */

import { validateItineraryContract } from './itineraryValidator';
import { SmartTripItineraryContract, ValidationContext } from '../types/itinerary';
import { NormalizedPoi } from './places';

// Mocks de POIs factuais fornecidos pelo backend /api/pois
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
  currentDate: '2026-09-19',
  allowExtraProperties: false // Política estrita: rejeita campos extras
};

// Base de roteiro válido para os testes
const validBaseItinerary: SmartTripItineraryContract = {
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

async function runItineraryContractTests() {
  console.log('=== SUÍTE DE TESTES COMPLETA: CONTRATO DO ROTEIRO SMARTTRIP ===\n');

  let passed = 0;
  const total = 9;

  // 1. Exemplo Válido
  const res1 = validateItineraryContract(validBaseItinerary, mockContext);
  if (res1.isValid && res1.logErrors.length === 0) {
    console.log('[PASS] 1. Exemplo Válido: Roteiro aceito com sucesso sem erros de validação.');
    passed++;
  } else {
    console.error('[FAIL] 1. Exemplo Válido falhou:', res1.logErrors);
  }

  // 2. Título Vazio
  const res2 = validateItineraryContract({ ...validBaseItinerary, title: '   ' }, mockContext);
  if (!res2.isValid && res2.logErrors.some(e => e.includes('title') && e.includes('vazio'))) {
    console.log('[PASS] 2. Título Vazio: Rejeitado com mensagem explícita de log ("title não pode ser vazio").');
    passed++;
  } else {
    console.error('[FAIL] 2. Título Vazio falhou:', res2);
  }

  // 3. Days Vazio
  const res3 = validateItineraryContract({ ...validBaseItinerary, days: [] }, mockContext);
  if (!res3.isValid && res3.logErrors.some(e => e.includes('days') && e.includes('não-vazia'))) {
    console.log('[PASS] 3. Days Vazio: Rejeitado por ser um array sem elementos.');
    passed++;
  } else {
    console.error('[FAIL] 3. Days Vazio falhou:', res3);
  }

  // 4. Data Fora do Período
  const res4 = validateItineraryContract({
    ...validBaseItinerary,
    days: [
      {
        date: '2026-09-30', // Viagem é de 20-22/09
        weatherSummary: null,
        activities: validBaseItinerary.days[0].activities
      }
    ]
  }, mockContext);
  if (!res4.isValid && res4.logErrors.some(e => e.includes('fora do período da viagem'))) {
    console.log('[PASS] 4. Data Fora do Período: Rejeitada data "2026-09-30" fora do intervalo da viagem.');
    passed++;
  } else {
    console.error('[FAIL] 4. Data Fora do Período falhou:', res4);
  }

  // 5. Atividade sem placeId
  const res5 = validateItineraryContract({
    ...validBaseItinerary,
    days: [
      {
        date: '2026-09-20',
        weatherSummary: null,
        activities: [
          {
            placeId: '', // Vazio
            name: 'Castelo de São Jorge',
            periodOrTime: 'manhã',
            justification: 'Justificativa válida'
          }
        ]
      }
    ]
  }, mockContext);
  if (!res5.isValid && res5.logErrors.some(e => e.includes('placeId') && e.includes('vazio'))) {
    console.log('[PASS] 5. Atividade sem placeId: Rejeitada atividade com placeId vazio.');
    passed++;
  } else {
    console.error('[FAIL] 5. Atividade sem placeId falhou:', res5);
  }

  // 6. placeId Desconhecido
  const res6 = validateItineraryContract({
    ...validBaseItinerary,
    days: [
      {
        date: '2026-09-20',
        weatherSummary: null,
        activities: [
          {
            placeId: 'PLACE_ID_DESCONHECIDO_123',
            name: 'Lugar Fictício',
            periodOrTime: 'tarde',
            justification: 'Lugar fictício'
          }
        ]
      }
    ]
  }, mockContext);
  if (!res6.isValid && res6.logErrors.some(e => e.includes('desconhecido'))) {
    console.log('[PASS] 6. placeId Desconhecido: Rejeitado ID não cadastrado no catálogo de POIs.');
    passed++;
  } else {
    console.error('[FAIL] 6. placeId Desconhecido falhou:', res6);
  }

  // 7. Campo Obrigatório Ausente (Ex: sem summary)
  const incompleteItinerary: any = { ...validBaseItinerary };
  delete incompleteItinerary.summary;
  const res7 = validateItineraryContract(incompleteItinerary, mockContext);
  if (!res7.isValid && res7.logErrors.some(e => e.includes('Campo obrigatório ausente: "summary"'))) {
    console.log('[PASS] 7. Campo Obrigatório Ausente: Rejeitada ausência de "summary".');
    passed++;
  } else {
    console.error('[FAIL] 7. Campo Obrigatório Ausente falhou:', res7);
  }

  // 8. Tipo Incorreto (Ex: periodOrTime como número)
  const wrongTypeItinerary: any = {
    ...validBaseItinerary,
    days: [
      {
        date: '2026-09-20',
        weatherSummary: null,
        activities: [
          {
            placeId: 'ChIJb9X7m_sZGQ0RkXb-Y2q7_1A',
            name: 'Castelo de São Jorge',
            periodOrTime: 9999, // Número em vez de string
            justification: 'Atende ao interesse.'
          }
        ]
      }
    ]
  };
  const res8 = validateItineraryContract(wrongTypeItinerary, mockContext);
  if (!res8.isValid && res8.logErrors.some(e => e.includes('Tipo incorreto para "periodOrTime"'))) {
    console.log('[PASS] 8. Tipo Incorreto: Rejeitado "periodOrTime" numérico.');
    passed++;
  } else {
    console.error('[FAIL] 8. Tipo Incorreto falhou:', res8);
  }

  // 9. Campos Extras quando Política Determinar Rejeição
  const extraFieldsItinerary: any = {
    ...validBaseItinerary,
    unauthorizedRootProperty: 'Invadindo contrato'
  };
  const res9 = validateItineraryContract(extraFieldsItinerary, mockContext);
  if (!res9.isValid && res9.logErrors.some(e => e.includes('Campo extra não permitido no nível raiz'))) {
    console.log('[PASS] 9. Campos Extras Rejeitados: Rejeitado "unauthorizedRootProperty" com política estrita.');
    passed++;
  } else {
    console.error('[FAIL] 9. Campos Extras Rejeitados falhou:', res9);
  }

  console.log(`\nRESULTADO DA SUÍTE DE TESTES: ${passed}/${total} cenários aprovados com sucesso.`);

  if (passed !== total) {
    process.exit(1);
  }
}

runItineraryContractTests().catch(err => {
  console.error('Erro na suíte de testes do contrato:', err);
  process.exit(1);
});
