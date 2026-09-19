# SPEC Técnica de Modelagem do Cloud Firestore - SmartTrip

> **Projeto:** SmartTrip - Assistente Inteligente de Viagens  
> **Documento:** Modelagem Conceitual e Física de Dados NoSQL (Cloud Firestore)  
> **Versão:** 1.0.0  
> **Status:** Aprovado  

---

## 1. Visão Geral e Princípios de Modelagem

O modelo de dados do **SmartTrip** no Cloud Firestore foi desenvolvido aplicando as melhores práticas para bancos NoSQL orientados a documentos. A estrutura prioriza o **isolamento estrito de dados por usuário**, a **simplicidade de consultas**, a **prevenção de limites de tamanho por documento (1MB)** e o **baixo custo de leitura/escrita**.

---

## 2. Análise Arquitetural: Coleção Raiz vs. Subcoleção

| Padrão | Utilizado Em | Justificativa Técnica |
| :--- | :--- | :--- |
| **Coleção Raiz (`Root Collection`)** | `/users` | Entidade de nível superior representando os viajantes cadastrados. Facilita consultas administrativas globais e autenticação. |
| **Documento Embutido (`Embedded Object`)** | `preferences` | As preferências possuem cardinalidade 1:1 estrita com o usuário e tamanho irrisório (~200 bytes). Embuti-las dentro de `/users/{userId}` elimina leituras extras (0 leituras adicionais). |
| **Subcoleção (`Subcollection`)** | `vacationPeriods` | Cardinalidade 1:N com o usuário (um usuário pode ter dezenas de folgas). Manter como subcoleção `/users/{userId}/vacationPeriods/{periodId}` isola o acesso e impede que a lista de folgas inflacione o documento principal. |
| **Subcoleção (`Subcollection`)** | `trips` | Cardinalidade 1:N. Uma viagem pode conter itinerários extensos. O isolamento em subcoleção possibilita paginação e busca individual por viagem sem carregar o perfil completo do usuário. |
| **Subcoleção (`Subcollection`)** | `itineraryItems` | Cardinalidade 1:N com a viagem (um roteiro de 7 dias pode conter de 30 a 50 atividades). Manter como subcoleção `/users/{userId}/trips/{tripId}/itineraryItems/{itemId}` evita ultrapassar o limite de 1MB por documento e permite a edição granular ("Human-in-the-loop") de itens individuais sem sobrescrever a viagem inteira. |

---

## 3. Modelagem Detalhada por Entidade

### 3.1 Entidade 1: `users`
* **Caminho:** `/users/{userId}` (onde `userId == request.auth.uid`).
* **Proprietário:** O próprio usuário (`userId`).
* **Estratégia de Exclusão:** Exclusão lógica (Soft Delete com `deletedAt`) ou exclusão física mediante solicitação de LGPD.
* **Risco de Duplicação:** Baixo (ID do documento é a chave primária `UID` do Firebase Auth).

#### Tabela de Campos (`users`)
| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :---: | :--- |
| `uid` | `string` | **Sim** | Identificador único correspondente ao Firebase Auth. |
| `email` | `string` | **Sim** | E-mail de cadastro do usuário. |
| `displayName` | `string` | **Sim** | Nome de exibição do viajante. |
| `photoURL` | `string` | Não | URL do avatar do usuário. |
| `role` | `string` | **Sim** | Papel de acesso: `"user"` (padrão) ou `"admin"`. |
| `preferences` | `map` | **Sim** | Objeto embutido com preferências de viagem. |
| `createdAt` | `timestamp` | **Sim** | Data de criação (`serverTimestamp()`). |
| `updatedAt` | `timestamp` | **Sim** | Data da última atualização (`serverTimestamp()`). |

#### Exemplo em JSON (`/users/uid_fernanda_123`)
```json
{
  "uid": "uid_fernanda_123",
  "email": "fernanda@smarttrip.com",
  "displayName": "Fernanda Costa",
  "photoURL": "https://images.unsplash.com/avatar-fernanda.jpg",
  "role": "user",
  "preferences": {
    "styles": ["Gastronomia", "Cultura", "Fotografia"],
    "budget": "moderado",
    "pace": "tranquilo"
  },
  "createdAt": "2026-09-19T10:00:00Z",
  "updatedAt": "2026-09-19T10:00:00Z"
}
```

#### Consultas Previstas
```typescript
// Leitura do perfil do usuário logado
const userRef = doc(db, 'users', currentUser.uid);
const userSnap = await getDoc(userRef);
```

---

### 3.2 Entidade 2: `preferences` (Embutido no `users`)
* **Caminho:** `/users/{userId}.preferences` (Objeto interno).
* **Proprietário:** O próprio usuário (`userId`).

#### Tabela de Campos (`preferences`)
| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :---: | :--- |
| `styles` | `array<string>` | **Sim** | Lista de estilos (ex: `["Gastronomia", "Ecoturismo"]`). |
| `budget` | `string` | **Sim** | Nível de orçamento: `"economico"`, `"moderado"`, `"luxo"`. |
| `pace` | `string` | **Sim** | Ritmo de viagem: `"tranquilo"`, `"moderado"`, `"intenso"`. |

