# SPEC Mestre - SmartTrip

> **Projeto:** SmartTrip - Assistente Inteligente de Viagens  
> **Contexto:** Projeto Final de Curso em IA Generativa  
> **Versão:** 1.0.0  
> **Status:** Aprovado para Desenvolvimento  

---

## 1. Visão do Produto

O **SmartTrip** é um assistente pessoal e inteligente de planejamento e gerenciamento de viagens alimentado por Inteligência Artificial Generativa (Google Gemini). Ele resolve a fragmentação e o estresse no processo de planejamento de viagens ao consolidar em uma única plataforma intuitiva a análise de disponibilidade de tempo (períodos de folga), preferências pessoais, dados climáticos e geolocalização em tempo real, gerando roteiros altamente personalizados com revisão e ajuste humano garantidos.

---

## 2. Personas

### Persona 1: Fernanda "A Viajante Ocupada" (32 anos, Gerente de Projetos)
* **Perfil:** Profissional com rotina corrida, possui períodos específicos de folga/férias fracionadas e pouco tempo para pesquisar múltiplos sites (blogs, clima, mapas, fóruns).
* **Necessidade:** Inserir suas datas de folga e suas preferências e receber rapidamente um roteiro pronto, confiável e adaptado ao clima previsto.
* **Dor:** Perder horas montando planilhas e descobrindo no destino que atrações estavam fechadas ou o clima inadequado.

### Persona 2: Lucas "O Explorador Flexível" (24 anos, Designer Freelancer)
* **Perfil:** Gosta de viajar gastando pouco ou buscando pontos de interesse fora do circuito tradicional (gastronomia local, ecoturismo, cultura).
* **Necessidade:** Personalizar fortemente os roteiros sugeridos pela IA, adicionar/remover atividades e salvar diferentes opções.
* **Dor:** Roteiros engessados e genéricos de agências tradicionais que não respeitam suas preferências de estilo de viagem.

---

## 3. Objetivos

### 3.1 Objetivos de Negócio / Produto
* **OBJ-001:** Entregar um MVP funcional e completo como projeto conclusivo do curso de IA Generativa.
* **OBJ-002:** Reduzir o tempo médio de planejamento de uma viagem de 5 horas para menos de 5 minutos.
* **OBJ-003:** Atingir taxa de aprovação > 85% na utilidade dos roteiros gerados via IA na percepção dos usuários de teste.

### 3.2 Objetivos Técnicos
* **OBJ-T01:** Arquitetura Serverless moderna utilizando React / TypeScript / Vite implantada na Vercel.
* **OBJ-T02:** Integração resiliente com Google Gemini API para geração estruturada de JSON de roteiros.
* **OBJ-T03:** Segurança robusta com Firebase Authentication e Cloud Firestore Security Rules.

---

## 4. Escopo MVP (Obrigatório)

O MVP contempla todas as funcionalidades essenciais para autenticação, perfil, parametrização, consulta de APIs externas e geração/gestão de roteiros com IA:

1. **Autenticação de Usuários:** Cadastro, login (e-mail/senha e Google) e logout via Firebase Auth.
2. **Perfil do Usuário:** Dados básicos do viajante e foto de perfil.
3. **Períodos de Folga:** Cadastro e gerenciamento de datas de férias ou folgas disponíveis.
4. **Preferências de Viagem:** Estilo (relax, aventura, cultural, gastronômico), orçamento e ritmo.
5. **Busca de Destino & Geolocalização:** Busca por cidades/países e suporte a geolocalização atual.
6. **Previsão do Clima:** Consulta à API de clima para o período do destino.
7. **Pontos de Interesse (POIs):** Listagem de atrações locais com dados atualizados.
8. **Geração de Roteiro com Gemini:** Criação automatizada de itinerário dia-a-dia estruturado por IA.
9. **Revisão Humana (Human-in-the-loop):** Edição manual, reordenação e exclusão de itens no roteiro gerado.
10. **Persistência:** Salvamento de roteiros finalizados no Cloud Firestore.
11. **Listagem e Exclusão de Viagens:** Dashboard com viagens salvas e opção de remoção.
12. **Segurança:** Regras de acesso a dados por usuário (RBAC básico) e proteção de API Keys.
13. **Deploy:** Aplicação em produção na infraestrutura Vercel.

---

## 5. Escopo Pós-MVP (Evoluções Futuras)

