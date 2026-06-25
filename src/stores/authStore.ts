import { create } from "zustand";
import { User } from "../types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  updateUserCalendarStatus: (connected: boolean, googleEmail?: string | null, googleLastSync?: string | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem("dg_token"),
  isAuthenticated: false,
  isLoading: false,
  error: null,

  initialize: async () => {
    const token = get().token;
    if (!token) {
      set({ isAuthenticated: false, isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, isAuthenticated: true, error: null });
      } else {
        // Token expired/invalid
        localStorage.removeItem("dg_token");
        set({ token: null, user: null, isAuthenticated: false });
      }
    } catch (e: any) {
      set({ error: e.message || "Failed to contact auth server" });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("dg_token", data.token);
        set({
          token: data.token,
          user: data.user,
          isAuthenticated: true,
          error: null,
        });
        return true;
      } else {
        set({ error: data.error || "Login failed" });
        return false;
      }
    } catch (e: any) {
      set({ error: e.message || "Login failed due to a network error" });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  signup: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("dg_token", data.token);
        set({
          token: data.token,
          user: data.user,
          isAuthenticated: true,
          error: null,
        });
        return true;
      } else {
        set({ error: data.error || "Signup failed" });
        return false;
      }
    } catch (e: any) {
      set({ error: e.message || "Signup failed due to a network error" });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem("dg_token");
    set({ token: null, user: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),

  updateUserCalendarStatus: (connected: boolean, googleEmail?: string | null, googleLastSync?: string | null) => {
    const user = get().user;
    if (user) {
      set({ 
        user: { 
          ...user, 
          googleCalendarConnected: connected,
          googleEmail: googleEmail !== undefined ? googleEmail : user.googleEmail,
          googleLastSync: googleLastSync !== undefined ? googleLastSync : user.googleLastSync
        } 
      });
    }
  },
}));
