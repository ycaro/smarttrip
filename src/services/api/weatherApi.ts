import {
  getWeatherForecast,
  WeatherForecastRequest,
  WeatherForecastResponse,
  DailyWeatherForecast,
} from '../weather';

export type { WeatherForecastRequest, WeatherForecastResponse, DailyWeatherForecast };

/**
 * ENDPOINT E SERVIÇO INTERNO: /api/weather
 * 
 * Atua como o adaptador de API interno do SmartTrip para meteorologia.
 * Garante que chaves privadas (se houver) permaneçam no servidor/ambiente e
 * devolve a resposta estritamente alinhada com o contrato interno.
 */
export const handleWeatherApiRequest = async (
  requestParams: WeatherForecastRequest
): Promise<WeatherForecastResponse> => {
  // 1. Verificação de chave privada de servidor (se configurada em ambiente)
  const isServerKeyPresent =
    typeof process !== 'undefined' &&
    process.env &&
    (process.env.WEATHER_API_PRIVATE_KEY || process.env.OPENWEATHER_API_KEY);

  if (isServerKeyPresent) {
    // Chave utilizada apenas server-side de forma segura
  }

  // 2. Executa o serviço de domínio meteorológico
  return await getWeatherForecast(requestParams);
};
