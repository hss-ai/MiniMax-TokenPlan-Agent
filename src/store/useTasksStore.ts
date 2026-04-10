import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getStorageConfig } from '@/lib/storageAdapter';

export interface Task {
  id: string;
  type: 'video' | 'image' | 'music' | 'voice';
  prompt: string;
  status: 'Processing' | 'Success' | 'Fail' | 'Queuing';
  resultUrl?: string;
  createdAt: number;
  errorMessage?: string;
}

interface TasksState {
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  clearTasksByType: (type: Task["type"]) => void;
}

const MAX_TASKS = 120;

const normalizeTasks = (tasks: Task[]) => tasks
  .sort((a, b) => b.createdAt - a.createdAt)
  .slice(0, MAX_TASKS);

export const useTasksStore = create<TasksState>()(
  persist(
    (set) => ({
      tasks: [],
      addTask: (task) => set((state) => ({ tasks: normalizeTasks([task, ...state.tasks]) })),
      updateTask: (id, updates) =>
        set((state) => ({
          tasks: normalizeTasks(state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t))),
        })),
      removeTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),
      clearTasksByType: (type) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.type !== type),
        })),
    }),
    {
      name: 'minimax-tasks',
      storage: createJSONStorage(() => getStorageConfig()),
      partialize: (state) => ({
        tasks: state.tasks.map((task) => ({
          ...task,
          resultUrl: task.resultUrl?.startsWith("data:") ? undefined : task.resultUrl,
        })),
      }),
    }
  )
);

