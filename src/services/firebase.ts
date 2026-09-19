import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

/**
 * Lê e valida as variáveis de ambiente públicas do Firebase Client SDK.
 * Lança erro explícito se alguma variável obrigatória estiver ausente.
 */
export const getClientEnvConfig = (): FirebaseClientConfig => {
  const metaEnv: Record<string, any> = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {};
  const procEnv: Record<string, any> = (typeof process !== 'undefined' && process.env) ? process.env : {};

  const apiKey = metaEnv.VITE_FIREBASE_API_KEY || procEnv.VITE_FIREBASE_API_KEY || '';
  const authDomain = metaEnv.VITE_FIREBASE_AUTH_DOMAIN || procEnv.VITE_FIREBASE_AUTH_DOMAIN || '';
  const projectId = metaEnv.VITE_FIREBASE_PROJECT_ID || procEnv.VITE_FIREBASE_PROJECT_ID || '';
  const storageBucket = metaEnv.VITE_FIREBASE_STORAGE_BUCKET || procEnv.VITE_FIREBASE_STORAGE_BUCKET || '';
  const messagingSenderId = metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || procEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '';
  const appId = metaEnv.VITE_FIREBASE_APP_ID || procEnv.VITE_FIREBASE_APP_ID || '';

  // No ambiente de dev/teste local, avisamos sobre chaves ausentes
  const missingKeys: string[] = [];
  if (!apiKey) missingKeys.push('VITE_FIREBASE_API_KEY');
  if (!projectId) missingKeys.push('VITE_FIREBASE_PROJECT_ID');
  if (!authDomain) missingKeys.push('VITE_FIREBASE_AUTH_DOMAIN');

  if (missingKeys.length > 0 && metaEnv.PROD) {
    throw new Error(
      `[SmartTrip Firebase Error] Configuração obrigatória do Firebase ausente: ${missingKeys.join(', ')}. Verifique seu .env.local!`
    );
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
};

/**
 * Padrão Singleton de Inicialização do Firebase Client SDK
 * Evita a exceção 'FirebaseApp already exists' durante HMR / Fast Refresh.
 */
const initFirebaseClient = (): { app: FirebaseApp; auth: Auth | null; db: Firestore | null } => {
  const config = getClientEnvConfig();

  let app: FirebaseApp;
  const existingApps = getApps();

  if (existingApps.length > 0) {
    app = getApp();
  } else {
    app = initializeApp(config);
  }

  // Inicializa Auth e Firestore apenas se houver configuração ou suporte
  let authInstance: Auth | null = null;
  let dbInstance: Firestore | null = null;

  try {
    authInstance = getAuth(app);
    dbInstance = getFirestore(app);
  } catch (err) {
    console.warn('[SmartTrip Firebase Warning] Falha na inicialização dos serviços Auth/Firestore:', err);
  }

  return { app, auth: authInstance, db: dbInstance };
};

const { app, auth, db } = initFirebaseClient();

export { app, auth, db };
export default app;
