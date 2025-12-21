/**
 * Startup Checks and Initialization
 * Validates environment and displays warnings for production issues
 */

import { logger } from './logger';
import { isAIEnabled, isDevelopment, getSafeEnvInfo } from './env';
import { monitor } from './monitoring';

/**
 * Runs startup checks and logs any issues
 */
export function runStartupChecks(): void {
  logger.info('Running startup checks...');

  const envInfo = getSafeEnvInfo();
  logger.info('Environment initialized', envInfo);

  // Check if AI is enabled
  if (!isAIEnabled()) {
    logger.warn(
      'AI features are disabled. Configure GEMINI_API_KEY in .env to enable AI features.'
    );
  }

  // Check localStorage availability
  try {
    localStorage.setItem('startup-check', 'ok');
    localStorage.removeItem('startup-check');
  } catch (error) {
    logger.error('LocalStorage is not available. Some features may not work.', error as Error);
  }

  // Production warnings
  if (!isDevelopment()) {
    logger.warn('⚠️  PRODUCTION MODE DETECTED');
    logger.warn('⚠️  Please ensure all production requirements are met:');
    logger.warn('   1. Backend API server is running');
    logger.warn('   2. Database is connected');
    logger.warn('   3. Real authentication is implemented');
    logger.warn('   4. API keys are secured on backend');
    logger.warn('   See PRODUCTION_READINESS.md for details');
  }

  // Log health status
  const health = monitor.getHealthStatus();
  if (health.status !== 'healthy') {
    logger.warn(`Health check status: ${health.status}`, health.checks);
  }

  logger.info('Startup checks completed');
}

/**
 * Display startup banner in console
 */
export function displayStartupBanner(): void {
  if (isDevelopment()) {
    console.log(
      '%c🙏 Pathway Tracker',
      'font-size: 20px; font-weight: bold; color: #0A1931;'
    );
    console.log(
      '%cChurch Integration Platform',
      'font-size: 12px; color: #4A7FA7;'
    );
    console.log(
      '%c💡 Tips:',
      'font-size: 12px; font-weight: bold; color: #10B981; margin-top: 10px;'
    );
    console.log('  - Use logger.getLogs() to view application logs');
    console.log('  - Use monitor.getHealthStatus() to check app health');
    console.log('  - Use monitor.getPerformanceMetrics() for performance stats');
    console.log('');
    console.log('%c⚠️  Development Mode', 'font-weight: bold; color: #F59E0B;');
    console.log('  This is a frontend prototype. See DEPLOYMENT_LIMITATIONS.md');
    console.log('');
  }
}

/**
 * Perform runtime validations
 */
export function validateRuntime(): boolean {
  const issues: string[] = [];

  // Check for required browser features
  if (typeof localStorage === 'undefined') {
    issues.push('LocalStorage is not available');
  }

  if (typeof fetch === 'undefined') {
    issues.push('Fetch API is not available');
  }

  if (typeof Promise === 'undefined') {
    issues.push('Promises are not supported');
  }

  // Log issues
  if (issues.length > 0) {
    logger.error('Runtime validation failed', new Error('Missing browser features'), {
      issues,
    });
    return false;
  }

  return true;
}
