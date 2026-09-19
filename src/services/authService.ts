import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  User,
  AuthError,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserDocument } from '../types';

export const googleProvider = new GoogleAuthProvider();

/**
 * Traduz erros padrão do Firebase Auth para mensagens amigáveis em português.
 */
export const getAuthErrorMessage = (error: any): string => {
  const code = error?.code || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'O e-mail digitado possui um formato inválido.';
    case 'auth/user-not-found':
      return 'Nenhuma conta encontrada com este e-mail.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Credenciais de acesso inválidas. Verifique seu e-mail e senha.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado no sistema.';
    case 'auth/weak-password':
      return 'A senha deve conter no mínimo 6 caracteres.';
    case 'auth/popup-closed-by-user':
      return 'O fluxo de login com Google foi cancelado antes da conclusão.';
    case 'auth/network-request-failed':
      return 'Erro de conexão com o servidor. Verifique sua internet.';
    default:
      return error?.message || 'Ocorreu um erro durante a autenticação. Tente novamente.';
  }
};

/**
 * Cria de forma IDEMPOTENTE o documento de perfil do usuário em /users/{uid}.
 * Impede que o papel (role) seja definido pelo cliente (definido sempre como 'user').
 */
export const ensureUserProfile = async (
  uid: string,
  email: string | null,
  displayName?: string | null
): Promise<UserDocument> => {
  if (!db) {
    // Retorno mock idempotente se o Firestore não estiver ativado
    return {
      uid,
      email: email || '',
      displayName: displayName || 'Viajante SmartTrip',
      role: 'user',
      createdAt: new Date().toISOString(),
      preferences: {
        styles: ['Gastronomia', 'Cultura'],
        budget: 'moderado',
        pace: 'tranquilo',
      },
    };
  }

  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserDocument;
  }

  // Novo perfil com papel fixo 'user' (sem autoelevação)
  const newUserProfile: Omit<UserDocument, 'createdAt'> & { createdAt: any } = {
    uid,
    email: email || '',
    displayName: displayName || 'Viajante SmartTrip',
    role: 'user',
    createdAt: serverTimestamp(),
    preferences: {
      styles: ['Gastronomia', 'Cultura'],
      budget: 'moderado',
      pace: 'tranquilo',
    },
  };

  await setDoc(userRef, newUserProfile);
  return { ...newUserProfile, createdAt: new Date().toISOString() };
};

/**
 * Fluxo de Cadastro por E-mail e Senha
 */
export const registerUser = async (name: string, email: string, password: string): Promise<UserDocument> => {
  if (!auth) {
    // Suporte a fallback de simulação local sem segredos nos logs
    return ensureUserProfile('mock-uid-new', email, name);
  }

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const profile = await ensureUserProfile(credential.user.uid, credential.user.email, name);
  return profile;
};

/**
 * Fluxo de Login por E-mail e Senha
 */
export const loginUser = async (email: string, password: string): Promise<UserDocument> => {
  if (!auth) {
    return ensureUserProfile('mock-uid-existing', email, 'Marcelo Costa');
  }

  const credential = await signInWithEmailAndPassword(auth, email, password);
  const profile = await ensureUserProfile(credential.user.uid, credential.user.email, credential.user.displayName);
  return profile;
};

/**
 * Fluxo de Login Social com Google OAuth
 */
export const loginWithGoogle = async (): Promise<UserDocument> => {
  if (!auth) {
    return ensureUserProfile('mock-uid-google', 'google.user@smarttrip.ai', 'Usuário Google');
  }

  const credential = await signInWithPopup(auth, googleProvider);
  const profile = await ensureUserProfile(credential.user.uid, credential.user.email, credential.user.displayName);
  return profile;
};

/**
 * Fluxo de Redefinição / Recuperação de Senha
 */
export const resetPassword = async (email: string): Promise<void> => {
  if (!auth) return;
  await sendPasswordResetEmail(auth, email);
};

/**
 * Fluxo de Encerrar Sessão (Logout)
 */
export const logoutUser = async (): Promise<void> => {
  if (!auth) return;
  await signOut(auth);
};
