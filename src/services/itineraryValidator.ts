/**
 * VALIDADOR DE CONTRATO DO ROTEIRO SMARTTRIP
 * 
 * Centraliza a validação reutilizável do contrato do roteiro antes da integração real com Gemini.
 * Garante que a saída atenda a todas as invariantes e regras de segurança sem chamar a API do Gemini.
 */

import {
  SmartTripItineraryContract,
  ValidationContext,
  ValidationResult,
  DayPlanContract,
  ActivityContract,
  WeatherSummaryContract
} from '../types/itinerary';
import { NormalizedPoi } from './places';

// Re-exporta tipos para conveniência sem duplicar definições
export type {
  SmartTripItineraryContract,
  ValidationContext,
  ValidationResult,
  DayPlanContract,
  ActivityContract,
  WeatherSummaryContract
};

const ALLOWED_ROOT_KEYS = new Set(['title', 'summary', 'alerts', 'days']);
const ALLOWED_DAY_KEYS = new Set(['date', 'weatherSummary', 'activities']);
const ALLOWED_WEATHER_KEYS = new Set(['condition', 'tempMin', 'tempMax', 'rainProbability']);
const ALLOWED_ACTIVITY_KEYS = new Set(['placeId', 'name', 'periodOrTime', 'justification', 'notes']);

/**
 * Valida um payload de roteiro contra o contrato estrito SmartTrip e o contexto fornecido.
 */
