# SmartTrip - Assistente Inteligente de Viagens

> **Projeto Final de Curso em IA Generativa**  
> Aplicação para planejamento inteligente de viagens utilizando Google Gemini, Firebase e React.

---

## 📄 Documentação Técnica & Especificações

A documentação do produto está organizada em especificações detalhadas:
- 📖 [SPEC Mestre do SmartTrip](docs/spec-mestre.md) (`docs/spec-mestre.md`)
- ⚙️ [Especificação Operacional de Inicialização](docs/spec-operacional.md) (`docs/spec-operacional.md`)
- 🎨 [Especificação da Interface-Base (UI/UX)](docs/spec-interface.md) (`docs/spec-interface.md`)
- 🔥 [Especificação Técnica da Integração Firebase](docs/spec-firebase.md) (`docs/spec-firebase.md`)
- 🔐 [Especificação Técnica de Autenticação](docs/spec-auth.md) (`docs/spec-auth.md`)
- 🗄️ [Especificação Técnica de Modelagem do Firestore](docs/spec-firestore-model.md) (`docs/spec-firestore-model.md`)
- 📅 [SPEC Conjunta: Disponibilidade & Preferências](docs/spec-disponibilidade-preferencias.md) (`docs/spec-disponibilidade-preferencias.md`)

---

## 🛠️ Tech Stack & Requisitos do Sistema

* **Runtime Recomendado:** Node.js `>= 18.18.0` (LTS 20.x recomendado)
* **Gerenciador de Pacotes:** `npm >= 9.x`
* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Motion, Lucide Icons
* **Autenticação:** Firebase Authentication
* **Banco de Dados:** Cloud Firestore
* **IA Generativa:** Google Gemini API (`@google/genai`)
* **Hospedagem & Deploy:** Vercel

---

## 📁 Estrutura do Repositório

```text
smart-trip/
├── docs/                     # Documentação do projeto
│   ├── spec-mestre.md        # SPEC Mestre oficial com requisitos (US, RF, RN, CA)
│   ├── spec-operacional.md   # Especificação operacional de ambiente e Git (OP, REP)
│   ├── spec-interface.md     # Especificação da interface UI/UX (Rotas, Layouts, CA-UI)
│   ├── spec-firebase.md      # Especificação técnica do Firebase (Auth, Firestore, Security Rules)
│   ├── spec-auth.md          # Especificação técnica de Autenticação e Perfis (CA-AUTH)
│   ├── spec-firestore-model.md # Especificação técnica do Modelo de Dados NoSQL (CA-FS)
│   └── spec-disponibilidade-preferencias.md # SPEC de Folgas e Preferências (CA-AVAIL / CA-PREF)
├── src/
│   ├── components/           # Componentes UI (Telas, Modais, Navegação)
│   ├── context/              # Contextos React (Autenticação, Estado Global)
│   ├── hooks/                # Custom React Hooks
│   ├── services/             # Clientes de API (Firebase, Gemini, Weather, Places)
│   ├── types/                # Definições de Tipos TypeScript
│   ├── utils/                # Utilitários e formatadores
│   ├── App.tsx               # Componente Raiz da Aplicação
│   ├── index.css             # Estilos Globais
│   └── main.tsx              # Ponto de Entrada da Aplicação
├── .env.example              # Modelo de Variáveis de Ambiente (sem secrets)
├── .gitignore                # Regras de exclusão do Git
├── package.json              # Dependências e Scripts
├── tsconfig.json             # Configurações do TypeScript
└── vite.config.ts            # Configuração do Bundler Vite
```

---

## 🚀 Como Executar Localmente (Checklist de Onboarding)

Siga este passo a passo para clonar, instalar e rodar o projeto localmente:

1. **Verificar a versão do Node.js:**
   ```bash
   node -v  # Deve ser >= 18.18.0
   ```

2. **Clonar e acessar o repositório:**
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd smart-trip
   ```

3. **Instalar as dependências:**
   ```bash
   npm install
   ```

4. **Configurar as Variáveis de Ambiente:**
   Copie o modelo para `.env.local` e preencha suas chaves locais:
   ```bash
   cp .env.example .env.local
   ```

5. **Verificar integridade dos tipos:**
   ```bash
   npm run lint
   ```

6. **Iniciar o Servidor de Desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse no navegador: `http://localhost:3000`

---

## 📜 Scripts Disponíveis

* `npm run dev`: Inicia o servidor local de desenvolvimento Vite (porta 3000).
* `npm run build`: Compila a aplicação para produção na pasta `dist/`.
* `npm run lint`: Executa a verificação estática de tipos com o TypeScript (`tsc --noEmit`).
* `npm run preview`: Visualiza o build de produção localmente.
