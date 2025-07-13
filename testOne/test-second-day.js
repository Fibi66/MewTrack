// 测试第二天打卡逻辑

console.log('=== 测试第二天打卡逻辑 ===\n');

// 模拟存储数据
const mockStorageData = {
  sites: {
    'youtube.com': {
      name: 'YouTube',
      targetDays: 30,
      streak: 1,
      totalDays: 1,
      lastVisitDate: 'Sat Jun 21 2025', // 昨天
      isActive: true,
      catStage: 1,
      visits: [
        { date: 'Sat Jun 21 2025', isLearningContent: true }
      ]
    }
  },
  globalStats: {
    totalStreak: 1,
    maxStreak: 1,
    lastCheckDate: 'Sat Jun 21 2025', // 昨天
    totalDays: 1,
    checkedSitesToday: ['youtube.com'] // 昨天的记录
  },
  settings: {
    notifications: true,
    autoDetect: true,
    aiContentDetection: true
  },
  customSites: {}
};

// 测试场景
console.log('测试场景: 用户第二天访问YouTube学习视频\n');

console.log('1. 存储数据状态（修复前）:');
console.log('   lastCheckDate:', mockStorageData.globalStats.lastCheckDate);
console.log('   checkedSitesToday:', mockStorageData.globalStats.checkedSitesToday);
console.log('   今天日期:', new Date().toDateString());
console.log('   问题: checkedSitesToday包含昨天的数据');

// 模拟修复后的逻辑
console.log('\n2. 修复逻辑:');
const today = new Date().toDateString();
if (mockStorageData.globalStats.lastCheckDate !== today) {
  console.log('   ✓ 检测到新的一天');
  console.log('   ✓ 清空checkedSitesToday数组');
  mockStorageData.globalStats.checkedSitesToday = [];
  mockStorageData.globalStats.lastCheckDate = today;
}

console.log('\n3. 修复后的状态:');
console.log('   lastCheckDate:', mockStorageData.globalStats.lastCheckDate);
console.log('   checkedSitesToday:', mockStorageData.globalStats.checkedSitesToday);

// 模拟hasVisitedToday检查
const hasVisitedToday = mockStorageData.globalStats.checkedSitesToday.includes('youtube.com');
console.log('\n4. hasVisitedToday检查:');
console.log('   结果:', hasVisitedToday ? '已访问（错误）' : '未访问（正确）');

// 模拟打卡后的效果
if (!hasVisitedToday) {
  console.log('\n5. 执行打卡:');
  console.log('   ✓ 显示打卡弹窗');
  console.log('   ✓ 显示连续天数: 2天');
  console.log('   ✓ 显示鼓励信息');
  
  // 更新数据
  mockStorageData.globalStats.totalStreak = 2;
  mockStorageData.globalStats.checkedSitesToday.push('youtube.com');
  mockStorageData.sites['youtube.com'].streak = 2;
  mockStorageData.sites['youtube.com'].lastVisitDate = today;
}

console.log('\n6. 预期的用户体验:');
console.log('   - 第一天: 访问YouTube学习视频，设置30天目标，打卡成功');
console.log('   - 第二天: 访问YouTube学习视频，显示"连续2天"，鼓励继续');
console.log('   - 弹窗应该显示猫猫成长和激励语言');

console.log('\n=== 修复总结 ===');
console.log('问题原因: checkedSitesToday数组未在新的一天清空');
console.log('解决方案: 在getAllData时检查日期并清理过期数据');
console.log('影响: 确保第二天能正常显示打卡弹窗');