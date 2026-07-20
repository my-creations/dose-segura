import Constants from 'expo-constants';

import { MedicationsData } from '@/types/medication';

let cachedData: MedicationsData | null = null;
let pendingRequest: Promise<MedicationsData> | null = null;
let resolvedUrl: string | null = null;

function getBasePath() {
  const baseUrl = Constants.expoConfig?.experiments?.baseUrl;
  return typeof baseUrl === 'string' ? baseUrl : '';
}

function getCandidateUrls() {
  if (resolvedUrl) {
    return [resolvedUrl];
  }

  const urls = new Set<string>();
  const basePath = getBasePath().replace(/\/$/, '');

  if (basePath) {
    urls.add(`${basePath}/meds-full.json`);
  }

  urls.add('/meds-full.json');

  return [...urls];
}

export async function loadMedicationsFull() {
  if (cachedData) {
    return cachedData;
  }

  if (!pendingRequest) {
    pendingRequest = (async () => {
      let lastStatus: number | null = null;

      for (const url of getCandidateUrls()) {
        const response = await fetch(url, { cache: 'force-cache' });

        if (!response.ok) {
          lastStatus = response.status;
          continue;
        }

        const data = (await response.json()) as MedicationsData;
        resolvedUrl = url;
        cachedData = data;
        return data;
      }

      throw new Error(`Failed to load medication details: ${lastStatus ?? 'unknown'}`);
    })().finally(() => {
      pendingRequest = null;
    });
  }

  return pendingRequest;
}