Recursos planejados para expansão da plataforma após validação do MVP:

1. **Compartilhamento de Roteiro:** Links públicos / exportação em PDF e imagem.
2. **Feed Social:** Feed da comunidade para explorar e curtir roteiros criados por outros viajantes.
3. **Copiar Roteiro:** Clonar um roteiro de outro usuário para a própria conta para personalização.
4. **Grupos de Viagem:** Colaboração em tempo real entre múltiplos usuários no mesmo roteiro.
5. **Votação em Atividades:** Sistema de enquetes/votação entre membros do grupo de viagem.
6. **Sincronização com Google Calendar:** Exportar eventos do roteiro direto para o calendário pessoal.
7. **Painel de Administração:** Dashboard para métricas de uso de token do Gemini e gestão de usuários.

---

## 6. Jornadas do Usuário

### Jornada A: Criação do Primeiro Roteiro com IA (MVP)
1. **Acesso:** O usuário acessa o SmartTrip e realiza cadastro/login.
2. **Configuração Inicial:** Preenche suas preferências no perfil e cadastra um período de folga (ex: 10 a 15 de Outubro).
3. **Definição da Viagem:** Seleciona um destino pesquisado ou usa geolocalização.
4. **Análise de Contexto:** O sistema busca o clima previsto e atrações locais relevantes.
5. **Geração por IA:** O usuário clica em "Gerar Roteiro". O Gemini processa o perfil, clima e destino, devolvendo um itinerário detalhado.
6. **Revisão Humana:** O usuário ajusta o roteiro (troca um restaurante, altera horários).
7. **Persistência:** O usuário clica em "Salvar Viagem". A viagem fica guardada no seu dashboard.

---

## 7. Histórias de Usuário Numeradas

* **US-001:** Como novo usuário, quero me cadastrar com e-mail/senha ou conta Google para acessar a plataforma com segurança.
* **US-002:** Como usuário cadastrado, quero editar meu perfil e definir minhas preferências de viagem (ritmo, estilo, orçamento) para personalizar os roteiros gerados.
* **US-003:** Como viajante, quero cadastrar meus períodos de folga no perfil para visualizar rapidamente quando posso viajar.
* **US-004:** Como usuário, quero pesquisar um destino ou autorizar minha localização atual para planejar uma viagem para essa cidade.
* **US-005:** Como viajante, quero visualizar a previsão do tempo para o destino e período escolhidos para preparar as malas e atividades adequadas.
* **US-006:** Como usuário, quero visualizar pontos de interesse sugeridos (pontos turísticos, restaurantes, parques) no destino selecionado.
* **US-007:** Como viajante, quero solicitar a geração de um roteiro inteligente via Gemini para obter um planejamento dia a dia adaptado ao meu perfil e ao clima.
* **US-008:** Como usuário, quero poder revisar e editar manualmente qualquer item do roteiro gerado pela IA antes de finalizar.
* **US-009:** Como viajante, quero salvar o roteiro revisado na minha conta para consulta futura.
* **US-010:** Como usuário, quero ver uma lista das minhas viagens salvas e poder excluir viagens antigas ou indesejadas.
* **US-011 (Pós-MVP):** Como viajante, quero gerar um link público do meu roteiro para compartilhar com amigos no WhatsApp.
* **US-012 (Pós-MVP):** Como usuário, quero explorar o feed social para me inspirar com roteiros criados por outras pessoas e poder copiá-los para a minha conta.
* **US-013 (Pós-MVP):** Como viajante em grupo, quero convidar amigos para meu grupo de viagem para votarmos nas atrações que queremos visitar.
* **US-014 (Pós-MVP):** Como usuário, quero sincronizar meu roteiro finalizado com meu Google Calendar em um clique.

---

## 8. Requisitos Funcionais Numerados

### Módulo: Autenticação & Perfil
* **RF-001:** O sistema deve permitir cadastro e autenticação de usuários via e-mail/senha e via provedor OAuth Google (Firebase Auth).
* **RF-002:** O sistema deve manter sessão ativa e permitir logout seguro do usuário.
* **RF-003:** O sistema deve armazenar e permitir edição das preferências do usuário: Estilo (Cultural, Gastronômico, Ecoturismo, Relax, Aventura), Orçamento (Econômico, Moderado, Luxo) e Ritmo (Intenso, Moderado, Tranquilo).
* **RF-004:** O sistema deve permitir cadastrar, listar e remover períodos de folga/férias (data início e data fim).

