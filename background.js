// Background script - Service Worker

// Import logger for background script
// Since service workers can't import modules directly, we'll define a simple logger here
const logger = {
  logLevel: 4, // Default to debug for Service Worker
  
  shouldLog(level) {
    return this.logLevel >= level;
  },
  
  async loadLogLevel() {
    try {
      const data = await chrome.storage.local.get(['debugLogLevel']);
      if (data.debugLogLevel !== undefined) {
        this.logLevel = data.debugLogLevel;
      }
    } catch (e) {
      // Ignore errors
    }
  },
  
  error(message, ...args) {
    if (this.shouldLog(1)) {
      console.error(`[MewTrack BG Error] ${message}`, ...args);
    }
  },
  
  warn(message, ...args) {
    if (this.shouldLog(2)) {
      console.warn(`[MewTrack BG Warning] ${message}`, ...args);
    }
  },
  
  info(message, ...args) {
    if (this.shouldLog(3)) {
      console.log(`[MewTrack BG Info] ${message}`, ...args);
    }
  },
  
  debug(message, ...args) {
    if (this.shouldLog(4)) {
      console.log(`[MewTrack BG Debug] ${message}`, ...args);
    }
  }
};

// Load log level on initialization
logger.loadLogLevel();

// Listen for storage changes to update log level
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.debugLogLevel) {
    logger.logLevel = changes.debugLogLevel.newValue;
    logger.info('Log level updated to:', logger.logLevel);
  }
});

// Listen for extension installation events
chrome.runtime.onInstalled.addListener((details) => {
  if (typeof logger !== 'undefined') {
    logger.info('MewTrack extension installed! 🐱', details.reason);
  }
  
  // Set default data on first installation
  if (details.reason === 'install') {
    const defaultData = {
      sites: {},
      globalStats: {
        totalStreak: 0,
        maxStreak: 0,
        lastCheckDate: null,
        totalDays: 0,
        checkedSitesToday: []
      },
      settings: {
        notifications: true,
        autoDetect: true
      }
    };
    chrome.storage.local.set({ mewtrack_data: defaultData }, () => {
      if (typeof logger !== 'undefined') {
        logger.info('MewTrack default storage has been set.');
      }
    });
    
    // Open settings page to guide user setup
    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
  } else if (details.reason === 'update') {
    if (typeof logger !== 'undefined') {
      logger.info('MewTrack has been updated to a new version');
    }
    
    // Optional: Inject refresh notification in all open tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        // Only inject notification on supported sites
        if (tab.url && (
          tab.url.includes('youtube.com') ||
          tab.url.includes('bilibili.com') ||
          tab.url.includes('leetcode.com') ||
          tab.url.includes('github.com') ||
          tab.url.includes('coursera.org')
        )) {
          // Try to send message to tab
          chrome.tabs.sendMessage(tab.id, { 
            action: 'extensionUpdated' 
          }).catch(() => {
            // Ignore errors as content script might not be loaded yet
          });
        }
      });
    });
  }
});

// Listen for daily reset (check date changes when browser starts)
chrome.runtime.onStartup.addListener(async () => {
  if (typeof logger !== 'undefined') {
    logger.info('MewTrack browser startup check...');
  }
  try {
    const result = await chrome.storage.local.get('mewtrack_data');
    const data = result.mewtrack_data;
    
    if (data && data.globalStats) {
      const today = new Date().toDateString();
      const lastCheckDate = data.globalStats.lastCheckDate;
      
      if (lastCheckDate && lastCheckDate !== today) {
        // Check if we need to reset streak
        const lastDate = new Date(lastCheckDate);
        const todayDate = new Date(today);
        const diffTime = todayDate - lastDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 1) {
          if (typeof logger !== 'undefined') {
            logger.info(`Detected ${diffDays} days of inactivity, resetting active status`);
          }
          // Set all sites to inactive status
          Object.values(data.sites).forEach(site => {
            site.isActive = false;
          });
        }
        
        // Reset today's check-in records
        data.globalStats.checkedSitesToday = [];
        data.globalStats.lastCheckDate = today;
        
        await chrome.storage.local.set({ mewtrack_data: data });
        if (typeof logger !== 'undefined') {
          logger.info('MewTrack: Date status has been updated');
        }
      }
    }
  } catch (error) {
    if (typeof logger !== 'undefined') {
      logger.error('MewTrack startup check failed:', error);
    }
  }
});

