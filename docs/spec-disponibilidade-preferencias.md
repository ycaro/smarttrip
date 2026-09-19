# SPEC Conjunta: Disponibilidade & Preferências de Viagem - SmartTrip

> **Projeto:** SmartTrip - Assistente Inteligente de Viagens  
> **Documento:** Especificação Técnica e Funcional de Períodos de Folga e Preferências de Viagem  
> **Versão:** 1.0.0  
> **Status:** Aprovado  

---

## 1. Visão Geral

Esta especificação define o comportamento funcional, a experiência do usuário (UX), a modelagem de dados, as regras de validação e a persistência dos dois módulos fundamentais de entrada de contexto para a IA do SmartTrip:
1. **Períodos de Folga (Disponibilidade):** Gestão de intervalos de tempo em que o usuário está livre para viajar.
2. **Preferências de Viagem:** Parâmetros do perfil do viajante que orientam a personalização do roteiro gerado pelo Google Gemini.

---

## 2. Módulo A: Períodos de Folga (Disponibilidade)

### 2.1 Campos & Atributos da Entidade (`vacationPeriods`)

| Campo | Tipo | Obrigatório | Descrição / Validação |
| :--- | :--- | :---: | :--- |
| `id` | `string` | **Sim** | Identificador único gerado (`vac_{timestamp}`). |
| `userId` | `string` | **Sim** | UID do proprietário autenticado. |
| `title` | `string` | **Sim** | Nome da folga (ex: "Férias de Outubro", 3 a 50 caracteres). |
| `startDate` | `string` | **Sim** | Data de início no formato estrito `YYYY-MM-DD`. |
| `endDate` | `string` | **Sim** | Data de término no formato estrito `YYYY-MM-DD`. |
| `notes` | `string` | Não | Observações ou lembretes (até 250 caracteres). |
| `status` | `string` | **Sim** | Status automático: `"em_breve"`, `"em_andamento"`, `"concluida"`. |
| `daysCount` | `number` | **Sim** | Total de dias calculados inclusivamente (`endDate - startDate + 1`). |
| `createdAt` | `timestamp` | **Sim** | Data de gravação no banco (`serverTimestamp()`). |
| `updatedAt` | `timestamp` | **Sim** | Data da última alteração (`serverTimestamp()`). |

### 2.2 Operações CRUD
* **Criar:** Formulário modal ou inline na rota `/availability`.
* **Ler:** Listagem em ordem cronológica de `startDate ASC`.
* **Atualizar:** Edição de título, datas e observações com recalculo instantâneo de dias.
* **Excluir:** Remoção física do documento com confirmação prèvia.

### 2.3 Validação de Intervalos & Conflitos de Datas
* **Regra 1 (`VAL-AV-01` Ordenação de Datas):** `startDate` deve ser menor ou igual a `endDate`. Se `startDate == endDate`, é tratado como folga de 1 dia (bate-volta).
* **Regra 2 (`VAL-AV-02` Datas no Passado):** Ao cadastrar uma *nova* folga, `startDate` não pode ser anterior à data atual (salvo importação de histórico).
* **Regra 3 (`VAL-AV-03` Detecção de Conflitos / Overlapping):**
  Dois períodos $[A_{start}, A_{end}]$ e $[B_{start}, B_{end}]$ entram em conflito se:
  $$\max(A_{start}, B_{start}) \le \min(A_{end}, B_{end})$$
  - *Comportamento do Sistema:* Ao detectar sobreposição parcial ou total com uma folga existente, a UI deve exibir um alerta explicativo (*"Este período coincide com 'Férias de Outubro' (10/10 a 15/10)"*) permitindo que o usuário mescle as folgas ou prossiga ciente.

---

## 3. Módulo B: Preferências de Viagem

### 3.1 Campos & Atributos da Entidade (`preferences`)

O objeto `preferences` é mantido de forma embutida no documento `/users/{userId}`:

