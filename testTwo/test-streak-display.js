// 测试打卡提示中的 totalStreak 显示

console.log('=== 测试打卡提示中的 totalStreak 显示 ===\n');

console.log('问题描述：');
console.log('- 第一个网站打卡时显示 "4 days → 5 days"');
console.log('- 第二个网站打卡时仍显示 "4 days → 5 days"（错误）');
console.log('- 应该显示 "4 days → 4 days"（正确）\n');

console.log('修复内容：');
console.log('1. 添加 willIncreaseTotalStreak 参数');
console.log('2. 只有今天第一个打卡的网站会显示增加');
console.log('3. 其他网站显示当前值不变\n');

console.log('=== 测试场景 ===\n');

console.log('场景1：设置测试数据（totalStreak = 4）');
console.log(`
chrome.storage.local.get('mewtrack_data', (result) => {
  const data = result.mewtrack_data;
  if (data) {
    // 设置昨天的数据
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    // 设置全局数据
    data.globalStats.totalStreak = 4;
    data.globalStats.lastCheckDate = yesterdayStr;
    data.globalStats.checkedSitesToday = [];
    
    // 设置一个网站昨天已打卡（确保连续）
    data.sites['github.com'] = {
      name: 'GitHub',
      streak: 4,
      totalDays: 4,
      lastVisitDate: yesterdayStr,
      targetDays: 30,
      isActive: true,
      visits: [{date: yesterdayStr, isLearningContent: true}]
    };
    
    chrome.storage.local.set({ mewtrack_data: data }, () => {
      console.log('✅ 测试数据已设置');
      console.log('- totalStreak = 4');
      console.log('- 昨天有打卡记录');
      console.log('\\n预期行为：');
      console.log('1. 访问 YouTube（第一个）：显示 "4 days → 5 days"');
      console.log('2. 访问 LeetCode（第二个）：显示 "4 days → 4 days"');
    });
  }
});
`);

console.log('\n场景2：验证显示逻辑');
console.log(`
// 在控制台查看日志
console.log('观察控制台日志中的 "打卡弹窗计算"：');
console.log('- currentTotalStreak: 当前值');
console.log('- willIncreaseTotalStreak: 是否会增加');
console.log('- checkedSitesToday: 今天已打卡的网站');
`);

console.log('\n场景3：验证不同情况');
console.log(`
// 测试不同场景的显示
// 1. 全新用户（totalStreak = 0）
//    → 第一个网站：显示 "0 days → 1 day"

// 2. 中断后打卡（昨天没打卡）
//    → 第一个网站：显示 "4 days → 4 days"（保持不变）

// 3. 连续打卡
//    → 第一个网站：显示 "4 days → 5 days"
//    → 第二个网站：显示 "4 days → 4 days"
`);

console.log('\n=== 代码逻辑解释 ===');
console.log('willIncreaseTotalStreak 的计算：');
console.log('1. 如果 checkedSitesToday.length > 0：返回 false（今天已有打卡）');
console.log('2. 否则检查昨天是否有打卡：');
console.log('   - 有：返回 true（连续打卡）');
console.log('   - 没有但 totalStreak = 0：返回 true（第一次）');
console.log('   - 没有且 totalStreak > 0：返回 false（中断）');