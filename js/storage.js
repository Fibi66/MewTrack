// 数据存储管理模块
class MewTrackStorage {
  constructor() {
    this.storageKey = 'mewtrack_data';
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
        autoDetect: true
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
      
      return result[this.storageKey] || this.defaultData;
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
    
    // 如果是新的一天，重置今天的打卡记录
    if (data.globalStats.lastCheckDate !== today) {
      // 检查是否连续
      if (data.globalStats.lastCheckDate) {
        const lastDate = new Date(data.globalStats.lastCheckDate);
        const todayDate = new Date(today);
        const diffTime = todayDate - lastDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 1) {
          // 中断了连续性，所有网站变为非活跃状态
          Object.values(data.sites).forEach(site => {
            site.isActive = false;
          });
        }
      }
      
      data.globalStats.lastCheckDate = today;
      data.globalStats.checkedSitesToday = [];
      await this.saveAllData(data);
    }
    
    return data;
  }

  // 更新网站访问记录
  async updateSiteVisit(domain, isLearningContent = true) {
    const data = await this.checkAndUpdateDateStatus();
    const today = new Date().toDateString();
    
    // 规范化域名
    const normalizedDomain = this.normalizeDomain(domain);
    
    if (!data.sites[normalizedDomain]) {
      data.sites[normalizedDomain] = this.getDefaultSiteData();
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
          // 网站中断，保持streak但变灰
          siteData.isActive = false;
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
      
      // 如果这是今天第一个打卡的网站，更新总streak
      if (data.globalStats.checkedSitesToday.length === 1) {
        if (data.globalStats.lastCheckDate === today) {
          // 检查是否连续
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toDateString();
          
          // 查找昨天是否有打卡记录
          const hasYesterdayRecord = Object.values(data.sites).some(site => 
            site.lastVisitDate === yesterdayStr
          );
          
          if (hasYesterdayRecord || data.globalStats.totalStreak === 0) {
            data.globalStats.totalStreak++;
          } else {
            data.globalStats.totalStreak = 1; // 重新开始
          }
        } else {
          data.globalStats.totalStreak = 1;
        }
        
        data.globalStats.totalDays++;
        data.globalStats.maxStreak = Math.max(data.globalStats.maxStreak, data.globalStats.totalStreak);
      }
    }
    
    await this.saveAllData(data);
    
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
    const data = await this.getAllData();
    
    // 确保globalStats存在
    if (!data.globalStats || !data.globalStats.checkedSitesToday) {
      return false;
    }
    
    // 规范化域名（移除www.前缀）
    const normalizedDomain = this.normalizeDomain(domain);
    
    // 检查是否已访问（同时检查原始域名和规范化域名）
    return data.globalStats.checkedSitesToday.some(checkedDomain => 
      this.normalizeDomain(checkedDomain) === normalizedDomain
    );
  }
  
  // 规范化域名（移除www.前缀）
  normalizeDomain(domain) {
    return domain.replace(/^www\./, '');
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
}

// 导出实例
const mewTrackStorage = new MewTrackStorage(); 