// 手动重置今天的访问记录（用于测试）

console.log('=== 手动重置今天的访问记录 ===\n');

console.log('在Chrome扩展的控制台中运行以下代码：\n');

console.log(`
// 方法1：清空今天的访问记录
chrome.storage.local.get('mewtrack_data', (result) => {
  const data = result.mewtrack_data;
  if (data && data.globalStats) {
    // 清空今天已访问的网站
    data.globalStats.checkedSitesToday = [];
    
    // 保存更新后的数据
    chrome.storage.local.set({ mewtrack_data: data }, () => {
      console.log('✅ 今天的访问记录已清空');
      console.log('现在访问任何学习网站都会弹窗');
    });
  }
});
`);

console.log('\n或者：\n');

console.log(`
// 方法2：模拟新的一天（修改日期为昨天）
chrome.storage.local.get('mewtrack_data', (result) => {
  const data = result.mewtrack_data;
  if (data && data.globalStats) {
    // 将最后检查日期设为昨天
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    data.globalStats.lastCheckDate = yesterday.toDateString();
    
    // 保存更新后的数据
    chrome.storage.local.set({ mewtrack_data: data }, () => {
      console.log('✅ 已将日期设置为昨天');
      console.log('现在访问网站会触发新一天的逻辑');
    });
  }
});
`);

console.log('\n使用方法：');
console.log('1. 打开Chrome扩展管理页面 (chrome://extensions/)');
console.log('2. 找到MewTrack扩展');
console.log('3. 点击"背景页"或"Service Worker"');
console.log('4. 在打开的控制台中粘贴上面的代码并运行');
console.log('5. 刷新你要测试的网页');

console.log('\n注意：');
console.log('- 这只是为了测试，正常使用时不需要手动操作');
console.log('- 实际使用中，每天午夜会自动清理');