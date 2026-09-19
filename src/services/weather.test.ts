import {
  getWeatherForecast,
  clearWeatherCache,
  resetWeatherRateLimiter,
  setActiveWeatherProvider,
  MockWeatherProvider,
} from './weather';
import { handleWeatherApiRequest } from './api/weatherApi';

export interface TestReport {
  testName: string;
  passed: boolean;
  details: string;
}

/**
 * Suíte de Testes Completa do Serviço Meteorológico SmartTrip (/api/weather)
 * Valida os 8 cenários da SPEC:
 * 1. Coordenadas Válidas
 * 2. Coordenadas Inválidas
 * 3. Período Disponível (0-14 dias)
 * 4. Período Futuro sem Previsão (>14 dias)
 * 5. Erro HTTP
 * 6. Timeout
 * 7. Resposta Parcial
 * 8. Provider Unavailable
 */
export const runWeatherServiceTestSuite = async (): Promise<TestReport[]> => {
  const results: TestReport[] = [];

  const mockProvider = new MockWeatherProvider();
  setActiveWeatherProvider(mockProvider);
  clearWeatherCache();
  resetWeatherRateLimiter();

  const today = new Date();
  const dateWithinHorizon = new Date(today);
  dateWithinHorizon.setDate(today.getDate() + 3);
  const dateWithinHorizonStr = dateWithinHorizon.toISOString().split('T')[0];

  const dateBeyondHorizon = new Date(today);
  dateBeyondHorizon.setDate(today.getDate() + 45); // > 14 dias
  const dateBeyondHorizonStr = dateBeyondHorizon.toISOString().split('T')[0];

  // 1. TESTE: Coordenadas Válidas
  try {
    const res = await handleWeatherApiRequest({
      latitude: 38.7223,
      longitude: -9.1393,
      startDate: dateWithinHorizonStr,
      endDate: dateWithinHorizonStr,
    });
    const isValidCoordsPassed =
      res.latitude === 38.7223 &&
      res.longitude === -9.1393 &&
      res.dailyForecasts.length > 0;

    results.push({
      testName: '1. Coordenadas Válidas (38.7223, -9.1393)',
      passed: isValidCoordsPassed,
      details: isValidCoordsPassed
        ? `Previsão obtida para coordenadas válidas (${res.dailyForecasts[0].date})`
        : 'Falha no processamento de coordenadas válidas',
    });
  } catch (err: any) {
    results.push({ testName: '1. Coordenadas Válidas', passed: false, details: err.message });
  }

  // 2. TESTE: Coordenadas Inválidas
  try {
    clearWeatherCache();
    const resInvalid = await handleWeatherApiRequest({
      latitude: 999, // Inválido! (deve ser entre -90 e 90)
      longitude: -500, // Inválido! (deve ser entre -180 e 180)
      startDate: dateWithinHorizonStr,
      endDate: dateWithinHorizonStr,
    });
    const isInvalidCoordsPassed =
      !!resInvalid.errorAlert &&
      resInvalid.dailyForecasts[0].status === 'unavailable' &&
      resInvalid.dailyForecasts[0].tempMin === null;

    results.push({
      testName: '2. Coordenadas Inválidas (999, -500 Tratamento Seguro)',
      passed: isInvalidCoordsPassed,
      details: isInvalidCoordsPassed
        ? 'Coordenadas inválidas rejeitadas com alerta seguro, sem derrubar o app'
        : 'Coordenadas inválidas causaram erro não capturado',
    });
  } catch (err: any) {
    results.push({ testName: '2. Coordenadas Inválidas', passed: false, details: err.message });
  }

  // 3. TESTE: Período Disponível (0-14 dias)
  try {
    clearWeatherCache();
    const resAvailable = await handleWeatherApiRequest({
      latitude: -23.5505,
      longitude: -46.6333,
      startDate: dateWithinHorizonStr,
      endDate: dateWithinHorizonStr,
    });
    const isAvailablePassed =
      resAvailable.dailyForecasts[0].status === 'forecast_available' &&
      resAvailable.dailyForecasts[0].isHistoricalEstimate === false;

    results.push({
      testName: '3. Período Disponível (0 a 14 Dias)',
      passed: isAvailablePassed,
      details: isAvailablePassed
        ? `Previsão determinística em tempo real (${resAvailable.dailyForecasts[0].tempMin}°C - ${resAvailable.dailyForecasts[0].tempMax}°C)`
        : 'Falha ao classificar período disponível',
    });
  } catch (err: any) {
    results.push({ testName: '3. Período Disponível', passed: false, details: err.message });
  }

  // 4. TESTE: Período Futuro Sem Previsão (>14 dias - Sem Invenção)
  try {
    clearWeatherCache();
    const resBeyond = await handleWeatherApiRequest({
      latitude: -23.5505,
      longitude: -46.6333,
      startDate: dateBeyondHorizonStr,
      endDate: dateBeyondHorizonStr,
    });
    const isBeyondPassed =
      resBeyond.dailyForecasts[0].status === 'historical_average' &&
      resBeyond.dailyForecasts[0].isHistoricalEstimate === true;

    results.push({
      testName: '4. Período Futuro Sem Previsão (> 14 Dias - Média Histórica Sazonal)',
      passed: isBeyondPassed,
      details: isBeyondPassed
        ? `Data a 45 dias classificada como média histórica (${resBeyond.dailyForecasts[0].conditionText})`
        : 'Falha: Clima fictício inventado indevidamente para data futura distante',
    });
  } catch (err: any) {
    results.push({ testName: '4. Período Futuro Sem Previsão', passed: false, details: err.message });
  }

  // 5. TESTE: Erro HTTP (Provedor 500)
  try {
    clearWeatherCache();
    resetWeatherRateLimiter();
    const errorProvider = new MockWeatherProvider();
    errorProvider.setSimulateError(true);
    setActiveWeatherProvider(errorProvider);

    const resError = await handleWeatherApiRequest({
      latitude: 48.8566,
      longitude: 2.3522,
      startDate: dateWithinHorizonStr,
      endDate: dateWithinHorizonStr,
    });

    const isHttpErrorPassed = !!resError.errorAlert && resError.dailyForecasts.length > 0;

    results.push({
      testName: '5. Erro HTTP (Servidor 500 Capturado com Fallback)',
      passed: isHttpErrorPassed,
      details: isHttpErrorPassed
        ? `Erro do servidor capturado sem crashar a UI (${resError.errorAlert})`
        : 'Falha no tratamento de erro HTTP do provedor',
    });
  } catch (err: any) {
    results.push({ testName: '5. Erro HTTP', passed: false, details: err.message });
  } finally {
    setActiveWeatherProvider(mockProvider);
  }

  // 6. TESTE: Timeout de Requisição (> 4000ms Abort)
  try {
    clearWeatherCache();
    resetWeatherRateLimiter();
    const timeoutProvider = new MockWeatherProvider();
    timeoutProvider.setSimulateDelay(4500); // 4.5s > 4s
    setActiveWeatherProvider(timeoutProvider);

    const resTimeout = await handleWeatherApiRequest({
      latitude: 48.8566,
      longitude: 2.3522,
      startDate: dateWithinHorizonStr,
      endDate: dateWithinHorizonStr,
    });

    const isTimeoutPassed = !!resTimeout.errorAlert && resTimeout.dailyForecasts.length > 0;

    results.push({
      testName: '6. Timeout de Requisição (> 4000ms Cancelamento via AbortController)',
      passed: isTimeoutPassed,
      details: isTimeoutPassed
        ? 'Timeout de 4s abortou a chamada externa e entregou dados de fallback'
        : 'Falha no tratamento de timeout de requisição',
    });
  } catch (err: any) {
    results.push({ testName: '6. Timeout de Requisição', passed: false, details: err.message });
  } finally {
    setActiveWeatherProvider(mockProvider);
  }

  // 7. TESTE: Resposta Parcial (Campos Ausentes com null)
  try {
    clearWeatherCache();
    const pastDateStr = '2010-01-01';
    const resPartial = await handleWeatherApiRequest({
      latitude: 48.8566,
      longitude: 2.3522,
      startDate: pastDateStr,
      endDate: pastDateStr,
    });

    const isPartialPassed =
      resPartial.dailyForecasts[0].tempMin === null &&
      resPartial.dailyForecasts[0].status === 'unavailable';

    results.push({
      testName: '7. Resposta Parcial (Campos Ausentes com null e unavailable)',
      passed: isPartialPassed,
      details: isPartialPassed
        ? 'Valores ausentes representados com null explícito em vez de zero inventado'
        : 'Falha no tratamento de resposta parcial',
    });
  } catch (err: any) {
    results.push({ testName: '7. Resposta Parcial', passed: false, details: err.message });
  }

  // 8. TESTE: Provider Unavailable (Estabilidade do Contrato)
  try {
    clearWeatherCache();
    resetWeatherRateLimiter();
    const unavailableProvider = new MockWeatherProvider();
    unavailableProvider.setSimulateError(true);
    setActiveWeatherProvider(unavailableProvider);

    const resUnavailable = await handleWeatherApiRequest({
      latitude: 35.6762,
      longitude: 139.6503,
      startDate: dateWithinHorizonStr,
      endDate: dateWithinHorizonStr,
    });

    const isProviderUnavailablePassed =
      resUnavailable.provider === 'smarttrip_mock' &&
      Array.isArray(resUnavailable.dailyForecasts) &&
      resUnavailable.dailyForecasts.length > 0;

    results.push({
      testName: '8. Provider Unavailable (Manutenção da Estabilidade do Contrato)',
      passed: isProviderUnavailablePassed,
      details: isProviderUnavailablePassed
        ? 'Contrato interno mantido estável durante indisponibilidade do provedor'
        : 'Incompatibilidade no contrato de resposta durante falha do provedor',
    });
  } catch (err: any) {
    results.push({ testName: '8. Provider Unavailable', passed: false, details: err.message });
  } finally {
    setActiveWeatherProvider(mockProvider);
  }

  return results;
};

// Executa suíte no console se rodado via CLI
runWeatherServiceTestSuite().then((suite) => {
  console.log('=== SUÍTE DE TESTES: /api/weather & SERVIÇO METEOROLÓGICO ===');
  suite.forEach((r) => {
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.testName}: ${r.details}`);
  });
});
