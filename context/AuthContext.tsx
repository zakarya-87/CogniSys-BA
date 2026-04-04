import { createContext, useContext } from 'react';
import { UserRole } from '../types';

export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  role?: UserRole;
}

export interface AuthContextType {
  user: User | null;
  login: () => void;
  loginWithGoogle: () => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Thin provider alias — CatalystProvider supplies the value. */
export const AuthProvider = AuthContext.Provider;

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthContext.Provider');
  return ctx;
};
