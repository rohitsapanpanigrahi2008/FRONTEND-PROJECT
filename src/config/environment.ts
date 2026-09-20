/**
 * Environment access. Fails fast in production on missing critical config.
 * Values here are configuration, never credentials.
 */

function readEnv(key: string, fallback: string): string {
  const raw = (import.meta.env[key] as string | undefined) ?? fallback;
  if (raw === undefined || raw === '') {
    if (import.meta.env.PROD) {
      // Fail loudly in production rather than silently pointing at localhost.
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return fallback;
  }
  return raw;
}

export const env = {
  apiBaseUrl: readEnv('VITE_API_BASE_URL', 'http://localhost:8000/api/v1'),
  wsUrl: readEnv('VITE_WS_URL', 'ws://localhost:8000/ws'),
  useMockApi: readEnv('VITE_USE_MOCK_API', 'true') === 'true',
  appVersion: readEnv('VITE_APP_VERSION', '1.0.0'),
  isProd: import.meta.env.PROD,
  isDev: import.meta.env.DEV,
} as const;
