/**
 * SERVIÇO DE GERAÇÃO DE ROTEIRO COM GEMINI AI (SMARTTRIP)
 * 
 * Implementa o fluxo obrigatório de geração:
 * Request autenticada -> Validação de entrada -> Contexto estruturado -> Gemini -> Parse
 * -> Validação de schema/placeIds/datas -> Resposta ao cliente.
 * 
 * Garante resiliência com retries guiados por erro (máx 2), timeout de 15s e fallback factual seguro.
 */

import {
  PROMPT_VERSION,
  SYSTEM_INSTRUCTION_V1,
  buildTaskPrompt,
  sanitizeUserInput
} from './prompts/itineraryPrompt';
import {
  validateItineraryContract,
  SmartTripItineraryContract,
  ValidationContext
} from './itineraryValidator';
import {
  handleGenerateItineraryApi,
  GenerateItineraryServerRequest
} from './api/generateItineraryApi';
import { NormalizedPoi } from './places';

export interface GenerateItineraryInput {
  authToken: string;
  destination: {
    name: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  preferences: {
    interests: string[];
    budget: string;
    style: string;
    transport?: string;
  };
  factualWeather: any[];
  factualPois: NormalizedPoi[];
  // Parâmetros de teste/simulação
  mockResponseOverride?: string | null;
  simulateTimeout?: boolean;
  simulateServerError?: boolean;
}

export interface GenerateItineraryResult {
  success: boolean;
  itinerary: SmartTripItineraryContract;
  isFallback: boolean;
  promptVersion: string;
  userMessage: string;
  logErrors: string[];
  executionTimeMs: number;
}

/**
 * Função principal de geração de roteiro Gemini
 */
export async function generateItinerary(
  input: GenerateItineraryInput
): Promise<GenerateItineraryResult> {
  const startTime = Date.now();
  const logErrors: string[] = [];

  // STEP 1: Request Autenticada
  if (!input.authToken || input.authToken.trim() === '') {
    logErrors.push('[Auth Guard] Tentativa de geração sem token de sessão autenticada.');
    const fallback = generateFactualFallback(input);
    return {
      success: false,
      itinerary: fallback,
      isFallback: true,
      promptVersion: PROMPT_VERSION,
      userMessage: 'Autenticação necessária para gerar o roteiro.',
      logErrors,
      executionTimeMs: Date.now() - startTime
    };
  }

  // STEP 2: Validação de Entrada
  if (!input.destination || !input.destination.name || typeof input.destination.name !== 'string') {
    logErrors.push('[Input Guard] Destino normalizado é obrigatório.');
  }
  if (!input.startDate || !input.endDate || input.startDate > input.endDate) {
    logErrors.push(`[Input Guard] Período de viagem inválido (${input.startDate} a ${input.endDate}).`);
  }
  if (!Array.isArray(input.factualPois) || input.factualPois.length === 0) {
    logErrors.push('[Input Guard] Catálogo de POIs factuais não pode ser vazio.');
  }

  if (logErrors.length > 0) {
    const fallback = generateFactualFallback(input);
    return {
      success: false,
      itinerary: fallback,
      isFallback: true,
      promptVersion: PROMPT_VERSION,
      userMessage: 'Não foi possível gerar o roteiro devido a dados de entrada incompletos.',
      logErrors,
      executionTimeMs: Date.now() - startTime
    };
  }

  // Prepara o contexto de validação do contrato
  const validationContext: ValidationContext = {
    tripStartDate: input.startDate,
    tripEndDate: input.endDate,
    providedPois: input.factualPois,
    currentDate: new Date().toISOString().split('T')[0],
    allowExtraProperties: false
  };

  let attempt = 0;
  const maxRetries = 2; // Até 3 chamadas no total
  let lastRetryFeedback = '';

  while (attempt <= maxRetries) {
    attempt++;

    // STEP 3: Contexto Estruturado
    const taskPrompt = buildTaskPrompt({
      destinationName: input.destination.name,
      destinationCountry: input.destination.country,
      latitude: input.destination.latitude,
      longitude: input.destination.longitude,
      startDate: input.startDate,
      endDate: input.endDate,
      userInterests: input.preferences.interests || [],
      userBudget: input.preferences.budget || 'moderado',
      userStyle: input.preferences.style || 'cultural',
      userTransport: input.preferences.transport || 'caminhada',
      factualWeather: input.factualWeather || [],
      factualPois: input.factualPois,
      retryFeedback: lastRetryFeedback
    });

    // STEP 4: Chamada ao Gemini com Timeout de 15s
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const reqPayload: GenerateItineraryServerRequest = {
      systemInstruction: SYSTEM_INSTRUCTION_V1,
      taskPrompt,
      authToken: input.authToken,
      mockResponseOverride: input.mockResponseOverride,
      simulateTimeout: input.simulateTimeout,
      simulateServerError: input.simulateServerError
    };

    try {
      const serverRes = await handleGenerateItineraryApi(reqPayload, controller.signal);
      clearTimeout(timeoutId);

      if (!serverRes.success || !serverRes.rawJson) {
        logErrors.push(`[Attempt #${attempt}] Erro do provedor Gemini: ${serverRes.errorMessage || 'Sem resposta.'}`);
        lastRetryFeedback = `A API retornou erro: ${serverRes.errorMessage}`;
        continue;
      }

      // STEP 5: Parse JSON
      let parsedJson: any;
      try {
        parsedJson = JSON.parse(serverRes.rawJson);
      } catch (parseErr: any) {
        logErrors.push(`[Attempt #${attempt}] Falha no Parse JSON da resposta: ${parseErr.message}`);
        lastRetryFeedback = `O JSON retornado é inválido e não pôde ser analisado. Responda APENAS com um objeto JSON válido.`;
        continue;
      }

      // STEP 6: Validação do Schema e Validação de placeIds / Datas
      const contractVal = validateItineraryContract(parsedJson, validationContext);

      if (contractVal.isValid) {
        // SUCESSO! Roteiro 100% aprovado pelo contrato
        return {
          success: true,
          itinerary: parsedJson as SmartTripItineraryContract,
          isFallback: false,
          promptVersion: PROMPT_VERSION,
          userMessage: 'Roteiro gerado com sucesso!',
          logErrors: [],
          executionTimeMs: Date.now() - startTime
        };
      } else {
        // Validação falhou: registra erros e prepara feedback para retry
        logErrors.push(`[Attempt #${attempt}] Falha na validação do contrato: ${contractVal.logErrors.join(' | ')}`);
        lastRetryFeedback = contractVal.logErrors.join('\n');
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      logErrors.push(`[Attempt #${attempt}] Exceção na chamada: ${err.message || err}`);
    }
  }

  // STEP 8: Se persistir inválido após todas as tentativas, ativa o Fallback Factual Seguro
  logErrors.push('[Resilience Fallback] Máximo de tentativas atingido. Ativando roteiro determinístico factual.');
  const fallbackItinerary = generateFactualFallback(input);

  return {
    success: false,
    itinerary: fallbackItinerary,
    isFallback: true,
    promptVersion: PROMPT_VERSION,
    userMessage: 'Não foi possível gerar um roteiro personalizado com a IA neste momento. Exibindo sugestão determinística de locais confiáveis.',
    logErrors,
    executionTimeMs: Date.now() - startTime
  };
}

/**
 * Gera um roteiro Factual Determinístico Seguro baseado nos POIs mais bem avaliados do destino.
 * Usado em caso de indisponibilidade ou falha persistente da IA.
 */
export function generateFactualFallback(input: GenerateItineraryInput): SmartTripItineraryContract {
  const pois: NormalizedPoi[] = (input.factualPois && input.factualPois.length > 0) ? input.factualPois : [
    {
      id: 'ChIJ_DEFAULT_1',
      name: `Centro Histórico de ${input.destination?.name || 'Destino'}`,
      category: 'pontos_historicos',
      address: `Região central de ${input.destination?.name || 'Destino'}`,
      latitude: input.destination?.latitude || 0,
      longitude: input.destination?.longitude || 0,
      rating: null,
      provider: 'smarttrip_mock'
    }
  ];

  const sortedPois = [...pois].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  const periods = ['manhã', 'tarde', 'noite'];

  // Gera dias entre startDate e endDate
  const daysList: any[] = [];
  const start = new Date(input.startDate || '2026-09-20');
  const end = new Date(input.endDate || '2026-09-22');

  let poiIdx = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayActivities: any[] = [];

    // Adiciona 2 a 3 atividades por dia usando os POIs reais
    const count = Math.min(2, sortedPois.length);
    for (let a = 0; a < count; a++) {
      const selectedPoi = sortedPois[poiIdx % sortedPois.length];
      dayActivities.push({
        placeId: selectedPoi.id,
        name: selectedPoi.name,
        periodOrTime: periods[a % periods.length],
        justification: `Local selecionado pela alta avaliação em ${input.destination?.name || 'destino'}.`
      });
      poiIdx++;
    }

    daysList.push({
      date: dateStr,
      weatherSummary: null, // Fallback seguro sem dados inventados
      activities: dayActivities
    });
  }

  return {
    title: `Sugestão de Viagem para ${input.destination?.name || 'Destino'}`,
    summary: `Roteiro factual sugerido com os principais pontos de interesse de ${input.destination?.name || 'destino'}.`,
    alerts: [
      'Sugestão gerada via modo de resiliência factual. Verifique horários de funcionamento locais.'
    ],
    days: daysList
  };
}
