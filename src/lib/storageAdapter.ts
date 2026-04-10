import { StateStorage } from 'zustand/middleware';

const IS_SERVER = typeof window === 'undefined';

export const getStorageConfig = (): StateStorage => {
  if (IS_SERVER) {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }

  // 检查是否在 Electron 环境中
  const isElectron = navigator.userAgent.toLowerCase().includes(' electron/');
  
  if (isElectron && window.electronStore) {
    return {
      getItem: async (name: string): Promise<string | null> => {
        if (!window.electronStore) return null;
        const val = await window.electronStore.get(name);
        return typeof val === 'string' ? val : null;
      },
      setItem: async (name: string, value: string): Promise<void> => {
        if (!window.electronStore) return;
        return window.electronStore.set(name, value);
      },
      removeItem: async (name: string): Promise<void> => {
        if (!window.electronStore) return;
        return window.electronStore.delete(name);
      },
    };
  }

  // Fallback to localStorage for web/mobile
  return localStorage;
};
