# SPEC: Serviço de Busca e Normalização de Destinos (Geo-Normalization Service)

**Documento de Especificação Técnica - SmartTrip**  
**Versão:** 1.0.0  
**Status:** Aprovado  
**Autor:** Antigravity Team  
**Data:** 19/09/2026  

---

## 1. Visão Geral & Objetivo

O **Serviço de Busca e Normalização de Destinos** (`DestinationNormalizationService`) é o componente responsável por receber termos de busca digitados em texto livre pelo usuário (ex: `"lisb"`, `"rio de janeiro"`, `"tokyo"`, `"paris, fr"`) e convertê-los em uma **Entidade Geográfica Normalizada** padronizada, enriquecida com coordenadas e hierarquia territorial.

Ele estabelece um **contrato de domínio agnóstico de provedor**, permitindo alternar de forma transparente entre o **Google Places API**, **OpenStreetMap / Nominatim**, **Mapbox Geocoding** ou o **banco local/mock do SmartTrip**, mantendo o resto da aplicação imune a mudanças de infraestrutura.

---

## 2. Contrato Interno (Provider-Agnostic Interface)

O serviço abstrai os formatos proprietários dos provedores externos através da seguinte interface TypeScript estrita:

```typescript
export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface NormalizedDestination {
  id: string; // ID único normalizado (ex: "geo_lisbon_pt" ou Google Place ID)
  rawQuery: string; // Entrada exata digitada pelo usuário
  cityName: string; // Nome oficial da cidade (ex: "Lisboa")
  stateOrRegion?: string; // Estado / Província / Região (ex: "Distrito de Lisboa")
  countryName: string; // Nome oficial do país em português (ex: "Portugal")
  countryCode: string; // Código ISO 3166-1 alpha-2 em maiúsculas (ex: "PT")
  formattedAddress: string; // Endereço/localização formatada (ex: "Lisboa, Portugal")
  coordinates: GeoCoordinates; // Objeto de latitude e longitude decimais
  timezone?: string; // Fuso horário no formato IANA (ex: "Europe/Lisbon")
  locale: string; // Idioma utilizado na busca (padrão: "pt-BR")
  confidenceScore: number; // Índice de confiança do casamento (0.0 a 1.0)
  provider: 'google_places' | 'nominatim' | 'mapbox' | 'smarttrip_mock';
}

export interface DestinationSearchResult {
  query: string;
  destinations: NormalizedDestination[];
  totalResults: number;
  isAmbiguous: boolean; // Indica se há múltiplos resultados de relevância similar
  executionTimeMs: number;
  fromCache: boolean;
}

export interface SearchQueryOptions {
  query: string;
  language?: string; // Idioma desejado (padrão: "pt-BR")
  limit?: number; // Limite de resultados (padrão: 5, máximo: 10)
  signal?: AbortSignal; // Sinal de cancelamento HTTP
}
```

---

## 3. Especificações Técnicas & Regras de Negócio

### 3.1. Entrada e Sanitização de Dados
- **Sanitização Mandatória**: Antes de processar qualquer entrada:
  1. Remoção de espaços em branco nas extremidades (`trim()`).
  2. Substituição de múltiplos espaços internos por um único espaço.
  3. Remoção de marcas e scripts potencialmente nocivos (`stripHtml`).
  4. Manutenção de acentos e caracteres Unicode internacionais (para buscas fiéis em múltiplos idiomas).

### 3.2. Limite Mínimo de Caracteres (`MinCharLimit`)
- **Regra**: Nenhuma requisição de rede ou busca em provedores externos é disparada se `query.trim().length < 3`.
- **Resposta Automática**: Quando o comprimento for menor que 3 caracteres, o serviço retorna imediatamente:
  ```json
  {
    "query": "li",
    "destinations": [],
    "totalResults": 0,
    "isAmbiguous": false,
    "executionTimeMs": 0,
    "fromCache": false
  }
  ```
- **Dicionário de Exceções Curta**: Cidades com 2 letras oficiais reconhecidas internacionalmente (ex: *"Iú"*, *"Ua"*) são permitidas se constarem na lista de exceções do serviço.

