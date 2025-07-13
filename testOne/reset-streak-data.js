// 重置连续天数数据的测试脚本

console.log('=== 重置连续天数数据 ===\n');

console.log('在Chrome扩展的控制台中运行以下代码：\n');

console.log(`
// 方法1：重置所有数据，从第1天开始
chrome.storage.local.get('mewtrack_data', (result) => {
  const data = result.mewtrack_data;
  if (data && data.globalStats) {
    // 重置全局统计
    data.globalStats.totalStreak = 0;
    data.globalStats.maxStreak = 0;
    data.globalStats.totalDays = 0;
    data.globalStats.checkedSitesToday = [];
    data.globalStats.lastCheckDate = null;
    
    // 重置所有网站数据
    Object.keys(data.sites).forEach(site => {
      data.sites[site].streak = 0;
      data.sites[site].totalDays = 0;
      data.sites[site].lastVisitDate = null;
      data.sites[site].visits = [];
    });
    
    // 保存更新后的数据
    chrome.storage.local.set({ mewtrack_data: data }, () => {
      console.log('✅ 所有数据已重置');
      console.log('现在访问任何学习网站将从第1天开始计算');
    });
  }
});
`);

console.log('\n或者：\n');

console.log(`
// 方法2：模拟第1天的数据（昨天打卡过）
chrome.storage.local.get('mewtrack_data', (result) => {
  const data = result.mewtrack_data;
  if (data && data.globalStats) {
    // 设置为昨天打卡过
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    // 重置全局数据
    data.globalStats.totalStreak = 1;  // 昨天是第1天
    data.globalStats.maxStreak = 1;
    data.globalStats.totalDays = 1;
    data.globalStats.checkedSitesToday = [];
    data.globalStats.lastCheckDate = yesterdayStr;
    
    // 为GitHub设置昨天的数据
    if (data.sites['github.com']) {
      data.sites['github.com'].streak = 1;
      data.sites['github.com'].totalDays = 1;
      data.sites['github.com'].lastVisitDate = yesterdayStr;
      data.sites['github.com'].visits = [{date: yesterdayStr, isLearningContent: true}];
    }
    
    // 保存更新后的数据
    chrome.storage.local.set({ mewtrack_data: data }, () => {
      console.log('✅ 数据已设置为第1天状态');
      console.log('今天访问GitHub将显示：1 days → 2 days');
    });
  }
});
`);

console.log('\n\n=== 查看当前数据 ===\n');

console.log(`
// 查看当前的连续天数数据
chrome.storage.local.get('mewtrack_data', (result) => {
  const data = result.mewtrack_data;
  if (data && data.globalStats) {
    console.log('全局统计:');
    console.log('  总连续天数:', data.globalStats.totalStreak);
    console.log('  最大连续天数:', data.globalStats.maxStreak);
    console.log('  总学习天数:', data.globalStats.totalDays);
    console.log('  最后检查日期:', data.globalStats.lastCheckDate);
    console.log('  今天已打卡:', data.globalStats.checkedSitesToday);
    
    console.log('\\n网站数据:');
    Object.entries(data.sites).forEach(([domain, site]) => {
      if (site.totalDays > 0) {
        console.log(\`  \${domain}:\`);
        console.log(\`    连续天数: \${site.streak}\`);
        console.log(\`    总天数: \${site.totalDays}\`);
        console.log(\`    最后访问: \${site.lastVisitDate}\`);
      }
    });
  }
});
`);