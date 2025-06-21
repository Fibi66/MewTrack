// Logger module for MewTrack
// Provides centralized logging with configurable levels
class MewTrackLogger {
  constructor() {
    // Log levels: 0 = none, 1 = errors only, 2 = warnings, 3 = info, 4 = debug
    this.logLevel = 1; // Default to errors only
    this.isDevelopment = false;
    this.isServiceWorker = typeof window === 'undefined';
    this.source = this.detectSource();
    
    // Load log level from storage
    this.loadLogLevel();
  }
  
  detectSource() {
    if (this.isServiceWorker) {
      return 'service-worker';
    } else if (typeof window !== 'undefined') {
      // Check if we're in popup, settings, or content script
      const url = window.location.href;
      if (url.includes('popup.html')) return 'popup';
      if (url.includes('settings.html')) return 'settings';
      if (url.includes('chrome-extension://')) return 'extension-page';
      return 'content-script';
    }
    return 'unknown';
  }

  async loadLogLevel() {
    try {
      if (chrome && chrome.storage && chrome.storage.local) {
        const data = await chrome.storage.local.get(['debugLogLevel']);
        if (data.debugLogLevel !== undefined) {
          this.logLevel = data.debugLogLevel;
        }
      }
    } catch (e) {
      // Silently ignore storage errors
    }
  }

  // Check if a message should be logged based on current log level
  shouldLog(level) {
    return this.logLevel >= level;
  }
  
  // Send log to Service Worker for centralized logging
  sendToServiceWorker(level, levelName, message, args) {
    if (!this.isServiceWorker && chrome?.runtime?.sendMessage) {
      try {
        // Serialize args to ensure they can be sent via message passing
        const serializedArgs = args.map(arg => {
          try {
            // Try to convert to JSON-safe format
            if (arg instanceof Error) {
              return { type: 'Error', message: arg.message, stack: arg.stack };
            } else if (typeof arg === 'object' && arg !== null) {
              return JSON.parse(JSON.stringify(arg));
            }
            return arg;
          } catch (e) {
            return String(arg);
          }
        });
        
        chrome.runtime.sendMessage({
          action: 'log',
          source: this.source,
          level: level,
          levelName: levelName,
          message: message,
          args: serializedArgs,
          timestamp: Date.now(),
          url: window?.location?.href || 'N/A'
        }).catch(e => {
          // If Service Worker is not available, fall back to local console
          console.log(`[MewTrack ${levelName}] ${message}`, ...args);
        });
      } catch (e) {
        // Synchronous errors - also fall back to console
        console.log(`[MewTrack ${levelName}] ${message}`, ...args);
      }
    }
  }

  // Critical errors that should always be logged
  error(message, ...args) {
    if (this.shouldLog(1)) {
      if (this.isServiceWorker) {
        console.error(`[MewTrack Error] ${message}`, ...args);
      } else {
        // Send to Service Worker for centralized logging
        this.sendToServiceWorker(1, 'Error', message, args);
      }
    }
  }

  // Warnings that might indicate issues but don't break functionality
  warn(message, ...args) {
    if (this.shouldLog(2)) {
      if (this.isServiceWorker) {
        console.warn(`[MewTrack Warning] ${message}`, ...args);
      } else {
        this.sendToServiceWorker(2, 'Warning', message, args);
      }
    }
  }

  // Informational messages
  info(message, ...args) {
    if (this.shouldLog(3)) {
      if (this.isServiceWorker) {
        console.log(`[MewTrack Info] ${message}`, ...args);
      } else {
        this.sendToServiceWorker(3, 'Info', message, args);
      }
    }
  }

  // Debug messages for development
  debug(message, ...args) {
    if (this.shouldLog(4)) {
      if (this.isServiceWorker) {
        console.log(`[MewTrack Debug] ${message}`, ...args);
      } else {
        this.sendToServiceWorker(4, 'Debug', message, args);
      }
    }
  }

  // Special method for extension context errors (these are expected and shouldn't flood the console)
  contextError(message) {
    // Only log context errors in debug mode
    if (this.shouldLog(4)) {
      console.log(`[MewTrack Context] ${message}`);
    }
  }

  // Log only critical storage errors
  storageError(operation, error) {
    // Filter out common non-critical errors
    const errorMessage = error?.message || error?.toString() || '';
    
    if (errorMessage.includes('Extension context invalidated') ||
        errorMessage.includes('Cannot access a chrome:// URL') ||
        errorMessage.includes('chrome.storage')) {
      // These are expected when extension updates/reloads - log only in debug mode
      this.contextError(`Storage ${operation} failed: ${errorMessage}`);
    } else {
      // Log other storage errors as they might be important
      this.error(`Storage ${operation} failed:`, error);
    }
  }

  // Log API errors with reduced verbosity
  apiError(api, error, details = {}) {
    const errorMessage = error?.message || error?.toString() || '';
    
    // For rate limiting or auth errors, use warning level
    if (error?.status === 429 || error?.status === 401) {
      this.warn(`${api} API error (${error.status}):`, errorMessage);
    } else {
      // For other API errors, include details only in debug mode
      if (this.shouldLog(4)) {
        this.error(`${api} API error:`, error, details);
      } else {
        this.error(`${api} API error:`, errorMessage);
      }
    }
  }
}

// Export singleton instance
const logger = new MewTrackLogger();

// 暴露到全局以便调试
if (typeof window !== 'undefined') {
  window.MewTrackLogger = {
    setLevel: async (level) => {
      logger.logLevel = level;
      await chrome.storage.local.set({ debugLogLevel: level });
      console.log(`[MewTrack] 日志级别已设置为 ${level}`);
    },
    getLevel: () => logger.logLevel,
    testLog: () => {
      console.log('Testing logger - current level:', logger.logLevel);
      logger.debug('This is a debug message');
      logger.info('This is an info message');
      logger.warn('This is a warning message');
      logger.error('This is an error message');
    }
  };
}