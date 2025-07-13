// 测试MewTrack检测逻辑
// 此文件模拟各种场景来测试AI检测是否按预期工作

class DetectionLogicTester {
  constructor() {
    this.testResults = [];
  }

  // 模拟环境
  setupMockEnvironment() {
    // 模拟 window.location
    global.window = {
      location: {
        hostname: '',
        href: '',
        pathname: ''
      }
    };

    // 模拟 document
    global.document = {
      title: '',
      querySelector: (selector) => {
        if (selector === 'meta[name="description"]') {
          return { getAttribute: () => this.mockDescription };
        }
        if (selector === 'h1') {
          return { textContent: this.mockH1 };
        }
        return null;
      },
      querySelectorAll: () => []
    };

    // 模拟 chrome API
    global.chrome = {
      runtime: { id: 'test-extension-id' },
      storage: {
        local: {
          get: async (keys) => {
            return {
              openaiApiKey: 'mock-api-key',
              aiContentDetection: true
            };
          },
          set: async () => {}
        }
      }
    };
  }

  // 测试场景1: YouTube娱乐视频
  async testYouTubeEntertainment() {
    console.log('\n=== 测试1: YouTube娱乐视频 ===');
    
    window.location.hostname = 'www.youtube.com';
    window.location.href = 'https://www.youtube.com/watch?v=abc123';
    window.location.pathname = '/watch';
    
    document.title = 'Funny Cat Videos Compilation 2024';
    this.mockDescription = 'The funniest cat videos on the internet!';
    this.mockH1 = 'Funny Cat Videos Compilation 2024';

    const result = await this.simulateDetection('youtube.com');
    
    console.log('网站:', 'YouTube');
    console.log('标题:', document.title);
    console.log('预期结果: 不应该弹窗（娱乐内容）');
    console.log('检测结果:', result);
    
    this.testResults.push({
      test: 'YouTube娱乐视频',
      expected: '不弹窗',
      result: result.showPopup ? `弹窗（${result.aiResult || result.type}）` : '不弹窗',
      passed: !result.showPopup
    });
  }

  // 测试场景2: YouTube学习视频
  async testYouTubeLearning() {
    console.log('\n=== 测试2: YouTube学习视频 ===');
    
    window.location.hostname = 'www.youtube.com';
    window.location.href = 'https://www.youtube.com/watch?v=def456';
    window.location.pathname = '/watch';
    
    document.title = 'JavaScript Tutorial - Learn Async/Await in 20 Minutes';
    this.mockDescription = 'In this tutorial, we will learn about JavaScript async/await and promises';
    this.mockH1 = 'JavaScript Tutorial - Learn Async/Await';

    const result = await this.simulateDetection('youtube.com');
    
    console.log('网站:', 'YouTube');
    console.log('标题:', document.title);
    console.log('预期结果: 应该弹窗（学习内容）');
    console.log('检测结果:', result);
    
    this.testResults.push({
      test: 'YouTube学习视频',
      expected: '弹窗',
      result: result.showPopup ? '弹窗' : '不弹窗',
      passed: result.showPopup
    });
  }

  // 测试场景3: educative.io (现在是预定义学习网站)
  async testEducativeSite() {
    console.log('\n=== 测试3: Educative (预定义学习网站) ===');
    
    window.location.hostname = 'www.educative.io';
    window.location.href = 'https://www.educative.io/courses/javascript-fundamentals';
    window.location.pathname = '/courses/javascript-fundamentals';
    
    document.title = 'JavaScript Fundamentals - Interactive Course';
    this.mockDescription = 'Learn JavaScript from scratch with interactive coding challenges';
    this.mockH1 = 'JavaScript Fundamentals';

    const result = await this.simulateDetection('educative.io');
    
    console.log('网站:', 'educative.io');
    console.log('标题:', document.title);
    console.log('预期结果: 应该弹窗（预定义学习网站）');
    console.log('检测结果:', result);
    
    this.testResults.push({
      test: 'Educative学习网站',
      expected: '弹窗',
      result: result.showPopup ? '弹窗' : '不弹窗',
      passed: result.showPopup
    });
  }

  // 测试场景4: 未知非学习网站
  async testUnknownNonLearningSite() {
    console.log('\n=== 测试4: 未知非学习网站 ===');
    
    window.location.hostname = 'www.reddit.com';
    window.location.href = 'https://www.reddit.com/r/funny';
    window.location.pathname = '/r/funny';
    
    document.title = 'Funny Memes and Jokes - Reddit';
    this.mockDescription = 'The funniest memes and jokes on Reddit';
    this.mockH1 = 'r/funny';

    const result = await this.simulateDetection('reddit.com');
    
    console.log('网站:', 'reddit.com');
    console.log('标题:', document.title);
    console.log('预期结果: 不应该弹窗（AI检测为非学习内容）');
    console.log('检测结果:', result);
    
    this.testResults.push({
      test: '未知非学习网站',
      expected: '不弹窗',
      result: result.showPopup ? '弹窗' : '不弹窗',
      passed: !result.showPopup
    });
  }

