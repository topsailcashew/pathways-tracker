/**
 * Environment Variable Utilities
 * Provides type-safe access to environment variables with validation
 */

export interface EnvConfig {
  GEMINI_API_KEY: string;
  APP_NAME: string;
  APP_ENV: 'development' | 'production' | 'test';
  ENABLE_AI_FEATURES: boolean;
  ENABLE_AUTO_WELCOME: boolean;
  ENABLE_GOOGLE_SHEETS_INTEGRATION: boolean;
}

/**
 * Validates and returns environment configuration
 * @throws Error if required environment variables are missing
 */
export function getEnvConfig(): Partial<EnvConfig> {
  const config: Partial<EnvConfig> = {
    GEMINI_API_KEY: import.meta.env.GEMINI_API_KEY || '',
    APP_NAME: import.meta.env.VITE_APP_NAME || 'Pathway Tracker',
    APP_ENV: (import.meta.env.VITE_APP_ENV as EnvConfig['APP_ENV']) || 'development',
    ENABLE_AI_FEATURES: import.meta.env.VITE_ENABLE_AI_FEATURES === 'true',
    ENABLE_AUTO_WELCOME: import.meta.env.VITE_ENABLE_AUTO_WELCOME === 'true',
    ENABLE_GOOGLE_SHEETS_INTEGRATION: import.meta.env.VITE_ENABLE_GOOGLE_SHEETS_INTEGRATION === 'true',
  };

  return config;
}

/**
 * Checks if AI features are available
 */
export function isAIEnabled(): boolean {
  const config = getEnvConfig();
  return !!config.GEMINI_API_KEY && config.ENABLE_AI_FEATURES === true;
}

/**
 * Checks if the app is running in production
 */
export function isProduction(): boolean {
  return import.meta.env.PROD || getEnvConfig().APP_ENV === 'production';
}

/**
 * Checks if the app is running in development
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV || getEnvConfig().APP_ENV === 'development';
}

/**
 * Gets a safe environment info object (without sensitive data)
 */
export function getSafeEnvInfo() {
  return {
    appName: getEnvConfig().APP_NAME,
    environment: getEnvConfig().APP_ENV,
    aiEnabled: isAIEnabled(),
    version: import.meta.env.VITE_APP_VERSION || '0.0.0',
  };
}
