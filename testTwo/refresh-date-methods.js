// 刷新日期的方法 - 用于测试不同日期的打卡

console.log('=== 刷新日期的方法 ===\n');

console.log('方法1：模拟昨天已打卡（最常用）');
console.log(`
chrome.storage.local.get('mewtrack_data', (result) => {
  const data = result.mewtrack_data;
  if (data && data.globalStats) {
    // 将最后检查日期设为昨天
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    data.globalStats.lastCheckDate = yesterday.toDateString();
    
    // 清空今天的打卡记录
    data.globalStats.checkedSitesToday = [];
    
    // 更新所有网站的最后访问日期为昨天
    Object.keys(data.sites).forEach(domain => {
      if (data.sites[domain].lastVisitDate) {
        data.sites[domain].lastVisitDate = yesterday.toDateString();
      }
    });
    
    chrome.storage.local.set({ mewtrack_data: data }, () => {
      console.log('✅ 日期已刷新为昨天');
      console.log('- 所有网站的最后访问日期：', yesterday.toDateString());
      console.log('- 现在刷新页面可以模拟第二天打卡');
    });
  }
});
`);

console.log('\n方法2：模拟前天打卡（测试中断后的情况）');
console.log(`
chrome.storage.local.get('mewtrack_data', (result) => {
  const data = result.mewtrack_data;
  if (data && data.globalStats) {
    // 将最后检查日期设为前天
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    data.globalStats.lastCheckDate = twoDaysAgo.toDateString();
    
    // 清空今天的打卡记录
    data.globalStats.checkedSitesToday = [];
    
    // 更新所有网站的最后访问日期为前天
    Object.keys(data.sites).forEach(domain => {
      if (data.sites[domain].lastVisitDate) {
        data.sites[domain].lastVisitDate = twoDaysAgo.toDateString();
      }
    });
    
    chrome.storage.local.set({ mewtrack_data: data }, () => {
      console.log('✅ 日期已刷新为前天');
      console.log('- 所有网站的最后访问日期：', twoDaysAgo.toDateString());
      console.log('- 现在打卡会保持 totalStreak 不变（因为中断了）');
    });
  }
});
`);

console.log('\n方法3：清空今天的打卡记录（重新打卡）');
console.log(`
chrome.storage.local.get('mewtrack_data', (result) => {
  const data = result.mewtrack_data;
  if (data && data.globalStats) {
    // 只清空今天已打卡的网站列表
    data.globalStats.checkedSitesToday = [];
    
    // 可选：也可以将 lastCheckDate 设为 null 或昨天
    // data.globalStats.lastCheckDate = null;
    
    chrome.storage.local.set({ mewtrack_data: data }, () => {
      console.log('✅ 今天的打卡记录已清空');
      console.log('- 现在可以重新打卡');
    });
  }
});
`);

console.log('\n方法4：设置特定日期（高级测试）');
console.log(`
chrome.storage.local.get('mewtrack_data', (result) => {
  const data = result.mewtrack_data;
  if (data && data.globalStats) {
    // 设置特定日期，例如 2025-06-20
    const specificDate = new Date('2025-06-20');
    data.globalStats.lastCheckDate = specificDate.toDateString();
    
    // 更新网站数据
    Object.keys(data.sites).forEach(domain => {
      if (data.sites[domain].lastVisitDate) {
        data.sites[domain].lastVisitDate = specificDate.toDateString();
      }
    });
    
    chrome.storage.local.set({ mewtrack_data: data }, () => {
      console.log('✅ 日期已设置为：', specificDate.toDateString());
      const today = new Date();
      const diffDays = Math.floor((today - specificDate) / (1000 * 60 * 60 * 24));
      console.log('- 距离今天：', diffDays, '天');
    });
  }
});
`);

console.log('\n方法5：查看当前日期状态');
console.log(`
chrome.storage.local.get('mewtrack_data', (result) => {
  const data = result.mewtrack_data;
  if (data && data.globalStats) {
    const today = new Date().toDateString();
    console.log('===== 当前日期状态 =====');
    console.log('今天：', today);
    console.log('lastCheckDate：', data.globalStats.lastCheckDate);
    console.log('是否是新的一天：', data.globalStats.lastCheckDate !== today);
    console.log('今天已打卡的网站：', data.globalStats.checkedSitesToday);
    
    console.log('\\n各网站最后访问日期：');
    Object.entries(data.sites).forEach(([domain, site]) => {
      if (site.totalDays > 0) {
        const isToday = site.lastVisitDate === today;
        console.log(\`- \${domain}: \${site.lastVisitDate} \${isToday ? '(今天)' : ''}\`);
      }
    });
  }
});
`);

console.log('\n=== 使用建议 ===');
console.log('1. 测试连续打卡：使用方法1（设为昨天）');
console.log('2. 测试中断打卡：使用方法2（设为前天）');
console.log('3. 重复测试今天：使用方法3（清空记录）');
console.log('4. 复杂场景测试：使用方法4（特定日期）');
console.log('5. 调试问题：先用方法5查看状态');