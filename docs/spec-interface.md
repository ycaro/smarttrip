# SPEC da Interface-Base - SmartTrip

> **Projeto:** SmartTrip - Assistente Inteligente de Viagens  
> **Documento:** Especificação de Interface de Usuário (UI/UX) do MVP  
> **Versão:** 1.0.0  
> **Status:** Aprovado  

---

## 1. Visão Geral da Interface & Diretrizes Globais de Design

O SmartTrip adota um **Design System Moderno e Responsivo** (Mobile First), focado em proporcionar uma experiência fluida, limpa e de alto impacto visual.

### 1.1 Sistema de Cores & Tokens (Glassmorphism & Dark Mode)
* **Background Principal:** `#0F172A` (Slate 900) ou `#090D16` (Deep Dark).
* **Superfícies/Cards:** `rgba(30, 41, 59, 0.7)` com `backdrop-filter: blur(12px)` e bordas `1px solid rgba(255, 255, 255, 0.1)`.
* **Cor Primária (Brand):** Gradiente vibrante `from-indigo-500 to-purple-600` (`#6366F1` a `#9333EA`).
* **Cor Secundária (Accent):** `#10B981` (Emerald 500) para confirmações e destaques de clima positivo.
* **Texto Primário:** `#F8FAFC` (Slate 50).
* **Texto Secundário:** `#94A3B8` (Slate 400).
* **Tipografia:** Google Font `Inter` ou `Outfit` (sans-serif moderna).

---

## 2. Mapa de Rotas e Privacidade

| Rota | Nome da Tela | Acesso | Descrição / Objetivo |
| :--- | :--- | :---: | :--- |
| `/` | Landing / Redirecionamento | **Pública** | Apresentação do produto para visitantes e redirecionamento de usuários autenticados para `/dashboard`. |
| `/login` | Login de Usuário | **Pública** | Formulário de autenticação por e-mail/senha e botão de login social Google. |
| `/register` | Cadastro de Usuário | **Pública** | Formulário de criação de conta e aceitação dos termos de uso. |
| `/dashboard` | Dashboard Principal | **Privada** | Painel central com resumo da próxima viagem, atalhos rápidos e status de folgas. |
| `/profile` | Perfil & Preferências | **Privada** | Configuração de preferências de viagem (estilo, ritmo, orçamento) e dados pessoais. |
| `/availability` | Períodos de Folga | **Privada** | Gestão de intervalos de datas disponíveis/férias para planejar viagens. |
| `/explore` | Busca & Geração de Roteiro | **Privada** | Seleção de destino, geolocalização, clima, POIs e formulário de prompt para o Gemini. |
| `/trips` | Minhas Viagens | **Privada** | Listagem em grid/cards de todas as viagens salvas e atalho para exclusão/detalhes. |
| `/trips/[id]` | Detalhes & Edição de Roteiro | **Privada** | Visualização dia-a-dia do itinerário e interface "Human-in-the-loop" para edição. |

---

## 3. Especificação Detalhada por Tela

### 3.1 Rota `/` (Landing Page)
* **Objetivo:** Apresentar a proposta de valor do SmartTrip e converter visitantes em usuários cadastrados.
* **Acesso:** Pública.
* **Elementos Obrigatórios:**
  - Hero Section com título impactante, subtítulo e botão CTA "Começar Agora" (redireciona para `/register`).
  - Card demonstrativo animado de um roteiro fictício gerado por IA.
  - Carrossel ou Grid de pilares do produto (AI Gemini + Clima em Tempo Real + Edição Humana).
  - Footer com links de direitos autorais e documentação.
* **Navegação:** Botão "Entrar" no topo (vai para `/login`) e CTA principal (vai para `/register`).
* **Layout Responsivo:**
  - *Desktop:* Hero com 2 colunas (Texto à esquerda, Preview do Card à direita).
  - *Mobile:* Coluna única centralizada com CTA fixo ou em destaque.
