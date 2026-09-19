# SPEC: Serviço Meteorológico (Weather Forecast & Climate Service)

**Documento de Especificação Técnica - SmartTrip**  
**Versão:** 1.0.0  
**Status:** Aprovado  
**Autor:** Antigravity Team  
**Data:** 19/09/2026  

---

## 1. Visão Geral & Objetivo

O **Serviço Meteorológico** (`WeatherService`) é o componente responsável por obter, normalizar e fornecer informações de clima para um destino geográfico em um determinado período temporal (`startDate` a `endDate`).

As informações meteorológicas auxiliam a Inteligência Artificial a recomendar atividades adequadas para cada dia de viagem (ex: sugerir atrações cobertas em dias chuvosos ou passeios ao ar livre em dias ensolarados).

---

## 2. Contrato Interno (Provider-Agnostic Weather Domain Contract)

Para manter a aplicação completamente desacoplada de provedores externos (Open-Meteo, OpenWeatherMap, WeatherAPI, ou Mock), o serviço estabelece um contrato estrito de dados.

```typescript
export type WeatherConditionTag =
  | 'ensolarado'
  | 'parcialmente_nublado'
  | 'nublado'
  | 'chuva'
  | 'tempestade'
  | 'neve'
  | 'desconhecido';

export type WeatherDataStatus =
  | 'forecast_available' // Previsão determinística dentro do horizonte (0 a 14 dias)
  | 'historical_average' // Média histórica/sazonal para datas futuras além de 14 dias
  | 'unavailable'; // Dados indisponíveis no provedor

export interface DailyWeatherForecast {
  date: string; // Formato YYYY-MM-DD
  tempMin: number | null; // Temperatura mínima em °C (null se indisponível)
  tempMax: number | null; // Temperatura máxima em °C (null se indisponível)
  rainProbability: number | null; // Probabilidade de chuva (0 a 100%, null se indisponível)
  condition: WeatherConditionTag; // Tag de condição padronizada
  conditionText: string; // Descrição textual em português (ex: "Ensolarado com poucas nuvens")
  windSpeedKmH?: number | null; // Velocidade do vento em km/h
  humidityPercent?: number | null; // Umidade relativa em %
  uvIndex?: number | null; // Índice UV
  status: WeatherDataStatus; // Estado de disponibilidade explícito
  isHistoricalEstimate: boolean; // true se for estimativa histórica/sazonal
}

export interface WeatherForecastRequest {
  latitude: number;
  longitude: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface WeatherForecastResponse {
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  dailyForecasts: DailyWeatherForecast[];
  summary: {
    avgTempMin: number | null;
    avgTempMax: number | null;
    rainyDaysCount: number;
    dominantCondition: WeatherConditionTag;
  };
  provider: 'open_meteo' | 'openweather' | 'weather_api' | 'smarttrip_mock';
  executionTimeMs: number;
  fromCache: boolean;
  errorAlert?: string;
}
```

---

## 3. Regras de Negócio Importantes

### 3.1. Limite do Horizonte de Previsão (`ForecastHorizonLimit`)
- **Horizonte Determinístico**: Provedores de meteorologia oferecem previsão determinística confiável de no máximo **14 dias a partir da data atual**.
- **Datas Fora do Horizonte (Proibição de Clima Inventado)**:
  - Para datas no futuro que ultrapassem 14 dias da data atual:
    - O serviço **NUNCA deve inventar previsão determinística fictícia**.
    - O serviço consulta e fornece a **média histórica/climatológica sazonal** do destino para aquele mês.
    - O objeto retornado marca compulsoriamente `isHistoricalEstimate: true` e `status: 'historical_average'`.
- **Datas Passadas**: Retorna dados históricos reais caso disponíveis ou `status: 'unavailable'`.

### 3.2. Representação Explícita de Ausência de Dados
- Se a API externa não possuir medição para um determinado dia ou atributo (ex: probabilidade de chuva não informada):
  - O atributo recebe `null` de forma explícita (ex: `rainProbability: null`).
  - O campo `status` é configurado como `'unavailable'`.
  - A UI nunca exibe `0` como substituto genérico de ausência de dado quando 0 for um valor válido (ex: 0°C de temperatura vs ausência de temperatura).

### 3.3. Normalização de Resposta dos Provedores
O serviço converte os códigos originais de condições atmosféricas (ex: códigos WMO 0-99 do Open-Meteo ou códigos OWM 200-804) em uma das 7 tags padronizadas SmartTrip (`'ensolarado'`, `'parcialmente_nublado'`, `'nublado'`, `'chuva'`, `'tempestade'`, `'neve'`, `'desconhecido'`).

### 3.4. Resiliência Total (Falhas Não Podem Derrubar a Aplicação)
- **Princípio de Não-Interrupção**: Erros HTTP (4xx/5xx), falhas de conexão de rede ou timeouts do provedor meteorológico **nunca devem lançar exceções não capturadas** ou causar crash/tela branca no app.
- **Mecanismo de Fallback**:
  - Em caso de falha do provedor externo, o serviço retorna uma resposta de fallback graciosa contendo a lista de dias marcada com `status: 'unavailable'`, `condition: 'desconhecido'`, e um campo `errorAlert` descrevendo o motivo.
  - O restante da aplicação (geração do roteiro, exibição de locais, passeios) continua funcionando normalmente.

