/**
 * Módulo Server-Side Firebase Admin SDK
 * 
 * ATENÇÃO: Este módulo só deve ser executado no ambiente de SERVIDOR (Node.js / Route Handlers).
 * É ESTRITAMENTE PROIBIDO importar este arquivo em componentes React do cliente.
 */

export interface FirebaseAdminConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

/**
 * Valida a execução exclusiva no servidor e retorna as variáveis de ambiente privadas.
 */
export const getAdminEnvConfig = (): FirebaseAdminConfig => {
  // Guard de Proteção do Cliente: Impede vazamento no browser
  if (typeof window !== 'undefined') {
    throw new Error(
      '[SECURITY FATAL ERROR] Tentativa ilegítima de importar o Firebase Admin SDK no navegador do cliente! As chaves privadas de administrador NUNCA devem ser enviadas ao browser.'
    );
  }

  // No servidor (Node.js), lê variáveis privadas de ambiente
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '';
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || '';
  const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!privateKey || !clientEmail) {
    console.warn(
      '[SmartTrip Admin Warning] Variáveis de Admin (FIREBASE_ADMIN_PRIVATE_KEY / FIREBASE_ADMIN_CLIENT_EMAIL) não configuradas no ambiente de servidor.'
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey,
  };
};

/**
 * Contrato conceitual de inicialização do Admin SDK para execução Server-side.
 */
export const initFirebaseAdminStub = () => {
  const config = getAdminEnvConfig();
  return {
    isServer: true,
    projectId: config.projectId,
    status: 'Admin SDK configurado para Server-side',
  };
};
