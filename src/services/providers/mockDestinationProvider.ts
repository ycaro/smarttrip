import { IDestinationProvider, RawProviderDestination } from './destinationProviderInterface';

/**
 * PROVEDOR MOCK DE DESTINOS
 * Simula dados brutos retornado por APIs de geocoding com suporte a simulação de erros e timeouts.
 */
export class MockDestinationProvider implements IDestinationProvider {
  name: 'google_places' | 'nominatim' | 'mapbox' | 'smarttrip_mock' = 'smarttrip_mock';

  private simulateErrorFlag = false;
  private simulateDelayMs = 0;

  public setSimulateError(shouldError: boolean) {
    this.simulateErrorFlag = shouldError;
  }

  public setSimulateDelay(delayMs: number) {
    this.simulateDelayMs = delayMs;
  }

  async search(query: string, limit = 5, signal?: AbortSignal): Promise<RawProviderDestination[]> {
    // 1. Simulação de atraso/timeout
    if (this.simulateDelayMs > 0) {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, this.simulateDelayMs);
        if (signal) {
          signal.addEventListener('abort', () => {
            clearTimeout(timer);
            const err: any = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          });
        }
      });
    }

    if (signal?.aborted) {
      const err: any = new Error('The operation was aborted');
      err.name = 'AbortError';
      throw err;
    }

    // 2. Simulação de Erro do Provedor (ex: HTTP 500)
    if (this.simulateErrorFlag) {
      throw new Error('[Provider Error] HTTP 500: Erro interno no servidor de geocoding');
    }

    const q = query.toLowerCase().trim();

    // 3. Base de dados bruta do provedor (incluindo respostas incompletas e acentuadas)
    const database: RawProviderDestination[] = [
      {
        id: 'raw_lisbon',
        name: 'Lisboa',
        city: 'Lisboa',
        state: 'Distrito de Lisboa',
        country: 'Portugal',
        country_code: 'pt',
        lat: 38.7223,
        lng: -9.1393,
        formatted: 'Lisboa, Portugal',
        confidence: 0.98,
      },
      {
        id: 'raw_porto',
        name: 'Porto',
        city: 'Porto',
        state: 'Distrito do Porto',
        country: 'Portugal',
        country_code: 'pt',
        lat: 41.1579,
        lng: -8.6291,
        formatted: 'Porto, Portugal',
        confidence: 0.95,
      },
      {
        id: 'raw_paris',
        name: 'Paris',
        city: 'Paris',
        state: 'Île-de-France',
        country: 'França',
        country_code: 'fr',
        lat: 48.8566,
        lng: 2.3522,
        formatted: 'Paris, França',
        confidence: 0.99,
      },
      {
        id: 'raw_santiago_chile',
        name: 'Santiago',
        city: 'Santiago',
        state: 'Región Metropolitana',
        country: 'Chile',
        country_code: 'cl',
        lat: -33.4489,
        lng: -70.6693,
        formatted: 'Santiago, Región Metropolitana, Chile',
        confidence: 0.95,
      },
      {
        id: 'raw_santiago_espanha',
        name: 'Santiago de Compostela',
        city: 'Santiago de Compostela',
        state: 'Galícia',
        country: 'Espanha',
        country_code: 'es',
        lat: 42.8782,
        lng: -8.5448,
        formatted: 'Santiago de Compostela, Galícia, Espanha',
        confidence: 0.91,
      },
      // Resposta Incompleta (Campos ausentes para teste de resiliência)
      {
        id: 'raw_incomplete_city',
        name: 'Incompleta City',
        city: 'Incompleta City',
        // state, country, country_code e lat/lng omitidos intencionalmente!
      },
      // Cidade Acentuada
      {
        id: 'raw_sao_paulo',
        name: 'São Paulo',
        city: 'São Paulo',
        state: 'São Paulo',
        country: 'Brasil',
        country_code: 'br',
        lat: -23.5505,
        lng: -46.6333,
        formatted: 'São Paulo, SP, Brasil',
        confidence: 0.97,
      },
      {
        id: 'raw_tokyo',
        name: 'Tóquio',
        city: 'Tóquio',
        state: 'Kantō',
        country: 'Japão',
        country_code: 'jp',
        lat: 35.6762,
        lng: 139.6503,
        formatted: 'Tóquio, Japão',
        confidence: 0.98,
      },
      {
        id: 'raw_florianopolis',
        name: 'Florianópolis',
        city: 'Florianópolis',
        state: 'Santa Catarina',
        country: 'Brasil',
        country_code: 'br',
        lat: -27.5948,
        lng: -48.5482,
        formatted: 'Florianópolis, SC, Brasil',
        confidence: 0.96,
      },
      {
        id: 'raw_munchen',
        name: 'München',
        city: 'München',
        state: 'Baviera',
        country: 'Alemanha',
        country_code: 'de',
        lat: 48.1351,
        lng: 11.582,
        formatted: 'München, Baviera, Alemanha',
        confidence: 0.94,
      },
    ];

    if (!q) return [];

    return database
      .filter((item) => {
        const n = item.name?.toLowerCase() || '';
        const c = item.country?.toLowerCase() || '';
        const f = item.formatted?.toLowerCase() || '';
        return n.includes(q) || c.includes(q) || f.includes(q);
      })
      .slice(0, limit);
  }
}
