import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  auth,
  githubProvider,
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  type FirebaseUser,
} from '../firebase';
import { UserRole } from '../types';
import { logger } from '../src/utils/logger';

// Error codes for popup blocks
const POPUP_FALLBACK_ERRORS = new Set([
  'auth/popup-blocked',
  'auth/cancelled-popup-request',
  'auth/web-storage-unsupported',
  'auth/internal-error',
  'auth/operation-not-supported-in-this-environment',
]);

export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  role?: UserRole;
  orgId?: string; // Stored from claims
}

export interface AuthContextType {
  user: User | null;
  login: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('cognisys-user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState<boolean>(true);

  const mapFirebaseUser = useCallback(async (fbUser: FirebaseUser): Promise<User> => {
    const { claims } = await fbUser.getIdTokenResult();
    return {
      id: fbUser.uid,
      name: fbUser.displayName || fbUser.email || 'Unknown',
      avatarUrl: fbUser.photoURL || undefined,
      orgId: claims.orgId as string | undefined,
      role: claims.role as UserRole | undefined,
    };
  }, []);

  // On mount: consume any pending redirect result
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          logger.log('Redirect sign-in succeeded:', result.user.displayName);
        }
      })
      .catch((err) => {
        if (err?.code && err.code !== 'auth/popup-closed-by-user') {
          logger.error('Redirect sign-in error:', err?.code, err?.message);
        }
      });
  }, []);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      // E2E test bypass: if Playwright injected a test user, don't let Firebase override it
      if (!fbUser && localStorage.getItem('__playwright_skip_auth__')) {
        setLoading(false);
        return;
      }
      
      if (fbUser) {
        const mapped = await mapFirebaseUser(fbUser);
        setUser(mapped);
        localStorage.setItem('cognisys-user', JSON.stringify(mapped));
        setLoading(false);
        
        // Send ID token to server to create an httpOnly session cookie
        try {
          const idToken = await fbUser.getIdToken();
          await fetch('/api/auth/firebase-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ idToken }),
          });
        } catch (err) {
          // Session cookie is best-effort; token auth still works
        }
      } else {
        setUser(null);
        localStorage.removeItem('cognisys-user');
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [mapFirebaseUser]);

  const login = useCallback(async () => {
    try {
      await signInWithPopup(auth, githubProvider);
    } catch (err: any) {
      if (POPUP_FALLBACK_ERRORS.has(err?.code)) {
        logger.warn('GitHub popup blocked, falling back to redirect:', err?.code);
        await signInWithRedirect(auth, githubProvider);
      } else if (err?.code !== 'auth/popup-closed-by-user') {
        logger.error('GitHub sign-in error:', err);
      }
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (POPUP_FALLBACK_ERRORS.has(err?.code)) {
        logger.warn('Google popup blocked, falling back to redirect:', err?.code);
        await signInWithRedirect(auth, googleProvider);
      } else if (err?.code !== 'auth/popup-closed-by-user') {
        logger.error('Google sign-in error:', err);
      }
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      logger.error('Logout failed:', err);
    }
  }, []);

  const refreshToken = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      // Force refresh the ID token to get new custom claims (orgId, role)
      await auth.currentUser.getIdToken(true);
      const mapped = await mapFirebaseUser(auth.currentUser);
      setUser(mapped);
      localStorage.setItem('cognisys-user', JSON.stringify(mapped));
      logger.log('Auth token and claims refreshed successfully');
    } catch (err) {
      logger.error('Failed to refresh auth token:', err);
    }
  }, [mapFirebaseUser]);

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, refreshToken, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