### 3.3. Debounce (`DebounceTime`)
- **Tempo de Debounce**: **300ms** no componente de entrada da interface (`AutocompleteInput`).
- **Comportamento**: Se o usuário digitar `"Lisboa"` letra por letra em intervalos menores que 300ms, apenas 1 única requisição correspondente ao termo final `"Lisboa"` é enviada ao backend/provedor.

### 3.4. Resposta Normalizada & Hierarquia Geográfica
A entidade normalizada deve sempre cumprir a seguinte hierarquia territorial:
1. `cityName`: Nome limpo da cidade/município em português.
2. `stateOrRegion`: Estado, província ou distrito geográfico.
3. `countryName`: Nome do país em português (ex: *"França"* em vez de *"France"*).
4. `countryCode`: Código ISO 3166-1 alpha-2 em maiúsculas (`BR`, `PT`, `FR`, `US`, `JP`, etc.).
5. `coordinates`: Mapeamento em `latitude` (-90 a 90) e `longitude` (-180 a 180) no sistema WGS 84.

### 3.5. Seleção entre Resultados Ambíguos
- **Cenário de Ambiguidade**: Termos de busca com múltiplos destinos homônimos no mundo (ex: *"Santiago"*, *"Veneza"*, *"Porto"*).
- **Critério de Detecção**: O flag `isAmbiguous` é definido como `true` quando existirem $\ge 2$ resultados no ranking com `confidenceScore >= 0.7`.
- **Tratamento de UX**:
  - A interface exibe um menu suspenso destacando o estado/país de cada opção (ex: *"Santiago (Chile)"* vs *"Santiago de Compostela (Espanha)"* vs *"Santiago (RS, Brasil)"*).
  - O usuário deve selecionar explicitamente o destino desejado antes de avançar para a geração do roteiro com IA.

### 3.6. Destino Inexistente ou Sem Resultados
- **Comportamento**: Se a consulta não retornar nenhuma correspondência em nenhum provedor:
  - Retorna `destinations: []` e `totalResults: 0`.
  - Exibe mensagem amigável de orientação:  
    `"Nenhum destino encontrado para '<termo>'. Tente buscar pelo nome da cidade ou país (ex: Roma, Lisboa, Japão)."`
  - Apresenta atalhos visuais com os 4 destinos mais populares do SmartTrip (ex: Lisboa, Paris, Tóquio, Rio de Janeiro).

### 3.7. Timeout de Requisição & Resiliência
- **Limite Máximo (Timeout)**: **5.000ms (5 segundos)**.
- **Mecanismo**: Utilização de `AbortController` nativo do JavaScript.
- **Estratégia de Fallback**: Se o provedor primário (ex: Google Places API) falhar ou exceder 5000ms:
  1. A requisição HTTP é cancelada (`signal.abort()`).
  2. O serviço executa automaticamente uma busca no provedor secundário ou no **banco local de destinos pré-normalizados (Mock)**.
  3. A interface não trava e exibe os resultados com `provider: 'smarttrip_mock'`.

### 3.8. Estratégia de Caching (`GeoCache`)
- **Arquitetura**: Cache de dois níveis — **Memória de Curto Prazo (LRU)** + `sessionStorage` do navegador.
- **Tamanho Máximo do Cache**: 100 consultas mais recentes.
- **Tempo de Vida (TTL)**: **24 horas** (já que coordenadas geográficas e nomes de cidades são altamente estáveis).
- **Chave de Cache**: `geo_norm_${query_sanitizada}_${language}`.
- **Métrica**: Consultas servidas pelo cache retornam `fromCache: true` com `executionTimeMs < 5ms`.

### 3.9. Limite de Requisições (Rate Limiting)
- **Client-Side Throttling**: Máximo de **20 requisições de busca por minuto** por sessão de usuário.
- **Proteção Anti-Spam**: Se o usuário exceder o limite, o serviço responde temporariamente com dados do cache ou sugestões recomendadas, exibindo alerta: *"Muitas buscas em curto período. Selecione um destino da lista ou aguarde alguns segundos."*

### 3.10. Privacidade e Conformidade (LGPD / GDPR)
- **Privacidade por Design (Privacy by Design)**:
  - O texto digitado pelo usuário na busca de destinos é desassociado de qualquer PII (Nome, E-mail, CPF, UID).
  - A geolocalização exata do dispositivo do usuário **nunca** é gravada no banco de dados sem autorização expressa.
  - Logs de busca armazenam apenas dados agregados e anônimos para alimentar o ranking de destinos mais procurados.

