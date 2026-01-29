/**
 * Startup utilities for the application
 */

import { isDevelopment } from './env';
import { logger } from './logger';

/**
 * Display startup banner in the console
 */
export function displayStartupBanner(): void {
  if (isDevelopment()) {
    console.log(
      '%c🚀 Pathways Tracker',
      'color: #4f46e5; font-size: 20px; font-weight: bold;'
    );
    console.log('%cDevelopment Mode', 'color: #10b981; font-size: 12px;');
  }
}

/**
 * Validate the runtime environment
 * Returns true if the environment is valid, false otherwise
 */
export function validateRuntime(): boolean {
  // Check for required browser APIs
  if (typeof window === 'undefined') {
    logger.error('Window object not available');
    return false;
  }

  if (typeof document === 'undefined') {
    logger.error('Document object not available');
    return false;
  }

  // Check for localStorage support
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
  } catch {
    logger.warn('localStorage is not available');
  }

  return true;
}

/**
 * Run startup checks
 */
export function runStartupChecks(): void {
  logger.info('Running startup checks...');

  // Check API connectivity (non-blocking)
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) {
    logger.warn('VITE_API_URL is not configured');
  } else {
    logger.debug('API URL configured', { apiUrl });
  }

  logger.info('Startup checks completed');
}
