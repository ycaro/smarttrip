/**
 * CONTRATO DE PROVEDOR EXTERNO DE DESTINOS
 * Define a interface genérica para conectores de APIs externas (Google Places, Nominatim, Mapbox, Mock).
 */

export interface RawProviderDestination {
  id?: string;
  name?: string;
  city?: string;
  state?: string;
  country?: string;
  country_code?: string;
  lat?: number | string;
  lng?: number | string;
  lon?: number | string;
  formatted?: string;
  confidence?: number;
  rawJSON?: any;
}

export interface IDestinationProvider {
  name: 'google_places' | 'nominatim' | 'mapbox' | 'smarttrip_mock';
  search(query: string, limit?: number, signal?: AbortSignal): Promise<RawProviderDestination[]>;
}