---

## 4. Requisitos Não Funcionais (Cache, Timeout e Limites)

### 4.1. Estratégia de Caching (`WeatherCache`)
- **Dois Níveis**: Cache em memória (`LRUCache`) + `sessionStorage`.
- **Chave de Cache**: `wx_${lat.toFixed(2)}_${lng.toFixed(2)}_${startDate}_${endDate}`.
- **TTL (Time-To-Live)**:
  - **6 Horas** para previsões determinísticas dentro do horizonte de 14 dias.
  - **30 Dias** para médias históricas/climatológicas.
- **Desempenho**: Respostas do cache retornam em **< 5ms** com `fromCache: true`.

### 4.2. Timeout de Requisição
- **Tempo Limite**: **4.000ms (4 segundos)**.
- **Mecanismo**: `AbortController` nativo com `setTimeout`.
- **Comportamento em Timeout**: Se a chamada exceder 4s, o sinal é cancelado e o serviço ativa o fallback gracioso para médias históricas ou dados padrão.

### 4.3. Limite de Requisições (Rate Limiting)
- **Client-Side Limit**: Máximo de **30 requisições meteorológicas por minuto** por sessão.
- **Tratamento**: Requisições excedentes são atendidas diretamente pelo cache local ou retornam dados consolidados do destino.

---

## 5. Especificação de UX / Interface do Usuário

1. **Badge de Origem dos Dados**:
   - **Previsão Determinística**: Exibe badge azul/verde `☀️ Previsão Direta (Próximos 14 dias)`.
   - **Média Histórica**: Exibe badge âmbar `📊 Média Histórica Sazonal (Outubro)`.
   - **Dados Indisponíveis**: Exibe badge cinza `❓ Clima Indisponível`.
2. **Indicadores de Temperatura**:
   - Exibição limpa em formato de variação `min°C / max°C` (ex: `14°C / 22°C`).
   - Se `tempMin` ou `tempMax` for `null`, exibe `--°C`.
3. **Probabilidade de Chuva**:
   - Se `rainProbability >= 40%`, exibe ícone de guarda-chuva 🌧️ com destaque visual.

---

## 6. Critérios de Aceite (CA-WX)

- **`CA-WX-001` - Contrato Estrito Normalizado:** Toda resposta deve conter obrigatoriamente `date`, `tempMin`, `tempMax`, `rainProbability`, `condition`, `status` e `isHistoricalEstimate`.
- **`CA-WX-002` - Proibição de Clima Inventado Além de 14 Dias:** Datas que excederem 14 dias a partir de hoje devem marcar `isHistoricalEstimate: true` e `status: 'historical_average'`, fornecendo médias históricas em vez de previsões fictícias.
- **`CA-WX-003` - Ausência de Dados Explícita:** Atributos ausentes no provedor devem retornar `null` (nunca valores fictícios como `0` ou `""`) e possuir `status: 'unavailable'`.
- **`CA-WX-004` - Resiliência e Não-Derrubada do App:** Falhas de rede (500, 404, offline) ou timeouts do provedor devem retornar um objeto de resposta de fallback válido sem interromper o funcionamento da aplicação.
- **`CA-WX-005` - Timeout de 4 Segundos:** Chamadas de API que excederem 4000ms devem ser canceladas via `AbortController` e redirecionadas para o fallback.
- **`CA-WX-006` - Cache Eficiente:** Consultas para as mesmas coordenadas e período servidas no intervalo de 6h devem retornar do cache (`fromCache: true`) em menos de 5ms.
- **`CA-WX-007` - Mapeamento Padronizado de Condições:** Todas as condições meteorológicas de provedores nativos devem ser mapeadas em uma das 7 tags SmartTrip.
- **`CA-WX-008` - Exibição Contextual na UI:** A interface deve diferenciar visualmente previsões em tempo real, médias históricas e estados sem dados.

---

## 7. Plano de Testes & Casos de Teste

### 7.1. Testes Unitários (`weatherService.test.ts`)
1. **`test_forecast_within_horizon`**: Solicitar previsão para os próximos 5 dias e verificar `status === 'forecast_available'` e `isHistoricalEstimate === false`.
2. **`test_forecast_beyond_horizon`**: Solicitar previsão para daqui a 60 dias e verificar `status === 'historical_average'` e `isHistoricalEstimate === true`.
3. **`test_explicit_null_data`**: Simular resposta do provedor com dados ausentes e confirmar `tempMin === null` e `status === 'unavailable'`.
4. **`test_provider_error_resilience`**: Simular erro 500 do provedor e verificar se o app recebe resposta de fallback sem lançar exceção não capturada.
5. **`test_timeout_handling`**: Simular atraso de 5000ms e verificar se o `AbortController` cancela a requisição após 4000ms.
6. **`test_cache_persistence`**: Fazer duas buscas idênticas e comprovar `fromCache === true` na segunda chamada.
7. **`test_condition_mapping`**: Testar códigos WMO (0=ensolarado, 61=chuva, 95=tempestade) e verificar o mapeamento correto para as tags do SmartTrip.
