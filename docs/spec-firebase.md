# SPEC Técnica - Integração Firebase - SmartTrip

> **Projeto:** SmartTrip - Assistente Inteligente de Viagens  
> **Documento:** Especificação Técnica da Integração Firebase (Auth, Firestore, Security Rules)  
> **Versão:** 1.0.0  
> **Status:** Aprovado  

---

## 1. Visão Geral da Integração

O **Firebase** é o provedor primário de infraestrutura Backend-as-a-Service (BaaS) do SmartTrip. Ele responde pelo gerenciamento de identidade e autenticação de usuários (**Firebase Authentication**), pela persistência NoSQL de preferências, folgas e roteiros de viagem (**Cloud Firestore**), e pela fiscalização de acesso via **Security Rules**.

---

## 2. Diferença de SDKs: Client SDK vs. Admin SDK

Para manter a segurança e o correto isolamento de contexto no projeto, a arquitetura distingue estritamente o uso dos SDKs do Firebase:

| Característica | Firebase Client SDK (`firebase/app`, `firebase/auth`, `firebase/firestore`) | Firebase Admin SDK (`firebase-admin`) |
| :--- | :--- | :--- |
| **Onde Executa** | Navegador do usuário (Frontend / React App). | Ambiente de servidor seguro (Node.js / Route Handlers Serverless). |
| **Nível de Acesso** | Restrito e subordinado às **Security Rules** do Firestore e Auth. | Acesso privilegiado de Administrador (Bypassa Security Rules). |
| **Credenciais** | Utiliza chaves públicas identificadoras (`VITE_FIREBASE_API_KEY`, etc.). | Utiliza chave privada (Service Account JSON / `FIREBASE_ADMIN_KEY`). |
| **Casos de Uso no SmartTrip** | Login do usuário, leitura de roteiros próprios, salvamento de preferências no cliente. | Manutenção de sistema, webhooks de backend e chamadas privilegiadas de IA se necessário. |

---

## 3. Variáveis de Ambiente & Ambientes (Dev / Preview / Prod)

### 3.1 Variáveis Públicas (Client SDK)
As variáveis públicas utilizam o prefixo `VITE_` e são embutidas no bundle de cliente do React/Vite. Elas atuam apenas como identificadores do projeto Firebase e não constituem segredos:

* `VITE_FIREBASE_API_KEY=""`
* `VITE_FIREBASE_AUTH_DOMAIN=""`
* `VITE_FIREBASE_PROJECT_ID=""`
* `VITE_FIREBASE_STORAGE_BUCKET=""`
* `VITE_FIREBASE_MESSAGING_SENDER_ID=""`
* `VITE_FIREBASE_APP_ID=""`

### 3.2 Variáveis Privadas (Server Side)
As variáveis privadas contêm credenciais de alto privilégio e **jamais** podem possuir o prefixo `VITE_` ou ser importadas em arquivos do cliente React:

* `FIREBASE_ADMIN_PRIVATE_KEY=""`
* `FIREBASE_ADMIN_CLIENT_EMAIL=""`

### 3.3 Estratégia de Ambientes (Dev / Preview / Prod)
1. **Desenvolvimento Local (`development`):** Utiliza projeto Firebase de desenvolvimento (ex: `smarttrip-dev`) via `.env.local`.
2. **Preview (Vercel Deployments):** Aponta para o ambiente de staging (`smarttrip-staging`).
3. **Produção (`production`):** Aponta para o projeto Firebase de produção (`smarttrip-prod`) com Security Rules ativas e monitoramento ativado.

---

## 4. Inicialização Singleton & Prevenção de Duplicação

No ecossistema React com Fast Refresh/HMR (Hot Module Replacement) ou execução serverless, a chamada repetida de `initializeApp()` lança a exceção `FirebaseApp already exists`.

### 4.1 Padrão Singleton Verificável (Client)
O serviço de inicialização do Firebase deve verificar os aplicativos já inicializados através de `getApps()` antes de instanciar uma nova conexão:

```typescript
// Modelo Conceitual do Serviço Singleton (src/services/firebase.ts)
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Evita inicialização duplicada durante HMR
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
```

---

## 5. Autenticação (Firebase Auth)

* **Provedores Suportados:**
  - E-mail e Senha (`createUserWithEmailAndPassword`, `signInWithEmailAndPassword`).
  - Google OAuth (`GoogleAuthProvider`, `signInWithPopup` / `signInWithRedirect`).
* **Gerenciamento de Sessão:** Persistência padrão em `browserLocalPersistence` mantendo o usuário logado entre recargas.
* **Escuta de Estado:** O contexto global `AuthContext` utilizará a função `onAuthStateChanged()` para sincronizar o objeto de usuário e controlar os guards de rota privada.

---

## 6. Banco de Dados (Cloud Firestore) & Estratégia de Timestamps

### 6.1 Estrutura de Coleções
- `/users/{userId}`: Documento do usuário contendo `uid`, `email`, `displayName`, `preferences`.
- `/users/{userId}/vacationPeriods/{periodId}`: Sub-coleção de períodos de folga.
- `/users/{userId}/trips/{tripId}`: Sub-coleção de roteiros de viagem salvas.

