# SPEC: Serviço de Pontos de Interesse (POIs Service)

**Documento de Especificação Técnica - SmartTrip**  
**Versão:** 1.0.0  
**Status:** Aprovado  
**Autor:** Antigravity Team  
**Data:** 19/09/2026  

---

## 1. Visão Geral & Objetivo

O **Serviço de Pontos de Interesse (POIs)** (`PlacePoisService`) é o componente responsável por consultar, buscar, filtrar, normalizar e deduplicar lugares reais e atrações turísticas em uma localização geográfica delimitada.

### ⚠️ REGRA FUNDAMENTAL DE INTEGRAÇÃO COM IA (GEMINI)
> **O motor de IA Generativa (Google Gemini) é estritamente proibido de inventar ou alucinar lugares, nomes de restaurantes ou atrações fictícias.**
> A IA **somente poderá utilizar lugares reais retornados por este serviço de POIs**.

---

## 2. Contrato Interno (Provider-Agnostic POI Contract)

```typescript
export type PoiCategoryTag =
  | 'atracoes' // Atrações Turísticas Gerais e Monumentos
  | 'praias' // Praias, Balneários e Orlas
  | 'museus' // Museus, Galerias de Arte e Exposições
  | 'parques' // Parques Nacionais, Jardins e Reservas
  | 'restaurantes' // Restaurantes e Gastronomia Local
  | 'cafes' // Cafés, Padarias e Confeiteiras
  | 'pontos_historicos'; // Castelos, Ruínas e Locais Históricos

export interface NormalizedPoi {
  id: string; // ID único e estável fornecido pelo provedor (ex: Place ID "ChIJ...")
  name: string; // Nome oficial e factual do lugar
  category: PoiCategoryTag; // Categoria normalizada
  address: string; // Endereço físico formatado real
  latitude: number; // Coordenada WGS 84
  longitude: number; // Coordenada WGS 84
  rating?: number | null; // Avaliação de 1.0 a 5.0 (null se não houver)
  userRatingsTotal?: number | null; // Total de avaliações reais
  photoUrl?: string | null; // URL da foto do local
  priceLevel?: number | null; // Nível de preço (1 a 4)
  openNow?: boolean | null; // Status de funcionamento no momento
  provider: 'google_places' | 'overpass_osm' | 'mapbox' | 'smarttrip_mock';
  rawJSON?: any; // Metadados brutos do provedor (preservado apenas server-side)
}

export interface PoiSearchRequest {
  latitude: number;
  longitude: number;
  categories: PoiCategoryTag[];
  radiusMeters?: number; // Padrão: 5000m (5km), mín: 500m, máx: 50000m
  limit?: number; // Padrão: 20, máx: 50
}

export interface PoiSearchResponse {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  categories: PoiCategoryTag[];
  pois: NormalizedPoi[];
  totalResults: number;
  hasResults: boolean;
  deduplicatedCount: number; // Quantidade de duplicadas removidas
  executionTimeMs: number;
  fromCache: boolean;
  errorAlert?: string;
}
```

---

## 3. Regras de Negócio Importantes

### 3.1. Identificador Estável (`StableID`)
- Todo lugar retornado **deve possuir um identificador único e estável** fornecido pelo provedor (ex: Google Place ID `ChIJ...` ou OpenStreetMap ID `node/123456`).
- Esse `id` é utilizado para persistência no Firestore (`trips/{tripId}/itineraryItems`), permitindo sincronização em tempo real entre membros do grupo e reordenação segura.

### 3.2. Proibição de Alucinação da IA & Separação de Dados Factuais
- **Dados Factuais Protegidos**: Nome, endereço, coordenadas, avaliação e horário são oriundos **exclusivamente do provedor de dados factuais**.
- **Restrição do Gemini**: A IA não pode alterar o nome, endereço ou coordenadas do POI. Ela apenas utiliza o objeto normalizado retornado por este serviço para organizar a agenda do dia.
- **Proibição de Descrição Sintética como Fato**: Descrições promocionais geradas por IA não podem substituir nem alterar os dados factuais retornados pela API de lugares.

### 3.3. Algoritmo de Tratamento de Duplicidades (`DeduplicationAlgorithm`)
- Consultas que envolvam múltiplas categorias ou múltiplos provedores podem retornar o mesmo estabelecimento (ex: um café histórico categorizado como `cafes` e `pontos_historicos`).
- **Critério de Fusão**:
  1. **Proximidade Geográfica**: Distância $\le 50$ metros ($\Delta lat, \Delta lng$).
  2. **Similaridade de Nome**: Similaridade de texto (Jaro-Winkler / Levenshtein) $\ge 0.85$.
- **Ação**: Funde os registros mantendo a categoria mais específica e preservando o `id` mais estável. O atributo `deduplicatedCount` relata quantas duplicatas foram fundidas.

### 3.4. Tratamento de Nenhum Resultado
- Quando o raio de busca não encontrar lugares para a categoria especificada (ex: busca por `praias` em uma cidade de montanha):
  - O serviço retorna `pois: []`, `totalResults: 0` e `hasResults: false`.
  - A interface exibe aviso contextual: *"Nenhuma praia encontrada a 5km desta localização. Deseja expandir a busca para 20km?"*
  - O serviço oferece sugestão automática de expansão de raio.

