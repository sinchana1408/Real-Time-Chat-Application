import { create } from 'zustand';
import { UserProfile, LoginInput, RegisterInput, UpdateProfileInput } from '@pulsechat/shared';
import { apiRequest } from '../lib/api.js';
import { connectSocket, disconnectSocket } from '../lib/socket.js';

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (data: UpdateProfileInput) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  clearError: () => set({ error: null }),

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const user = await apiRequest<UserProfile>('/auth/me');
      set({ user, isInitialized: true, isLoading: false, error: null });
      connectSocket();
    } catch {
      set({ user: null, isInitialized: true, isLoading: false });
      disconnectSocket();
    }
  },

  login: async (data: LoginInput) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiRequest<{ user: UserProfile }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      set({ user: res.user, isLoading: false, error: null });
      connectSocket();
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Login failed' });
      throw err;
    }
  },

  register: async (data: RegisterInput) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiRequest<{ user: UserProfile }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      set({ user: res.user, isLoading: false, error: null });
      connectSocket();
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Registration failed' });
      throw err;
    }
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      set({ user: null });
      disconnectSocket();
    }
  },

  updateProfile: async (data: UpdateProfileInput) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await apiRequest<UserProfile>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      set({ user: updated, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Failed to update profile' });
      throw err;
    }
  },
}));