// Listen for messages from Content Script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Immediately log received messages (for debugging)
  if (request.action === 'log' && logger.logLevel >= 4) {
    console.log('[MewTrack SW] Received log message:', request);
  }
  
  // Handle unified log messages
  if (request.action === 'log') {
    // Check log level
    if (!logger.shouldLog(request.level)) {
      sendResponse({ received: true });
      return true;
    }
    
    const timestamp = new Date(request.timestamp).toLocaleTimeString();
    const source = request.source.toUpperCase();
    const levelName = request.levelName;
    const tabInfo = sender.tab ? `[Tab ${sender.tab.id}]` : '';
    
    // Build log prefix
    const prefix = `[MewTrack ${source}${tabInfo} ${timestamp} ${levelName}]`;
    
    // Special handling for siteDetector logs, provide more detailed info
    if (source === 'SITEDETECTOR') {
      // Add special format for siteDetector logs
      const siteDetectorPrefix = `[MewTrack SITE-DETECTOR${tabInfo} ${timestamp} ${levelName}]`;
      
      // Use different console methods based on log level
      switch (request.level) {
        case 1: // Error
          console.error(siteDetectorPrefix, request.message, ...request.args);
          break;
        case 2: // Warning
          console.warn(siteDetectorPrefix, request.message, ...request.args);
          break;
        case 3: // Info - Important decision points
          console.log(`%c${siteDetectorPrefix}`, 'color: #4CAF50; font-weight: bold;', request.message, ...request.args);
          break;
        case 4: // Debug - Detailed process
          console.log(`%c${siteDetectorPrefix}`, 'color: #2196F3;', request.message, ...request.args);
          break;
      }
      
      // If this is an important detection result, add extra visual cues
      if (request.level === 3 && typeof request.args[0] === 'object') {
        const data = request.args[0];
        if (data.isLearning !== undefined) {
          const status = data.isLearning ? '✅ Learning content' : '❌ Non-learning content';
          const site = data.site || 'Unknown site';
          console.log(`%c  └─ ${site}: ${status}`, 'color: #FF9800; font-weight: bold;');
          
          if (data.learningScore !== undefined && data.entertainmentScore !== undefined) {
            console.log(`     └─ Learning score: ${data.learningScore}, Entertainment score: ${data.entertainmentScore}`);
          }
        }
      }
    } else {
      // Logs from other sources use standard format
      switch (request.level) {
        case 1: // Error
          console.error(prefix, request.message, ...request.args);
          break;
        case 2: // Warning
          console.warn(prefix, request.message, ...request.args);
          break;
        case 3: // Info
        case 4: // Debug
          console.log(prefix, request.message, ...request.args);
          break;
      }
    }
    
    // If needed, also display additional information in Service Worker
    if (request.level === 1 && request.url) {
      console.error(`  └─ URL: ${request.url}`);
    }
    
    sendResponse({ received: true });
    return true;
  }
  
  // Original message handling logic
  if (typeof logger !== 'undefined') {
    logger.info('Received message from Content Script:', {
      action: request.action,
      url: request.url,
      tabId: sender.tab?.id,
      timestamp: new Date(request.timestamp).toLocaleTimeString()
    });
  }
  
  // Log site detection events
  if (request.action === 'siteDetectionStarted') {
    if (typeof logger !== 'undefined') {
      logger.debug('Site detection started:', {
        url: request.url,
        domain: new URL(request.url).hostname,
        tabId: sender.tab?.id
      });
    }
  }
  
  // Return confirmation
  sendResponse({ received: true });
  return true; // Keep message channel open
});

if (typeof logger !== 'undefined') {
  logger.info('MewTrack background script started! 🐱');
} 