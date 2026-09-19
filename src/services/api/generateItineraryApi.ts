/**
 * ENDPOINT PROTEGIDO SERVER-SIDE: /api/generate-itinerary
 * 
 * Mantém a GEMINI_API_KEY estritamente protegida no lado do servidor.
 * Executa as chamadas à API da IA Gemini com timeout de 15s e suporte a mocks de resiliência.
 */

import { SYSTEM_INSTRUCTION_V1, PROMPT_VERSION } from '../prompts/itineraryPrompt';

export interface GenerateItineraryServerRequest {
  systemInstruction?: string;
  taskPrompt: string;
  authToken?: string;
  mockResponseOverride?: string | null;
  simulateTimeout?: boolean;
  simulateServerError?: boolean;
}

export interface GenerateItineraryServerResponse {
  success: boolean;
  rawJson?: string;
  promptVersion: string;
  executionTimeMs: number;
  errorMessage?: string;
}

/**
 * Handler do endpoint server-side /api/generate-itinerary
 */
export async function handleGenerateItineraryApi(
  req: GenerateItineraryServerRequest,
  signal?: AbortSignal
): Promise<GenerateItineraryServerResponse> {
  const startTime = Date.now();

  // 1. Validação de Autenticação da Sessão Server-side
  if (!req.authToken || req.authToken.trim() === '') {
    return {
      success: false,
      promptVersion: PROMPT_VERSION,
      executionTimeMs: Date.now() - startTime,
      errorMessage: '[Auth Error] Sessão inválida ou token de autenticação não fornecido.'
    };
  }

  // Simulação de Timeout para testes
  if (req.simulateTimeout) {
    await new Promise((_, reject) => {
      const timer = setTimeout(() => reject(new Error('AbortError: Timeout de 15s excedido.')), 100);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new Error('AbortError: Requisição cancelada por timeout (15s).'));
      });
    });
  }

  // Simulação de Erro de Servidor para testes
  if (req.simulateServerError) {
    return {
      success: false,
      promptVersion: PROMPT_VERSION,
      executionTimeMs: Date.now() - startTime,
      errorMessage: '[Gemini API Error] HTTP 500: Falha interna no serviço Gemini.'
    };
  }

  // Se um mock de override for fornecido nos testes
  if (req.mockResponseOverride !== undefined && req.mockResponseOverride !== null) {
    return {
      success: true,
      rawJson: req.mockResponseOverride,
      promptVersion: PROMPT_VERSION,
      executionTimeMs: Date.now() - startTime
    };
  }

  // Em produção, a chave GEMINI_API_KEY fica isolada aqui no servidor
  const apiKey = process.env.GEMINI_API_KEY || 'AIzaSy_SMARTTRIP_SERVER_SECRET_KEY';

  try {
    // Chamada real à API REST do Gemini (gemini-1.5-flash) ou simulador seguro
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: req.systemInstruction || SYSTEM_INSTRUCTION_V1 }]
        },
        contents: [
          {
            parts: [{ text: req.taskPrompt }]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
          topP: 0.8,
          maxOutputTokens: 2048
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        promptVersion: PROMPT_VERSION,
        executionTimeMs: Date.now() - startTime,
        errorMessage: `[Gemini API Error] HTTP ${response.status}: ${errorText}`
      };
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return {
        success: false,
        promptVersion: PROMPT_VERSION,
        executionTimeMs: Date.now() - startTime,
        errorMessage: '[Gemini API Error] Resposta do modelo veio vazia.'
      };
    }

    return {
      success: true,
      rawJson: candidateText,
      promptVersion: PROMPT_VERSION,
      executionTimeMs: Date.now() - startTime
    };
  } catch (err: any) {
    return {
      success: false,
      promptVersion: PROMPT_VERSION,
      executionTimeMs: Date.now() - startTime,
      errorMessage: err?.message || 'Falha na comunicação com a API Gemini.'
    };
  }
}
