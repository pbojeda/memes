export type UserRole = 'TARGET' | 'MANAGER' | 'ADMIN' | 'MARKETING';

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  setAuth: (user: User, tokens: AuthTokens) => void;
  clearAuth: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setTokens: (tokens: AuthTokens) => void;
}

export type AuthStore = AuthState & AuthActions;
