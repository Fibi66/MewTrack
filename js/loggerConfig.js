// Logger configuration for MewTrack
// This file allows users to adjust logging levels for debugging

// Set logger level from developer console:
// MewTrackLogConfig.setLevel(4) - Enable all logs (debug mode)
// MewTrackLogConfig.setLevel(3) - Info and above
// MewTrackLogConfig.setLevel(2) - Warnings and errors
// MewTrackLogConfig.setLevel(1) - Errors only (default)
// MewTrackLogConfig.setLevel(0) - Disable all logs

window.MewTrackLogConfig = {
  async setLevel(level) {
    if (level < 0 || level > 4) {
      console.error('[MewTrack] Invalid log level. Use 0-4');
      return;
    }
    
    try {
      await chrome.storage.local.set({ debugLogLevel: level });
      console.log(`[MewTrack] Log level set to ${level}`);
      
      // Update current logger if available
      if (typeof logger !== 'undefined') {
        logger.logLevel = level;
      }
    } catch (error) {
      console.error('[MewTrack] Failed to save log level:', error);
    }
  },
  
  async getLevel() {
    try {
      const data = await chrome.storage.local.get(['debugLogLevel']);
      return data.debugLogLevel || 1;
    } catch (error) {
      console.error('[MewTrack] Failed to get log level:', error);
      return 1;
    }
  },
  
  levels: {
    NONE: 0,
    ERROR: 1,
    WARN: 2,
    INFO: 3,
    DEBUG: 4
  }
};