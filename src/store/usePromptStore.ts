import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PromptScope = "chat" | "voice" | "video" | "image" | "music";

export type PromptItem = {
  id: string;
  scope: PromptScope;
  theme: string;
  detail: string;
  text?: string;
  createdAt: number;
};

interface PromptState {
  prompts: PromptItem[];
  addPrompt: (scope: PromptScope, detail: string, theme?: string) => void;
  updatePrompt: (id: string, detail: string, theme?: string) => void;
  removePrompt: (id: string) => void;
}

const MAX_PROMPTS_PER_SCOPE = 40;

export const usePromptStore = create<PromptState>()(
  persist(
    (set) => ({
      prompts: [],
      addPrompt: (scope, detail, theme = "默认主题") =>
        set((state) => {
          const normalizedDetail = detail.trim();
          const normalizedTheme = theme.trim() || "默认主题";
          if (!normalizedDetail) {
            return state;
          }
          const existed = state.prompts.find(
            (item) =>
              item.scope === scope &&
              (item.theme || "默认主题").toLowerCase() === normalizedTheme.toLowerCase() &&
              (item.detail || item.text || "").toLowerCase() === normalizedDetail.toLowerCase()
          );
          if (existed) {
            return state;
          }
          const withNew = [
            { id: crypto.randomUUID(), scope, theme: normalizedTheme, detail: normalizedDetail, createdAt: Date.now() },
            ...state.prompts,
          ];
          const scoped = withNew.filter((item) => item.scope === scope).slice(0, MAX_PROMPTS_PER_SCOPE);
          const others = withNew.filter((item) => item.scope !== scope);
          return { prompts: [...scoped, ...others] };
        }),
      updatePrompt: (id, detail, theme = "默认主题") =>
        set((state) => {
          const target = state.prompts.find((item) => item.id === id);
          if (!target) {
            return state;
          }
          const normalizedDetail = detail.trim();
          const normalizedTheme = theme.trim() || "默认主题";
          if (!normalizedDetail) {
            return state;
          }
          const existed = state.prompts.find(
            (item) =>
              item.id !== id &&
              item.scope === target.scope &&
              (item.theme || "默认主题").toLowerCase() === normalizedTheme.toLowerCase() &&
              (item.detail || item.text || "").toLowerCase() === normalizedDetail.toLowerCase()
          );
          if (existed) {
            return state;
          }
          return {
            prompts: state.prompts.map((item) =>
              item.id === id
                ? {
                    ...item,
                    theme: normalizedTheme,
                    detail: normalizedDetail,
                  }
                : item
            ),
          };
        }),
      removePrompt: (id) => set((state) => ({ prompts: state.prompts.filter((item) => item.id !== id) })),
    }),
    {
      name: "minimax-prompts",
    }
  )
);
