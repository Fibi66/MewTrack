// 调试educative.io检测问题

// 模拟Chrome扩展环境
global.chrome = {
  runtime: { id: 'test-extension-id' },
  storage: {
    local: {
      get: async (keys) => {
        console.log('尝试获取存储数据:', keys);
        return {
          openaiApiKey: null, // 模拟没有API密钥
          aiContentDetection: true
        };
      }
    }
  }
};

// 模拟window对象
global.window = {
  location: {
    hostname: 'www.educative.io',
    href: 'https://www.educative.io/catalog/python',
    pathname: '/catalog/python'
  }
};

// 模拟document对象
global.document = {
  title: 'Python Courses and Tutorials | Educative',
  querySelector: (selector) => {
    if (selector === 'meta[name="description"]') {
      return { 
        getAttribute: () => 'Learn Python programming with interactive courses and hands-on tutorials'
      };
    }
    if (selector === 'h1') {
      return { textContent: 'Python Programming Courses' };
    }
    return null;
  }
};

console.log('=== 调试educative.io检测 ===\n');

// 测试1: 检查域名
console.log('1. 域名检测:');
console.log('   当前域名:', window.location.hostname);
console.log('   完整URL:', window.location.href);

// 测试2: 检查是否在预定义列表中
const learningSites = ['leetcode.com', 'coursera.org', 'github.com'];
const isInPredefined = learningSites.some(site => 
  window.location.hostname.includes(site)
);
console.log('\n2. 预定义网站检查:');
console.log('   是否在预定义列表中:', isInPredefined ? '是' : '否');

// 测试3: 模拟AI检测
console.log('\n3. AI检测模拟:');
console.log('   页面标题:', document.title);
console.log('   页面描述:', document.querySelector('meta[name="description"]')?.getAttribute('content'));
console.log('   H1标签:', document.querySelector('h1')?.textContent);

// 测试4: 检查API密钥
async function checkAPIKey() {
  const storage = await chrome.storage.local.get(['openaiApiKey', 'deepseekApiKey']);
  console.log('\n4. API密钥检查:');
  console.log('   OpenAI密钥:', storage.openaiApiKey ? '已配置' : '未配置');
  console.log('   DeepSeek密钥:', storage.deepseekApiKey ? '已配置' : '未配置');
  
  if (!storage.openaiApiKey && !storage.deepseekApiKey) {
    console.log('   ⚠️  警告: 没有配置API密钥，未知网站将无法进行AI检测！');
  }
}

// 测试5: 模拟检测流程
async function simulateDetection() {
  console.log('\n5. 模拟检测流程:');
  
  // 检查是否为未知网站
  if (!isInPredefined) {
    console.log('   ✓ 识别为未知网站，需要AI检测');
    
    // 检查API密钥
    const storage = await chrome.storage.local.get(['openaiApiKey']);
    if (!storage.openaiApiKey) {
      console.log('   ✗ 没有API密钥，无法进行AI检测');
      console.log('   结果: 不会弹窗');
      return false;
    }
    
    // 模拟AI检测
    const content = `${document.title} ${document.querySelector('meta[name="description"]')?.getAttribute('content')}`.toLowerCase();
    const hasLearningKeywords = ['python', 'course', 'tutorial', 'learn', 'programming'].some(
      keyword => content.includes(keyword)
    );
    
    console.log('   AI分析内容包含学习关键词:', hasLearningKeywords ? '是' : '否');
    console.log('   结果:', hasLearningKeywords ? '应该弹窗' : '不弹窗');
    return hasLearningKeywords;
  }
}

// 运行测试
checkAPIKey().then(() => {
  simulateDetection();
  
  console.log('\n=== 可能的原因 ===');
  console.log('1. 如果没有配置OpenAI或DeepSeek API密钥，未知网站无法进行AI检测');
  console.log('2. 需要确保在设置页面中保存了有效的API密钥');
  console.log('3. 建议在设置页面测试API连接是否正常');
});