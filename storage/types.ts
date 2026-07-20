/**
 * Seam for persisted string preferences (favorites, theme, …).
 * Two adapters justify it: AsyncStorage (native) and localStorage (web).
 */
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

/** In-memory adapter for tests. */
export function createMemoryKeyValueStore(initial: Record<string, string> = {}): KeyValueStore {
  const data = new Map<string, string>(Object.entries(initial));

  return {
    async getItem(key: string) {
      return data.has(key) ? data.get(key)! : null;
    },
    async setItem(key: string, value: string) {
      data.set(key, value);
    },
  };
}
