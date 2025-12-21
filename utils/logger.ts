/**
 * Centralized Logging Service
 * Provides structured logging with different levels
 * In production, this can be extended to send logs to a monitoring service
 */

import { isDevelopment } from './env';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  /**
   * Log a debug message (only in development)
   */
  debug(message: string, context?: Record<string, unknown>) {
    if (isDevelopment()) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  /**
   * Log an info message
   */
  info(message: string, context?: Record<string, unknown>) {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: Record<string, unknown>) {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log(LogLevel.ERROR, message, { ...context, error: error?.message });
    if (error) {
      console.error(error);
    }
  }

  /**
   * Log a critical error (always logged regardless of environment)
   */
  critical(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log(LogLevel.CRITICAL, message, { ...context, error: error?.message });
    if (error) {
      console.error(error);
    }
    // In production, you would send this to an error tracking service like Sentry
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    this.logs.push(entry);

    // Keep only last N logs to prevent memory issues
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output with color coding
    const prefix = `[${entry.timestamp}] [${level}]`;
    const logMessage = context ? `${message} ${JSON.stringify(context)}` : message;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, logMessage);
        break;
      case LogLevel.INFO:
        console.info(prefix, logMessage);
        break;
      case LogLevel.WARN:
        console.warn(prefix, logMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(prefix, logMessage);
        break;
    }
  }

  /**
   * Get all logs (useful for debugging or admin panels)
   */
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Export logs as JSON (useful for downloading logs)
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Export singleton instance
export const logger = new Logger();
