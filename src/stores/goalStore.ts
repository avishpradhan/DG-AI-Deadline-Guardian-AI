import { create } from "zustand";
import { Goal, Task, ProgressLog } from "../types";
import { useAuthStore } from "./authStore";

interface GoalState {
  goals: Goal[];
  currentGoal: Goal | null;
  tasks: Task[];
  history: ProgressLog[];
  isLoading: boolean;
  error: string | null;
  
  fetchGoals: () => Promise<void>;
  fetchGoalDetail: (id: string) => Promise<void>;
  createGoal: (goalData: Partial<Goal>) => Promise<string | null>;
  analyzeGoal: (id: string) => Promise<any>;
  completeGoal: (id: string) => Promise<any>;
  deleteGoal: (id: string) => Promise<boolean>;
  checkIn: (params: {
    goalId: string;
    date: string;
    completedTasks: string[];
    blockerNote: string;
  }) => Promise<{ status: string; log: ProgressLog } | null>;
  fetchHistory: (goalId: string) => Promise<void>;
  clearError: () => void;
}

export const useGoalStore = create<GoalState>((set, get) => {
  const getHeaders = () => {
    const token = useAuthStore.getState().token;
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  return {
    goals: [],
    currentGoal: null,
    tasks: [],
    history: [],
    isLoading: false,
    error: null,

    fetchGoals: async () => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch("/api/goals", {
          headers: getHeaders(),
        });
        const data = await res.json();
        if (res.ok) {
          set({ goals: data.goals, error: null });
        } else {
          set({ error: data.error || "Failed to fetch goals" });
        }
      } catch (e: any) {
        set({ error: e.message || "Failed to fetch goals" });
      } finally {
        set({ isLoading: false });
      }
    },

    fetchGoalDetail: async (id) => {
      const isRefetch = get().currentGoal?.id === id;
      set({ 
        isLoading: true, 
        error: null, 
        currentGoal: isRefetch ? get().currentGoal : null, 
        tasks: isRefetch ? get().tasks : [] 
      });
      try {
        const res = await fetch(`/api/goals/${id}`, {
          headers: getHeaders(),
        });
        const data = await res.json();
        if (res.ok) {
          set({
            currentGoal: data.goal,
            tasks: data.tasks,
            error: null,
          });
        } else {
          set({ error: data.error || "Failed to fetch goal detail" });
        }
      } catch (e: any) {
        set({ error: e.message || "Failed to fetch goal detail" });
      } finally {
        set({ isLoading: false });
      }
    },

    createGoal: async (goalData) => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch("/api/goals", {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(goalData),
        });
        const data = await res.json();
        if (res.ok) {
          await get().fetchGoals();
          return data.goalId;
        } else {
          set({ error: data.error || "Failed to create goal" });
          return null;
        }
      } catch (e: any) {
        set({ error: e.message || "Failed to create goal" });
        return null;
      } finally {
        set({ isLoading: false });
      }
    },

    analyzeGoal: async (id) => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch("/api/ai/analyze", {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ goalId: id }),
        });
        const data = await res.json();
        if (res.ok) {
          await get().fetchGoalDetail(id);
          return data;
        } else {
          set({ error: data.error || "Failed to analyze goal" });
          throw new Error(data.error || "Failed to analyze goal");
        }
      } catch (e: any) {
        set({ error: e.message || "Failed to analyze goal" });
        throw e;
      } finally {
        set({ isLoading: false });
      }
    },

    completeGoal: async (id) => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch(`/api/goals/${id}/complete`, {
          method: "POST",
          headers: getHeaders(),
        });
        const data = await res.json();
        if (res.ok) {
          await get().fetchGoalDetail(id);
          await get().fetchGoals();
          return data;
        } else {
          set({ error: data.error || "Failed to complete goal" });
          return null;
        }
      } catch (e: any) {
        set({ error: e.message || "Failed to complete goal" });
        return null;
      } finally {
        set({ isLoading: false });
      }
    },

    deleteGoal: async (id) => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch(`/api/goals/${id}`, {
          method: "DELETE",
          headers: getHeaders(),
        });
        if (res.ok) {
          set((state) => ({
            goals: state.goals.filter((g) => g.id !== id),
            currentGoal: state.currentGoal?.id === id ? null : state.currentGoal,
            error: null,
          }));
          return true;
        } else {
          const data = await res.json();
          set({ error: data.error || "Failed to delete goal" });
          return false;
        }
      } catch (e: any) {
        set({ error: e.message || "Failed to delete goal" });
        return false;
      } finally {
        set({ isLoading: false });
      }
    },

    checkIn: async ({ goalId, date, completedTasks, blockerNote }) => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch("/api/progress/checkin", {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ goalId, date, completedTasks, blockerNote }),
        });
        const data = await res.json();
        if (res.ok) {
          await get().fetchGoalDetail(goalId);
          await get().fetchHistory(goalId);
          return data;
        } else {
          set({ error: data.error || "Failed to check in" });
          return null;
        }
      } catch (e: any) {
        set({ error: e.message || "Failed to check in" });
        return null;
      } finally {
        set({ isLoading: false });
      }
    },

    fetchHistory: async (goalId) => {
      try {
        const res = await fetch(`/api/progress/${goalId}/history`, {
          headers: getHeaders(),
        });
        const data = await res.json();
        if (res.ok) {
          set({ history: data.history });
        }
      } catch (e) {
        console.error("Failed to fetch history:", e);
      }
    },

    clearError: () => set({ error: null }),
  };
});