* **Estados:**
  - *Loading/Redirecionamento:* Se o usuário já estiver logado, exibe spinner centralizado por < 500ms e redireciona automaticamente para `/dashboard`.

---

### 3.2 Rota `/login` (Autenticação)
* **Objetivo:** Permitir a autenticação de usuários já cadastrados.
* **Acesso:** Pública.
* **Elementos Obrigatórios:**
  - Campo de entrada `E-mail` com validação de formato.
  - Campo de entrada `Senha` com opção de alternar visibilidade (ícone de olho).
  - Botão principal "Entrar".
  - Botão secundário "Entrar com Google" (com ícone da marca).
  - Link "Não tem uma conta? Cadastre-se" (redireciona para `/register`).
  - Banner/Mensagem de erro de credenciais inválidas.
* **Navegação:** Sucesso no login redireciona para `/dashboard`.
* **Estados:**
  - *Vazio:* Campos limpos com placeholders.
  - *Loading:* Botões desabilitados com spinner e texto "Autenticando...".
  - *Error:* Mensagem destacada em vermelho acima do formulário.

---

### 3.3 Rota `/register` (Cadastro)
* **Objetivo:** Criar novas contas de usuários no sistema.
* **Acesso:** Pública.
* **Elementos Obrigatórios:**
  - Campo `Nome Completo`.
  - Campo `E-mail`.
  - Campo `Senha` (mínimo de 6 caracteres).
  - Campo `Confirmar Senha` (validação de correspondência).
  - Checkbox de confirmação dos Termos de Uso.
  - Botão principal "Criar Conta".
  - Link "Já possui conta? Faça Login" (redireciona para `/login`).
* **Navegação:** Sucesso no cadastro redireciona para `/profile` para configuração inicial de preferências.
* **Estados:**
  - *Error:* Validação em tempo real (senhas divergentes, e-mail malformado).

---

### 3.4 Rota `/dashboard` (Hub Central)
* **Objetivo:** Oferecer uma visão consolidada do status de viagens do usuário e atalhos rápidos.
* **Acesso:** Privada (Guard de Autenticação).
* **Elementos Obrigatórios:**
  - Header de boas-vindas personalizado ("Olá, [Nome]! Para onde vamos hoje?").
  - Card em destaque da "Próxima Viagem" (com contagem regressiva de dias, se houver).
  - Banner informativo do próximo Período de Folga cadastrado.
  - Botão de Ação Rápida "Planejar Nova Viagem" (redireciona para `/explore`).
  - Seção "Viagens Recentes" (lista horizontal ou grid com os últimos 3 roteiros).
* **Navegação:** Links para `/explore`, `/trips`, `/availability` e `/profile`.
* **Estados:**
  - *Vazio:* Caso o usuário não tenha viagens criadas, exibe um ilustrativo Banner de Boas-Vindas convidando para a primeira geração.

---

### 3.5 Rota `/profile` (Perfil & Preferências)
* **Objetivo:** Gerenciar informações pessoais e os parâmetros de viagem consumidos pela IA.
* **Acesso:** Privada.
* **Elementos Obrigatórios:**
  - Foto de Perfil (Avatar) com botão para alteração mock.
  - Campos de dados pessoais (Nome, E-mail).
  - Seção **Estilo de Viagem** (Multi-select de Chips/Pills: Cultural, Gastronômico, Ecoturismo, Relax, Aventura, Nightlife).
  - Seção **Orçamento** (Radio Buttons: Econômico, Moderado, Luxo).
  - Seção **Ritmo de Viagem** (Radio Buttons: Tranquilo, Moderado, Intenso).
  - Botão "Salvar Preferências".
* **Navegação:** Permanece na tela exibindo Toast feedback "Preferências atualizadas com sucesso!".

---

