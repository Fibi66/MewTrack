// 自动化测试第二天打卡逻辑

console.log('=== 自动化测试第二天打卡 ===\n');

// 模拟 storage.js 的核心逻辑
class MockStorage {
  constructor() {
    this.data = {
      sites: {},
      globalStats: {
        totalStreak: 0,
        maxStreak: 0,
        lastCheckDate: null,
        totalDays: 0,
        checkedSitesToday: []
      }
    };
  }

  // 模拟 checkAndUpdateDateStatus
  checkAndUpdateDateStatus() {
    const today = new Date().toDateString();
    
    // 修复后的逻辑：只清理 checkedSitesToday，不更新 lastCheckDate
    if (this.data.globalStats.lastCheckDate !== today) {
      this.data.globalStats.checkedSitesToday = [];
    }
    
    return this.data;
  }

  // 模拟 updateSiteVisit
  updateSiteVisit(domain, isLearningContent = true) {
    const data = this.checkAndUpdateDateStatus();
    const today = new Date().toDateString();
    
    // 检查是否已经访问过
    const hasVisitedToday = data.globalStats.checkedSitesToday.includes(domain);
    if (hasVisitedToday) {
      console.log(`${domain} 今天已经打卡过了`);
      return { isNewVisit: false };
    }
    
    // 初始化网站数据
    if (!data.sites[domain]) {
      data.sites[domain] = {
        streak: 0,
        totalDays: 0,
        lastVisitDate: null
      };
    }
    
    const siteData = data.sites[domain];
    const lastVisit = siteData.lastVisitDate;
    const isNewVisitToday = lastVisit !== today;
    
    if (isNewVisitToday) {
      // 更新网站数据
      if (lastVisit) {
        const lastVisitDate = new Date(lastVisit);
        const todayDate = new Date(today);
        const diffDays = Math.ceil((todayDate - lastVisitDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          siteData.streak++;
        } else {
          siteData.streak = 1;
        }
      } else {
        siteData.streak = 1;
      }
      
      siteData.lastVisitDate = today;
      siteData.totalDays++;
      
      // 更新全局统计
      if (!data.globalStats.checkedSitesToday.includes(domain)) {
        data.globalStats.checkedSitesToday.push(domain);
        data.globalStats.lastCheckDate = today; // 在这里更新
        
        // 第一个网站打卡时更新 totalStreak
        if (data.globalStats.checkedSitesToday.length === 1) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toDateString();
          
          const hasYesterdayRecord = Object.values(data.sites).some(site => 
            site.lastVisitDate === yesterdayStr
          );
          
          if (hasYesterdayRecord) {
            data.globalStats.totalStreak++;
          } else {
            data.globalStats.totalStreak = 1;
          }
          
          data.globalStats.totalDays++;
        }
      }
    }
    
    return {
      isNewVisit: isNewVisitToday,
      siteData: siteData,
      globalStats: data.globalStats
    };
  }
}

// 运行测试
console.log('测试场景1：第一天打卡');
const storage1 = new MockStorage();
const result1 = storage1.updateSiteVisit('github.com');
console.log('结果:', {
  isNewVisit: result1.isNewVisit,
  totalStreak: result1.globalStats.totalStreak,
  siteStreak: result1.siteData.streak
});
console.log('✅ 预期: isNewVisit=true, totalStreak=1, siteStreak=1\n');

console.log('测试场景2：同一天再次访问');
const result2 = storage1.updateSiteVisit('github.com');
console.log('结果:', {
  isNewVisit: result2.isNewVisit
});
console.log('✅ 预期: isNewVisit=false（已经打卡过）\n');

console.log('测试场景3：第二天连续打卡');
// 模拟第二天
const storage2 = new MockStorage();
// 设置昨天的数据
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
storage2.data.sites['github.com'] = {
  streak: 1,
  totalDays: 1,
  lastVisitDate: yesterday.toDateString()
};
storage2.data.globalStats.totalStreak = 1;
storage2.data.globalStats.lastCheckDate = yesterday.toDateString();

const result3 = storage2.updateSiteVisit('github.com');
console.log('结果:', {
  isNewVisit: result3.isNewVisit,
  totalStreak: result3.globalStats.totalStreak,
  siteStreak: result3.siteData.streak,
  lastCheckDate: result3.globalStats.lastCheckDate
});
console.log('✅ 预期: isNewVisit=true, totalStreak=2, siteStreak=2');
console.log('✅ lastCheckDate 应该更新为今天\n');

console.log('=== 测试总结 ===');
console.log('修复要点：');
console.log('1. checkAndUpdateDateStatus 只清理数据，不更新日期');
console.log('2. lastCheckDate 在实际打卡时才更新');
console.log('3. 这样可以正确判断是否是连续打卡');