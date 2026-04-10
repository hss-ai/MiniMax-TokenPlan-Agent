import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getStorageConfig } from '@/lib/storageAdapter';

interface SettingsState {
  apiKey: string;
  rememberApiKey: boolean;
  themeMode: "system" | "light" | "dark";
  mcpServers: {
    id: string;
    name: string;
    endpoint: string;
    description: string;
    command: string;
    args: string[];
    env: Record<string, string>;
    enabled: boolean;
    createdAt: number;
  }[];
  setApiKey: (key: string) => void;
  setRememberApiKey: (remember: boolean) => void;
  setThemeMode: (mode: "system" | "light" | "dark") => void;
  addMcpServer: (name: string, endpoint: string, description?: string) => void;
  addMcpServerConfig: (config: {
    name: string;
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    endpoint?: string;
    description?: string;
  }) => void;
  removeMcpServer: (id: string) => void;
  setMcpServerEnabled: (id: string, enabled: boolean) => void;
  clearApiKey: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      rememberApiKey: false,
      themeMode: "system",
      mcpServers: [],
      setApiKey: (key) => set({ apiKey: key }),
      setRememberApiKey: (rememberApiKey) => set((state) => ({
        rememberApiKey,
        apiKey: rememberApiKey ? state.apiKey : "",
      })),
      setThemeMode: (themeMode) => set({ themeMode }),
      addMcpServerConfig: (config) =>
        set((state) => {
          const normalizedName = (config.name || "").trim();
          const normalizedEndpoint = (config.endpoint || "").trim();
          const normalizedCommand = (config.command || "").trim();
          const normalizedDescription = (config.description || "").trim();
          const normalizedArgs = (config.args || []).map((item) => `${item}`.trim()).filter(Boolean);
          const normalizedEnv = Object.fromEntries(
            Object.entries(config.env || {}).map(([key, value]) => [
              key,
              `${value}`.trim().replace(/^`+|`+$/g, ""),
            ])
          );
          if (!normalizedName || (!normalizedEndpoint && !normalizedCommand)) {
            return state;
          }
          const existed = state.mcpServers.find(
            (item) =>
              item.name.toLowerCase() === normalizedName.toLowerCase() ||
              (!!normalizedEndpoint && (item.endpoint || "").toLowerCase() === normalizedEndpoint.toLowerCase()) ||
              (!!normalizedCommand &&
                (item.command || "").toLowerCase() === normalizedCommand.toLowerCase() &&
                (item.args || []).join(" ").toLowerCase() === normalizedArgs.join(" ").toLowerCase())
          );
          if (existed) {
            return state;
          }
          return {
            mcpServers: [
              {
                id: crypto.randomUUID(),
                name: normalizedName,
                endpoint: normalizedEndpoint,
                description: normalizedDescription,
                command: normalizedCommand,
                args: normalizedArgs,
                env: normalizedEnv,
                enabled: true,
                createdAt: Date.now(),
              },
              ...state.mcpServers,
            ],
          };
        }),
      addMcpServer: (name, endpoint, description = "") =>
        set((state) => {
          const normalizedName = name.trim();
          const normalizedEndpoint = endpoint.trim();
          const normalizedDescription = description.trim();
          if (!normalizedName || !normalizedEndpoint) {
            return state;
          }
          const existed = state.mcpServers.find(
            (item) =>
              item.name.toLowerCase() === normalizedName.toLowerCase() ||
              item.endpoint.toLowerCase() === normalizedEndpoint.toLowerCase()
          );
          if (existed) {
            return state;
          }
          return {
            mcpServers: [
              {
                id: crypto.randomUUID(),
                name: normalizedName,
                endpoint: normalizedEndpoint,
                description: normalizedDescription,
                command: "",
                args: [],
                env: {},
                enabled: true,
                createdAt: Date.now(),
              },
              ...state.mcpServers,
            ],
          };
        }),
      removeMcpServer: (id) =>
        set((state) => ({
          mcpServers: state.mcpServers.filter((item) => item.id !== id),
        })),
      setMcpServerEnabled: (id, enabled) =>
        set((state) => ({
          mcpServers: state.mcpServers.map((item) => (item.id === id ? { ...item, enabled } : item)),
        })),
      clearApiKey: () => set({ apiKey: '' }),
    }),
    {
      name: 'minimax-settings',
      storage: createJSONStorage(() => getStorageConfig()),
      partialize: (state) => ({
        apiKey: state.rememberApiKey ? state.apiKey : "",
        rememberApiKey: state.rememberApiKey,
        themeMode: state.themeMode,
        mcpServers: state.mcpServers,
      }),
    }
  )
);
