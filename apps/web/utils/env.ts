/**
 * Environment utilities
 */

export function isDevelopment(): boolean {
  return import.meta.env.DEV;
}

export function isProduction(): boolean {
  return import.meta.env.PROD;
}

export function getEnvVar(key: string): string | undefined {
  return import.meta.env[key];
}

export function isAIEnabled(): boolean {
  const enabled = import.meta.env.VITE_AI_ENABLED;
  return enabled === 'true' || enabled === '1';
}
