import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getStorageConfig } from '@/lib/storageAdapter';

export type SkillRepo = {
  id: string;
  name: string;
  url: string;
  createdAt: number;
};

export type SkillItem = {
  id: string;
  name: string;
  command: string;
  repoId: string;
  applied: boolean;
  createdAt: number;
};

interface SkillsState {
  repositories: SkillRepo[];
  skills: SkillItem[];
  addRepository: (name: string, url: string) => void;
  removeRepository: (id: string) => void;
  addSkill: (name: string, command: string, repoId: string) => void;
  removeSkill: (id: string) => void;
  setSkillApplied: (id: string, applied: boolean) => void;
}

export const useSkillsStore = create<SkillsState>()(
  persist(
    (set) => ({
      repositories: [],
      skills: [],
      addRepository: (name, url) =>
        set((state) => {
          const normalizedName = name.trim();
          const normalizedUrl = url.trim();
          if (!normalizedName || !normalizedUrl) {
            return state;
          }
          const existed = state.repositories.find(
            (item) =>
              item.name.toLowerCase() === normalizedName.toLowerCase() ||
              item.url.toLowerCase() === normalizedUrl.toLowerCase()
          );
          if (existed) {
            return state;
          }
          return {
            repositories: [
              { id: crypto.randomUUID(), name: normalizedName, url: normalizedUrl, createdAt: Date.now() },
              ...state.repositories,
            ],
          };
        }),
      removeRepository: (id) =>
        set((state) => ({
          repositories: state.repositories.filter((item) => item.id !== id),
          skills: state.skills.filter((item) => item.repoId !== id),
        })),
      addSkill: (name, command, repoId) =>
        set((state) => {
          const normalizedName = name.trim();
          const normalizedCommand = command.trim();
          if (!normalizedName || !normalizedCommand || !repoId) {
            return state;
          }
          const existed = state.skills.find(
            (item) =>
              item.repoId === repoId &&
              item.name.toLowerCase() === normalizedName.toLowerCase() &&
              item.command.toLowerCase() === normalizedCommand.toLowerCase()
          );
          if (existed) {
            return state;
          }
          return {
            skills: [
              {
                id: crypto.randomUUID(),
                name: normalizedName,
                command: normalizedCommand,
                repoId,
                applied: false,
                createdAt: Date.now(),
              },
              ...state.skills,
            ],
          };
        }),
      removeSkill: (id) =>
        set((state) => ({
          skills: state.skills.filter((item) => item.id !== id),
        })),
      setSkillApplied: (id, applied) =>
        set((state) => ({
          skills: state.skills.map((item) => (item.id === id ? { ...item, applied } : item)),
        })),
    }),
    {
      name: "minimax-skills",
      storage: createJSONStorage(() => getStorageConfig()),
    }
  )
);
