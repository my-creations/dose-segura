import type { KeyValueStore } from '@/storage/types';

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function createKeyValueStore(): KeyValueStore {
  return {
    async getItem(key: string) {
      if (!canUseLocalStorage()) {
        return null;
      }

      try {
        return window.localStorage.getItem(key);
      } catch (error) {
        console.error('KeyValueStore getItem failed:', error);
        throw error;
      }
    },
    async setItem(key: string, value: string) {
      if (!canUseLocalStorage()) {
        return;
      }

      try {
        window.localStorage.setItem(key, value);
      } catch (error) {
        console.error('KeyValueStore setItem failed:', error);
        throw error;
      }
    },
  };
}

export const keyValueStore = createKeyValueStore();
