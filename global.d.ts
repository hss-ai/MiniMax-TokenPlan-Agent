interface Window {
  electronStore?: {
    get: (key: string) => Promise<unknown>;
    set: (key: string, val: unknown) => Promise<void>;
    delete: (key: string) => Promise<void>;
  };
}