### Módulo: Busca & Contexto Ambiental
* **RF-005:** O sistema deve disponibilizar um campo de busca autocompletável para encontrar cidades de destino.
* **RF-006:** O sistema deve permitir capturar a localização atual do usuário via API de Geolocalização do navegador mediante permissão.
* **RF-007:** O sistema deve consumir a API de Clima para obter a previsão do tempo no destino durante as datas selecionadas.
* **RF-008:** O sistema deve listar pontos de interesse (POIs) no destino com categoria, nota/avaliação e endereço aproximado.

### Módulo: Geração por IA & Revisão Humana
* **RF-009:** O sistema deve enviar um prompt estruturado à API do Gemini contendo: destino, período, previsão do tempo, perfil/preferências e POIs selecionados.
* **RF-010:** O sistema deve exigir e validar a resposta do Gemini em formato JSON estrito contendo itinerário dia-a-dia divididos em turnos (manhã, tarde, noite).
* **RF-011:** O sistema deve exibir uma interface interativa de revisão ("Human-in-the-loop"), onde o usuário pode adicionar, editar a descrição, reordenar ou remover itens sugeridos pela IA.

### Módulo: Persistência & Gestão de Viagens
* **RF-012:** O sistema deve salvar o roteiro aprovado no Cloud Firestore associado exclusivamente ao UID do usuário logado.
* **RF-013:** O sistema deve exibir o Dashboard do usuário com a listagem de viagens passadas e futuras, ordenadas por data.
* **RF-014:** O sistema deve permitir a exclusão permanente de uma viagem pelo seu proprietário, com confirmação prévia.

---

## 9. Requisitos Não-Funcionais Numerados

* **RNF-001 (Desempenho):** O tempo de resposta inicial da interface (FCP - First Contentful Paint) deve ser inferior a 1,5 segundos.
* **RNF-002 (Tempo de IA):** A geração de roteiros pela API Gemini deve fornecer feedback visual de carregamento (skeletons/spinners) e responder em no máximo 10 segundos.
* **RNF-003 (Disponibilidade):** A aplicação deve alcançar disponibilidade de 99,5% hospedada na plataforma Vercel.
* **RNF-004 (Usabilidade & Responsividade):** A interface deve seguir um design responsivo (Mobile First), adaptando-se a telas de smartphones, tablets e desktops com visual moderno.
* **RNF-005 (Manutenibilidade):** O código fonte deve ser escrito em TypeScript estrito, utilizando Vite/React e componentes modularizados.
* **RNF-006 (Privacidade):** A aplicação deve respeitar os princípios da LGPD, armazenando apenas os dados estritamente necessários do usuário e permitindo a exclusão de conta.

---

## 10. Regras de Negócio Numeradas

* **RN-001 (Autenticação Obrigatória):** Apenas usuários autenticados podem gerar, editar ou salvar roteiros de viagem.
* **RN-002 (Consistência de Datas):** A data de início de uma viagem/folga deve ser obrigatoriamente menor ou igual à data de término, e não pode ser anterior à data atual (salvo histórico).
* **RN-003 (Limite de Roteiros MVP):** Cada usuário pode ter no máximo 20 viagens salvas concorrentemente no plano MVP gratuito para otimização do Firestore.
* **RN-004 (Obrigatoriedade de Revisão Humana):** O roteiro gerado pelo Gemini não é salvo automaticamente; ele deve passar obrigatoriamente pela etapa de visualização/revisão antes da gravação no Firestore.
* **RN-005 (Isolamento de Dados):** Um usuário só pode visualizar, alterar ou excluir suas próprias viagens e períodos de folga.

---

## 11. Arquitetura

### 11.1 Diagrama de Visão Geral da Arquitetura
```
[ Navegador / Cliente Mobile ]
              │
              │ HTTPS / React + Vite
              ▼
    ┌───────────────────┐
    │   Vercel Hosting  │
    └─────────┬─────────┘
              │
    ┌─────────┼───────────────────┬───────────────────┐
    │         │                   │                   │
    ▼         ▼                   ▼                   ▼
┌────────┐ ┌───────────────┐ ┌──────────────┐ ┌────────────────┐
│Firebase│ │Cloud Firestore│ │Google Gemini │ │ Weather & POI  │
│  Auth  │ │  (Database)   │ │    API       │ │ External APIs  │
└────────┘ └───────────────┘ └──────────────┘ └────────────────┘
```

