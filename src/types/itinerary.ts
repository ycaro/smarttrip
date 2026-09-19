/**
 * SMARTTRIP ITINERARY CONTRACT TYPES
 * 
 * Contrato centralizado e único para o roteiro de viagem SmartTrip.
 * NENHUM tipo deste contrato deve ser duplicado em outros arquivos.
 */

import { NormalizedPoi } from '../services/places';

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
  allowExtraProperties?: boolean; // Padrão: false (Rejeita campos extras não especificados)
}

export interface ValidationResult {
  isValid: boolean;
  logErrors: string[];   // Detalhamento técnico legível para logs de depuração
  userMessage: string;    // Resposta segura, amigável e higienizada para exibição ao usuário
}