### 3.6 Rota `/availability` (Períodos de Folga)
* **Objetivo:** Cadastrar e visualizar intervalos de folga/férias para bate de datas com viagens.
* **Acesso:** Privada.
* **Elementos Obrigatórios:**
  - Formulário de Adicionar Folga: Título da Folga, Data de Início e Data de Fim.
  - Lista de Folgas Cadastradas exibida como Cards com tag de status ("Em breve", "Em andamento", "Concluída").
  - Botão de exclusão (ícone de lixeira) por item.
  - Botão "Planejar Viagem nesta Folga" em cada card (redireciona para `/explore` com datas pré-preenchidas).
* **Estados:**
  - *Vazio:* Ilustração amigável com mensagem "Nenhuma folga cadastrada ainda. Adicione suas férias para organizar seus roteiros!".

---

### 3.7 Rota `/explore` (Busca & Geração Gemini)
* **Objetivo:** Selecionar o destino, consultar contexto ambiental (clima e POIs) e disparar a geração de roteiro por IA.
* **Acesso:** Privada.
* **Elementos Obrigatórios:**
  - Campo de busca autocompletável para Destino.
  - Botão de Geolocalização "Usar Minha Localização Atual" (captura lat/lng).
  - Seleção de Período (Data de Início e Data de Fim).
  - Widget de **Previsão do Clima** (exibe temperatura prevista e condição gráfica para o período escolhido).
  - Grid de **Pontos de Interesse (POIs)** recomendados no destino com seleção via Checkbox.
  - Resumo do Perfil aplicado (exibe os badges de preferências configurados no `/profile`).
  - Botão de Ação Principal: "Gerar Roteiro com Gemini IA" (abre o Modal ou exibe a animação de geração).
* **Estados:**
  - *Loading de IA:* Animação com frases dinâmicas ("Consultando previsão do tempo...", "Analisando preferências...", "Montando seu itinerário com Gemini...").

---

### 3.8 Rota `/trips` (Minhas Viagens)
* **Objetivo:** Listar todos os roteiros salvos pelo usuário com opções de filtro e gerenciamento.
* **Acesso:** Privada.
* **Elementos Obrigatórios:**
  - Campo de busca por nome de destino.
  - Filtros por status ("Todas", "Próximas", "Concluídas").
  - Grid de Cards de Viagem (cada card contém: Imagem de Capa do destino, Nome do Destino, Período, Total de Dias e Tag de Clima).
  - Menu de Ações no Card: Botão "Ver Roteiro" e Botão "Excluir Viagem".
  - Modal de Confirmação de Exclusão ("Deseja realmente excluir a viagem para [Destino]?").
* **Estados:**
  - *Vazio:* Card central "Nenhuma viagem encontrada. Que tal criar uma agora?" com botão para `/explore`.

---

### 3.9 Rota `/trips/[id]` (Detalhes & Edição "Human-in-the-Loop")
* **Objetivo:** Exibir o itinerário detalhado gerado pela IA e permitir a revisão manual do usuário.
* **Acesso:** Privada.
* **Elementos Obrigatórios:**
  - Header da Viagem: Destino, Período, Clima Médio e Ações ("Salvar Alterações", "Exportar", "Excluir").
  - Abas/Navegação por Dias (Dia 1, Dia 2, Dia 3...).
  - Lista de Atividades por Dia dividida em Turnos (Manhã, Tarde, Noite).
  - Card de Atividade com: Horário, Título, Categoria (Badge), Descrição e Tag "Editado pelo Usuário" (se alterado).
  - **Ações Human-in-the-Loop:**
    - Botão "Editar Atividade" (abre modal para alterar título, horário e descrição).
    - Botão "Remover Atividade".
    - Botão "Adicionar Nova Atividade no Dia".
  - Botão Flutuante/Fixo "Confirmar & Salvar Viagem".
* **Estados:**
  - *Loading:* Skeleton loaders para a estrutura dos dias e atividades.

---

## 4. Componentes Reutilizáveis de UI

