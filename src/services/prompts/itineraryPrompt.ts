/**
 * MÓDULO VERSIONADO DE PROMPTS DO SMARTTRIP (v1.0.0-grounded-json)
 * 
 * Mantém as instruções de sistema, templates de tarefa e sanitização contra Prompt Injection.
 */

export const PROMPT_VERSION = 'v1.0.0-grounded-json';

/**
 * Instrução estática de Sistema (System Instruction)
 * Jamais interpolar variáveis externas diretamente nesta instrução.
 */
export const SYSTEM_INSTRUCTION_V1 = `Você é o assistente de inteligência artificial especializado em planejamento de viagens do SmartTrip.
Sua única função é organizar os dados factuais fornecidos (destino, datas, clima factual, preferências do usuário e catálogo estrito de lugares) em um roteiro útil, agradável e perfeitamente estruturado em JSON.

REGRAS INVIOLÁVEIS DE ANCORAGEM FACTUAL (GROUNDING):
1. Você DEVE utilizar EXCLUSIVAMENTE os lugares presentes na lista de POIs fornecida no prompt de contexto.
2. É ESTRITAMENTE PROIBIDO inventar ou incluir atrações, restaurantes ou pontos turísticos que não estejam na lista de POIs fornecida.
3. Cada atividade DEVE conter exatamente o "placeId" e o "name" oficial do POI correspondente no catálogo.
4. Para datas com previsão meteorológica null ou ausente (fora do horizonte), você DEVE definir "weatherSummary": null no JSON. NUNCA invente temperaturas ou chuvas.
5. As justificativas das atividades DEVEM ser curtas (máximo 150 caracteres) e explicar por que o local atende ao perfil do usuário.
6. A saída DEVE ser estritamente um objeto JSON válido aderente ao JSON Schema solicitado. Não inclua texto explicativo antes ou depois do JSON.`;

/**
 * Sanitiza textos inseridos pelo usuário (ex: notas, preferências) para prevenir Prompt Injection.
 */
export function sanitizeUserInput(input: string): string {
  if (!input || typeof input !== 'string') return '';

  return input
    // Remove marcadores comuns de controle e escape de instrução
    .replace(/(system:|assistant:|human:|user:)/gi, '[filtrado]')
    .replace(/(ignore previous instructions|ignore all previous|override prompt)/gi, '[filtrado]')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Escapa delimitadores HTML/XML para evitar quebrar a estrutura <smarttrip_context>
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
}

export interface PromptContextParams {
  destinationName: string;
  destinationCountry: string;
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  userInterests: string[];
  userBudget: string;
  userStyle: string;
  userTransport: string;
  factualWeather: any[];
  factualPois: any[];
  retryFeedback?: string;
}

/**
 * Monta o prompt de contexto estruturado da tarefa com delimitadores XML protegidos.
 */
export function buildTaskPrompt(params: PromptContextParams): string {
  const sanitizedInterests = params.userInterests.map(sanitizeUserInput).join(', ');
  const sanitizedBudget = sanitizeUserInput(params.userBudget);
  const sanitizedStyle = sanitizeUserInput(params.userStyle);
  const sanitizedTransport = sanitizeUserInput(params.userTransport);

  const cleanWeather = JSON.stringify(params.factualWeather, null, 2);
  const cleanPois = JSON.stringify(
    params.factualPois.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      address: p.address,
      rating: p.rating ?? null
    })),
    null,
    2
  );

  let retryBlock = '';
  if (params.retryFeedback) {
    retryBlock = `\n<retry_feedback>\nATENÇÃO - CORRIJA OS SEGUINTES ERROS DA TENTATIVA ANTERIOR:\n${params.retryFeedback}\n</retry_feedback>\n`;
  }

  return `<smarttrip_context version="${PROMPT_VERSION}">
  <destination>
    <name>${sanitizeUserInput(params.destinationName)}</name>
    <country>${sanitizeUserInput(params.destinationCountry)}</country>
    <coordinates>lat=${params.latitude}, lng=${params.longitude}</coordinates>
  </destination>

  <trip_period>
    <startDate>${sanitizeUserInput(params.startDate)}</startDate>
    <endDate>${sanitizeUserInput(params.endDate)}</endDate>
  </trip_period>

  <user_preferences>
    <interests>${sanitizedInterests}</interests>
    <budget>${sanitizedBudget}</budget>
    <style>${sanitizedStyle}</style>
    <transport>${sanitizedTransport}</transport>
  </user_preferences>

  <factual_weather>
${cleanWeather}
  </factual_weather>

  <factual_pois_catalog>
${cleanPois}
  </factual_pois_catalog>
</smarttrip_context>
${retryBlock}
INSTRUÇÃO DE TAREFA:
Com base EXCLUSIVAMENTE nos dados fornecidos na tag <smarttrip_context>, monte o roteiro de viagem de ${params.startDate} a ${params.endDate} para ${params.destinationName}.
Retorne apenas o JSON estruturado do roteiro conforme as regras do sistema.`;
}