---

### 3.3 Entidade 3: `availability` (Períodos de Folga)
* **Caminho:** `/users/{userId}/vacationPeriods/{periodId}`
* **Proprietário:** O próprio usuário (`userId`).
* **Estratégia de Exclusão:** Exclusão física direta do documento do período de folga.
* **Risco de Duplicação:** Baixo (gerado por UUID único).

#### Tabela de Campos (`vacationPeriods`)
| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :---: | :--- |
| `id` | `string` | **Sim** | Identificador único do período. |
| `userId` | `string` | **Sim** | UID do proprietário para validação de segurança. |
| `title` | `string` | **Sim** | Nome amigável (ex: "Férias de Outubro"). |
| `startDate` | `string` | **Sim** | Data de início no formato `YYYY-MM-DD`. |
| `endDate` | `string` | **Sim** | Data de término no formato `YYYY-MM-DD`. |
| `status` | `string` | **Sim** | Status: `"em_breve"`, `"em_andamento"`, `"concluida"`. |
| `daysCount` | `number` | **Sim** | Quantidade total de dias calculados. |
| `createdAt` | `timestamp` | **Sim** | Data de criação (`serverTimestamp()`). |

#### Exemplo em JSON (`/users/uid_fernanda_123/vacationPeriods/vac_001`)
```json
{
  "id": "vac_001",
  "userId": "uid_fernanda_123",
  "title": "Férias de Outubro",
  "startDate": "2026-10-10",
  "endDate": "2026-10-20",
  "status": "em_breve",
  "daysCount": 10,
  "createdAt": "2026-09-19T10:00:00Z"
}
```

#### Consultas Previstas
```typescript
// Listar folgas ativas ordenadas por data de início
const q = query(
  collection(db, 'users', currentUser.uid, 'vacationPeriods'),
  orderBy('startDate', 'asc')
);
```

---

### 3.4 Entidade 4: `trips` (Roteiros de Viagem)
* **Caminho:** `/users/{userId}/trips/{tripId}`
* **Proprietário:** O próprio usuário (`userId`).
* **Estratégia de Exclusão:** Exclusão em cascata (deleta a viagem e recursivamente todos os seus `itineraryItems`).
* **Risco de Duplicação:** Mitigado por verificação de chave única e data.

#### Tabela de Campos (`trips`)
| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :---: | :--- |
| `id` | `string` | **Sim** | Identificador único da viagem. |
| `userId` | `string` | **Sim** | UID do proprietário. |
| `title` | `string` | **Sim** | Título do roteiro (ex: "Lisboa & Porto"). |
| `destination` | `string` | **Sim** | Cidade/País de destino. |
| `startDate` | `string` | **Sim** | Data de início da viagem (`YYYY-MM-DD`). |
| `endDate` | `string` | **Sim** | Data de fim da viagem (`YYYY-MM-DD`). |
| `status` | `string` | **Sim** | Status: `"draft"`, `"saved"`, `"completed"`. |
| `coverImage` | `string` | Não | URL da imagem de capa. |
| `isUserEdited` | `boolean` | **Sim** | Flag indicando se houve revisão humana ("Human-in-the-loop"). |
| `createdAt` | `timestamp` | **Sim** | Data de criação (`serverTimestamp()`). |
| `updatedAt` | `timestamp` | **Sim** | Data da última alteração (`serverTimestamp()`). |

#### Exemplo em JSON (`/users/uid_fernanda_123/trips/trip_lisboa_001`)
```json
{
  "id": "trip_lisboa_001",
  "userId": "uid_fernanda_123",
  "title": "Lisboa & Porto 2026",
  "destination": "Portugal",
  "startDate": "2026-10-10",
  "endDate": "2026-10-15",
  "status": "saved",
  "coverImage": "https://images.unsplash.com/photo-lisboa.jpg",
  "isUserEdited": true,
  "createdAt": "2026-09-19T10:00:00Z",
  "updatedAt": "2026-09-19T10:05:00Z"
}
```

#### Consultas Previstas
```typescript
// Listar todas as viagens do usuário ordenadas por criação
const q = query(
  collection(db, 'users', currentUser.uid, 'trips'),
  orderBy('createdAt', 'desc')
);
```

---

### 3.5 Entidade 5: `itineraryItems` (Atividades do Roteiro)
* **Caminho:** `/users/{userId}/trips/{tripId}/itineraryItems/{itemId}`
* **Proprietário:** O próprio usuário (`userId`).
* **Estratégia de Exclusão:** Exclusão física individual ao remover a atividade ou exclusão em cascata ao apagar a viagem mãe.

