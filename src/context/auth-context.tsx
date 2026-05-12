/**
 * Auth Context
 * ---------------------
 * Gerenciamento de autenticação Google e sistema de créditos.
 * 
 * Modelo de créditos (inspirado no Imagine.art Flow):
 * - Imagens geradas: GRÁTIS (0 créditos)
 * - Vídeos gerados: 20+ créditos (varia por modelo/duração)
 * - Novos usuários recebem 100 créditos iniciais
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';

// =============================================
// TIPOS
// =============================================

/** Custo de créditos por tipo de operação */
export const CREDIT_COSTS = {
  // Imagens são GRÁTIS
  'text-to-image': 0,
  'image-to-image': 0,
  'ai-background': 0,
  'background-remover': 0,
  'upscale': 0,
  // Vídeos custam créditos
  'text-to-video': 20,
  'image-to-video': 20,
  'text-to-video-hd': 30,
  'image-to-video-hd': 30,
  'text-to-video-pro': 50,
  'image-to-video-pro': 50,
} as const;

export type CreditOperation = keyof typeof CREDIT_COSTS;

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  credits: number;
  totalCreditsUsed: number;
  totalGenerations: number;
  createdAt: string;
  lastLoginAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  consumeCredits: (operation: CreditOperation) => Promise<boolean>;
  canAfford: (operation: CreditOperation) => boolean;
  getCost: (operation: CreditOperation) => number;
}

const INITIAL_CREDITS = 1000;

// =============================================
// CONTEXTO & PROVIDER
// =============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Escutar autenticação do Firebase (onAuthStateChanged)
  useEffect(() => {
    // Timeout de segurança: se Firebase não responder em 5s, libera o loading
    const timeout = setTimeout(() => setLoading(false), 5000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(timeout);
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          await ensureUserProfile(firebaseUser);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('[Auth] Erro ao inicializar perfil:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  // Escutar mudanças no perfil em tempo real (Firestore)
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setProfile(snapshot.data() as UserProfile);
      }
    });

    return () => unsubscribe();
  }, [user]);

  /** Garante que o perfil do usuário existe no Firestore */
  const ensureUserProfile = async (firebaseUser: User) => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Novo usuário → cria perfil com créditos iniciais
      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'Usuário',
        photoURL: firebaseUser.photoURL || '',
        credits: INITIAL_CREDITS,
        totalCreditsUsed: 0,
        totalGenerations: 0,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      await setDoc(userRef, newProfile);
      setProfile(newProfile);
    } else {
      // Usuário existente → atualiza última sessão e equipara limite de 1000
      const currentData = userSnap.data();
      const currentCredits = currentData.credits || 0;
      const updatedCredits = Math.max(currentCredits, INITIAL_CREDITS);

      await updateDoc(userRef, {
        lastLoginAt: new Date().toISOString(),
        displayName: firebaseUser.displayName || currentData.displayName,
        photoURL: firebaseUser.photoURL || currentData.photoURL,
        credits: updatedCredits,
      });
      setProfile({ ...currentData, credits: updatedCredits } as UserProfile);
    }
  };

  /** Login com Google */
  const signInWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('[Auth] Erro no login Google:', error);
      throw error;
    }
  }, []);

  /** Logout */
  const signOutFn = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      setProfile(null);
    } catch (error: any) {
      console.error('[Auth] Erro no logout:', error);
      throw error;
    }
  }, []);

  /** Retorna o custo de uma operação */
  const getCost = useCallback((operation: CreditOperation): number => {
    return CREDIT_COSTS[operation] || 0;
  }, []);

  /** Verifica se tem créditos suficientes (Standby - retorna sempre true) */
  const canAfford = useCallback((operation: CreditOperation) => {
    return true;
  }, []);

  /** Consome créditos para uma operação (retorna true se sucesso) */
  const consumeCredits = useCallback(async (operation: CreditOperation): Promise<boolean> => {
    if (!user || !profile) return false;

    const cost = getCost(operation);
    
    // Operações grátis (imagens)
    if (cost === 0) {
      // Apenas incrementa o contador de gerações
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        totalGenerations: profile.totalGenerations + 1,
      });
      return true;
    }

    // Verifica saldo suficiente
    if (profile.credits < cost) {
      return false;
    }

    // Deduz créditos
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      credits: profile.credits - cost,
      totalCreditsUsed: profile.totalCreditsUsed + cost,
      totalGenerations: profile.totalGenerations + 1,
    });

    return true;
  }, [user, profile, getCost]);

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signInWithGoogle,
    signOut: signOutFn,
    consumeCredits,
    canAfford,
    getCost,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
