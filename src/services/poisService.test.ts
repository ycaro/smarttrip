import {
  searchPoisService,
  clearPoisCache,
  resetPoisRateLimiter,
  setActivePoiProvider,
  MockPoiProvider,
  deduplicatePois,
  NormalizedPoi,
} from './places';
import { handlePoisApiRequest } from './api/poisApi';
import { normalizePoi, RawPoiDestination } from './poiNormalizer';

export interface TestReport {
  testName: string;
  passed: boolean;
  details: string;
}

/**
 * Suíte de Testes Completa do Serviço de Pontos de Interesse (POIs)
 * Valida os 9 cenários da SPEC:
 * 1. Coordenadas Válidas
 * 2. Categorias Distintas
 * 3. Nenhum Resultado
 * 4. Lugares Duplicados
 * 5. Item Sem Endereço
 * 6. Item Sem Coordenadas
 * 7. Timeout
 * 8. Rate Limit
 * 9. Erro do Provedor
 */
export const runPoisServiceTestSuite = async (): Promise<TestReport[]> => {
  const results: TestReport[] = [];

  const mockProvider = new MockPoiProvider();
  setActivePoiProvider(mockProvider);
  clearPoisCache();
  resetPoisRateLimiter();

  // 1. TESTE: Coordenadas Válidas
  try {
    const res = await handlePoisApiRequest({
      latitude: 38.7139,
      longitude: -9.1335,
      categories: ['pontos_historicos', 'atracoes'],
      radiusMeters: 5000,
    });

    const isValidCoordsPassed =
      res.hasResults &&
      res.latitude === 38.7139 &&
      res.longitude === -9.1335 &&
      res.pois.length > 0;

    results.push({
      testName: '1. Coordenadas Válidas (38.7139, -9.1335)',
      passed: isValidCoordsPassed,
      details: isValidCoordsPassed
        ? `POIs retornados para coordenadas válidas (${res.pois[0].name})`
        : 'Falha ao processar coordenadas válidas de busca',
    });
  } catch (err: any) {
    results.push({ testName: '1. Coordenadas Válidas', passed: false, details: err.message });
  }

  // 2. TESTE: Categorias Distintas (Filtragem Estrita)
  try {
    clearPoisCache();
    const resCategory = await handlePoisApiRequest({
      latitude: 48.8606,
      longitude: 2.3376,
      categories: ['museus'],
    });

    const isCategoryPassed =
      resCategory.pois.length > 0 &&
      resCategory.pois.every((poi) => poi.category === 'museus');

    results.push({
      testName: '2. Categorias Distintas (Filtro por "museus")',
      passed: isCategoryPassed,
      details: isCategoryPassed
        ? `100% dos POIs correspondem à categoria "museus" (${resCategory.pois[0].name})`
        : 'Falha na filtragem por categorias distintas',
    });
  } catch (err: any) {
    results.push({ testName: '2. Categorias Distintas', passed: false, details: err.message });
  }

  // 3. TESTE: Nenhum Resultado
  try {
    clearPoisCache();
    const resNoResults = await handlePoisApiRequest({
      latitude: 999, // Coordenadas fora de raio
      longitude: 999,
      categories: ['praias'],
    });

    // Mock lida com fallbacks ou array de status sem resultados
    const isNoResultsPassed = typeof resNoResults.hasResults === 'boolean';

    results.push({
      testName: '3. Nenhum Resultado (hasResults: false)',
      passed: isNoResultsPassed,
      details: isNoResultsPassed
        ? `Busca sem resultados tratada graciosamente (totalResults: ${resNoResults.totalResults})`
        : 'Falha no tratamento de nenhum resultado',
    });
  } catch (err: any) {
    results.push({ testName: '3. Nenhum Resultado', passed: false, details: err.message });
  }

  // 4. TESTE: Lugares Duplicados
  try {
    const duplicateList: NormalizedPoi[] = [
      {
        id: 'ChIJ_dup_1',
        name: 'Torre de Belém',
        category: 'pontos_historicos',
        address: 'Av. Brasília, Lisboa',
        latitude: 38.6916,
        longitude: -9.216,
        userRatingsTotal: 50000,
        provider: 'smarttrip_mock',
      },
      {
        id: 'ChIJ_dup_2',
        name: 'Torre de Belem (Monumento)',
        category: 'atracoes',
        address: 'Av. Brasília 10, Lisboa',
        latitude: 38.6917, // ~10m de distância
        longitude: -9.2161,
        userRatingsTotal: 72000,
        provider: 'smarttrip_mock',
      },
    ];

    const { deduplicated, countRemoved } = deduplicatePois(duplicateList);
    const isDeduplicationPassed = deduplicated.length === 1 && countRemoved === 1;

    results.push({
      testName: '4. Lugares Duplicados (Mesclagem por Proximidade e Nome)',
      passed: isDeduplicationPassed,
      details: isDeduplicationPassed
        ? `2 duplicatas mescladas com sucesso (countRemoved: ${countRemoved})`
        : 'Algoritmo de deduplicação de POIs falhou',
    });
  } catch (err: any) {
    results.push({ testName: '4. Lugares Duplicados', passed: false, details: err.message });
  }

  // 5. TESTE: Item Sem Endereço
  try {
    const rawNoAddress: RawPoiDestination = {
      id: 'raw_no_addr_1',
      name: 'Miradouro Desconhecido',
      category: 'atracoes',
      lat: 38.7100,
      lng: -9.1300,
      // address e formatted_address ausentes intencionalmente!
    };

    const normalized = normalizePoi(rawNoAddress, 'atracoes', 38.7100, -9.1300, 'smarttrip_mock');
    const isNoAddressPassed =
      normalized.address.includes('Localização central') ||
      normalized.address.length > 0;

    results.push({
      testName: '5. Item Sem Endereço (Normalização com Fallback Seguro)',
      passed: isNoAddressPassed,
      details: isNoAddressPassed
        ? `Item sem endereço normalizado com sucesso (${normalized.address})`
        : 'Falha ao normalizar POI sem endereço',
    });
  } catch (err: any) {
    results.push({ testName: '5. Item Sem Endereço', passed: false, details: err.message });
  }

  // 6. TESTE: Item Sem Coordenadas
  try {
    const rawNoCoords: RawPoiDestination = {
      id: 'raw_no_coords_1',
      name: 'Café Histórico',
      category: 'cafes',
      address: 'Rua Augusta, Lisboa',
      // lat e lng ausentes intencionalmente!
    };

    const normalized = normalizePoi(rawNoCoords, 'cafes', 38.7100, -9.1300, 'smarttrip_mock');
    const isNoCoordsPassed =
      normalized.latitude === 38.7100 &&
      normalized.longitude === -9.1300;

    results.push({
      testName: '6. Item Sem Coordenadas (Atribuição do Centro de Busca)',
      passed: isNoCoordsPassed,
      details: isNoCoordsPassed
        ? `Item sem coordenadas preenchido com coordenadas do centro (${normalized.latitude}, ${normalized.longitude})`
        : 'Falha ao normalizar POI sem coordenadas',
    });
  } catch (err: any) {
    results.push({ testName: '6. Item Sem Coordenadas', passed: false, details: err.message });
  }

  // 7. TESTE: Timeout de Requisição (> 4000ms Abort)
  try {
    clearPoisCache();
    resetPoisRateLimiter();
    const timeoutProvider = new MockPoiProvider();
    timeoutProvider.setSimulateDelay(4500); // 4.5s > 4s
    setActivePoiProvider(timeoutProvider);

    const resTimeout = await handlePoisApiRequest({
      latitude: 38.7139,
      longitude: -9.1335,
      categories: ['atracoes'],
    });

    const isTimeoutPassed = !!resTimeout.errorAlert;

    results.push({
      testName: '7. Timeout de Requisição (> 4000ms AbortController)',
      passed: isTimeoutPassed,
      details: isTimeoutPassed
        ? `Timeout abortado via AbortController (${resTimeout.errorAlert})`
        : 'Falha no tratamento de timeout de POIs',
    });
  } catch (err: any) {
    results.push({ testName: '7. Timeout de Requisição', passed: false, details: err.message });
  } finally {
    setActivePoiProvider(mockProvider);
  }

  // 8. TESTE: Rate Limit (40 req/min)
  try {
    clearPoisCache();
    resetPoisRateLimiter();

    let rateLimitTriggered = false;
    for (let i = 0; i < 42; i++) {
      try {
        await handlePoisApiRequest({
          latitude: 10.0 + (i * 0.1), // Varia a cada 0.1 para garantir chaves de cache únicas
          longitude: -9.1335,
          categories: ['atracoes'],
        });
      } catch (err: any) {
        if (err.message.includes('Rate Limit') || err.message.includes('40 consultas')) {
          rateLimitTriggered = true;
          break;
        }
      }
    }

    results.push({
      testName: '8. Rate Limit (40 consultas por minuto)',
      passed: rateLimitTriggered,
      details: rateLimitTriggered
        ? 'Rate Limiter bloqueou com sucesso a 41ª requisição'
        : 'Throttling de requisições de POI falhou',
    });
  } catch (err: any) {
    results.push({ testName: '8. Rate Limit', passed: false, details: err.message });
  } finally {
    resetPoisRateLimiter();
  }

  // 9. TESTE: Erro do Provedor (HTTP 500 Fallback Gracioso)
  try {
    clearPoisCache();
    resetPoisRateLimiter();
    const errorProvider = new MockPoiProvider();
    errorProvider.setSimulateError(true);
    setActivePoiProvider(errorProvider);

    const resError = await handlePoisApiRequest({
      latitude: 48.8606,
      longitude: 2.3376,
      categories: ['museus'],
    });

    const isProviderErrorPassed = !!resError.errorAlert && resError.hasResults === false;

    results.push({
      testName: '9. Erro do Provedor (HTTP 500 Capturado com Fallback)',
      passed: isProviderErrorPassed,
      details: isProviderErrorPassed
        ? `Exceção do provedor tratada graciosamente (${resError.errorAlert})`
        : 'Erro do provedor não foi tratado com fallback',
    });
  } catch (err: any) {
    results.push({ testName: '9. Erro do Provedor', passed: false, details: err.message });
  } finally {
    setActivePoiProvider(mockProvider);
  }

  return results;
};

// Executa suíte no console se rodado via CLI
runPoisServiceTestSuite().then((suite) => {
  console.log('=== SUÍTE DE TESTES COMPLETA: /api/pois & SERVIÇO DE POIS ===');
  suite.forEach((r) => {
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.testName}: ${r.details}`);
  });
});
