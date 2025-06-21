// 简单popup的JavaScript逻辑
console.log('MewTrack popup 已加载');

// 简单的测试脚本
document.addEventListener('DOMContentLoaded', function() {
  const statusEl = document.getElementById('status');
  const testBtn = document.getElementById('testBtn');
  
  // 测试Chrome API是否可用
  if (typeof chrome !== 'undefined' && chrome.storage) {
    statusEl.textContent = '✅ Chrome API 可用';
    
    // 测试存储
    chrome.storage.local.get(null, function(data) {
      console.log('当前存储数据:', data);
      document.getElementById('totalSites').textContent = Object.keys(data).length;
    });
  } else {
    statusEl.textContent = '❌ Chrome API 不可用';
  }
  
  testBtn.addEventListener('click', function() {
    alert('MewTrack 测试按钮点击成功！');
    console.log('测试按钮被点击');
  });
  
  console.log('MewTrack popup 初始化完成');
}); 