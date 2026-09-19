/**
 * Google Gemini Service Stub
 * Para ser implementado na Fase 2 (Geração de Roteiro via IA)
 */

export interface GenerateTripParams {
  destination: string;
  startDate: string;
  endDate: string;
  preferences?: string[];
  weatherContext?: string;
}

export const generateTripItinerary = async (_params: GenerateTripParams): Promise<null> => {
  // Mock stub - Implementação real na Fase 2
  return null;
};
