/**
 * Application Monitoring and Health Check Utilities
 * Provides runtime monitoring and health status
 */

import { getSafeEnvInfo } from './env';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warn';
      message?: string;
    };
  };
}

export interface PerformanceMetrics {
  memoryUsage?: number;
  loadTime: number;
  renderTime: number;
  apiLatency: { [endpoint: string]: number };
}

class Monitor {
  private startTime: number;
  private performanceMetrics: PerformanceMetrics;

  constructor() {
    this.startTime = Date.now();
    this.performanceMetrics = {
      loadTime: 0,
      renderTime: 0,
      apiLatency: {},
    };
  }

  /**
   * Get application health status
   */
  getHealthStatus(): HealthStatus {
    const uptime = Date.now() - this.startTime;
    const status: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime,
      checks: {},
    };

    // Check if app has been running for a reasonable time
    status.checks.uptime = {
      status: uptime > 0 ? 'pass' : 'fail',
      message: `App uptime: ${Math.floor(uptime / 1000)}s`,
    };

    // Check localStorage availability
    try {
      localStorage.setItem('health-check', 'ok');
      localStorage.removeItem('health-check');
      status.checks.localStorage = {
        status: 'pass',
        message: 'LocalStorage is available',
      };
    } catch {
      status.checks.localStorage = {
        status: 'fail',
        message: 'LocalStorage is not available',
      };
      status.status = 'degraded';
    }

    // Check if environment is properly configured
    const envInfo = getSafeEnvInfo();
    status.checks.environment = {
      status: envInfo.appName ? 'pass' : 'warn',
      message: `Environment: ${envInfo.environment}`,
    };

    // Overall status determination
    const hasFailures = Object.values(status.checks).some(check => check.status === 'fail');
    const hasWarnings = Object.values(status.checks).some(check => check.status === 'warn');

    if (hasFailures) {
      status.status = 'unhealthy';
    } else if (hasWarnings) {
      status.status = 'degraded';
    }

    return status;
  }

  /**
   * Record API call latency
   */
  recordApiLatency(endpoint: string, latency: number) {
    this.performanceMetrics.apiLatency[endpoint] = latency;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    // Get memory usage if available
    if (performance && 'memory' in performance) {
      const memory = (performance as any).memory;
      this.performanceMetrics.memoryUsage = memory.usedJSHeapSize / 1048576; // Convert to MB
    }

    // Get load time
    if (performance && performance.timing) {
      const timing = performance.timing;
      this.performanceMetrics.loadTime =
        timing.loadEventEnd - timing.navigationStart;
    }

    return { ...this.performanceMetrics };
  }

  /**
   * Get app uptime in milliseconds
   */
  getUptime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Reset metrics
   */
  reset() {
    this.startTime = Date.now();
    this.performanceMetrics = {
      loadTime: 0,
      renderTime: 0,
      apiLatency: {},
    };
  }
}

// Export singleton instance
export const monitor = new Monitor();

/**
 * Simple performance timer utility
 */
export class PerformanceTimer {
  private startTime: number;

  constructor() {
    this.startTime = performance.now();
  }

  end(): number {
    return performance.now() - this.startTime;
  }

  endAndLog(label: string): number {
    const duration = this.end();
    console.info(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    return duration;
  }
}
