// 测试LinkedIn Learning的特殊路径匹配

// 模拟siteDetector的域名匹配逻辑
function isDomainMatch(currentDomain, targetDomain) {
  const current = currentDomain.toLowerCase();
  const target = targetDomain.toLowerCase();
  
  // 完全匹配
  if (current === target) return true;
  
  // 检查是否为子域名
  if (current.endsWith('.' + target)) return true;
  
  // 检查是否为主域名
  if (target.endsWith('.' + current)) return true;
  
  return false;
}

// 测试场景
const testCases = [
  {
    url: 'https://www.linkedin.com/learning/javascript-essential-training',
    hostname: 'www.linkedin.com',
    path: '/learning/javascript-essential-training',
    configDomain: 'linkedin.com/learning',
    expected: false, // 当前的isDomainMatch不支持路径匹配
    description: 'LinkedIn Learning URL'
  }
];

console.log('=== 测试LinkedIn Learning路径匹配 ===\n');

testCases.forEach(test => {
  console.log(`测试: ${test.description}`);
  console.log(`URL: ${test.url}`);
  console.log(`配置域名: ${test.configDomain}`);
  
  const result = isDomainMatch(test.hostname, test.configDomain);
  console.log(`匹配结果: ${result ? '✅ 匹配' : '❌ 不匹配'}`);
  console.log(`预期结果: ${test.expected ? '匹配' : '不匹配'}`);
  
  if (result !== test.expected) {
    console.log('\n⚠️  问题: LinkedIn Learning使用路径而不是子域名');
    console.log('建议: 需要特殊处理路径匹配，或者只使用 linkedin.com 作为域名');
  }
  
  console.log('---\n');
});

// 建议的解决方案
console.log('=== 建议解决方案 ===');
console.log('1. 将配置改为只使用域名 "linkedin.com"');
console.log('2. 在检测时额外检查路径是否包含 "/learning"');
console.log('3. 或者为LinkedIn创建特殊的检测逻辑');