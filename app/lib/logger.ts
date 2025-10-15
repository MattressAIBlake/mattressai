/**
 * Structured Logger
 * Provides structured logging compatible with Vercel Log Drains
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: any;
}

/**
 * Structured logger that outputs JSON for better parsing in production
 */
export const logger = {
  /**
   * Debug level logging
   */
  debug: (message: string, meta?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      const entry: LogEntry = {
        level: 'debug',
        message,
        timestamp: new Date().toISOString(),
        ...meta
      };
      console.log(JSON.stringify(entry));
    }
  },

  /**
   * Info level logging
   */
  info: (message: string, meta?: Record<string, any>) => {
    const entry: LogEntry = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    };
    console.log(JSON.stringify(entry));
  },

  /**
   * Warning level logging
   */
  warn: (message: string, meta?: Record<string, any>) => {
    const entry: LogEntry = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    };
    console.warn(JSON.stringify(entry));
  },

  /**
   * Error level logging
   */
  error: (message: string, error?: Error | unknown, meta?: Record<string, any>) => {
    const entry: LogEntry = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    };

    if (error instanceof Error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    } else if (error) {
      entry.error = error;
    }

    console.error(JSON.stringify(entry));
  },

  /**
   * Create a child logger with default metadata
   */
  child: (defaultMeta: Record<string, any>) => {
    return {
      debug: (message: string, meta?: Record<string, any>) =>
        logger.debug(message, { ...defaultMeta, ...meta }),
      info: (message: string, meta?: Record<string, any>) =>
        logger.info(message, { ...defaultMeta, ...meta }),
      warn: (message: string, meta?: Record<string, any>) =>
        logger.warn(message, { ...defaultMeta, ...meta }),
      error: (message: string, error?: Error | unknown, meta?: Record<string, any>) =>
        logger.error(message, error, { ...defaultMeta, ...meta })
    };
  }
};

/**
 * Performance logger for tracking execution time
 */
export class PerformanceLogger {
  private startTime: number;
  private label: string;
  private meta: Record<string, any>;

  constructor(label: string, meta: Record<string, any> = {}) {
    this.label = label;
    this.meta = meta;
    this.startTime = Date.now();
    logger.debug(`${label} started`, meta);
  }

  end(additionalMeta?: Record<string, any>) {
    const duration = Date.now() - this.startTime;
    logger.info(`${this.label} completed`, {
      ...this.meta,
      ...additionalMeta,
      duration_ms: duration
    });
    return duration;
  }

  fail(error: Error | unknown, additionalMeta?: Record<string, any>) {
    const duration = Date.now() - this.startTime;
    logger.error(`${this.label} failed`, error, {
      ...this.meta,
      ...additionalMeta,
      duration_ms: duration
    });
    return duration;
  }
}

