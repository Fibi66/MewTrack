// 测试第二天打卡失败的问题

console.log('=== 测试第二天打卡失败问题 ===\n');

console.log('问题描述：');
console.log('1. 第二天打卡时显示成功消息');
console.log('2. 但实际上没有记录打卡');
console.log('3. 刷新页面后继续提示check in\n');

console.log('=== 问题根源分析 ===');
console.log('在 checkAndUpdateDateStatus 方法中：');
console.log('- 如果是新的一天，会立即保存 lastCheckDate = today');
console.log('- 这导致后续的打卡逻辑认为"今天已经检查过了"');
console.log('- 虽然 checkedSitesToday 被清空了，但逻辑判断可能有问题\n');

console.log('=== 在Chrome控制台运行以下代码进行测试 ===\n');

// 测试1：检查当前数据状态
console.log('// 测试1：检查当前数据状态');
console.log(`
chrome.storage.local.get('mewtrack_data', (result) => {
  const data = result.mewtrack_data;
  if (data && data.globalStats) {
    const today = new Date().toDateString();
    console.log('===== 当前数据状态 =====');
    console.log('今天日期:', today);
    console.log('lastCheckDate:', data.globalStats.lastCheckDate);
    console.log('是否是今天:', data.globalStats.lastCheckDate === today);
    console.log('checkedSitesToday:', data.globalStats.checkedSitesToday);
    console.log('totalStreak:', data.globalStats.totalStreak);
    
    // 检查各网站状态
    console.log('\\n===== 网站状态 =====');
    ['github.com', 'leetcode.com', 'educative.io'].forEach(domain => {
      const site = data.sites[domain];
      if (site) {
        console.log(\`\${domain}:\`);
        console.log('  最后访问:', site.lastVisitDate);
        console.log('  是否是今天:', site.lastVisitDate === today);
        console.log('  连续天数:', site.streak);
      }
    });
  }
});
`);

// 测试2：模拟打卡流程
console.log('\n// 测试2：模拟checkAndUpdateDateStatus的行为');
console.log(`
chrome.storage.local.get('mewtrack_data', (result) => {
  const data = result.mewtrack_data;
  if (data && data.globalStats) {
    const today = new Date().toDateString();
    
    console.log('===== 模拟 checkAndUpdateDateStatus =====');
    console.log('当前 lastCheckDate:', data.globalStats.lastCheckDate);
    console.log('今天:', today);
    
    if (data.globalStats.lastCheckDate !== today) {
      console.log('\\n检测到新的一天！');
      console.log('操作：');
      console.log('1. 设置 lastCheckDate = today');
      console.log('2. 清空 checkedSitesToday');
      console.log('3. 保存数据');
      console.log('\\n这会导致什么问题？');
      console.log('- 后续的 updateSiteVisit 会认为"今天已经处理过了"');
      console.log('- 可能导致打卡逻辑失败');
    }
  }
});
`);

// 测试3：手动修复数据
console.log('\n// 测试3：临时修复 - 重置lastCheckDate为昨天');
console.log(`
chrome.storage.local.get('mewtrack_data', (result) => {
  const data = result.mewtrack_data;
  if (data && data.globalStats) {
    // 设置为昨天，强制触发新一天的逻辑
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    data.globalStats.lastCheckDate = yesterday.toDateString();
    data.globalStats.checkedSitesToday = [];
    
    chrome.storage.local.set({ mewtrack_data: data }, () => {
      console.log('✅ 已重置 lastCheckDate 为昨天');
      console.log('现在刷新页面应该可以正常打卡');
    });
  }
});
`);

console.log('\n=== 修复方案 ===');
console.log('1. checkAndUpdateDateStatus 不应该立即保存 lastCheckDate');
console.log('2. 只有在实际打卡成功后才更新 lastCheckDate');
console.log('3. 或者将日期检查和清理逻辑分离');