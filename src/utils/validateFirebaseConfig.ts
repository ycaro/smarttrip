import app, { getClientEnvConfig } from '../services/firebase';
import { getApps } from 'firebase/app';

export interface FirebaseValidationReport {
  isSingleton: boolean;
  activeAppsCount: number;
  clientEnvConfigured: boolean;
  missingEnvKeys: string[];
  adminSecurityGuardPassed: boolean;
}

/**
 * Utilitário de Verificação Automatizada da Camada Firebase do SmartTrip.
 * Executa checagens da SPEC para validar resiliência, singleton e segurança.
 */
export const validateFirebaseLayer = (): FirebaseValidationReport => {
  const activeApps = getApps();
  const config = getClientEnvConfig();

  const missingKeys: string[] = [];
  if (!config.apiKey) missingKeys.push('VITE_FIREBASE_API_KEY');
  if (!config.projectId) missingKeys.push('VITE_FIREBASE_PROJECT_ID');
  if (!config.authDomain) missingKeys.push('VITE_FIREBASE_AUTH_DOMAIN');

  // Teste do Guard do Admin SDK
  let adminSecurityGuardPassed = false;
  try {
    // Tenta simular o import do Admin no ambiente atual (cliente)
    // No navegador, deve lançar exceção
    if (typeof window !== 'undefined') {
      const { getAdminEnvConfig } = require('../services/firebaseAdmin');
      getAdminEnvConfig();
    } else {
      adminSecurityGuardPassed = true;
    }
  } catch (err: any) {
    if (err?.message?.includes('SECURITY FATAL ERROR')) {
      adminSecurityGuardPassed = true;
    }
  }

  return {
    isSingleton: activeApps.length === 1,
    activeAppsCount: activeApps.length,
    clientEnvConfigured: missingKeys.length === 0,
    missingEnvKeys: missingKeys,
    adminSecurityGuardPassed,
  };
};

console.log('[SmartTrip Firebase Audit]', validateFirebaseLayer());
