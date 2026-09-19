/**
 * SmartTrip Itinerary Output Contract & Validator
 * 
 * Este módulo define os tipos do contrato estruturado do roteiro SmartTrip
 * e fornece funções utilitárias simples para alunos e validadores verificarem
 * a conformidade de roteiros gerados contra o contexto da viagem e POIs factuais.
 */

import { NormalizedPoi } from './places';

export interface WeatherSummaryContract {
  condition: string;
  tempMin: number | null;
  tempMax: number | null;
  rainProbability: number | null;
}

export interface ActivityContract {
  placeId: string;
  name: string;
  periodOrTime: string;
  justification: string;
  notes?: string;
}

export interface DayPlanContract {
  date: string; // YYYY-MM-DD
  weatherSummary: WeatherSummaryContract | null;
  activities: ActivityContract[];
}

export interface SmartTripItineraryContract {
  title: string;
  summary: string;
  alerts: string[];
  days: DayPlanContract[];
}

export interface ValidationContext {
  tripStartDate: string; // YYYY-MM-DD
  tripEndDate: string;   // YYYY-MM-DD
  providedPois: NormalizedPoi[];
  currentDate?: string;  // YYYY-MM-DD (para verificação do horizonte meteorológico)
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Valida um roteiro de viagem contra o contrato estrito SmartTrip e o contexto fornecido.
 */
export function validateItineraryContract(
  itinerary: any,
  context: ValidationContext
): ValidationResult {
  const errors: string[] = [];

  if (!itinerary || typeof itinerary !== 'object') {
    return { isValid: false, errors: ['O roteiro deve ser um objeto JSON válido.'] };
  }

  // 1. Validação de Campos Raiz
  if (!itinerary.title || typeof itinerary.title !== 'string' || itinerary.title.trim().length < 5) {
    errors.push('O campo "title" é obrigatório e deve conter no mínimo 5 caracteres.');
  } else if (itinerary.title.length > 100) {
    errors.push('O campo "title" deve ter no máximo 100 caracteres.');
  }

  if (!itinerary.summary || typeof itinerary.summary !== 'string' || itinerary.summary.trim().length < 10) {
    errors.push('O campo "summary" é obrigatório e deve conter no mínimo 10 caracteres.');
  } else if (itinerary.summary.length > 300) {
    errors.push('O campo "summary" deve ter no máximo 300 caracteres.');
  }

  if (!Array.isArray(itinerary.alerts)) {
    errors.push('O campo "alerts" deve ser uma lista (array) de strings, podendo ser vazia [].');
  } else {
    itinerary.alerts.forEach((alert: any, idx: number) => {
      if (typeof alert !== 'string' || alert.length > 200) {
        errors.push(`O alerta #${idx + 1} deve ser uma string de até 200 caracteres.`);
      }
    });
  }

  if (!Array.isArray(itinerary.days) || itinerary.days.length === 0) {
    errors.push('O campo "days" deve ser uma lista não-vazia de dias.');
    return { isValid: false, errors };
  }

  // Mapeamento de POIs factuais por ID para busca O(1)
  const poiMap = new Map<string, NormalizedPoi>();
  context.providedPois.forEach(poi => {
    poiMap.set(poi.id, poi);
  });

  const refDate = context.currentDate ? new Date(context.currentDate) : new Date();

  // 2. Validação de Dias e Atividades
  itinerary.days.forEach((day: any, dayIdx: number) => {
    const dayLabel = `Dia #${dayIdx + 1}`;

    if (!day.date || typeof day.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day.date)) {
      errors.push(`${dayLabel}: O campo "date" é obrigatório no formato YYYY-MM-DD.`);
    } else {
      // Invariante: Pertencimento ao intervalo da viagem
      if (day.date < context.tripStartDate || day.date > context.tripEndDate) {
        errors.push(`${dayLabel}: A data "${day.date}" está fora do intervalo da viagem (${context.tripStartDate} a ${context.tripEndDate}).`);
      }

      // Invariante: Ausência de Clima Fictício fora do horizonte (> 14 dias)
      const dayDateObj = new Date(day.date);
      const diffDays = Math.round((dayDateObj.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays > 14 || diffDays < 0) {
        if (day.weatherSummary !== null) {
          // Se tiver dados numéricos específicos quando fora do horizonte, é erro
          if (day.weatherSummary.tempMin !== null || day.weatherSummary.tempMax !== null) {
            errors.push(`${dayLabel}: Previsão meteorológica numérica proibida para datas fora do horizonte (${day.date}). O campo "weatherSummary" deve ser null.`);
          }
        }
      }
    }

    // Validação do objeto weatherSummary se presente
    if (day.weatherSummary !== null && typeof day.weatherSummary === 'object') {
      if (typeof day.weatherSummary.condition !== 'string') {
        errors.push(`${dayLabel}: "weatherSummary.condition" deve ser uma string.`);
      }
    }

    // Validação de atividades
    if (!Array.isArray(day.activities) || day.activities.length === 0) {
      errors.push(`${dayLabel}: Deve conter ao menos 1 atividade.`);
    } else if (day.activities.length > 6) {
      errors.push(`${dayLabel}: Não pode conter mais de 6 atividades por dia.`);
    } else {
      day.activities.forEach((act: any, actIdx: number) => {
        const actLabel = `${dayLabel}, Atividade #${actIdx + 1}`;

        if (!act.placeId || typeof act.placeId !== 'string') {
          errors.push(`${actLabel}: O campo "placeId" é obrigatório.`);
        } else {
          // Invariante: Rastreabilidade Factual de Locais
          const matchedPoi = poiMap.get(act.placeId);
          if (!matchedPoi) {
            errors.push(`${actLabel}: O placeId "${act.placeId}" não existe no catálogo factual de POIs fornecidos.`);
          } else {
            // Nome deve corresponder ao POI factual
            if (act.name && act.name.trim().toLowerCase() !== matchedPoi.name.trim().toLowerCase()) {
              errors.push(`${actLabel}: O nome "${act.name}" não corresponde ao nome factual "${matchedPoi.name}" do POI.`);
            }
          }
        }

        if (!act.name || typeof act.name !== 'string') {
          errors.push(`${actLabel}: O campo "name" é obrigatório.`);
        }

        if (!act.periodOrTime || typeof act.periodOrTime !== 'string' || act.periodOrTime.length > 30) {
          errors.push(`${actLabel}: O campo "periodOrTime" é obrigatório (máximo 30 caracteres).`);
        }

        if (!act.justification || typeof act.justification !== 'string') {
          errors.push(`${actLabel}: O campo "justification" é obrigatório.`);
        } else if (act.justification.length > 150) {
          errors.push(`${actLabel}: A justificativa excede 150 caracteres (possui ${act.justification.length} caracteres).`);
        }

        if (act.notes && (typeof act.notes !== 'string' || act.notes.length > 150)) {
          errors.push(`${actLabel}: O campo "notes" (se informado) deve ter no máximo 150 caracteres.`);
        }
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}