Para garantir consistência e produtividade, a aplicação utilizará os seguintes componentes reutilizáveis:

1. **`Navbar` / `BottomNavigation`:** Barra de navegação responsiva (Menu lateral/superior no desktop, barra inferior fixa no mobile).
2. **`Button`:** Variantes `primary` (gradiente), `secondary`, `outline`, `danger` e `ghost`, com suporte a estado `isLoading`.
3. **`Input` & `Select`:** Campos com suporte a label, ícone à esquerda, mensagem de erro e estado desabilitado.
4. **`Card`:** Container glassmorphism padrão com suporte a hover animado.
5. **`Badge` / `Chip`:** Marcadores visuais para categorias (Gastronomia, Cultura, Clima, Ritmo).
6. **`Modal`:** Diálogo sobreposto acessível com suporte a foco contido (Focus Trap) e fechamento por tecla `Esc` ou backdrop.
7. **`Toast`:** Notificação flutuante temporária para mensagens de sucesso, alerta ou erro.
8. **`SkeletonLoader`:** Indicador visual de carregamento pulsante correspondente à forma dos cards e listas.

---

## 5. Estratégia de Dados Mock (Contratos Frontend)

Nesta fase de UI, nenhuma API externa real será chamada. Os contratos de dados utilizados serão definidos em `src/data/mockData.ts`:

```typescript
export interface MockDestination {
  id: string;
  name: string;
  country: string;
  coverImage: string;
  weather: { temp: number; condition: string; icon: string };
  pois: Array<{ id: string; name: string; category: string; rating: number }>;
}

export interface MockTripItinerary {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'saved';
  days: Array<{
    dayNumber: number;
    date: string;
    activities: Array<{
      id: string;
      timeOfDay: 'morning' | 'afternoon' | 'evening';
      title: string;
      description: string;
      locationName: string;
      category: string;
      isUserEdited?: boolean;
    }>;
  }>;
}
```

---

## 6. Requisitos de Acessibilidade (a11y)

* **a11y-001 (Navegação por Teclado):** Todos os botões, campos e links devem ser alcançáveis via tecla `Tab` com indicador visual de foco nítido (`outline`).
* **a11y-002 (Leitores de Tela):** Formulários devem utilizar tags `<label>` associadas corretamente por `htmlFor`/`id`. Botões de ícone (ex: fechar modal, lixeira) devem possuir o atributo `aria-label`.
* **a11y-003 (Contraste de Cores):** Todo texto deve manter contraste mínimo de 4.5:1 em relação ao fundo escuro (atendendo ao padrão WCAG AA).
* **a11y-004 (Estrutura Semântica):** Cada tela deve conter exatamente uma tag `<h1>` principal e seções estruturadas com `<header>`, `<main>`, `<nav>` e `<section>`.

---

## 7. Critérios de Aceite da Interface (CA-UI)

* **`CA-UI-001` (Proteção de Rota Privada):** Tentativas de acessar rotas privadas (`/dashboard`, `/profile`, `/explore`, `/trips`) sem estado de autenticação devem redirecionar automaticamente para `/login`.
* **`CA-UI-002` (Responsividade Mobile First):** Todas as telas devem ser testadas nas resoluções 360px (mobile), 768px (tablet) e 1280px (desktop), sem estouro de layout horizontal.
* **`CA-UI-003` (Edição Humana no Roteiro):** Na tela `/trips/[id]`, a edição de uma atividade deve alterar visualmente seu conteúdo e aplicar o badge `Editado pelo Usuário`.
* **`CA-UI-004` (Exclusão com Confirmação):** Na tela `/trips`, o clique em "Excluir" deve obrigatoriamente abrir um modal de confirmação antes de remover o card da lista.
* **`CA-UI-005` (Feedback de Transição):** Toda mudança de tela ou acionamento de modal deve fornecer animação suave ou indicador visual de carregamento instantâneo.
