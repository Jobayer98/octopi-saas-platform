import { create } from "zustand";
import { User } from "@/types";
import { tokenStore } from "@/lib/api-client";

interface AuthState {
  user: User | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setAuth: (user, token) => {
    tokenStore.set(token);
    set({ user });
  },
  clearAuth: () => {
    tokenStore.clear();
    set({ user: null });
  },
}));
