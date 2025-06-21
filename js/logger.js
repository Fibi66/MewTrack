// Logger module for MewTrack
// Provides centralized logging with configurable levels
class MewTrackLogger {
  constructor() {
    // Log levels: 0 = none, 1 = errors only, 2 = warnings, 3 = info, 4 = debug
    this.logLevel = 1; // Default to errors only
    this.isDevelopment = false;
    
    // Load log level from storage
    this.loadLogLevel();
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

  // Critical errors that should always be logged
  error(message, ...args) {
    if (this.shouldLog(1)) {
      console.error(`[MewTrack Error] ${message}`, ...args);
    }
  }

  // Warnings that might indicate issues but don't break functionality
  warn(message, ...args) {
    if (this.shouldLog(2)) {
      console.warn(`[MewTrack Warning] ${message}`, ...args);
    }
  }

  // Informational messages
  info(message, ...args) {
    if (this.shouldLog(3)) {
      console.log(`[MewTrack Info] ${message}`, ...args);
    }
  }

  // Debug messages for development
  debug(message, ...args) {
    if (this.shouldLog(4)) {
      console.log(`[MewTrack Debug] ${message}`, ...args);
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