---

## 4. Matriz de Mapeamento entre Provedores

| Atributo Normalizado | Google Places API | OpenStreetMap (Nominatim) | Mapbox Geocoding | SmartTrip Mock |
| :--- | :--- | :--- | :--- | :--- |
| **`id`** | `place_id` | `osm_id` | `id` | `id` |
| **`cityName`** | `locality` / `administrative_area_level_2` | `city` / `town` / `village` | `text` | `cityName` |
| **`stateOrRegion`** | `administrative_area_level_1` | `state` / `county` | `region` | `stateOrRegion` |
| **`countryName`** | `country` (long name) | `country` | `country` | `countryName` |
| **`countryCode`** | `country` (short name) | `country_code` (uppercase) | `short_code` (uppercase) | `countryCode` |
| **`coordinates.latitude`** | `geometry.location.lat()` | `parseFloat(lat)` | `center[1]` | `coordinates.latitude` |
| **`coordinates.longitude`** | `geometry.location.lng()` | `parseFloat(lon)` | `center[0]` | `coordinates.longitude` |

---

## 5. Critérios de Aceite (CA-GEO)

- **`CA-GEO-001` - Trava de Comprimento Mínimo:** Requisições com menos de 3 caracteres devem ser rejeitadas instantaneamente sem realizar chamadas de rede (`executionTimeMs: 0`).
- **`CA-GEO-002` - Mapeamento Estrito do Contrato:** Todos os resultados normalizados devem conter compulsoriamente os campos `id`, `cityName`, `countryName`, `countryCode`, `coordinates.latitude`, `coordinates.longitude` e `provider`.
- **`CA-GEO-003` - Debounce de 300ms:** O componente de busca só deve disparar a chamada de serviço 300ms após a última tecla digitada pelo usuário.
- **`CA-GEO-004` - Desambiguação Clara:** Quando o termo retornar cidades homônimas (ex: *"Santiago"*), `isAmbiguous` deve ser `true` e a lista deve trazer as opções com localização pai (estado/país) visíveis.
- **`CA-GEO-005` - Resiliência por Timeout de 5s:** Se a chamada para o provedor externo ultrapassar 5000ms, a aplicação deve cancelar a requisição e utilizar o banco de fallback local de forma transparente.
- **`CA-GEO-006` - Desempenho por Cache:** Consultas repetidas na mesma sessão devem ser entregues diretamente do cache (`fromCache: true`) em menos de 5ms.
- **`CA-GEO-007` - Proteção de Privacidade:** O texto da busca de destinos não deve ser gravado no Firestore associado ao `uid` do usuário em logs de auditoria pública.
- **`CA-GEO-008` - Feedback para Destino Inexistente:** Caso nenhum destino seja encontrado, a interface deve exibir mensagem explicativa e 4 sugestões de destinos pré-configurados.

---

## 6. Suíte de Testes Requerida

### 6.1. Testes Unitários (`destinationService.test.ts`)
1. **`test_min_char_limit`**: Garantir que queries com `""`, `"a"` ou `"  li "` retornam lista vazia sem chamar HTTP.
2. **`test_normalized_contract_structure`**: Validar se o objeto retornado contém todas as chaves exigidas pela interface `NormalizedDestination`.
3. **`test_debounce_timer`**: Disparar 5 chamadas em rajada dentro de 200ms e verificar que apenas a última chamada foi executada.
4. **`test_cache_hit_response`**: Executar a busca por `"Lisboa"`, repetir e assinalar `fromCache === true` e `executionTimeMs < 5`.
5. **`test_ambiguity_detection`**: Executar busca por `"Santiago"` e validar que `isAmbiguous === true`.
6. **`test_rate_limiting`**: Disparar 25 buscas consecutivas e validar que a 21ª é bloqueada com mensagem de limite.

### 6.2. Testes de Integração & Resiliência
1. **`test_timeout_cancellation`**: Simular atraso de 5.500ms e confirmar o cancelamento do sinal e uso do fallback.
2. **`test_html_sanitization`**: Enviar a string `"<script>alert('xss')</script> Roma"` e verificar que o termo processado é `"Roma"`.
