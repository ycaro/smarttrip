import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../services/firebase';
import {
  registerUser,
  loginUser,
  loginWithGoogle,
  logoutUser,
  resetPassword,
  ensureUserProfile,
} from '../services/authService';
import { UserDocument } from '../types';

interface AuthContextType {
  user: UserDocument | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  register: (name: string, email: string, pass: string) => Promise<UserDocument>;
  login: (email: string, pass: string) => Promise<UserDocument>;
  loginGoogle: () => Promise<UserDocument>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  updateUserPreferencesInContext: (preferences: UserDocument['preferences']) => void;
  // Fallbacks para demonstração sem backend
  loginStub: () => void;
  logoutStub: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  register: async () => ({} as UserDocument),
  login: async () => ({} as UserDocument),
  loginGoogle: async () => ({} as UserDocument),
  logout: async () => {},
  forgotPassword: async () => {},
  updateUserPreferencesInContext: () => {},
  loginStub: () => {},
  logoutStub: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        try {
          const profile = await ensureUserProfile(fbUser.uid, fbUser.email, fbUser.displayName);
          setUser(profile);
        } catch (err) {
          console.warn('[SmartTrip Auth Warning] Falha ao carregar perfil do Firestore:', err);
          setUser({
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || 'Viajante',
            role: 'user',
            createdAt: new Date().toISOString(),
            preferences: { styles: [], budget: 'moderado', pace: 'tranquilo' },
          });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRegister = async (name: string, email: string, pass: string) => {
    setIsLoading(true);
    try {
      const profile = await registerUser(name, email, pass);
      setUser(profile);
      setIsLoading(false);
      return profile;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const handleLogin = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const profile = await loginUser(email, pass);
      setUser(profile);
      setIsLoading(false);
      return profile;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const handleLoginGoogle = async () => {
    setIsLoading(true);
    try {
      const profile = await loginWithGoogle();
      setUser(profile);
      setIsLoading(false);
      return profile;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    await logoutUser();
    setUser(null);
    setIsLoading(false);
  };

  const handleForgotPassword = async (email: string) => {
    await resetPassword(email);
  };

  const loginStub = () => {
    setUser({
      uid: 'stub-user-123',
      email: 'fernanda@smarttrip.com',
      displayName: 'Fernanda Costa',
      role: 'user',
      createdAt: new Date().toISOString(),
      preferences: {
        styles: ['Gastronomia', 'Cultura'],
        budget: 'moderado',
        pace: 'tranquilo',
      },
    });
  };

  const logoutStub = () => {
    setUser(null);
  };

  const handleUpdateUserPreferences = (preferences: UserDocument['preferences']) => {
    setUser((prev) => {
      if (!prev) return null;
      return { ...prev, preferences };
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        register: handleRegister,
        login: handleLogin,
        loginGoogle: handleLoginGoogle,
        logout: handleLogout,
        forgotPassword: handleForgotPassword,
        updateUserPreferencesInContext: handleUpdateUserPreferences,
        loginStub,
        logoutStub,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
