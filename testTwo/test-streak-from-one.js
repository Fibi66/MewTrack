// 测试 totalStreak 从 1 开始

console.log('=== 测试 totalStreak 从 1 开始 ===\n');

console.log('修复内容：');
console.log('- 第一次打卡时，totalStreak 应该是 1，不是 0');
console.log('- 第二天连续打卡，totalStreak 应该是 2');
console.log('- 中断后保持原值不变\n');

console.log('=== 测试场景 ===\n');

console.log('场景1：全新用户第一次打卡');
console.log(`
// 清空所有数据，模拟全新用户
chrome.storage.local.clear(() => {
  console.log('✅ 数据已清空');
  console.log('现在访问任何学习网站，第一次打卡后 totalStreak 应该显示 1');
});
`);

console.log('\n场景2：验证第一次打卡后的数据');
console.log(`
chrome.storage.local.get('mewtrack_data', (result) => {
  const data = result.mewtrack_data;
  if (data && data.globalStats) {
    console.log('===== 第一次打卡后 =====');
    console.log('totalStreak:', data.globalStats.totalStreak);
    console.log('totalDays:', data.globalStats.totalDays);
    console.log('maxStreak:', data.globalStats.maxStreak);
    
    if (data.globalStats.totalStreak === 1) {
      console.log('✅ 正确！totalStreak 从 1 开始');
    } else {
      console.log('❌ 错误！totalStreak 应该是 1，实际是', data.globalStats.totalStreak);
    }
  }
});
`);

console.log('\n场景3：设置测试数据验证连续打卡');
console.log(`
// 设置第一天的数据
chrome.storage.local.get('mewtrack_data', (result) => {
  const data = result.mewtrack_data || {
    sites: {},
    globalStats: {
      totalStreak: 0,
      maxStreak: 0,
      lastCheckDate: null,
      totalDays: 0,
      checkedSitesToday: []
    },
    settings: {},
    customSites: {}
  };
  
  // 清空现有数据
  data.sites = {};
  data.globalStats = {
    totalStreak: 0,
    maxStreak: 0,
    lastCheckDate: null,
    totalDays: 0,
    checkedSitesToday: []
  };
  
  chrome.storage.local.set({ mewtrack_data: data }, () => {
    console.log('✅ 已重置为初始状态');
    console.log('- totalStreak = 0');
    console.log('- 现在打卡后应该变为 1');
  });
});
`);

console.log('\n=== 预期行为总结 ===');
console.log('Day 1: 第一次打卡 → totalStreak = 1 ✅');
console.log('Day 2: 连续打卡 → totalStreak = 2 ✅');
console.log('Day 3: 没打卡 → totalStreak = 2（保持）');
console.log('Day 4: 打卡 → totalStreak = 2（保持，因为不连续）');
console.log('Day 5: 连续打卡 → totalStreak = 3 ✅');