### 6.2 Estratégia Obrigatória de Timestamps
- Para gravação e modificação no Firestore, utilizar **estritamente** `serverTimestamp()` da SDK do Firestore para evitar divergências do relógio do cliente.
- Ao converter para visualização no cliente React, formatar a data ISO ou Timestamp para string legível via utilitários em `src/utils/formatters.ts`.

---

## 7. Security Rules (Requisito Obrigatório)

O acesso ao Firestore deve ser travado no painel do Firebase usando regras baseadas em funções de autorização de usuário (RBAC). **Nenhum banco de dados do SmartTrip poderá permanecer em "Modo Teste" (leitura/escrita aberta).**

### 7.1 Regras Oficiais de Segurança do Firestore (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Função utilitária: verifica se a requisição vem de um usuário autenticado
    function isAuthenticated() {
      return request.auth != null;
    }

    // Função utilitária: verifica se o usuário autenticado é o dono do documento
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Regra da Coleção de Usuários e Sub-coleções
    match /users/{userId} {
      allow read, write: if isOwner(userId);

      // Sub-coleção de Folgas
      match /vacationPeriods/{periodId} {
        allow read, write: if isOwner(userId);
      }

      // Sub-coleção de Viagens
      match /trips/{tripId} {
        allow read, write: if isOwner(userId);
      }
    }

    // Bloqueia qualquer outro acesso não especificado por padrão
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 8. Armazenamento de Arquivos (Firebase Storage - Extensão Opcional)

* **Status:** Módulo de expansão pós-MVP / opcional.
* **Finalidade:** Caso o usuário opte por fazer upload de fotos personalizadas para avatar ou comprovantes de passagem em PDF.
* **Segurança de Storage:** Regras aplicadas da mesma forma: `match /users/{userId}/{allPaths=**} { allow read, write: if request.auth.uid == userId; }`.

---

## 9. Módulos Conceituais & Responsabilidades de Arquivos

```text
src/
├── services/
│   ├── firebase.ts          # Inicialização Singleton, exportação de auth e db
│   ├── authService.ts       # Funções de Login, Cadastro, Logout e Google OAuth
│   └── firestoreService.ts  # Operações de CRUD de viagens, folgas e preferências
├── context/
│   └── AuthContext.tsx      # Provider React escutando onAuthStateChanged
└── hooks/
    └── useAuth.ts           # Custom hook para componentes acessarem dados do usuário logado
```

---

## 10. Riscos Técnicos e Mitigações

| Risco Técnico | Impacto | Mitigação |
| :--- | :--- | :--- |
| **Exposição de Service Account Key no Client** | Crítico | Impedir qualquer importação de `firebase-admin` em arquivos de `src/` que não sejam Route Handlers de servidor. |
| **Exceção de Inicialização Duplicada no HMR** | Médio | Usar o padrão `getApps().length === 0 ? initializeApp() : getApp()`. |
| **Vazamento de Dados entre Usuários (Cross-User Access)** | Crítico | Aplicar a regra estrita `request.auth.uid == userId` no `firestore.rules`. |
| **Falha de Conexão Offline** | Baixo | Habilitar a persistência local do Firestore (`enableIndexedDbPersistence`) para cache offline. |

---

## 11. Estratégia de Testes da Integração

1. **Testes de Inicialização:** Verificar se a invocação repetida da inicialização não gera exceções no console.
2. **Testes de Regras de Segurança (Firestore Rules Emulator):** Executar a suíte de testes usando o emulador do Firebase para garantir que `isOwner` bloqueia leitura de outros UIDs.
3. **Testes de Transição de Auth:** Simular login/logout e verificar se o `AuthContext` atualiza o estado da UI instantaneamente.

---

## 12. Critérios de Aceite da Integração Firebase (CA-FB)

* **`CA-FB-001` (Singleton sem Erros):** A inicialização do Firebase deve ser realizada via Singleton, sem lançar exceções de app duplicado durante a navegação ou HMR.
* **`CA-FB-002` (Segurança de Secrets):** Nenhuma chave privada ou Service Account de admin pode estar presente no bundle gerado pelo Vite (`dist/`).
* **`CA-FB-003` (Isolamento de Dados por Usuário):** Toda gravação ou leitura no Firestore deve estar atrelada ao `uid` do usuário autenticado no caminho `/users/{userId}`.
* **`CA-FB-004` (Bloqueio por Security Rules):** O painel do Firestore deve possuir as regras oficiais ativas que impedem o acesso por requisições anônimas ou de outros UIDs.
* **`CA-FB-005` (Persistência de Timestamps):** Todos os registros gravados no Firestore que contiverem data de criação ou atualização devem utilizar `serverTimestamp()`.
* **`CA-FB-006` (Tratamento de Erro de Auth):** Erros de login (e-mail não encontrado, senha incorreta) devem ser capturados e convertidos em mensagens amigáveis em português na UI.
