// 数据存储管理模块
class MewTrackStorage {
  constructor() {
    this.storageKey = 'mewtrack_data';
    this.pendingUpdates = new Map(); // Track pending updates to prevent duplicates
    this.defaultData = {
      sites: {},
      globalStats: {
        totalStreak: 0,        // 总连续天数（影响猫猫成长）
        maxStreak: 0,          // 历史最长连续天数
        lastCheckDate: null,   // 最后检查日期
        totalDays: 0,          // 总学习天数
        checkedSitesToday: []  // 今天已打卡的网站
      },
      settings: {
        notifications: true,
        autoDetect: true,
        aiContentDetection: true  // AI自动识别内容开关
      },
      customSites: {} // 用户自定义的网站
    };
  }

  // 检查扩展上下文是否有效
  isExtensionContextValid() {
    try {
      return !!(chrome && chrome.storage && chrome.storage.local);
    } catch (error) {
      return false;
    }
  }

  // 获取所有数据
  async getAllData() {
    try {
      // 检查扩展上下文
      if (!this.isExtensionContextValid()) {
        // Silently return default data when context is invalid
        return this.defaultData;
      }
      
      // 使用Promise包装chrome.storage调用，增加更好的错误处理
      const result = await new Promise((resolve) => {
        try {
          chrome.storage.local.get(this.storageKey, (data) => {
            if (chrome.runtime.lastError) {
              // 静默处理扩展上下文失效错误
              resolve({ [this.storageKey]: null });
            } else {
              resolve(data);
            }
          });
        } catch (err) {
          // 如果chrome对象不可用，返回默认值
          resolve({ [this.storageKey]: null });
        }
      });
      
      const data = result[this.storageKey] || this.defaultData;
      
      // 检查并清理过期的 checkedSitesToday
      if (data.globalStats && data.globalStats.lastCheckDate) {
        const today = new Date().toDateString();
        const lastCheckDate = data.globalStats.lastCheckDate;
        
        // 如果最后检查日期不是今天，清空 checkedSitesToday
        if (lastCheckDate !== today) {
          data.globalStats.checkedSitesToday = [];
          // 不在这里更新 lastCheckDate，让它在实际打卡时更新
          // 这样可以正确追踪是否是连续打卡
          
          if (typeof logger !== 'undefined') {
            logger.info('新的一天开始，已清空昨天的打卡记录');
          }
        }
      } else {
        // 如果没有lastCheckDate，保持为null
        // 让第一次打卡时设置
      }
      
      return data;
    } catch (error) {
      // 这个catch块现在应该很少被触发
      return this.defaultData;
    }
  }

  // 保存所有数据
  async saveAllData(data) {
    try {
      // 检查扩展上下文
      if (!this.isExtensionContextValid()) {
        // Silently fail when context is invalid
        return false;
      }
      
      // 使用Promise包装chrome.storage调用，增加更好的错误处理
      return await new Promise((resolve) => {
        try {
          chrome.storage.local.set({ [this.storageKey]: data }, () => {
            if (chrome.runtime.lastError) {
              // 静默处理扩展上下文失效错误
              resolve(false);
            } else {
              resolve(true);
            }
          });
        } catch (err) {
          // 如果chrome对象不可用
          resolve(false);
        }
      });
    } catch (error) {
      // 这个catch块现在应该很少被触发
      return false;
    }
  }

  // 获取特定网站的数据
  async getSiteData(domain) {
    const data = await this.getAllData();
    const normalizedDomain = this.normalizeDomain(domain);
    
    if (typeof logger !== 'undefined') {
      logger.debug(`获取网站数据 - 原始域名: ${domain}, 规范化域名: ${normalizedDomain}`);
      logger.debug(`存储的网站列表:`, Object.keys(data.sites));
    }
    
    return data.sites[normalizedDomain] || this.getDefaultSiteData();
  }

  // 获取默认网站数据结构
  getDefaultSiteData() {
    return {
      streak: 0,
      totalDays: 0,
      lastVisitDate: null,
      isActive: true,
      catStage: 0,
      visits: [],
      targetDays: 0,  // 目标打卡天数
      targetCreatedDate: null  // 目标创建日期
    };
  }

