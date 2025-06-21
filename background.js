// 后台脚本 - Service Worker

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

// 初始化时加载日志级别
logger.loadLogLevel();

// 监听存储变化以更新日志级别
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.debugLogLevel) {
    logger.logLevel = changes.debugLogLevel.newValue;
    logger.info('日志级别已更新为:', logger.logLevel);
  }
});

// 监听插件安装事件
chrome.runtime.onInstalled.addListener((details) => {
  if (typeof logger !== 'undefined') {
    logger.info('MewTrack 插件已安装！🐱', details.reason);
  }
  
  // 首次安装时设置默认数据
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
        logger.info('MewTrack 已设置默认存储。');
      }
    });
    
    // 打开设置页面，引导用户设置
    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
  } else if (details.reason === 'update') {
    if (typeof logger !== 'undefined') {
      logger.info('MewTrack 已更新到新版本');
    }
    
    // 可选：在所有打开的标签页中注入刷新提示
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        // 只在支持的网站上注入提示
        if (tab.url && (
          tab.url.includes('youtube.com') ||
          tab.url.includes('bilibili.com') ||
          tab.url.includes('leetcode.com') ||
          tab.url.includes('github.com') ||
          tab.url.includes('coursera.org')
        )) {
          // 尝试向标签页发送消息
          chrome.tabs.sendMessage(tab.id, { 
            action: 'extensionUpdated' 
          }).catch(() => {
            // 忽略错误，因为内容脚本可能还未加载
          });
        }
      });
    });
  }
});

// 监听每日重置（当浏览器启动时检查日期变化）
chrome.runtime.onStartup.addListener(async () => {
  if (typeof logger !== 'undefined') {
    logger.info('MewTrack 浏览器启动检查...');
  }
  try {
    const result = await chrome.storage.local.get('mewtrack_data');
    const data = result.mewtrack_data;
    
    if (data && data.globalStats) {
      const today = new Date().toDateString();
      const lastCheckDate = data.globalStats.lastCheckDate;
      
      if (lastCheckDate && lastCheckDate !== today) {
        // 检查是否需要重置连续性
        const lastDate = new Date(lastCheckDate);
        const todayDate = new Date(today);
        const diffTime = todayDate - lastDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 1) {
          if (typeof logger !== 'undefined') {
            logger.info(`检测到 ${diffDays} 天未使用，重置活跃状态`);
          }
          // 将所有网站设为非活跃状态
          Object.values(data.sites).forEach(site => {
            site.isActive = false;
          });
        }
        
        // 重置今日打卡记录
        data.globalStats.checkedSitesToday = [];
        data.globalStats.lastCheckDate = today;
        
        await chrome.storage.local.set({ mewtrack_data: data });
        if (typeof logger !== 'undefined') {
          logger.info('MewTrack: 日期状态已更新');
        }
      }
    }
  } catch (error) {
    if (typeof logger !== 'undefined') {
      logger.error('MewTrack 启动检查失败:', error);
    }
  }
});

// 监听来自 Content Script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 立即记录收到的消息（用于调试）
  if (request.action === 'log' && logger.logLevel >= 4) {
    console.log('[MewTrack SW] 收到日志消息:', request);
  }
  
  // 处理统一日志消息
  if (request.action === 'log') {
    // 检查日志级别
    if (!logger.shouldLog(request.level)) {
      sendResponse({ received: true });
      return true;
    }
    
    const timestamp = new Date(request.timestamp).toLocaleTimeString();
    const source = request.source.toUpperCase();
    const levelName = request.levelName;
    const tabInfo = sender.tab ? `[Tab ${sender.tab.id}]` : '';
    
    // 构建日志前缀
    const prefix = `[MewTrack ${source}${tabInfo} ${timestamp} ${levelName}]`;
    
    // 根据日志级别使用不同的 console 方法
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
    
    // 如果需要，也可以在 Service Worker 中显示额外信息
    if (request.level === 1 && request.url) {
      console.error(`  └─ URL: ${request.url}`);
    }
    
    sendResponse({ received: true });
    return true;
  }
  
  // 原有的消息处理逻辑
  if (typeof logger !== 'undefined') {
    logger.info('收到来自 Content Script 的消息:', {
      action: request.action,
      url: request.url,
      tabId: sender.tab?.id,
      timestamp: new Date(request.timestamp).toLocaleTimeString()
    });
  }
  
  // 记录网站检测事件
  if (request.action === 'siteDetectionStarted') {
    if (typeof logger !== 'undefined') {
      logger.debug('网站检测开始:', {
        url: request.url,
        domain: new URL(request.url).hostname,
        tabId: sender.tab?.id
      });
    }
  }
  
  // 返回确认
  sendResponse({ received: true });
  return true; // 保持消息通道开放
});

if (typeof logger !== 'undefined') {
  logger.info('MewTrack 后台脚本已启动！🐱');
} 