// 调试YouTube第二天打卡问题

console.log('=== YouTube第二天打卡调试 ===\n');

// 分析可能的原因
console.log('错误信息分析:');
console.log('- 错误位置: background.js:225');
console.log('- 标签ID: Tab 1061793871');
console.log('- URL: https://www.youtube.com/watch?v=K5KVEU3aaeQ&t=3804s');
console.log('- 时间: 5:40:16 PM');
console.log('- 错误类型: 检测错误');

console.log('\n可能的原因:');

console.log('\n1. hasVisitedToday 检查问题:');
console.log('   - 如果今天已经访问过，会跳过检测');
console.log('   - 可能日期判断有问题，导致误判为已访问');

console.log('\n2. AI检测错误:');
console.log('   - 视频内容检测时可能抛出异常');
console.log('   - API调用失败或超时');
console.log('   - 页面元素未加载完成');

console.log('\n3. 扩展上下文错误:');
console.log('   - Chrome扩展上下文失效');
console.log('   - 存储访问权限问题');

console.log('\n4. 异步处理问题:');
console.log('   - Promise rejection未正确捕获');
console.log('   - 异步操作顺序问题');

// 模拟检查流程
async function simulateDetectionFlow() {
  console.log('\n=== 模拟检测流程 ===');
  
  // 步骤1: 检查是否已访问
  console.log('\n步骤1: 检查今天是否已访问');
  const today = new Date().toDateString();
  console.log(`今天日期: ${today}`);
  console.log('存储的访问记录应该是昨天的日期');
  
  // 步骤2: 获取网站信息
  console.log('\n步骤2: 获取YouTube网站信息');
  console.log('域名: youtube.com');
  console.log('类型: video');
  console.log('需要内容检测: true');
  console.log('alwaysLearning: false');
  
  // 步骤3: AI检测
  console.log('\n步骤3: AI内容检测');
  console.log('获取视频标题...');
  console.log('发送到AI分析...');
  console.log('等待结果...');
  
  // 步骤4: 显示弹窗
  console.log('\n步骤4: 显示打卡弹窗');
  console.log('- 如果是学习内容');
  console.log('- 如果今天未访问');
  console.log('- 显示第二天打卡提示');
}

// 建议的调试步骤
console.log('\n=== 建议的调试步骤 ===');
console.log('1. 检查Chrome开发者工具中的错误详情');
console.log('2. 查看存储中的visitHistory数据');
console.log('3. 验证日期比较逻辑是否正确');
console.log('4. 添加更多调试日志在runDetection函数中');
console.log('5. 检查AI检测是否正常返回结果');

// 可能的修复方案
console.log('\n=== 可能的修复方案 ===');
console.log('1. 改进错误处理，确保catch块正确记录错误');
console.log('2. 添加重试机制for AI检测');
console.log('3. 验证hasVisitedToday日期比较逻辑');
console.log('4. 确保第二天访问时正确显示连续天数');

simulateDetectionFlow();

// 检查日期逻辑
console.log('\n=== 日期逻辑测试 ===');
const now = new Date();
const yesterday = new Date(now);
yesterday.setDate(yesterday.getDate() - 1);

console.log('当前时间:', now.toString());
console.log('昨天时间:', yesterday.toString());
console.log('今天日期字符串:', now.toDateString());
console.log('昨天日期字符串:', yesterday.toDateString());
console.log('日期是否相同:', now.toDateString() === yesterday.toDateString());