### 11.2 Pilha Tecnológica (Tech Stack)
* **Frontend:** React 19, TypeScript, Vite, Vanilla CSS / Tailwind CSS v4, Lucide Icons, Motion.
* **Autenticação:** Firebase Authentication.
* **Banco de Dados:** Cloud Firestore (NoSQL Serverless).
* **Inteligência Artificial:** Google Gemini API (`@google/genai` SDK).
* **APIs Externas:** OpenWeatherMap API (clima) e Nominatim / OpenStreetMap / Google Places (POIs e Geocoding).
* **Hospedagem & CI/CD:** Vercel.

---

## 12. Modelo de Dados Conceitual

O banco de dados Cloud Firestore utilizará as seguintes coleções principais:

```
users (Collection)
 └── {userId} (Document)
      ├── uid: string
      ├── email: string
      ├── displayName: string
      ├── photoURL: string
      ├── preferences: {
      │    styles: string[]      // ex: ["gastronomico", "cultural"]
      │    budget: string        // ex: "moderado"
      │    pace: string          // ex: "tranquilo"
      │   }
      ├── createdAt: timestamp
      │
      ├── vacationPeriods (Sub-collection)
      │    └── {periodId} (Document)
      │         ├── startDate: string (YYYY-MM-DD)
      │         ├── endDate: string (YYYY-MM-DD)
      │         └── label: string (ex: "Férias de Outubro")
      │
      └── trips (Sub-collection)
           └── {tripId} (Document)
                ├── destination: string
                ├── location: { lat: number, lng: number }
                ├── startDate: string
                ├── endDate: string
                ├── weatherForecast: object
                ├── status: string // "draft", "saved", "completed"
                ├── days: Array<{
                │    dayNumber: number
                │    date: string
                │    summary: string
                │    activities: Array<{
                │      id: string
                │      timeOfDay: string // "morning", "afternoon", "evening"
                │      title: string
                │      description: string
                │      locationName: string
                │      category: string
                │      isUserEdited: boolean
                │    }>
                │   }>
                ├── createdAt: timestamp
                └── updatedAt: timestamp
```

---

## 13. Integrações

1. **Google Gemini API:**
   - **Objetivo:** Geração do Roteiro Inteligente em JSON.
   - **Formato do Output:** Schema JSON estrito contendo estrutura diária com horários e atividades.

2. **OpenWeatherMap / Weather API:**
   - **Objetivo:** Consulta de temperatura e condições climáticas para as datas da viagem.

3. **API de Geocoding & POIs:**
   - **Objetivo:** Autocompletar busca de cidades e extrair latitude/longitude e lista de pontos turísticos.

4. **Firebase SDK:**
   - **Objetivo:** Login de usuário e operações de CRUD no Firestore.

---

## 14. Segurança

* **SEG-001 (Ocultação de Secrets):** As chaves privadas (`GEMINI_API_KEY`, `FIREBASE_*`, `WEATHER_API_KEY`) ficarão exclusivamente nas Variáveis de Ambiente no Vercel e `.env.local`, jamais expostas em commits.
* **SEG-002 (Regras de Segurança Firestore):** Leitura e escrita no Firestore configuradas estritamente com `request.auth.uid == userId`.
* **SEG-003 (Proteção contra Prompt Injection):** Sanitização prévia de inputs digitados pelo usuário antes de repassar ao Gemini.
* **SEG-004 (HTTPS Estrito):** Tráfego 100% criptografado com TLS/SSL provido automaticamente pela Vercel.

---

## 15. Critérios de Aceite Globais

* **CA-001 (Rastreabilidade e ID Único):** Todos os documentos e entidades de dados salvos devem possuir identificadores únicos gerados no Firestore.
* **CA-002 (Validação de Formulários):** Nenhum formulário pode ser submetido com campos obrigatórios vazios ou datas inválidas.
* **CA-003 (Feedback de Estado):** Toda requisição assíncrona (login, busca de dados, chamada de IA) deve exibir indicador claro de carregamento (spinner/skeleton) e mensagem amigável em caso de erro.
* **CA-004 (Design Responsivo):** A interface não deve apresentar quebra de layout ou barras de rolagem horizontal indesejadas em dispositivos com largura a partir de 360px.
* **CA-005 (Tratamento de Falha de API Externa):** Caso a API de Clima ou POI falhe, o sistema deve ser capaz de gerar o roteiro com o Gemini avisando ao usuário que o contexto climático foi omitido.

