/**
 * Places / Geocoding Service Stub
 * Para ser implementado na Fase 2 (Busca de Destino e POIs)
 */

export interface PlacePOI {
  id: string;
  name: string;
  category: string;
  rating?: number;
}

export const searchPlaces = async (_query: string): Promise<PlacePOI[]> => {
  // Mock stub - Implementação real na Fase 2
  return [];
};