  // 测试场景5: 预定义学习网站 (LeetCode)
  async testPredefinedLearningSite() {
    console.log('\n=== 测试5: 预定义学习网站 (LeetCode) ===');
    
    window.location.hostname = 'leetcode.com';
    window.location.href = 'https://leetcode.com/problems/two-sum/';
    window.location.pathname = '/problems/two-sum/';
    
    document.title = 'Two Sum - LeetCode';
    this.mockDescription = 'Can you solve this real interview question?';
    this.mockH1 = 'Two Sum';

    const result = await this.simulateDetection('leetcode.com');
    
    console.log('网站:', 'LeetCode');
    console.log('标题:', document.title);
    console.log('预期结果: 应该弹窗（预定义学习网站）');
    console.log('检测结果:', result);
    
    this.testResults.push({
      test: '预定义学习网站',
      expected: '弹窗',
      result: result.showPopup ? '弹窗' : '不弹窗',
      passed: result.showPopup
    });
  }

  // 模拟检测逻辑
  async simulateDetection(domain) {
    // 预定义的学习网站
    const learningSites = ['leetcode.com', 'coursera.org', 'github.com', 'educative.io', 'pluralsight.com', 'skillshare.com'];
    
    // 需要内容检测的网站
    const contentDetectionSites = ['youtube.com', 'bilibili.com'];
    
    // 检查是否是预定义学习网站
    if (learningSites.includes(domain)) {
      return {
        domain: domain,
        type: 'predefined',
        isLearning: true,
        showPopup: true,
        reason: '预定义学习网站'
      };
    }
    
    // 检查是否需要内容检测
    if (contentDetectionSites.includes(domain)) {
      // 模拟AI检测逻辑
      const isLearning = await this.mockAIDetection(document.title, this.mockDescription);
      return {
        domain: domain,
        type: 'content-detection',
        isLearning: isLearning,
        showPopup: isLearning, // 只有学习内容才弹窗
        aiResult: isLearning ? '学习内容' : '娱乐内容',
        reason: 'AI内容检测'
      };
    }
    
    // 未知网站 - 使用AI检测
    const isLearning = await this.mockAIDetection(document.title, this.mockDescription);
    return {
      domain: domain,
      type: 'unknown',
      isLearning: isLearning,
      showPopup: isLearning,
      reason: isLearning ? 'AI检测为学习网站' : 'AI检测为非学习网站'
    };
  }

  // 模拟AI检测
  async mockAIDetection(title, description) {
    const content = `${title} ${description}`.toLowerCase();
    
    // 学习相关关键词
    const learningKeywords = [
      'tutorial', 'learn', 'course', 'education', 'programming',
      'javascript', 'coding', 'development', 'algorithm', 'fundamentals',
      '教程', '学习', '课程', '编程', '算法'
    ];
    
    // 娱乐相关关键词
    const entertainmentKeywords = [
      'funny', 'meme', 'joke', 'entertainment', 'music',
      'game', 'vlog', 'comedy', 'cat video', 'compilation',
      '搞笑', '娱乐', '游戏', '音乐', '段子'
    ];
    
    // 计算匹配分数
    let learningScore = 0;
    let entertainmentScore = 0;
    
    learningKeywords.forEach(keyword => {
      if (content.includes(keyword)) learningScore++;
    });
    
    entertainmentKeywords.forEach(keyword => {
      if (content.includes(keyword)) entertainmentScore++;
    });
    
    console.log(`  AI分析: 学习分数=${learningScore}, 娱乐分数=${entertainmentScore}`);
    
    return learningScore > entertainmentScore;
  }

  // 运行所有测试
  async runAllTests() {
    console.log('开始测试MewTrack检测逻辑...\n');
    
    this.setupMockEnvironment();
    
    await this.testYouTubeEntertainment();
    await this.testYouTubeLearning();
    await this.testEducativeSite();
    await this.testUnknownNonLearningSite();
    await this.testPredefinedLearningSite();
    
    this.printTestSummary();
  }

  // 打印测试总结
  printTestSummary() {
    console.log('\n\n========== 测试总结 ==========');
    console.log(`总测试数: ${this.testResults.length}`);
    
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;
    
    console.log(`通过: ${passed}`);
    console.log(`失败: ${failed}`);
    console.log('\n详细结果:');
    
    this.testResults.forEach((result, index) => {
      const status = result.passed ? '✅ 通过' : '❌ 失败';
      console.log(`${index + 1}. ${result.test}: ${status}`);
      console.log(`   预期: ${result.expected}, 实际: ${result.result}`);
    });
    
    if (failed === 0) {
      console.log('\n🎉 所有测试通过！检测逻辑工作正常。');
    } else {
      console.log('\n⚠️  有测试失败，请检查检测逻辑。');
    }
  }
}

// 运行测试
const tester = new DetectionLogicTester();
tester.runAllTests();