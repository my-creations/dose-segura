import type { ExpoConfig } from 'expo/config';

const { expo } = require('./app.json') as { expo: ExpoConfig };

const GITHUB_PAGES_BASE_URL = '/dose-segura';
const shouldUseGitHubPagesBaseUrl = process.env.NODE_ENV === 'production';

export default (): ExpoConfig => {
  const experiments = {
    ...(expo.experiments ?? {}),
    ...(shouldUseGitHubPagesBaseUrl ? { baseUrl: GITHUB_PAGES_BASE_URL } : {}),
  };

  if (!shouldUseGitHubPagesBaseUrl && 'baseUrl' in experiments) {
    delete experiments.baseUrl;
  }

  return {
    ...expo,
    web: {
      ...expo.web,
      startUrl: shouldUseGitHubPagesBaseUrl ? `${GITHUB_PAGES_BASE_URL}/` : '/',
    },
    experiments,
  };
};
