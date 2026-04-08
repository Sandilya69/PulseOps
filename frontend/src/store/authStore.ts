import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  orgId: string;
  avatarUrl: string | null;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

interface Organization {
  id: string;
  name: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  tokens: Tokens | null;
  organization: Organization | null;
  login: (user: User, tokens: Tokens, organization: Organization | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      tokens: null,
      organization: null,

      login: (user, tokens, organization) => 
        set({ isAuthenticated: true, user, tokens, organization }),

      logout: () => 
        set({ isAuthenticated: false, user: null, tokens: null, organization: null }),
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
      partialize: (state) => ({ 
        isAuthenticated: state.isAuthenticated, 
        tokens: state.tokens,
        user: state.user,
        organization: state.organization
      }),
    }
  )
);