| Atributo | Tipo | Opções / Formato | Descrição |
| :--- | :--- | :--- | :--- |
| `interests` | `array<string>` | `["Gastronomia", "História", "Fotografia", "Arte", "Vida Noturna", "Natureza", "Compras", "Arquitetura"]` | Interesses temáticos (mínimo 1, máximo 5). |
| `budget` | `string` | `"economico"`, `"moderado"`, `"conforto"`, `"luxo"` | Faixa de orçamento padrão. |
| `style` | `string` | `"mochilao"`, `"relax"`, `"aventura"`, `"familia"`, `"casal"`, `"solo"` | Estilo predominante de viagem. |
| `transport` | `array<string>` | `["a_pe", "transporte_publico", "carro_alugado", "taxi_app", "bicicleta"]` | Meios de transporte aceitos no destino. |
| `preferredClimate` | `string` | `"ensolarado"`, `"ameno"`, `"frio_neve"`, `"indiferente"` | Clima ideal preferido. |
| `maxDistanceKmPerDay` | `number` | `3`, `5`, `10`, `25`, `50` (ou `0` para sem limite) | Raio máximo de deslocamento diário no destino. |

---

## 4. Experiência do Usuário (UX) & Interfaces

### 4.1 UI de Períodos de Folga (`/availability`)
* **Visualizador em Calendário / Timeline:** Exibição gráfica dos meses com realce colorido nos dias de folga cadastrados.
* **Badges de Status:**
  - 🟢 **Em Andamento:** Folga cuja data atual está entre `startDate` e `endDate`.
  - 🔵 **Em Breve:** Folga com `startDate` futura.
  - ⚪ **Concluída:** Folga com `endDate` no passado.
* **Ação Rápida "Planejar Viagem":** Cada card de folga possui o botão que abre a tela `/explore` preenchendo automaticamente as datas.

### 4.2 UI de Preferências (`/profile`)
* **Chips Interativos com Ícones:** Seleção de interesses e transportes via chips com efeito de ativação vibrante.
* **Slider ou Segmented Control para Distância Máxima e Orçamento.**
* **Indicador de "DNA de Viagem IA":** Visualizador resumido do perfil que mostra como o Gemini enxerga o viajante.

---

## 5. Persistência & Regras de Segurança do Firestore

### 5.1 Estrutura de Documentos
- **Folgas:** `/users/{userId}/vacationPeriods/{periodId}`
- **Preferências:** `/users/{userId}` (campo embutido `preferences`)

### 5.2 Regras de Autorização (`firestore.rules`)
```javascript
match /users/{userId} {
  // Leitura e escrita nas preferências apenas pelo proprietário
  allow read, write: if request.auth != null && request.auth.uid == userId;

  // Leitura e escrita na subcoleção de folgas apenas pelo proprietário
  match /vacationPeriods/{periodId} {
    allow read, write: if request.auth != null && request.auth.uid == userId;
  }
}
```

---

## 6. Casos Extremos (Edge Cases)

1. **Ano Bissexto:** Validação nativa de datas (ex: `2028-02-29` é válido, `2027-02-29` é rejeitado).
2. **Folga de 1 Dia (`startDate == endDate`):** Aceito e calculado com `daysCount = 1`.
3. **Fuso Horário no Cliente:** As datas `startDate` e `endDate` devem ser armazenadas como strings puras `YYYY-MM-DD` para evitar deslocamento de fuso horário UTC em viagens internacionais.
4. **Alteração de Preferências com Roteiros Ativos:** Alterar as preferências no `/profile` atualiza o perfil global do usuário, mas **não altera retroativamente roteiros já salvos e finalizados** em `/trips`.

---

## 7. Critérios de Aceite (CA)

### 7.1 Critérios de Disponibilidade (CA-AVAIL)
* **`CA-AVAIL-001` (Validação de Datas):** O formulário deve proibir submissão se `endDate < startDate`.
* **`CA-AVAIL-002` (Cálculo Inclusivo de Dias):** Um período de `2026-10-10` a `2026-10-12` deve registrar `daysCount: 3`.
* **`CA-AVAIL-003` (Alerta de Conflito):** Tentar cadastrar datas que colidam com uma folga existente deve exibir mensagem de alerta visual sem travar o sistema.
* **`CA-AVAIL-004` (Suporte a Observações):** O campo `notes` deve aceitar textos opcionais de até 250 caracteres.

### 7.2 Critérios de Preferências (CA-PREF)
* **`CA-PREF-001` (Persistência no Perfil):** Salvar preferências no `/profile` deve atualizar o objeto `preferences` no Firestore em `/users/{userId}`.
* **`CA-PREF-002` (Limites de Seleção):** A UI deve exigir no mínimo 1 interesse selecionado e limitar a no máximo 5.
* **`CA-PREF-003` (Raio de Deslocamento):** O parâmetro `maxDistanceKmPerDay` deve ser persistido como número e injetado no prompt do Gemini.