---

## 16. Estratégia de Testes

1. **Testes Unitários:** Validação de utilitários de formatação de datas, geradores de prompts e parse de JSON da IA.
2. **Testes de Integração:** Validação da comunicação com as APIs do Gemini e Firebase SDK.
3. **Avaliação da IA (Prompt Evaluation):** Testes com múltiplos destinos e preferências para verificar a taxa de conformidade do JSON retornado pelo Gemini e prevenção de alucinações.
4. **Testes Manuais de Usabilidade / Interface:** Navegação mobile e desktop simulando as Personas (Fernanda e Lucas).
5. **Auditoria de Segurança:** Verificação de vazamento de chaves no bundle frontend e teste de invasão básica em Security Rules do Firestore.

---

## 17. Riscos e Mitigações

| Risco | Impacto | Mitigação |
| :--- | :--- | :--- |
| **Timeout na API do Gemini** ao gerar roteiros longos | Alto | Limitar o roteiro gerado no MVP a no máximo 7 dias e utilizar respostas via Structured Outputs. |
| **Estouro de Cota Gratuita (Rate Limit)** das APIs | Médio | Implementar cache em memória ou no Firestore para buscas repetidas do mesmo destino e clima. |
| **Respostas com formato JSON inválido da IA** | Médio | Usar Schema estrito na chamada da API do Gemini e bloco `try/catch` com fallback para re-tentativa (retry). |
| **Incompatibilidade de clima** para datas distantes (>14 dias) | Baixo | Exibir média histórica de clima para datas futuras além da previsão meteorológica padrão. |

---

## 18. Fora de Escopo

Para garantir a entrega pontual do MVP no curso, **NÃO** fazem parte da entrega inicial:
* Compra direta de passagens aéreas ou reservas de hotéis integradas.
* Aplicativo nativo iOS/Android (será Web Responsive PWA-ready).
* Chatbot conversacional de estilo livre (o fluxo é guiado por formulário e geração estruturada).
* Pagamentos e planos de assinatura pagos.

---

## 19. Roadmap Incremental

### Fase 1: Fundação & Autenticação (Semanas 1-2)
* Setup do repositório, scaffolding de módulos, documentação e configs.
* Configuração do Firebase Auth e Cloud Firestore.
* Telas de Login, Cadastro e Perfil do Usuário com preferências e folgas.

### Fase 2: Integrações Externa & Motor de IA (Semanas 3-4)
* Integração da API de Geolocalização, Clima e POIs.
* Integração da API do Gemini para geração do Roteiro em JSON.
* Tela de Solicitação de Roteiro e carregamento.

### Fase 3: Edição Humana, Persistência & Dashboard (Semanas 5-6)
* Interface de revisão e edição ("Human-in-the-loop").
* Persistência da viagem no Firestore.
* Tela de Dashboard (Listagem e Exclusão de Roteiros).

### Fase 4: Polimento, Segurança & Deploy Final (Semanas 7-8)
* Ajustes estéticos (Design System premium, micro-animações).
* Aplicação de Security Rules no Firestore e auditoria de tokens.
* Apresentação final do Projeto do Curso.

---

## 20. Definition of Done (DoD)

Uma funcionalidade do SmartTrip será considerada **CONCLUÍDA (Done)** quando responder aos seguintes critérios:

1. **Código:** Escrito em TypeScript sem erros de compilação ou warnings críticos.
2. **Requisitos:** Atende integralmente à História de Usuário (US) e Requisitos Funcionais (RF) associados.
3. **Critérios de Aceite:** Aprovado em todos os Critérios de Aceite (CA) especificados.
4. **Segurança:** Sem chaves privadas expostas e com regras de segurança ativas no Firestore.
5. **Revisão de Código:** Código revisado e limpo de declarações `console.log` desnecessárias.
6. **Deploy:** Código mesclado no branch principal (`main`) e publicado com sucesso no ambiente Vercel.
7. **Documentação:** SPEC e README atualizados refletindo qualquer ajuste de arquitetura.
