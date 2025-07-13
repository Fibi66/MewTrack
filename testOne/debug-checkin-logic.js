// 调试打卡逻辑

console.log('=== 调试打卡逻辑 ===\n');

console.log('在Chrome扩展的控制台中运行以下代码来查看详细的打卡数据：\n');

console.log(`
// 查看所有网站的详细打卡信息
chrome.storage.local.get('mewtrack_data', (result) => {
  const data = result.mewtrack_data;
  if (data) {
    console.log('===== 全局统计 =====');
    console.log('总连续天数 (totalStreak):', data.globalStats.totalStreak);
    console.log('最大连续天数 (maxStreak):', data.globalStats.maxStreak);
    console.log('总学习天数 (totalDays):', data.globalStats.totalDays);
    console.log('最后检查日期:', data.globalStats.lastCheckDate);
    console.log('今天已打卡网站:', data.globalStats.checkedSitesToday);
    console.log('当前日期:', new Date().toDateString());
    
    console.log('\\n===== 各网站详情 =====');
    Object.entries(data.sites).forEach(([domain, site]) => {
      if (site.totalDays > 0) {
        console.log(\`\\n【\${domain}】\`);
        console.log('  网站连续天数:', site.streak);
        console.log('  网站总天数:', site.totalDays);
        console.log('  最后访问日期:', site.lastVisitDate);
        console.log('  目标天数:', site.targetDays || '未设置');
        console.log('  是否活跃:', site.isActive);
        console.log('  访问记录数:', site.visits ? site.visits.length : 0);
        
        // 检查是否为今天
        const isToday = site.lastVisitDate === new Date().toDateString();
        console.log('  今天是否已打卡:', isToday ? '✅ 是' : '❌ 否');
        
        // 检查是否连续
        if (site.lastVisitDate) {
          const lastDate = new Date(site.lastVisitDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          lastDate.setHours(0, 0, 0, 0);
          const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
          console.log('  距离上次打卡:', diffDays, '天');
        }
      }
    });
    
    console.log('\\n===== 诊断信息 =====');
    // 检查数据一致性
    const sitesCheckedToday = Object.entries(data.sites)
      .filter(([domain, site]) => site.lastVisitDate === new Date().toDateString())
      .map(([domain]) => domain);
    
    console.log('实际今天打卡的网站:', sitesCheckedToday);
    console.log('记录的今天打卡网站:', data.globalStats.checkedSitesToday);
    
    const isConsistent = sitesCheckedToday.length === data.globalStats.checkedSitesToday.length;
    console.log('数据一致性:', isConsistent ? '✅ 一致' : '❌ 不一致');
    
    if (!isConsistent) {
      console.warn('⚠️ 数据不一致，可能需要修复');
    }
  }
});
`);

console.log('\n\n=== 模拟打卡测试 ===\n');

console.log(`
// 测试打卡逻辑（不会真正修改数据）
chrome.storage.local.get('mewtrack_data', (result) => {
  const data = result.mewtrack_data;
  if (data) {
    const testDomain = 'leetcode.com';
    
    console.log('===== 模拟打卡测试：' + testDomain + ' =====');
    
    // 检查是否已打卡
    const hasVisitedToday = data.globalStats.checkedSitesToday.includes(testDomain);
    console.log('今天是否已打卡:', hasVisitedToday);
    
    if (!hasVisitedToday) {
      console.log('\\n如果现在打卡会发生：');
      
      // 检查昨天是否有任何网站打卡
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();
      
      const hasYesterdayRecord = Object.values(data.sites).some(site => 
        site.lastVisitDate === yesterdayStr
      );
      
      console.log('昨天是否有打卡记录:', hasYesterdayRecord);
      
      if (data.globalStats.checkedSitesToday.length === 0) {
        console.log('这是今天第一个打卡的网站');
        if (hasYesterdayRecord) {
          console.log('→ totalStreak 将从', data.globalStats.totalStreak, '变为', data.globalStats.totalStreak + 1);
        } else {
          console.log('→ totalStreak 将保持为', data.globalStats.totalStreak, '（因为昨天没打卡）');
        }
      } else {
        console.log('今天已经有其他网站打卡了');
        console.log('→ totalStreak 保持不变:', data.globalStats.totalStreak);
      }
      
      // 网站个人数据
      const siteData = data.sites[testDomain] || { streak: 0, totalDays: 0 };
      console.log('\\n网站个人数据：');
      console.log('当前连续天数:', siteData.streak);
      console.log('→ 新的连续天数将是:', siteData.lastVisitDate === yesterdayStr ? siteData.streak + 1 : 1);
    }
  }
});
`);

console.log('\n\n=== 常见问题排查 ===');
console.log('1. 如果打卡后没有成功消息：');
console.log('   - 检查控制台是否有错误');
console.log('   - 确认扩展已经重新加载');
console.log('   - 查看上面的数据一致性检查');
console.log('\\n2. 如果连续天数计算错误：');
console.log('   - 查看"昨天是否有打卡记录"的结果');
console.log('   - 检查各网站的"距离上次打卡"天数');
console.log('\\n3. 如果某个网站不显示弹窗：');
console.log('   - 查看该网站是否在"今天已打卡网站"列表中');
console.log('   - 检查网站域名是否正确（注意www前缀）');