  // 检查并更新日期状态
  async checkAndUpdateDateStatus() {
    const data = await this.getAllData();
    const today = new Date().toDateString();
    
    // 确保globalStats存在
    if (!data.globalStats) {
      data.globalStats = {
        totalStreak: 0,
        maxStreak: 0,
        lastCheckDate: null,
        totalDays: 0,
        checkedSitesToday: []
      };
    }
    
    // 如果是新的一天，只清理checkedSitesToday，不更新lastCheckDate
    if (data.globalStats.lastCheckDate !== today) {
      // 清空今天的打卡记录，但不更新lastCheckDate
      // lastCheckDate 会在实际打卡时更新
      data.globalStats.checkedSitesToday = [];
      // 不在这里保存数据，避免竞态条件
    }
    
    return data;
  }

  // 更新网站访问记录
  async updateSiteVisit(domain, isLearningContent = true) {
    const data = await this.checkAndUpdateDateStatus();
    const today = new Date().toDateString();
    
    // 规范化域名
    const normalizedDomain = this.normalizeDomain(domain);
    
    // Check if there's already a pending update for this domain today
    const updateKey = `${normalizedDomain}-${today}`;
    if (this.pendingUpdates.has(updateKey)) {
      return this.pendingUpdates.get(updateKey);
    }
    
    // Create a promise for this update
    const updatePromise = this._performSiteUpdate(data, normalizedDomain, today, isLearningContent);
    this.pendingUpdates.set(updateKey, updatePromise);
    
    // Clean up the pending update after completion
    updatePromise.finally(() => {
      this.pendingUpdates.delete(updateKey);
    });
    
    return updatePromise;
  }
  
  async _performSiteUpdate(data, normalizedDomain, today, isLearningContent) {
    if (typeof logger !== 'undefined') {
      logger.debug(`更新网站访问记录 - 域名: ${normalizedDomain}, 今天: ${today}`);
    }
    
    if (!data.sites[normalizedDomain]) {
      data.sites[normalizedDomain] = this.getDefaultSiteData();
      if (typeof logger !== 'undefined') {
        logger.debug(`为 ${normalizedDomain} 创建新的网站数据`);
      }
    }

    const siteData = data.sites[normalizedDomain];
    const lastVisit = siteData.lastVisitDate;
    const isNewVisitToday = lastVisit !== today;
    
    // 更新网站数据
    if (isNewVisitToday) {
      // 计算网站 streak
      if (lastVisit) {
        const lastVisitDate = new Date(lastVisit);
        const todayDate = new Date(today);
        const diffTime = todayDate - lastVisitDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          siteData.streak++;
          siteData.isActive = true;
        } else if (diffDays > 1) {
          // 网站中断，重置streak
          siteData.streak = 1;
          siteData.isActive = true;
        }
      } else {
        // 第一次访问
        siteData.streak = 1;
        siteData.isActive = true;
      }
      
      siteData.lastVisitDate = today;
      siteData.totalDays++;
      siteData.visits.push({
        date: today,
        isLearningContent
      });
      
      // 更新猫猫成长阶段
      siteData.catStage = this.calculateCatStage(siteData.streak);
    }
    
    // 更新全局统计（如果今天第一次打卡这个网站）
    if (isNewVisitToday && !data.globalStats.checkedSitesToday.some(d => 
      this.normalizeDomain(d) === normalizedDomain
    )) {
      data.globalStats.checkedSitesToday.push(normalizedDomain);
      data.globalStats.lastCheckDate = today; // 更新最后检查日期
      
      // 如果这是今天第一个打卡的网站，更新总streak
      if (data.globalStats.checkedSitesToday.length === 1) {
        // 检查是否连续
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();
        
        // 查找昨天是否有打卡记录
        const hasYesterdayRecord = Object.values(data.sites).some(site => 
          site.lastVisitDate === yesterdayStr
        );
        
        if (hasYesterdayRecord) {
          // 昨天有打卡，连续天数+1
          data.globalStats.totalStreak++;
        } else if (data.globalStats.totalStreak === 0) {
          // 第一次打卡，设置为1
          data.globalStats.totalStreak = 1;
        }
        // 如果已经有totalStreak但昨天没打卡，保持不变
        
        data.globalStats.totalDays++;
        data.globalStats.maxStreak = Math.max(data.globalStats.maxStreak, data.globalStats.totalStreak);
      }
    }
    
