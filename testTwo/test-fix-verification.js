// 验证第二天打卡修复

console.log('=== 验证第二天打卡修复 ===\n');

console.log('修复内容：');
console.log('1. getAllData() 不再自动更新 lastCheckDate');
console.log('2. checkAndUpdateDateStatus() 不再自动更新 lastCheckDate');
console.log('3. lastCheckDate 只在实际打卡成功时更新\n');

console.log('=== 测试步骤 ===\n');

console.log('步骤1：设置测试数据（模拟昨天已打卡）');
console.log(`
chrome.storage.local.get('mewtrack_data', (result) => {
  const data = result.mewtrack_data || {
    sites: {},
    globalStats: {
      totalStreak: 1,
      maxStreak: 1,
      lastCheckDate: null,
      totalDays: 1,
      checkedSitesToday: []
    },
    settings: {
      notifications: true,
      autoDetect: true,
      aiContentDetection: true
    },
    customSites: {}
  };
  
  // 设置昨天的数据
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();
  
  // 设置GitHub昨天已打卡
  data.sites['github.com'] = {
    name: 'GitHub',
    streak: 1,
    totalDays: 1,
    lastVisitDate: yesterdayStr,
    targetDays: 30,
    isActive: true,
    catStage: 1,
    visits: [{date: yesterdayStr, isLearningContent: true}]
  };
  
  // 设置全局统计
  data.globalStats.totalStreak = 1;
  data.globalStats.lastCheckDate = yesterdayStr;
  data.globalStats.checkedSitesToday = [];
  
  chrome.storage.local.set({ mewtrack_data: data }, () => {
    console.log('✅ 测试数据已设置');
    console.log('- GitHub 昨天已打卡');
    console.log('- totalStreak = 1');
    console.log('- lastCheckDate =', yesterdayStr);
    console.log('\\n现在刷新GitHub页面，应该能看到打卡弹窗');
  });
});
`);

console.log('\n步骤2：验证数据状态');
console.log(`
chrome.storage.local.get('mewtrack_data', (result) => {
  const data = result.mewtrack_data;
  const today = new Date().toDateString();
  
  console.log('===== 数据验证 =====');
  console.log('今天:', today);
  console.log('lastCheckDate:', data.globalStats.lastCheckDate);
  console.log('是否是新的一天:', data.globalStats.lastCheckDate !== today);
  console.log('checkedSitesToday:', data.globalStats.checkedSitesToday);
  console.log('totalStreak:', data.globalStats.totalStreak);
  
  if (data.sites['github.com']) {
    console.log('\\nGitHub数据:');
    console.log('  最后访问:', data.sites['github.com'].lastVisitDate);
    console.log('  连续天数:', data.sites['github.com'].streak);
    console.log('  今天是否已打卡:', data.sites['github.com'].lastVisitDate === today);
  }
  
  console.log('\\n预期行为:');
  console.log('1. 显示打卡弹窗（因为今天还没打卡）');
  console.log('2. 点击确认后，totalStreak 应该变成 2');
  console.log('3. GitHub.streak 应该变成 2');
  console.log('4. lastCheckDate 应该更新为今天');
});
`);

console.log('\n步骤3：模拟打卡后验证');
console.log(`
// 打卡成功后运行这个验证
chrome.storage.local.get('mewtrack_data', (result) => {
  const data = result.mewtrack_data;
  const today = new Date().toDateString();
  
  console.log('===== 打卡后验证 =====');
  const success = data.globalStats.lastCheckDate === today &&
                 data.globalStats.totalStreak === 2 &&
                 data.sites['github.com'].streak === 2;
  
  if (success) {
    console.log('✅ 测试通过！第二天打卡成功');
    console.log('- lastCheckDate 已更新为今天');
    console.log('- totalStreak = 2（正确）');
    console.log('- GitHub.streak = 2（正确）');
  } else {
    console.log('❌ 测试失败');
    console.log('实际数据:');
    console.log('- lastCheckDate:', data.globalStats.lastCheckDate);
    console.log('- totalStreak:', data.globalStats.totalStreak);
    console.log('- GitHub.streak:', data.sites['github.com']?.streak);
  }
});
`);

console.log('\n=== 问题排查指南 ===');
console.log('如果打卡仍然失败：');
console.log('1. 检查控制台是否有错误');
console.log('2. 确认扩展已重新加载');
console.log('3. 检查 updateSiteVisit 是否被正确调用');
console.log('4. 查看 logger 输出的详细日志');