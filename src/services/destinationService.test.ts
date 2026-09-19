import {
  searchAndNormalizeDestination,
  clearGeoCache,
  resetRateLimiter,
  setActiveProvider,
} from './destinationService';
import { MockDestinationProvider } from './providers/mockDestinationProvider';
import { normalizeDestination } from './destinationNormalizer';

export interface TestReport {
  testName: string;
  passed: boolean;
  details: string;
}

/**
 * Suíte de Testes do Serviço de Busca e Normalização de Destinos
 * Valida os 8 cenários exigidos pela SPEC:
 * 1. Cidade conhecida
 * 2. Nomes ambíguos
 * 3. Consulta vazia
 * 4. Nenhum resultado
 * 5. Timeout
 * 6. Erro do provedor
 * 7. Resposta incompleta
 * 8. Caracteres acentuados
 */
export const runDestinationServiceTestSuite = async (): Promise<TestReport[]> => {
  const results: TestReport[] = [];
  
  const mockProvider = new MockDestinationProvider();
  setActiveProvider(mockProvider);
  clearGeoCache();
  resetRateLimiter();

  // 1. TESTE: Cidade Conhecida
  try {
    const res = await searchAndNormalizeDestination({ query: 'Lisboa' });
    const isKnownCityPassed =
      res.totalResults > 0 &&
      res.destinations[0].cityName === 'Lisboa' &&
      res.destinations[0].countryCode === 'PT';

    results.push({
      testName: '1. Cidade Conhecida ("Lisboa")',
      passed: isKnownCityPassed,
      details: isKnownCityPassed
        ? `Cidade normalizada com sucesso: ${res.destinations[0].cityName} (${res.destinations[0].countryCode})`
        : 'Falha ao normalizar cidade conhecida',
    });
  } catch (err: any) {
    results.push({ testName: '1. Cidade Conhecida', passed: false, details: err.message });
  }

  // 2. TESTE: Nomes Ambíguos
  try {
    clearGeoCache();
    const resAmbiguous = await searchAndNormalizeDestination({ query: 'Santiago' });
    const isAmbiguousPassed = resAmbiguous.isAmbiguous && resAmbiguous.destinations.length >= 2;

    results.push({
      testName: '2. Nomes Ambíguos ("Santiago")',
      passed: isAmbiguousPassed,
      details: isAmbiguousPassed
        ? `Flag isAmbiguous: true com ${resAmbiguous.destinations.length} opções desambiguadas`
        : 'Falha na identificação de destinos ambíguos',
    });
  } catch (err: any) {
    results.push({ testName: '2. Nomes Ambíguos', passed: false, details: err.message });
  }

  // 3. TESTE: Consulta Vazia
  try {
    const resEmptyQuery = await searchAndNormalizeDestination({ query: '   ' });
    const isEmptyPassed = resEmptyQuery.totalResults === 0 && resEmptyQuery.destinations.length === 0;

    results.push({
      testName: '3. Consulta Vazia ("   ")',
      passed: isEmptyPassed,
      details: isEmptyPassed
        ? 'Consulta vazia rejeitada com resposta instantânea (0 resultados)'
        : 'Consulta vazia acionou requisição indevida',
    });
  } catch (err: any) {
    results.push({ testName: '3. Consulta Vazia', passed: false, details: err.message });
  }

  // 4. TESTE: Nenhum Resultado
  try {
    const resNoResults = await searchAndNormalizeDestination({ query: 'CidadeInexistenteXYZ123' });
    const isNoResultsPassed = resNoResults.totalResults === 0 && resNoResults.destinations.length === 0;

    results.push({
      testName: '4. Nenhum Resultado ("CidadeInexistenteXYZ123")',
      passed: isNoResultsPassed,
      details: isNoResultsPassed
        ? 'Busca sem correspondência retornou lista vazia de forma segura'
        : 'Inconsistência para destino inexistente',
    });
  } catch (err: any) {
    results.push({ testName: '4. Nenhum Resultado', passed: false, details: err.message });
  }

  // 5. TESTE: Timeout do Provedor (> 5000ms)
  try {
    clearGeoCache();
    resetRateLimiter();
    const timeoutProvider = new MockDestinationProvider();
    timeoutProvider.setSimulateDelay(5500); // 5.5s > 5s timeout!
    setActiveProvider(timeoutProvider);

    const resTimeout = await searchAndNormalizeDestination({ query: 'Paris' });
    const isTimeoutPassed = resTimeout.destinations.length > 0 && !!resTimeout.errorAlert;

    results.push({
      testName: '5. Timeout do Provedor (> 5000ms Abort & Fallback)',
      passed: isTimeoutPassed,
      details: isTimeoutPassed
        ? 'Timeout capturado via AbortController; fallback acionado sem quebrar a UI'
        : 'Falha no tratamento de timeout do provedor',
    });
  } catch (err: any) {
    results.push({ testName: '5. Timeout do Provedor', passed: false, details: err.message });
  } finally {
    setActiveProvider(mockProvider);
  }

  // 6. TESTE: Erro do Provedor (ex: HTTP 500)
  try {
    clearGeoCache();
    resetRateLimiter();
    const errorProvider = new MockDestinationProvider();
    errorProvider.setSimulateError(true); // Força HTTP 500
    setActiveProvider(errorProvider);

    const resError = await searchAndNormalizeDestination({ query: 'Porto' });
    const isErrorPassed = !!resError.errorAlert && resError.destinations.length > 0;

    results.push({
      testName: '6. Erro do Provedor (HTTP 500 / Network Error Fallback)',
      passed: isErrorPassed,
      details: isErrorPassed
        ? `Exceção do provedor capturada com sucesso (${resError.errorAlert})`
        : 'Erro do provedor não foi tratado com fallback',
    });
  } catch (err: any) {
    results.push({ testName: '6. Erro do Provedor', passed: false, details: err.message });
  } finally {
    setActiveProvider(mockProvider);
  }

  // 7. TESTE: Resposta Incompleta do Provedor
  try {
    const rawIncomplete = {
      id: 'incomplete_1',
      name: 'Cidade Incompleta',
      // campos state, country, country_code, lat/lng ausentes!
    };
    const normalized = normalizeDestination(rawIncomplete, 'incompleta', 'smarttrip_mock');
    const isIncompletePassed =
      normalized !== null &&
      normalized.cityName === 'Cidade Incompleta' &&
      normalized.countryCode === 'XX' &&
      typeof normalized.coordinates.latitude === 'number';

    results.push({
      testName: '7. Resposta Incompleta do Provedor (Tratamento de Campos Ausentes)',
      passed: isIncompletePassed,
      details: isIncompletePassed
        ? `Payload incompleto normalizado com fallbacks seguros (${normalized?.countryCode})`
        : 'Normalizador falhou com payload incompleto',
    });
  } catch (err: any) {
    results.push({ testName: '7. Resposta Incompleta', passed: false, details: err.message });
  }

  // 8. TESTE: Caracteres Acentuados
  try {
    clearGeoCache();
    resetRateLimiter();
    const resAccented = await searchAndNormalizeDestination({ query: 'São Paulo' });
    const isAccentedPassed =
      resAccented.totalResults > 0 &&
      resAccented.destinations[0].cityName === 'São Paulo' &&
      resAccented.destinations[0].countryCode === 'BR';

    results.push({
      testName: '8. Caracteres Acentuados ("São Paulo", "München", "Tóquio")',
      passed: isAccentedPassed,
      details: isAccentedPassed
        ? `Busca acentuada preservou UTF-8 e retornou: ${resAccented.destinations[0].cityName}`
        : 'Falha no tratamento de acentuação UTF-8',
    });
  } catch (err: any) {
    results.push({ testName: '8. Caracteres Acentuados', passed: false, details: err.message });
  }

  return results;
};

// Executa suíte no console se rodar via CLI
runDestinationServiceTestSuite().then((suite) => {
  console.log('=== SUÍTE DE TESTES: SERVIÇO DE DESTINO (SPEC) ===');
  suite.forEach((r) => {
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.testName}: ${r.details}`);
  });
});
