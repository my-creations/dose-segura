import AsyncStorage from '@react-native-async-storage/async-storage';

import type { KeyValueStore } from '@/storage/types';

export function createKeyValueStore(): KeyValueStore {
  return {
    getItem(key: string) {
      return AsyncStorage.getItem(key);
    },
    setItem(key: string, value: string) {
      return AsyncStorage.setItem(key, value);
    },
  };
}

export const keyValueStore = createKeyValueStore();