export function validateItineraryContract(
  itinerary: any,
  context: ValidationContext
): ValidationResult {
  const logErrors: string[] = [];
  const allowExtra = context.allowExtraProperties === true;

  // 1. Validação Primária de Objeto
  if (itinerary === null || itinerary === undefined || typeof itinerary !== 'object' || Array.isArray(itinerary)) {
    logErrors.push('Payload do roteiro inválido: deve ser um objeto JSON não nulo.');
    return buildResult(logErrors);
  }

  // 1.1. Validação de Campos Extras no Nível Raiz
  if (!allowExtra) {
    const rootKeys = Object.keys(itinerary);
    for (const key of rootKeys) {
      if (!ALLOWED_ROOT_KEYS.has(key)) {
        logErrors.push(`Campo extra não permitido no nível raiz: "${key}".`);
      }
    }
  }

  // 2. Validação do Campo "title"
  if (!('title' in itinerary)) {
    logErrors.push('Campo obrigatório ausente: "title".');
  } else if (typeof itinerary.title !== 'string') {
    logErrors.push(`Tipo incorreto para "title": esperado string, recebido ${typeof itinerary.title}.`);
  } else if (itinerary.title.trim().length === 0) {
    logErrors.push('O campo "title" não pode ser vazio ou conter apenas espaços.');
  } else if (itinerary.title.trim().length < 5) {
    logErrors.push(`O campo "title" é muito curto: mínimo de 5 caracteres (${itinerary.title.trim().length} fornecido).`);
  } else if (itinerary.title.length > 100) {
    logErrors.push(`O campo "title" excede o limite máximo de 100 caracteres (${itinerary.title.length} fornecido).`);
  }

  // 3. Validação do Campo "summary"
  if (!('summary' in itinerary)) {
    logErrors.push('Campo obrigatório ausente: "summary".');
  } else if (typeof itinerary.summary !== 'string') {
    logErrors.push(`Tipo incorreto para "summary": esperado string, recebido ${typeof itinerary.summary}.`);
  } else if (itinerary.summary.trim().length < 10) {
    logErrors.push(`O campo "summary" é muito curto: mínimo de 10 caracteres.`);
  } else if (itinerary.summary.length > 300) {
    logErrors.push(`O campo "summary" excede o limite máximo de 300 caracteres.`);
  }

  // 4. Validação do Campo "alerts"
  if (!('alerts' in itinerary)) {
    logErrors.push('Campo obrigatório ausente: "alerts".');
  } else if (!Array.isArray(itinerary.alerts)) {
    logErrors.push(`Tipo incorreto para "alerts": esperado array de strings, recebido ${typeof itinerary.alerts}.`);
  } else {
    itinerary.alerts.forEach((alertItem: any, idx: number) => {
      if (typeof alertItem !== 'string') {
        logErrors.push(`Tipo incorreto em "alerts[${idx}]": esperado string, recebido ${typeof alertItem}.`);
      } else if (alertItem.length > 200) {
        logErrors.push(`Alerta em "alerts[${idx}]" excede o limite de 200 caracteres.`);
      }
    });
  }

  // 5. Validação do Campo "days"
  if (!('days' in itinerary)) {
    logErrors.push('Campo obrigatório ausente: "days".');
    return buildResult(logErrors);
  } else if (!Array.isArray(itinerary.days)) {
    logErrors.push(`Tipo incorreto para "days": esperado array, recebido ${typeof itinerary.days}.`);
    return buildResult(logErrors);
  } else if (itinerary.days.length === 0) {
    logErrors.push('O campo "days" deve ser uma lista não-vazia (mínimo 1 dia).');
    return buildResult(logErrors);
  }

  // Mapeamento O(1) de POIs factuais por ID
  const poiMap = new Map<string, NormalizedPoi>();
  if (Array.isArray(context.providedPois)) {
    context.providedPois.forEach(poi => {
      if (poi && poi.id) {
        poiMap.set(poi.id, poi);
      }
    });
  }

  const refDate = context.currentDate ? new Date(context.currentDate) : new Date();

  // 6. Validação Detalhada de Cada Dia
  itinerary.days.forEach((day: any, dayIdx: number) => {
    const dayLabel = `Dia #${dayIdx + 1}`;

    if (day === null || typeof day !== 'object' || Array.isArray(day)) {
      logErrors.push(`${dayLabel}: Deve ser um objeto JSON válido.`);
      return;
    }

    // Campos extras no dia
    if (!allowExtra) {
      Object.keys(day).forEach(key => {
        if (!ALLOWED_DAY_KEYS.has(key)) {
          logErrors.push(`${dayLabel}: Campo extra não permitido: "${key}".`);
        }
      });
    }

    // 6.1. Data do Dia
    if (!('date' in day)) {
      logErrors.push(`${dayLabel}: Campo obrigatório ausente: "date".`);
    } else if (typeof day.date !== 'string') {
      logErrors.push(`${dayLabel}: Tipo incorreto para "date": esperado string, recebido ${typeof day.date}.`);
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date)) {
      logErrors.push(`${dayLabel}: Formato de data inválido "${day.date}". Esperado YYYY-MM-DD.`);
    } else {
      // Regra: Data deve pertencer ao período da viagem
      if (day.date < context.tripStartDate || day.date > context.tripEndDate) {
        logErrors.push(`${dayLabel}: Data "${day.date}" fora do período da viagem (${context.tripStartDate} a ${context.tripEndDate}).`);
      }

      // Regra: Não inventar clima numérico fora do horizonte (> 14 dias)
      const dayDateObj = new Date(day.date);
      const diffDays = Math.round((dayDateObj.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 14 || diffDays < 0) {
        if (day.weatherSummary !== null && typeof day.weatherSummary === 'object') {
          if (day.weatherSummary.tempMin !== null || day.weatherSummary.tempMax !== null) {
            logErrors.push(`${dayLabel}: Previsão meteorológica numérica proibida para datas fora do horizonte (${day.date}). O campo "weatherSummary" deve ser null.`);
          }
        }
      }
    }

    // 6.2. WeatherSummary
    if (!('weatherSummary' in day)) {
      logErrors.push(`${dayLabel}: Campo obrigatório ausente: "weatherSummary" (utilize null se indisponível).`);
    } else if (day.weatherSummary !== null) {
      if (typeof day.weatherSummary !== 'object' || Array.isArray(day.weatherSummary)) {
        logErrors.push(`${dayLabel}: Tipo incorreto para "weatherSummary": esperado objeto ou null, recebido ${typeof day.weatherSummary}.`);
      } else {
        if (!allowExtra) {
          Object.keys(day.weatherSummary).forEach(key => {
            if (!ALLOWED_WEATHER_KEYS.has(key)) {
              logErrors.push(`${dayLabel}, weatherSummary: Campo extra não permitido: "${key}".`);
            }
          });
        }

        if (!('condition' in day.weatherSummary) || typeof day.weatherSummary.condition !== 'string') {
          logErrors.push(`${dayLabel}, weatherSummary: Campo "condition" é obrigatório e deve ser string.`);
        }
      }
    }

    // 6.3. Atividades
    if (!('activities' in day)) {
      logErrors.push(`${dayLabel}: Campo obrigatório ausente: "activities".`);
    } else if (!Array.isArray(day.activities)) {
      logErrors.push(`${dayLabel}: Tipo incorreto para "activities": esperado array, recebido ${typeof day.activities}.`);
    } else if (day.activities.length === 0) {
      logErrors.push(`${dayLabel}: Lista de "activities" não pode ser vazia (mínimo 1 atividade).`);
    } else if (day.activities.length > 6) {
      logErrors.push(`${dayLabel}: Não pode conter mais de 6 atividades por dia (${day.activities.length} fornecido).`);
    } else {
      day.activities.forEach((act: any, actIdx: number) => {
        const actLabel = `${dayLabel}, Atividade #${actIdx + 1}`;

        if (act === null || typeof act !== 'object' || Array.isArray(act)) {
          logErrors.push(`${actLabel}: Deve ser um objeto JSON.`);
          return;
        }

        if (!allowExtra) {
          Object.keys(act).forEach(key => {
            if (!ALLOWED_ACTIVITY_KEYS.has(key)) {
              logErrors.push(`${actLabel}: Campo extra não permitido: "${key}".`);
            }
          });
        }

        // placeId
        if (!('placeId' in act)) {
          logErrors.push(`${actLabel}: Campo obrigatório ausente: "placeId".`);
        } else if (typeof act.placeId !== 'string' || act.placeId.trim() === '') {
          logErrors.push(`${actLabel}: O campo "placeId" não pode ser vazio ou de tipo incorreto.`);
        } else {
          // Regra: placeId deve existir na lista factual fornecida
          const matchedPoi = poiMap.get(act.placeId);
          if (!matchedPoi) {
            logErrors.push(`${actLabel}: O placeId "${act.placeId}" é desconhecido (não consta no catálogo de POIs fornecido).`);
          } else if (act.name && typeof act.name === 'string' && act.name.trim().toLowerCase() !== matchedPoi.name.trim().toLowerCase()) {
            logErrors.push(`${actLabel}: Nome "${act.name}" incoerente com o nome factual "${matchedPoi.name}" do POI.`);
          }
        }

        // name
        if (!('name' in act)) {
          logErrors.push(`${actLabel}: Campo obrigatório ausente: "name".`);
        } else if (typeof act.name !== 'string' || act.name.trim() === '') {
          logErrors.push(`${actLabel}: O campo "name" é obrigatório e deve ser uma string.`);
        }

        // periodOrTime
        if (!('periodOrTime' in act)) {
          logErrors.push(`${actLabel}: Campo obrigatório ausente: "periodOrTime".`);
        } else if (typeof act.periodOrTime !== 'string') {
          logErrors.push(`${actLabel}: Tipo incorreto para "periodOrTime": esperado string, recebido ${typeof act.periodOrTime}.`);
        } else if (act.periodOrTime.length > 30) {
          logErrors.push(`${actLabel}: O campo "periodOrTime" excede o limite máximo de 30 caracteres.`);
        }

        // justification
        if (!('justification' in act)) {
          logErrors.push(`${actLabel}: Campo obrigatório ausente: "justification".`);
        } else if (typeof act.justification !== 'string') {
          logErrors.push(`${actLabel}: Tipo incorreto para "justification": esperado string, recebido ${typeof act.justification}.`);
        } else if (act.justification.length > 150) {
          logErrors.push(`${actLabel}: A justificativa excede o limite máximo de 150 caracteres (${act.justification.length} caracteres).`);
        }

        // notes (opcional)
        if ('notes' in act && act.notes !== undefined && act.notes !== null) {
          if (typeof act.notes !== 'string') {
            logErrors.push(`${actLabel}: Tipo incorreto para "notes": esperado string.`);
          } else if (act.notes.length > 150) {
            logErrors.push(`${actLabel}: O campo "notes" excede o limite de 150 caracteres.`);
          }
        }
      });
    }
  });

  return buildResult(logErrors);
}

/**
 * Constrói uma resposta padronizada com erros técnicos legíveis para logs e mensagem segura para o usuário.
 */
function buildResult(logErrors: string[]): ValidationResult {
  const isValid = logErrors.length === 0;
  
  let userMessage = 'Roteiro validado com sucesso.';
  if (!isValid) {
    userMessage = 'Não foi possível validar o roteiro gerado devido a inconsistências de estrutura ou dados factuais. Por favor, tente gerar novamente.';
  }

  return {
    isValid,
    logErrors,
    userMessage
  };
}