    await this.saveAllData(data);
    
    if (typeof logger !== 'undefined') {
      logger.debug(`网站数据更新完成 - ${normalizedDomain}:`, {
        streak: siteData.streak,
        totalDays: siteData.totalDays,
        isActive: siteData.isActive,
        lastVisitDate: siteData.lastVisitDate
      });
    }
    
    return {
      isNewVisit: isNewVisitToday,
      siteData: siteData,
      globalStats: data.globalStats
    };
  }

  // 计算猫猫成长阶段（基于总streak）
  calculateCatStage(streak) {
    if (streak >= 30) return 3; // 猫王
    if (streak >= 10) return 2; // 大猫
    if (streak >= 1) return 1;  // 小猫
    return 0; // 蛋
  }

  // 获取所有网站数据
  async getAllSitesData() {
    const data = await this.getAllData();
    return data.sites;
  }

  // 获取全局统计数据
  async getGlobalStats() {
    const data = await this.getAllData();
    
    // 确保globalStats存在，如果不存在则使用默认值
    if (!data.globalStats) {
      data.globalStats = {
        totalStreak: 0,
        maxStreak: 0,
        lastCheckDate: null,
        totalDays: 0,
        checkedSitesToday: []
      };
      await this.saveAllData(data);
    }
    
    return data.globalStats;
  }

  // 重置特定网站的数据
  async resetSiteData(domain) {
    const data = await this.getAllData();
    delete data.sites[domain];
    await this.saveAllData(data);
  }

  // 重置所有学习数据（保留API密钥和设置）
  async resetLearningData() {
    try {
      // 获取当前所有数据
      const allData = await chrome.storage.local.get(null);
      
      // 保留API密钥和设置
      const preservedData = {
        openaiApiKey: allData.openaiApiKey,
        deepseekApiKey: allData.deepseekApiKey,
        userLanguage: allData.userLanguage
      };
      
      // 清除所有数据
      await chrome.storage.local.clear();
      
      // 恢复API密钥和设置
      await chrome.storage.local.set(preservedData);
      
      // 重新初始化默认数据结构
      await this.saveAllData(this.defaultData);
      
      return true;
    } catch (error) {
      if (typeof logger !== 'undefined') {
        logger.error('重置学习数据失败:', error);
      }
      return false;
    }
  }

  // 获取统计数据
  async getStats() {
    const data = await this.getAllData();
    
    // 确保globalStats存在
    if (!data.globalStats) {
      data.globalStats = {
        totalStreak: 0,
        maxStreak: 0,
        lastCheckDate: null,
        totalDays: 0,
        checkedSitesToday: []
      };
      await this.saveAllData(data);
    }
    
    const sites = Object.values(data.sites);
    
    return {
      totalSites: sites.length,
      activeSites: sites.filter(site => site.isActive).length,
      totalStreak: data.globalStats.totalStreak,
      maxStreak: data.globalStats.maxStreak,
      totalVisits: data.globalStats.totalDays,
      checkedSitesToday: data.globalStats.checkedSitesToday.length
    };
  }

  // 检查今天是否已经访问过某个网站
  async hasVisitedToday(domain) {
    const today = new Date().toDateString();
    const normalizedDomain = this.normalizeDomain(domain);
    
    // Check pending updates first
    const updateKey = `${normalizedDomain}-${today}`;
    if (this.pendingUpdates.has(updateKey)) {
      return true; // Already being processed
    }
    
    const data = await this.getAllData();
    
    // 确保globalStats存在
    if (!data.globalStats || !data.globalStats.checkedSitesToday) {
      return false;
    }
    
    // 双重检查：即使 getAllData 应该已经清理了，这里再检查一次
    if (data.globalStats.lastCheckDate && data.globalStats.lastCheckDate !== today) {
      if (typeof logger !== 'undefined') {
        logger.warn('hasVisitedToday: 检测到日期不匹配，应该已经被清理。lastCheckDate:', data.globalStats.lastCheckDate, 'today:', today);
      }
      // 这种情况不应该发生，但如果发生了，返回 false
      return false;
    }
    
    // 检查是否已访问（同时检查原始域名和规范化域名）
    return data.globalStats.checkedSitesToday.some(checkedDomain => 
      this.normalizeDomain(checkedDomain) === normalizedDomain
    );
  }
  
  // 规范化域名（移除www.前缀，并处理YouTube等特殊域名）
  normalizeDomain(domain) {
    // 首先移除www.前缀
    let normalized = domain.replace(/^www\./, '');
    
    // 特殊处理YouTube的各种子域名
    if (normalized.includes('youtube.com')) {
      return 'youtube.com';
    }
    
    // 特殊处理Bilibili的各种子域名
    if (normalized.includes('bilibili.com')) {
      return 'bilibili.com';
    }
    
    return normalized;
  }

  // 获取连续访问天数最多的网站
  async getTopSites(limit = 5) {
    const data = await this.getAllData();
    const sites = Object.entries(data.sites)
      .map(([domain, siteData]) => ({
        domain,
        ...siteData
      }))
      .sort((a, b) => b.streak - a.streak)
      .slice(0, limit);
    
    return sites;
  }

  // 设置网站的目标打卡天数
  async setTargetDays(domain, targetDays) {
    const data = await this.getAllData();
    
    if (!data.sites[domain]) {
      data.sites[domain] = this.getDefaultSiteData();
    }
    
    data.sites[domain].targetDays = targetDays;
    data.sites[domain].targetCreatedDate = new Date().toDateString();
    
    await this.saveAllData(data);
    return true;
  }

  // 获取网站的目标进度
  async getTargetProgress(domain) {
    const siteData = await this.getSiteData(domain);
    
    if (!siteData.targetDays || siteData.targetDays === 0) {
      return null;
    }
    
    return {
      current: siteData.totalDays,
      target: siteData.targetDays,
      percentage: Math.min(100, Math.round((siteData.totalDays / siteData.targetDays) * 100)),
      isCompleted: siteData.totalDays >= siteData.targetDays
    };
  }

  // 添加自定义网站
  async addCustomSite(url, name) {
    const data = await this.getAllData();
    
    if (!data.customSites) {
      data.customSites = {};
    }
    
    // 从URL中提取域名
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      const domain = urlObj.hostname.toLowerCase();
      
      data.customSites[domain] = {
        name: name || domain,
        url: urlObj.href,
        addedDate: new Date().toISOString(),
        enabled: true
      };
      
      await this.saveAllData(data);
      return { success: true, domain };
    } catch (error) {
      return { success: false, error: '无效的URL格式' };
    }
  }

  // 删除自定义网站
  async removeCustomSite(domain) {
    const data = await this.getAllData();
    
    if (data.customSites && data.customSites[domain]) {
      delete data.customSites[domain];
      // 同时删除该网站的打卡记录
      delete data.sites[domain];
      await this.saveAllData(data);
      return true;
    }
    
    return false;
  }

  // 获取所有自定义网站
  async getCustomSites() {
    const data = await this.getAllData();
    return data.customSites || {};
  }

  // 切换自定义网站的启用状态
  async toggleCustomSite(domain, enabled) {
    const data = await this.getAllData();
    
    if (data.customSites && data.customSites[domain]) {
      data.customSites[domain].enabled = enabled;
      await this.saveAllData(data);
      return true;
    }
    
    return false;
  }

  // 获取AI内容检测设置
  async getAIContentDetectionSetting() {
    const data = await this.getAllData();
    return data.settings?.aiContentDetection !== false; // 默认为true
  }

  // 设置AI内容检测开关
  async setAIContentDetectionSetting(enabled) {
    const data = await this.getAllData();
    if (!data.settings) {
      data.settings = {};
    }
    data.settings.aiContentDetection = enabled;
    await this.saveAllData(data);
    return true;
  }
}

// 导出实例
const mewTrackStorage = new MewTrackStorage(); 