### 3.5. Tratamento de Rate Limit
- **Client-Side Throttling**: Máximo de **40 buscas de POIs por minuto** por sessão.
- **Cache LRU**: Cache em memória com tempo de vida (TTL) de **12 Horas** por coordenadas/categoria. Consultas do cache retornam `fromCache: true` em **< 5ms**.

### 3.6. Segurança e Isolamento da Chave de API (`APIKeyProtection`)
- A chave de API do provedor (ex: `GOOGLE_PLACES_API_KEY`) **nunca deve ser exposta nos bundles client-side**.
- O cliente chama o endpoint interno `/api/pois`, que executa a chamada protegida no servidor/Edge Function.

---

## 4. Matriz de Mapeamento das Categorias do SmartTrip

| Categoria SmartTrip | Google Places Type | OpenStreetMap Tag (Overpass) | Mapbox Category |
| :--- | :--- | :--- | :--- |
| `atracoes` | `tourist_attraction`, `point_of_interest` | `tourism=attraction` | `attraction` |
| `praias` | `natural_feature`, `beach` | `natural=beach` | `beach` |
| `museus` | `museum`, `art_gallery` | `tourism=museum` | `museum` |
| `parques` | `park`, `national_park` | `leisure=park` | `park` |
| `restaurantes` | `restaurant`, `food` | `amenity=restaurant` | `restaurant` |
| `cafes` | `cafe`, `bakery` | `amenity=cafe` | `cafe` |
| `pontos_historicos` | `historical_landmark`, `church` | `historic=*` | `historic_site` |

---

## 5. Critérios de Aceite (CA-POI)

- **`CA-POI-001` - Identificador Estável Obrigatório:** Todo POI retornado deve possuir o atributo `id` único e persistente.
- **`CA-POI-002` - Resposta Estritamente Factual:** O objeto `NormalizedPoi` deve utilizar obrigatoriamente o nome, endereço e coordenadas factuais retornados pelo provedor, sem substituição por descrições sintéticas de IA.
- **`CA-POI-003` - Deduplicação Inteligente:** POIs no mesmo local ($\le 50$m) com nomes similares ($\ge 85\%$) devem ser mesclados em um único registro.
- **`CA-POI-004` - Consumo Exclusivo pelo Gemini:** O módulo de geração de roteiro IA só deve utilizar POIs validados por este serviço.
- **`CA-POI-005` - Tratamento de Nenhum Resultado:** Quando não houver locais no raio, o serviço deve retornar `hasResults: false` de forma graciosa e sugerir aumento de raio.
- **`CA-POI-006` - Proteção da Chave de API:** Chaves privadas de APIs externas devem ser mantidas exclusivamente server-side (`/api/pois`).
- **`CA-POI-007` - Desempenho via Cache:** Consultas idênticas para a mesma região servidas no intervalo de 12h devem responder em menos de 5ms (`fromCache: true`).
- **`CA-POI-008` - Throttling Anti-Spam:** Exceder 40 requisições por minuto deve retornar resposta amigável do cache local sem travar o aplicativo.

---

## 6. Análise de Riscos

| Risco | Impacto | Mitigação |
| :--- | :--- | :--- |
| **Alucinação da IA sobre atrações** | Alto (Usuário tenta visitar um local inexistente) | **Garantia Arquitetural**: A IA seleciona apenas POIs do array de POIs factuais pré-carregados pelo serviço. |
| **Vazamento de Chave de API do Google** | Crítico (Custos indevidos e abuso de cota) | Encapsular chamadas no servidor/Edge `/api/pois` sem expor a chave no código cliente. |
| **Locais duplicados no roteiro** | Médio (Ruído e má experiência na UI) | Algoritmo de deduplicação por raio de 50m + similaridade Levenshtein/Jaro-Winkler. |
| **Cota do provedor esgotada (Rate Limit 429)** | Alto (Falha na busca de lugares) | Cache LRU de 12h + fallback gracioso para o banco pré-normalizado local. |

---

## 7. Plano de Testes & Casos de Teste (`poisService.test.ts`)

1. **`test_stable_id_preservation`**: Garantir que todo POI retornado contém um ID estável do provedor (ex: `ChIJ...`).
2. **`test_deduplication_merge`**: Enviar dois lugares com nomes similares a 20m de distância e verificar que foram mesclados em 1 registro com `deduplicatedCount === 1`.
3. **`test_no_results_handling`**: Realizar busca em coordenadas desérticas e verificar `hasResults === false` e `pois.length === 0`.
4. **`test_no_ai_factual_override`**: Garantir que o nome e endereço do POI correspondem exatamente à resposta do provedor de mapas.
5. **`test_api_key_server_isolation`**: Verificar que o cliente consome o serviço sem necessitar da chave privada no bundle.
6. **`test_cache_hit`**: Fazer 2 buscas idênticas e verificar `fromCache === true` na segunda chamada.
7. **`test_category_filtering`**: Buscar pela categoria `museus` e verificar que 100% dos resultados retornados pertencem a esta categoria.
