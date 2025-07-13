// 测试 Later 按钮功能

console.log('=== 测试 Later 按钮功能 ===\n');

console.log('修复内容：');
console.log('1. 点击 Later 后，今天不再提示该网站');
console.log('2. 移除了每30秒的定期检测');
console.log('3. 每个页面只检测一次，避免重复API调用\n');

console.log('=== 测试步骤 ===\n');

console.log('步骤1：查看当前跳过的网站');
console.log(`
chrome.storage.local.get('mewtrack_data', (result) => {
  const data = result.mewtrack_data;
  if (data && data.globalStats) {
    console.log('===== 当前状态 =====');
    console.log('今天已打卡的网站:', data.globalStats.checkedSitesToday);
    console.log('今天已跳过的网站:', data.globalStats.skippedSitesToday || []);
    console.log('最后检查日期:', data.globalStats.lastCheckDate);
    console.log('今天日期:', new Date().toDateString());
  }
});
`);

console.log('\n步骤2：手动标记网站为跳过（测试）');
console.log(`
// 手动标记 YouTube 为今天跳过
chrome.storage.local.get('mewtrack_data', (result) => {
  const data = result.mewtrack_data;
  if (data && data.globalStats) {
    if (!data.globalStats.skippedSitesToday) {
      data.globalStats.skippedSitesToday = [];
    }
    
    if (!data.globalStats.skippedSitesToday.includes('youtube.com')) {
      data.globalStats.skippedSitesToday.push('youtube.com');
      
      chrome.storage.local.set({ mewtrack_data: data }, () => {
        console.log('✅ 已将 youtube.com 标记为今天跳过');
        console.log('现在刷新 YouTube 页面，不应该再显示弹窗');
      });
    } else {
      console.log('youtube.com 已经在跳过列表中');
    }
  }
});
`);

console.log('\n步骤3：清除跳过记录（重新测试）');
console.log(`
chrome.storage.local.get('mewtrack_data', (result) => {
  const data = result.mewtrack_data;
  if (data && data.globalStats) {
    data.globalStats.skippedSitesToday = [];
    
    chrome.storage.local.set({ mewtrack_data: data }, () => {
      console.log('✅ 已清空今天的跳过记录');
      console.log('现在刷新页面，会重新显示弹窗');
    });
  }
});
`);

console.log('\n=== 预期行为 ===');
console.log('1. 访问学习网站 → 显示弹窗');
console.log('2. 点击 "Later" → 记录跳过状态');
console.log('3. 刷新页面 → 不再显示弹窗');
console.log('4. 第二天 → 重新显示弹窗');
console.log('\n5. 页面加载只检测一次');
console.log('6. URL变化时检测一次');
console.log('7. 不再有30秒定期检测');

console.log('\n=== 调试提示 ===');
console.log('如果仍然重复提示：');
console.log('1. 确认扩展已重新加载');
console.log('2. 检查 skippedSitesToday 是否正确记录');
console.log('3. 查看控制台是否有 "定期检测触发" 的日志（不应该有）');
console.log('4. 确认没有其他地方触发 runDetection()');