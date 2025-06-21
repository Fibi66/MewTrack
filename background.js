// 后台脚本 - Service Worker

// Import logger for background script
// Since service workers can't import modules directly, we'll define a simple logger here
const logger = {
  logLevel: 4, // Default to errors only
  
  shouldLog(level) {
    return this.logLevel >= level;
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