#### Tabela de Campos (`itineraryItems`)
| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :---: | :--- |
| `id` | `string` | **Sim** | ID único da atividade. |
| `tripId` | `string` | **Sim** | ID da viagem associada. |
| `dayNumber` | `number` | **Sim** | Número do dia no roteiro (ex: `1`, `2`, `3`). |
| `time` | `string` | **Sim** | Horário da atividade (ex: `"09:00"`). |
| `timeOfDay` | `string` | **Sim** | Turno: `"morning"`, `"afternoon"`, `"evening"`. |
| `title` | `string` | **Sim** | Nome da atividade (ex: "Torre de Belém"). |
| `description` | `string` | Não | Detalhes adicionais sugeridos pela IA ou pelo usuário. |
| `category` | `string` | **Sim** | Categoria (ex: `"Gastronomia"`, `"Histórico"`). |
| `costEstimate` | `string` | Não | Estimativa de custo (ex: `"R$ 45"`). |
| `isUserEdited` | `boolean` | **Sim** | Indica se o item passou por edição humana. |
| `createdAt` | `timestamp` | **Sim** | Data de criação (`serverTimestamp()`). |

#### Exemplo em JSON (`/users/uid_fernanda_123/trips/trip_lisboa_001/itineraryItems/item_pasteis_01`)
```json
{
  "id": "item_pasteis_01",
  "tripId": "trip_lisboa_001",
  "dayNumber": 3,
  "time": "09:00",
  "timeOfDay": "morning",
  "title": "Pastéis de Belém",
  "description": "Café da manhã tradicional com pastéis de nata quentinhos.",
  "category": "Gastronomia",
  "costEstimate": "R$ 45",
  "isUserEdited": false,
  "createdAt": "2026-09-19T10:00:00Z"
}
```

---

## 4. Justificativa de Desnormalização

1. **`displayName` e `avatar` em mensagens/comentários:** Desnormalizados pontualmente para evitar requisições extras por avatar de outros membros.
2. **`isUserEdited` no documento da viagem e no item:** Desnormalizado para que a listagem principal do Dashboard consiga exibir a tag de revisão humana sem precisar ler todos os 40 itens de itinerário do banco.

---

## 5. Índices Compostos Recomendados (`firestore.indexes.json`)

Para garantir alta performance e evitar erros de consulta ordenada, o arquivo `firestore.indexes.json` contemplará:

```json
{
  "indexes": [
    {
      "collectionGroup": "vacationPeriods",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "startDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "trips",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "itineraryItems",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "dayNumber", "order": "ASCENDING" },
        { "fieldPath": "time", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## 6. Estratégia de Exclusão em Cascata (Cascading Delete)

Quando uma viagem for excluída na tela `/trips`, uma função de lote (Firestore `writeBatch`) ou transação executará os seguintes passos em lote único:
1. Deletar todos os documentos da subcoleção `itineraryItems` pertencentes àquela viagem.
2. Deletar o documento da viagem mãe em `/users/{userId}/trips/{tripId}`.

---

## 7. Matriz de Autorização por Entidade

| Entidade / Coleção | Proprietário (Owner) | Outro Usuário Autenticado | Usuário Anônimo | Administrador (`role == admin`) |
| :--- | :---: | :---: | :---: | :---: |
| `/users/{userId}` | Read / Write | Bloqueado | Bloqueado | Read / Write |
| `/users/{userId}/vacationPeriods` | Read / Write | Bloqueado | Bloqueado | Read / Write |
| `/users/{userId}/trips` | Read / Write | Bloqueado | Bloqueado | Read / Write |
| `/users/{userId}/trips/.../itineraryItems` | Read / Write | Bloqueado | Bloqueado | Read / Write |

---

## 8. Regras Oficiais de Segurança do Firestore (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function notChangingRole() {
      return !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']);
    }

    // Coleção Raiz de Usuários
    match /users/{userId} {
      allow create: if isOwner(userId) && request.resource.data.role == 'user';
      allow read: if isOwner(userId);
      allow update: if isOwner(userId) && notChangingRole();
      allow delete: if isOwner(userId);

      // Subcoleção de Folgas
      match /vacationPeriods/{periodId} {
        allow read, write: if isOwner(userId);
      }

      // Subcoleção de Viagens
      match /trips/{tripId} {
        allow read, write: if isOwner(userId);

        // Subcoleção de Itens do Itinerário
        match /itineraryItems/{itemId} {
          allow read, write: if isOwner(userId);
        }
      }
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 9. Critérios de Aceite da Modelagem (CA-FS)

* **`CA-FS-001` (Hierarquia de Subcoleção):** As folgas, viagens e itens de itinerário devem ser salvos estritamente em subcoleções abaixo do caminho do usuário `/users/{userId}`.
* **`CA-FS-002` (Uso Obrigatório de `serverTimestamp()`):** Todos os campos `createdAt` e `updatedAt` devem ser gravados usando a função oficial `serverTimestamp()`.
* **`CA-FS-003` (Imutabilidade de `role`):** Qualquer tentativa de alteração do campo `role` via cliente deve falhar com o erro `PERMISSION_DENIED`.
* **`CA-FS-004` (Exclusão em Cascata):** Ao deletar uma viagem, seus itens de itinerário devem ser completamente removidos sem deixar documentos órfãos no banco.
* **`CA-FS-005` (Conformidade com os Schemas):** Os documentos gravados no Firestore devem corresponder integralmente às interfaces TypeScript declaradas em `src/types.ts`.
