// Console Interceptor for MewTrack
// Intercepts all console methods and forwards them to Service Worker

(function() {
  'use strict';
  
  // Check if we're in Service Worker (no window object)
  if (typeof window === 'undefined') {
    return;
  }
  
  // Store original console methods
  const originalConsole = {
    log: console.log.bind(console),
    error: console.error.bind(console),
    warn: console.warn.bind(console),
    info: console.info.bind(console),
    debug: console.debug.bind(console)
  };
  
  // Detect source
  function detectSource() {
    const url = window.location.href;
    if (url.includes('popup.html')) return 'popup';
    if (url.includes('settings.html')) return 'settings';
    if (url.includes('chrome-extension://')) return 'extension-page';
    return 'content-script';
  }
  
  const source = detectSource();
  
  // Function to send log to Service Worker
  function sendLogToServiceWorker(level, levelName, args) {
    if (!chrome?.runtime?.sendMessage) return;
    
    try {
      // Convert arguments to serializable format
      const serializedArgs = Array.from(args).map(arg => {
        try {
          if (arg instanceof Error) {
            return { type: 'Error', message: arg.message, stack: arg.stack };
          } else if (typeof arg === 'function') {
            return '[Function]';
          } else if (arg instanceof HTMLElement) {
            return `[HTMLElement: ${arg.tagName}]`;
          } else if (typeof arg === 'object' && arg !== null) {
            // Try to stringify, but limit depth to avoid circular references
            return JSON.parse(JSON.stringify(arg));
          }
          return arg;
        } catch (e) {
          return String(arg);
        }
      });
      
      // Extract the actual message from args
      let message = '';
      if (serializedArgs.length > 0) {
        // Handle formatted console messages like console.log('text %s', 'value')
        if (typeof serializedArgs[0] === 'string' && serializedArgs[0].includes('%')) {
          message = serializedArgs[0];
          // Simple replacement for %s, %d, etc.
          let index = 1;
          message = message.replace(/%[sdifco]/g, () => {
            return index < serializedArgs.length ? serializedArgs[index++] : '';
          });
          serializedArgs.splice(0, index);
        } else {
          message = serializedArgs[0];
          serializedArgs.splice(0, 1);
        }
      }
      
      chrome.runtime.sendMessage({
        action: 'console-log',
        source: source,
        level: level,
        levelName: levelName,
        message: String(message),
        args: serializedArgs,
        timestamp: Date.now(),
        url: window.location.href
      }).catch(() => {
        // Ignore errors - Service Worker might not be ready
      });
    } catch (e) {
      // Ignore serialization errors
    }
  }
  
  // Override console methods
  console.log = function(...args) {
    originalConsole.log(...args);
    sendLogToServiceWorker(4, 'Log', args);
  };
  
  console.error = function(...args) {
    originalConsole.error(...args);
    sendLogToServiceWorker(1, 'Error', args);
  };
  
  console.warn = function(...args) {
    originalConsole.warn(...args);
    sendLogToServiceWorker(2, 'Warning', args);
  };
  
  console.info = function(...args) {
    originalConsole.info(...args);
    sendLogToServiceWorker(3, 'Info', args);
  };
  
  console.debug = function(...args) {
    originalConsole.debug(...args);
    sendLogToServiceWorker(4, 'Debug', args);
  };
  
  // Add a flag to indicate interceptor is active
  window.__mewTrackConsoleInterceptor = true;
  
  // Log that interceptor is active
  originalConsole.log('[MewTrack] Console interceptor activated for:', source);
})();