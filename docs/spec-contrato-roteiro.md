# SPEC: Contrato Estruturado de Saída do Roteiro SmartTrip

**Versão:** 1.0.0  
**Status:** Aprovado / Definição de Arquitetura  
**Autor:** Arquiteto de Contratos de Dados SmartTrip  

---

## 🎯 1. Objetivo & Visão Geral

Esta especificação define o **Contrato Estruturado de Saída do Roteiro SmartTrip**. Este contrato rege o payload retornado pela camada de geração (IA Gemini / motor de itinerário) para consumo direto da interface da aplicação.

O objetivo principal é garantir que o roteiro gerado seja **100% ancorado em dados factuais** (locais reais e previsão meteorológica real), impedindo alucinações de nomes, coordenadas, endereços ou dados meteorológicos inventados, enquanto mantém uma estrutura simples e de fácil implementação e validação por alunos.

---

## 📐 2. Schema JSON de Exemplo

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SmartTripItinerary",
  "description": "Contrato de saída estruturado para roteiros de viagem no SmartTrip",
  "type": "object",
  "required": ["title", "summary", "alerts", "days"],
  "additionalProperties": false,
  "properties": {
    "title": {
      "type": "string",
      "minLength": 5,
      "maxLength": 100,
      "description": "Título descritivo do roteiro de viagem."
    },
    "summary": {
      "type": "string",
      "minLength": 10,
      "maxLength": 300,
      "description": "Resumo geral da proposta do roteiro."
    },
    "alerts": {
      "type": "array",
      "description": "Lista de alertas globais sobre a viagem (ex: logística, acessibilidade). Pode ser vazia [].",
      "items": {
        "type": "string",
        "maxLength": 200
      }
    },
    "days": {
      "type": "array",
      "minItems": 1,
      "description": "Lista cronológica de dias do roteiro.",
      "items": {
        "type": "object",
        "required": ["date", "weatherSummary", "activities"],
        "additionalProperties": false,
        "properties": {
          "date": {
            "type": "string",
            "format": "date",
            "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
            "description": "Data do dia do roteiro no formato YYYY-MM-DD. Deve pertencer ao intervalo da viagem."
          },
          "weatherSummary": {
            "type": ["object", "null"],
            "description": "Observação meteorológica factual para a data. Deve ser null quando fora do horizonte de previsão.",
            "required": ["condition", "tempMin", "tempMax", "rainProbability"],
            "additionalProperties": false,
            "properties": {
              "condition": { "type": "string" },
              "tempMin": { "type": ["number", "null"] },
              "tempMax": { "type": ["number", "null"] },
              "rainProbability": { "type": ["number", "null"] }
            }
          },
          "activities": {
            "type": "array",
            "minItems": 1,
            "maxItems": 6,
            "description": "Lista de atividades agendadas para o dia.",
            "items": {
              "type": "object",
              "required": ["placeId", "name", "periodOrTime", "justification"],
              "additionalProperties": false,
              "properties": {
                "placeId": {
                  "type": "string",
                  "description": "ID estável do lugar. DEVE corresponder a um ID retornado pelo serviço de POIs."
                },
                "name": {
                  "type": "string",
                  "description": "Nome oficial do ponto de interesse."
                },
                "periodOrTime": {
                  "type": "string",
                  "maxLength": 30,
                  "description": "Período do dia ('manhã', 'tarde', 'noite') ou horário estipulado (ex: '09:00 - 11:30')."
                },
                "justification": {
                  "type": "string",
                  "maxLength": 150,
                  "description": "Justificativa curta e objetiva conectando a escolha às preferências do usuário."
                },
                "notes": {
                  "type": "string",
                  "maxLength": 150,
                  "description": "Observações úteis ou conselhos práticos (opcional)."
                }
              }
            }
          }
        }
      }
    }
  }
}
```

---

## 📋 3. Definição de Cada Campo & Obrigatoriedade

| Campo | Tipo | Obrigatoriedade | Descrição & Regras de Formato |
| :--- | :--- | :--- | :--- |
| `title` | `string` | **Obrigatório** | Título claro e atraente do roteiro (5 a 100 caracteres). Ex: *"Lisboa Histórica & Gastronômica"*. |
| `summary` | `string` | **Obrigatório** | Resumo conceitual da viagem (10 a 300 caracteres). |
| `alerts` | `string[]` | **Obrigatório** | Lista de avisos globais (logística, clima, deslocamento). **Pode ser lista vazia (`[]`)**. |
| `days` | `DayPlan[]` | **Obrigatório** | Lista não-vazia de dias da viagem. Devem estar em ordem cronológica. |
| `days[].date` | `string` | **Obrigatório** | Data no formato ISO (`YYYY-MM-DD`). Deve obrigatoriamente estar entre `startDate` e `endDate` da viagem. |
| `days[].weatherSummary` | `WeatherInfo \| null` | **Obrigatório (Nullable)** | Dados meteorológicos factuais. **DEVE ser `null`** se a data estiver fora do horizonte de previsão (ex: > 14 dias). |
| `days[].weatherSummary.condition` | `string` | Obrigatório (se objeto) | Condição textual (ex: `"Ensolarado"`, `"Nublado"`, `"Sem previsão (fora do horizonte)"`). |
| `days[].weatherSummary.tempMin` | `number \| null` | Obrigatório (se objeto) | Temperatura mínima em ºC. `null` se indisponível. |
| `days[].weatherSummary.tempMax` | `number \| null` | Obrigatório (se objeto) | Temperatura máxima em ºC. `null` se indisponível. |
| `days[].weatherSummary.rainProbability`| `number \| null` | Obrigatório (se objeto) | Probabilidade de chuva em % (0 a 100). `null` se indisponível. |
| `days[].activities` | `Activity[]` | **Obrigatório** | Lista de 1 a 6 atividades planejadas para o dia. |
| `days[].activities[].placeId` | `string` | **Obrigatório** | ID estável do POI. **DEVE existir** na lista de POIs factuais fornecidos na requisição. |
| `days[].activities[].name` | `string` | **Obrigatório** | Nome oficial do local exatamente como fornecido pelo serviço de POIs. |
| `days[].activities[].periodOrTime` | `string` | **Obrigatório** | Período ("manhã", "tarde", "noite") ou horário curto (ex: "09:00 - 11:30"). Máximo de 30 caracteres. |
| `days[].activities[].justification` | `string` | **Obrigatório** | Explicação concisa da escolha com base no perfil (máximo 150 caracteres). Proibido textos prolixos. |
| `days[].activities[].notes` | `string` | *Opcional* | Dica ou detalhe operacional curto (máximo 150 caracteres). |

---

## 🔒 4. Invariantes do Domínio

As invariantes são regras de integridade invioláveis que garantem a rastreabilidade e veracidade do contrato:

1. **Rastreabilidade Factual de Locais (`placeId Integrity`)**:
   Todo `placeId` em `activities` **DEVE corresponder exatamente** a um `id` presente no catálogo de lugares previamente consultado e enviado no contexto. Não é permitido criar IDs inventados ou genéricos (ex: `"place-123"` ou `"local-qualquer"`).
2. **Pertencimento Temporal (`Date Boundary`)**:
   Todas as datas em `days[].date` **DEVEM ser iguais ou estar contidas no intervalo** `[startDate, endDate]` do registro de viagem do usuário.
3. **Ausência de Clima Fictício (`No Weather Hallucination`)**:
   Datas que excedem o horizonte determinístico do serviço meteorológico (> 14 dias no futuro ou no passado) **DEVEM utilizar `weatherSummary: null`** ou indicar ausência explícita de previsão. Proibido inventar dados numéricos de temperatura/chuva.
4. **Concisão de Justificativas (`Concise Rationale`)**:
   O campo `justification` possui limite máximo estrito de 150 caracteres para evitar blocos longos de texto e focar na relevância para as preferências do usuário.
5. **Composição Factual Exclusiva (`No Unsourced Facts`)**:
   Não é permitido adicionar atrações ou locais que não constem na lista de POIs válidos fornecidos pelo backend.

---

## 🛠️ 5. Validações

A validação do contrato é executada em 3 níveis:

### 5.1. Validação de Schema (Estrutural)
- Presença de todos os campos obrigatórios (`title`, `summary`, `alerts`, `days`).
- Formatos de data (`YYYY-MM-DD`).
- Limites de tamanho em strings (`justification` <= 150 caracteres, `periodOrTime` <= 30 caracteres).

### 5.2. Validação Cruzada de Contexto (Business Rules)
- **Validação de Locais**:
  $$\forall \text{activity} \in \text{activities}, \quad \text{activity.placeId} \in \{ \text{poi.id} \mid \text{poi} \in \text{ProvidedPois} \}$$
- **Validação de Intervalo de Datas**:
  $$\forall \text{day} \in \text{days}, \quad \text{trip.startDate} \le \text{day.date} \le \text{trip.endDate}$$
- **Validação de Coerência de Clima**:
  Se `day.date` for superior a `today + 14d`, `weatherSummary` deve ser `null`.

---

## ✅ 6. Exemplos Válidos

### 6.1. Exemplo Válido 1: Roteiro Padrão Completo (Com Previsão Meteorológica & Alertas)

```json
{
  "title": "Lisboa Histórica & Gastronômica",
  "summary": "Um roteiro de 2 dias explorando monumentos emblemáticos, gastronomia local e miradouros em Lisboa.",
  "alerts": [
    "O Castelo de São Jorge requer caminhada em ladeiras íngremes; use calçados confortáveis.",
    "Recomenda-se comprar ingressos antecipados para os monumentos de Belém."
  ],
  "days": [
    {
      "date": "2026-09-22",
      "weatherSummary": {
        "condition": "Ensolarado",
        "tempMin": 16,
        "tempMax": 24,
        "rainProbability": 10
      },
      "activities": [
        {
          "placeId": "ChIJb9X7m_sZGQ0RkXb-Y2q7_1A",
          "name": "Castelo de São Jorge",
          "periodOrTime": "manhã",
          "justification": "Atende ao interesse em pontos históricos e proporciona vista panorâmica da cidade.",
          "notes": "Chegue às 09:00 para evitar filas na bilheteria."
        },
        {
          "placeId": "ChIJc8Y8n_sZGQ0RkXb-Y2q7_2B",
          "name": "Pastéis de Belém",
          "periodOrTime": "tarde",
          "justification": "Atende ao interesse em culinária e cafés tradicionais portugueses."
        }
      ]
    }
  ]
}
```

### 6.2. Exemplo Válido 2: Roteiro Futuro (Fora do Horizonte Meteorológico & Sem Alertas)

```json
{
  "title": "Aventura Cultural em Tóquio",
  "summary": "Imersão de 1 dia pelos templos históricos e tecnologia em Asakusa.",
  "alerts": [],
  "days": [
    {
      "date": "2026-11-15",
      "weatherSummary": null,
      "activities": [
        {
          "placeId": "ChIJvT1X_tokGGARx8y909J9_3C",
          "name": "Templo Senso-ji",
          "periodOrTime": "09:00 - 12:00",
          "justification": "Principal templo histórico da região, alinhado ao estilo de viagem cultural."
        }
      ]
    }
  ]
}
```

---

## ❌ 7. Exemplos Inválidos

### 7.1. Exemplo Inválido 1: `placeId` Inexistente na Lista de Origem

```json
{
  "title": "Passeio por Lisboa",
  "summary": "Dia de passeio no centro.",
  "alerts": [],
  "days": [
    {
      "date": "2026-09-22",
      "weatherSummary": null,
      "activities": [
        {
          "placeId": "ID_INVENTADO_12345",
          "name": "Lugar Fictício da IA",
          "periodOrTime": "manhã",
          "justification": "Lugar bonito."
        }
      ]
    }
  ]
}
```
> 🚫 **Erro de Validação:** `placeId: "ID_INVENTADO_12345"` não existe no catálogo factual de POIs fornecido ao motor de geração.

---

### 7.2. Exemplo Inválido 2: Data Fora do Intervalo da Viagem (`[2026-09-20, 2026-09-22]`)

```json
{
  "title": "Viagem para Lisboa",
  "summary": "Roteiro de teste.",
  "alerts": [],
  "days": [
    {
      "date": "2026-09-30",
      "weatherSummary": null,
      "activities": [
        {
          "placeId": "ChIJb9X7m_sZGQ0RkXb-Y2q7_1A",
          "name": "Castelo de São Jorge",
          "periodOrTime": "manhã",
          "justification": "Ponto histórico."
        }
      ]
    }
  ]
}
```
> 🚫 **Erro de Validação:** A data `2026-09-30` está fora do intervalo cadastrado da viagem (`2026-09-20` a `2026-09-22`).

---

### 7.3. Exemplo Inválido 3: Clima Inventado Fora do Horizonte (> 14 Dias)

```json
{
  "title": "Férias em Dezembro",
  "summary": "Viagem de fim de ano.",
  "alerts": [],
  "days": [
    {
      "date": "2026-12-25",
      "weatherSummary": {
        "condition": "Ensolarado e Quente",
        "tempMin": 22,
        "tempMax": 30,
        "rainProbability": 0
      },
      "activities": [
        {
          "placeId": "ChIJb9X7m_sZGQ0RkXb-Y2q7_1A",
          "name": "Castelo de São Jorge",
          "periodOrTime": "tarde",
          "justification": "Visita histórica."
        }
      ]
    }
  ]
}
```
> 🚫 **Erro de Validação:** Data `2026-12-25` excede 14 dias no futuro. Dados meteorológicos numéricos específicos não podem ser inventados; `weatherSummary` deve ser `null`.

---

### 7.4. Exemplo Inválido 4: Justificativa Prolixa (Excede 150 Caracteres)

```json
{
  "title": "Roteiro Histórico",
  "summary": "Visita a locais históricos.",
  "alerts": [],
  "days": [
    {
      "date": "2026-09-22",
      "weatherSummary": null,
      "activities": [
        {
          "placeId": "ChIJb9X7m_sZGQ0RkXb-Y2q7_1A",
          "name": "Castelo de São Jorge",
          "periodOrTime": "manhã",
          "justification": "Este lugar foi escolhido porque o usuário demonstrou um interesse extremamente profundo em monumentos antigos durante o preenchimento do formulário de preferências e também porque o castelo possui uma história fascinante que remonta aos séculos passados e oferece uma vista verdadeiramente inesquecível de toda a cidade de Lisboa."
        }
      ]
    }
  ]
}
```
> 🚫 **Erro de Validação:** O campo `justification` contém 342 caracteres (limite máximo é 150 caracteres).

---

## 🏁 8. Critérios de Aceite

Para considerar o contrato de saída do roteiro validado e pronto para produção:

- [x] **CA-01 (Formato JSON Válido)**: A saída da camada de geração deve ser um JSON válido aderente ao JSON Schema definido nesta SPEC.
- [x] **CA-02 (Rastreabilidade de POIs)**: 100% dos `placeId` nas atividades devem ser estritamente mapeáveis aos POIs factuais retornados pelo serviço de POIs.
- [x] **CA-03 (Validação de Intervalo de Datas)**: Todas as datas em `days[].date` pertencem obrigatoriamente ao período da viagem.
- [x] **CA-04 (Clima Factual / Null)**: Datas dentro do horizonte (0-14 dias) contêm dados meteorológicos reais do serviço meteorológico; datas fora do horizonte possuem `weatherSummary: null`.
- [x] **CA-05 (Flexibilidade de Alertas)**: O array `alerts` aceita 0 ou mais itens sem falhar na validação.
- [x] **CA-06 (Concisão)**: Nenhuma justificativa ultrapassa 150 caracteres.
- [x] **CA-07 (Interface Simples)**: A validação do contrato pode ser realizada por alunos através de funções auxiliares TypeScript simples (ex: `validateItineraryContract(itinerary, tripContext, poisContext)`).

---

## 🧪 9. Casos de Teste (Suíte de Testes de Contrato)

A suíte automatizada de testes de contrato deve validar os seguintes cenários:

| ID | Nome do Teste | Dado de Entrada | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **CT-01** | Roteiro Completo Válido | Roteiro com POIs válidos, datas no período e clima válido | `isValid: true`, `errors: []` |
| **CT-02** | Lista Vazia de Alertas | `alerts: []` | `isValid: true` |
| **CT-03** | Data Fora da Viagem | `day.date` = "2026-09-30" (Viagem de 20-22/09) | `isValid: false`, Erro: `"Data 2026-09-30 fora do período da viagem"` |
| **CT-04** | `placeId` Fictício | `placeId` = "FANTASIA_999" | `isValid: false`, Erro: `"placeId FANTASIA_999 não encontrado na lista factual de POIs"` |
| **CT-05** | Clima Inventado Fora do Horizonte | Data +30 dias com `tempMin: 20` | `isValid: false`, Erro: `"Previsão meteorológica numéruca proibida para datas fora do horizonte (use null)"` |
| **CT-06** | Justificativa Longa | `justification` com 200 caracteres | `isValid: false`, Erro: `"Justificativa excede 150 caracteres"` |
| **CT-07** | Ausência de Atividades | `activities: []` em um dia | `isValid: false`, Erro: `"Cada dia deve conter ao menos 1 atividade"` |
| **CT-08** | Nome do Local Alterado | `placeId` válido mas `name` modificado | `isValid: false`, Erro: `"Nome 'Lugar X' não corresponde ao nome factual 'Lugar Y' do POI"` |
