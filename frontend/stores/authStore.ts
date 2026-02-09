import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthStore, AuthState, User, AuthTokens } from '../types/auth';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,

      setAuth: (user: User, tokens: AuthTokens) =>
        set({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
          error: null,
        }),

      clearAuth: () => set(initialState),

      setLoading: (isLoading: boolean) => set({ isLoading }),

      setError: (error: string | null) => set({ error, isLoading: false }),

      setTokens: (tokens: AuthTokens) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      skipHydration: true,
    }
  )
);
