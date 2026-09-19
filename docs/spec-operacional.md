# Especificação Operacional de Inicialização do Repositório - SmartTrip

> **Projeto:** SmartTrip - Assistente Inteligente de Viagens  
> **Documento:** Especificação Operacional de Ambiente e Repositório  
> **Versão:** 1.0.0  
> **Status:** Aprovado  

---

## 1. Requisitos de Runtime & Gerenciador de Pacotes

* **OP-001 (Versão Mínima do Node.js):**
  - Versão mínima suportada: `Node.js >= 18.18.0` (Recomendado: `Node.js 20.x LTS`).
  - *Critério de Aceite Verificável:* A execução de `node -v` deve retornar uma versão superior ou igual a `v18.18.0`.

* **OP-002 (Gerenciador de Pacotes):**
  - Gerenciador oficial: `npm >= 9.0.0`.
  - O repositório deve conter exclusivamente o arquivo `package-lock.json` como lockfile oficial para garantir builds determinísticos.
  - *Critério de Aceite Verificável:* Não deve existir arquivo `yarn.lock`, `pnpm-lock.yaml` ou `bun.lockb` versionado no repositório.

---

## 2. Scripts Obrigatórios do Repositório

O arquivo [`package.json`](file:///c:/xampp/htdocs/antigravity/smart-trip/package.json) deve obrigatoriamente expor os seguintes comandos padronizados:

* **OP-003 (`npm run dev`):** Inicia o servidor local de desenvolvimento na porta `3000` com suporte a Hot Module Replacement (HMR).
* **OP-004 (`npm run build`):** Compila o código TypeScript e gera o bundle otimizado na pasta `dist/` sem qualquer erro de compilação.
* **OP-005 (`npm run lint`):** Executa a verificação estática de tipos e linting (`tsc --noEmit`), devendo retornar código de saída `0` (sucesso).
* **OP-006 (`npm run preview`):** Inicia um servidor web local servindo os arquivos compilados da pasta `dist/` para validação pré-deploy.

---

## 3. Estratégia de Variáveis de Ambiente & Segurança

* **OP-007 (Modelo `.env.example`):**
  - O arquivo [`.env.example`](file:///c:/xampp/htdocs/antigravity/smart-trip/.env.example) é de versionamento obrigatório no Git.
  - Deve conter todas as chaves necessárias para a aplicação (Firebase, Gemini API, Weather API), acompanhadas de comentários descritivos.
  - **Proibição Estrita:** O `.env.example` não deve conter senhas, tokens reais ou chaves de API válidas (valores devem ser mantidos vazios `""` ou com sintaxe de placeholder como `"SUA_CHAVE_AQUI"`).

* **OP-008 (Arquivo Local `.env.local`):**
  - Cada desenvolvedor criará seu próprio `.env.local` a partir da cópia de `.env.example`.
  - Arquivos `.env`, `.env.local` ou `.env.*.local` jamais devem ser comitados.

* **OP-009 (Regras do `.gitignore`):**
  - O arquivo [`.gitignore`](file:///c:/xampp/htdocs/antigravity/smart-trip/.gitignore) deve obrigatoriamente conter as seguintes regras de exclusão:
    ```gitignore
    node_modules/
    dist/
    build/
    coverage/
    .env
    .env.local
    .env.development.local
    .env.test.local
    .env.production.local
    *.pem
    *.key
    !.env.example
    ```
  - *Critério de Aceite Verificável:* O comando `git status` em um repositório com `.env.local` criado não deve listar o arquivo `.env.local`.

---

## 4. Convenções de Controle de Versão (Git)

* **OP-010 (Convenção de Branches):**
  - `main` / `master`: Branch protegida contendo o código estável em produção.
  - `feat/<US-ID>-<nome-curto>`: Para novas funcionalidades associadas a uma História de Usuário (ex: `feat/US-001-autenticacao-firebase`).
  - `fix/<RF-ID>-<nome-curto>`: Para correções de bugs associados a Requisitos Funcionais (ex: `fix/RF-002-logout-sessao`).
  - `docs/<nome-curto>`: Para alterações exclusivamente em documentação (ex: `docs/spec-operacional`).

* **OP-011 (Convenção de Commits - Conventional Commits):**
  - Estrutura obrigatória: `<tipo>(<escopo>): <descrição no imperativo> [<ID-DA-SPEC>]`
  - Tipos permitidos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.
  - Exemplo válido 1: `feat(auth): adiciona fluxo de login com Google [US-001]`
  - Exemplo válido 2: `fix(itinerary): corrige ordenacao de atividades [RF-011]`
  - Exemplo válido 3: `docs(spec): cria especificacao operacional do repositorio [OP-001]`

---

## 5. Requisitos Obrigatórios do README.md

O arquivo [`README.md`](file:///c:/xampp/htdocs/antigravity/smart-trip/README.md) deve atender às seguintes exigências de clareza e onboarding:

1. **Visão Geral:** Descrição concisa do objetivo do produto SmartTrip.
2. **Links de SPECs:** Link direto e clicável para `docs/spec-mestre.md` e `docs/spec-operacional.md`.
3. **Pré-requisitos:** Lista das ferramentas exigidas (Node.js versão X, npm versão Y).
4. **Guia Passo a Passo:** Comandos exatos para clonar, copiar variáveis de ambiente (`cp .env.example .env.local`), instalar dependências e iniciar o servidor dev.
5. **Tabela de Scripts:** Explicação do propósito de cada script de `package.json`.
6. **Desenho da Árvore de Diretórios:** Diagrama em formato texto representando a organização das pastas em `src/`.

---

## 6. Critérios de Reprodutibilidade do Ambiente

O ambiente do projeto será considerado **100% Reproduzível** se atender aos seguintes critérios objetivos:

* **REP-001 (Zero Dependências Globais Ocultas):** O projeto não pode depender de pacotes instalados no escopo global do sistema operacional para rodar seus scripts principais (`build`, `dev`, `lint`).
* **REP-002 (Instalação Sem Warnings Críticos):** O comando `npm install` deve rodar do início ao fim em uma máquina limpa sem erros fatais.
* **REP-003 (Build Determinístico):** O comando `npm run build` deve produzir os artefatos de saída em `dist/` utilizando apenas as dependências declaradas no `package.json`.
* **REP-004 (Integridade de Tipos):** O comando `npm run lint` deve retornar zero erros em qualquer máquina configurada com Node >= 18.18.0.

---

## 7. Checklist de Validação por Outro Aluno (Onboarding Test)

Este checklist deve ser executado por um segundo desenvolvedor/aluno ao clonar o projeto para validar a reproduzibilidade do ambiente:

- [ ] **Passo 1:** Executar `node -v` e confirmar que a versão é `>= 18.18.0`.
- [ ] **Passo 2:** Clonar o repositório (`git clone <url-do-repositorio>`).
- [ ] **Passo 3:** Executar `npm install` e verificar que todas as dependências foram instaladas e o `package-lock.json` permaneceu consistente.
- [ ] **Passo 4:** Copiar o modelo de ambiente (`cp .env.example .env.local`).
- [ ] **Passo 5:** Executar `git status` e confirmar que o arquivo `.env.local` **NÃO** é exibido como arquivo não rastreado.
- [ ] **Passo 6:** Executar `npm run lint` e validar que o comando termina com código de saída 0 (sem erros de TypeScript).
- [ ] **Passo 7:** Executar `npm run build` e confirmar a criação da pasta `dist/` sem falhas.
- [ ] **Passo 8:** Executar `npm run dev` e acessar a URL gerada (ex: `http://localhost:3000`) confirmando o carregamento da página inicial no navegador.
