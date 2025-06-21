// 网站识别和内容检测模块
class SiteDetector {
  constructor() {
    // 学习型网站配置
    this.learningSites = {
      'leetcode.com': {
        name: 'LeetCode',
        type: 'coding',
        alwaysLearning: true,
        keywords: ['算法', '编程', '数据结构', 'leetcode']
      },
      'coursera.org': {
        name: 'Coursera',
        type: 'education',
        alwaysLearning: true,
        keywords: ['课程', '学习', '教育', 'coursera']
      },
      'github.com': {
        name: 'GitHub',
        type: 'coding',
        alwaysLearning: true,
        keywords: ['代码', '项目', '编程', 'github']
      },
      'stackoverflow.com': {
        name: 'Stack Overflow',
        type: 'coding',
        alwaysLearning: true,
        keywords: ['编程', '问题', '解答', 'stackoverflow']
      },
      'udemy.com': {
        name: 'Udemy',
        type: 'education',
        alwaysLearning: true,
        keywords: ['课程', '学习', '技能', 'udemy']
      },
      'edx.org': {
        name: 'edX',
        type: 'education',
        alwaysLearning: true,
        keywords: ['课程', '大学', '学习', 'edx']
      },
      'khanacademy.org': {
        name: 'Khan Academy',
        type: 'education',
        alwaysLearning: true,
        keywords: ['学习', '教育', '课程', 'khan']
      },
      'freecodecamp.org': {
        name: 'freeCodeCamp',
        type: 'coding',
        alwaysLearning: true,
        keywords: ['编程', '学习', '代码', 'freecodecamp']
      },
      'codecademy.com': {
        name: 'Codecademy',
        type: 'coding',
        alwaysLearning: true,
        keywords: ['编程', '学习', '代码', 'codecademy']
      },
      'w3schools.com': {
        name: 'W3Schools',
        type: 'coding',
        alwaysLearning: true,
        keywords: ['编程', '教程', 'web', 'w3schools']
      },
      'developer.mozilla.org': {
        name: 'MDN Web Docs',
        type: 'coding',
        alwaysLearning: true,
        keywords: ['编程', '文档', 'web', 'mdn']
      },
      'geeksforgeeks.org': {
        name: 'GeeksforGeeks',
        type: 'coding',
        alwaysLearning: true,
        keywords: ['算法', '编程', '数据结构', 'geeksforgeeks']
      },
      'hackerrank.com': {
        name: 'HackerRank',
        type: 'coding',
        alwaysLearning: true,
        keywords: ['编程', '算法', '挑战', 'hackerrank']
      },
      'hackerearth.com': {
        name: 'HackerEarth',
        type: 'coding',
        alwaysLearning: true,
        keywords: ['编程', '算法', '挑战', 'hackerearth']
      },
      'codechef.com': {
        name: 'CodeChef',
        type: 'coding',
        alwaysLearning: true,
        keywords: ['编程', '算法', '竞赛', 'codechef']
      },
      'topcoder.com': {
        name: 'TopCoder',
        type: 'coding',
        alwaysLearning: true,
        keywords: ['编程', '算法', '竞赛', 'topcoder']
      },
      'atcoder.jp': {
        name: 'AtCoder',
        type: 'coding',
        alwaysLearning: true,
        keywords: ['编程', '算法', '竞赛', 'atcoder']
      },
      'codeforces.com': {
        name: 'Codeforces',
        type: 'coding',
        alwaysLearning: true,
        keywords: ['编程', '算法', '竞赛', 'codeforces']
      }
    };

    // 需要内容检测的网站（娱乐性网站）
    this.contentDetectionSites = {
      'youtube.com': {
        name: 'YouTube',
        type: 'video',
        alwaysLearning: false,
        learningKeywords: [
          '教程', '教学', '学习', '编程', '算法', '数据结构', '课程', '培训',
          'tutorial', 'learn', 'programming', 'algorithm', 'course', 'education',
          'coding', 'development', 'software', 'computer science', 'math',
          'physics', 'chemistry', 'biology', 'history', 'literature', 'language'
        ],
        entertainmentKeywords: [
          '游戏', '娱乐', '搞笑', '音乐', '电影', '综艺', '直播', 'vlog',
          'game', 'entertainment', 'funny', 'music', 'movie', 'show', 'live',
          'vlog', 'comedy', 'dance', 'food', 'travel', 'gaming'
        ]
      },
      'bilibili.com': {
        name: '哔哩哔哩',
        type: 'video',
        alwaysLearning: false,
        learningKeywords: [
          '教程', '教学', '学习', '编程', '算法', '数据结构', '课程', '培训',
          '技术', '科普', '知识', '教育', '学术', '研究', '实验', '理论',
          '数学', '物理', '化学', '生物', '历史', '文学', '语言', '哲学'
        ],
        entertainmentKeywords: [
          '游戏', '娱乐', '搞笑', '音乐', '电影', '综艺', '直播', 'vlog',
          '动画', '番剧', '鬼畜', '舞蹈', '美食', '旅游', '生活', '时尚'
        ]
      }
    };
  }

  // 获取当前网站的域名
  getCurrentDomain() {
    try {
      const hostname = window.location.hostname;
      if (typeof hostname === 'string' && hostname.trim()) {
        return hostname.toLowerCase().trim();
      } else {
        if (typeof logger !== 'undefined') {
          logger.error('获取域名失败，hostname为空或非字符串:', hostname);
        }
        return '';
      }
    } catch (error) {
      if (typeof logger !== 'undefined') {
        logger.error('获取当前域名时发生错误:', error);
      }
      return '';
    }
  }

  // 检查域名是否匹配（支持子域名）
  isDomainMatch(currentDomain, targetDomain) {
    // 类型检查：确保两个参数都是字符串
    if (typeof currentDomain !== 'string' || typeof targetDomain !== 'string') {
      if (typeof logger !== 'undefined') {
        logger.error('isDomainMatch参数类型错误:', {
          currentDomain: typeof currentDomain,
          currentDomainValue: currentDomain,
          targetDomain: typeof targetDomain,
          targetDomainValue: targetDomain
        });
      }
      return false;
    }

    // 转换为小写进行比较
    const current = currentDomain.toLowerCase();
    const target = targetDomain.toLowerCase();
    
    // 完全匹配
    if (current === target) return true;
    
    // 检查是否为子域名（如 www.youtube.com 匹配 youtube.com）
    if (current.endsWith('.' + target)) return true;
    
    // 检查是否为主域名（如 youtube.com 匹配 www.youtube.com）
    if (target.endsWith('.' + current)) return true;
    
    return false;
  }

  // 检查是否为学习型网站
  async isLearningSite(domain = null) {
    const currentDomain = domain || this.getCurrentDomain();
    
    // 确保当前域名有效
    if (!currentDomain || typeof currentDomain !== 'string') {
      if (typeof logger !== 'undefined') {
        logger.error('当前域名无效:', currentDomain);
      }
      return false;
    }
    
    // 检查预定义的学习网站
    for (const configDomain of Object.keys(this.learningSites)) {
      if (typeof configDomain === 'string' && this.isDomainMatch(currentDomain, configDomain)) {
        return true;
      }
    }
    
    // 检查内容检测网站
    for (const configDomain of Object.keys(this.contentDetectionSites)) {
      if (typeof configDomain === 'string' && this.isDomainMatch(currentDomain, configDomain)) {
        return true;
      }
    }
    
    // 检查用户自定义网站
    if (typeof mewTrackStorage !== 'undefined') {
      try {
        const customSites = await mewTrackStorage.getCustomSites();
        if (customSites && typeof customSites === 'object') {
          for (const customDomain of Object.keys(customSites)) {
            if (typeof customDomain === 'string' && 
                customSites[customDomain] && 
                customSites[customDomain].enabled && 
                this.isDomainMatch(currentDomain, customDomain)) {
              return true;
            }
          }
        }
      } catch (error) {
        if (typeof logger !== 'undefined') {
          logger.error('检查自定义网站时发生错误:', error);
        }
      }
    }
    
    return false;
  }

  // 获取网站信息
  async getSiteInfo(domain = null) {
    const currentDomain = domain || this.getCurrentDomain();
    
    // 确保当前域名有效
    if (!currentDomain || typeof currentDomain !== 'string') {
      if (typeof logger !== 'undefined') {
        logger.error('getSiteInfo: 当前域名无效:', currentDomain);
      }
      return null;
    }
    
    // 先检查预定义网站
    for (const [siteDomain, siteInfo] of Object.entries(this.learningSites)) {
      if (typeof siteDomain === 'string' && this.isDomainMatch(currentDomain, siteDomain)) {
        return siteInfo;
      }
    }
    
    for (const [siteDomain, siteInfo] of Object.entries(this.contentDetectionSites)) {
      if (typeof siteDomain === 'string' && this.isDomainMatch(currentDomain, siteDomain)) {
        return siteInfo;
      }
    }
    
    // 再检查自定义网站
    if (typeof mewTrackStorage !== 'undefined') {
      try {
        const customSites = await mewTrackStorage.getCustomSites();
        if (customSites && typeof customSites === 'object') {
          for (const [siteDomain, siteConfig] of Object.entries(customSites)) {
            if (typeof siteDomain === 'string' && 
                siteConfig && 
                siteConfig.enabled && 
                this.isDomainMatch(currentDomain, siteDomain)) {
              return {
                name: siteConfig.name || siteDomain,
                type: 'custom',
                alwaysLearning: true, // 自定义网站默认总是学习内容
                keywords: []
              };
            }
          }
        }
      } catch (error) {
        if (typeof logger !== 'undefined') {
          logger.error('getSiteInfo: 检查自定义网站时发生错误:', error);
        }
      }
    }
    
    return null;
  }

  // 检测页面内容是否为学习型内容
  async detectLearningContent() {
    const domain = this.getCurrentDomain();
    const siteInfo = await this.getSiteInfo(domain);

    if (!siteInfo) {
      return false;
    }

    // 如果网站总是学习型的，直接返回 true
    if (siteInfo.alwaysLearning) {
      return true;
    }

    // 对于需要内容检测的网站，分析页面内容
    if (siteInfo.type === 'video') {
      return this.analyzeVideoContent(siteInfo);
    }

    return false;
  }

  // 分析视频内容
  async analyzeVideoContent(siteInfo) {
    if (typeof logger !== 'undefined') {
      logger.debug('开始分析视频内容，网站信息:', siteInfo);
      logger.debug('当前URL:', window.location.href);
      logger.debug('当前域名:', this.getCurrentDomain());
    }
    
    const title = this.getVideoTitle();
    const description = this.getVideoDescription();
    const tags = this.getVideoTags();
    
    if (typeof logger !== 'undefined') {
      logger.debug('检测视频内容:', {
        title,
        description: description.substring(0, 100) + '...',
        tags,
        titleLength: title ? title.length : 0
      });
    }
    
    if (!title) {
      if (typeof logger !== 'undefined') {
        logger.debug('无法获取视频标题，延迟后重试');
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
      const retryTitle = this.getVideoTitle();
      if (!retryTitle) {
        if (typeof logger !== 'undefined') {
          logger.debug('仍无法获取视频标题');
          // 尝试输出页面结构帮助调试
          logger.debug('页面h1元素:', document.querySelectorAll('h1').length);
          const h1Elements = document.querySelectorAll('h1');
          h1Elements.forEach((h1, index) => {
            logger.debug(`h1[${index}]:`, h1.className, h1.textContent?.substring(0, 50));
          });
        }
        return false;
      }
    }
    
    // 检查AI识别设置
    let aiEnabled = true;
    if (typeof mewTrackStorage !== 'undefined') {
      try {
        aiEnabled = await mewTrackStorage.getAIContentDetectionSetting();
        if (typeof logger !== 'undefined') {
          logger.debug('AI内容检测设置:', aiEnabled ? '已开启' : '已关闭');
        }
      } catch (error) {
        if (typeof logger !== 'undefined') {
          logger.debug('获取AI设置失败，使用默认值:', error);
        }
      }
    }

    // 首先尝试使用OpenAI API分析（如果启用）
    if (aiEnabled && typeof openAIIntegration !== 'undefined') {
      await openAIIntegration.init();
      if (typeof logger !== 'undefined') {
        logger.debug('OpenAI API密钥状态:', openAIIntegration.apiKey ? '已配置' : '未配置');
      }
      
      if (openAIIntegration.apiKey) {
        try {
          if (typeof logger !== 'undefined') {
            logger.debug('开始调用OpenAI API分析视频内容...');
          }
          const finalTitle = title || this.getVideoTitle();
          const fullDescription = `${description} ${tags}`;
          
          if (typeof logger !== 'undefined') {
            logger.debug('准备发送到OpenAI的数据:', {
              title: finalTitle,
              description: fullDescription.substring(0, 200) + '...',
              url: window.location.href
            });
          }
          
          const analysis = await openAIIntegration.analyzeContent(
            finalTitle,
            fullDescription,
            window.location.href
          );
          
          if (analysis && analysis.isLearning !== undefined) {
            if (typeof logger !== 'undefined') {
              logger.info('OpenAI分析完成，判断结果:', {
                isLearning: analysis.isLearning,
                contentType: analysis.contentType,
                reason: analysis.reason
              });
            }
            return analysis.isLearning;
          } else {
            if (typeof logger !== 'undefined') {
              logger.warn('OpenAI返回了无效的分析结果:', analysis);
            }
          }
        } catch (error) {
          if (typeof logger !== 'undefined') {
            logger.warn('OpenAI分析失败，将使用关键词匹配:', error.message);
          }
        }
      } else {
        if (typeof logger !== 'undefined') {
          logger.debug('OpenAI API未配置，使用关键词匹配');
        }
      }
    } else if (!aiEnabled) {
      if (typeof logger !== 'undefined') {
        logger.debug('AI识别已关闭，使用本地关键词匹配');
      }
    } else {
      if (typeof logger !== 'undefined') {
        logger.debug('OpenAI集成模块未加载，使用关键词匹配');
      }
    }
    
    // 使用本地关键词匹配算法
    if (typeof logger !== 'undefined') {
      logger.debug(aiEnabled ? '使用本地关键词匹配作为备选方案' : '使用本地关键词匹配');
    }
    const content = `${title} ${description} ${tags}`.toLowerCase();
    
    // 计算学习关键词和娱乐关键词的匹配度
    const learningScore = this.calculateKeywordScore(content, siteInfo.learningKeywords);
    const entertainmentScore = this.calculateKeywordScore(content, siteInfo.entertainmentKeywords);
    
    if (typeof logger !== 'undefined') {
      logger.debug('关键词匹配得分 - 学习:', learningScore, '娱乐:', entertainmentScore);
    }
    
    // 调整判断逻辑：学习内容需要有明确的学习关键词，且学习得分要高于娱乐得分
    return learningScore >= 2 && learningScore > entertainmentScore;
  }

  // 获取视频标题
  getVideoTitle() {
    const domain = this.getCurrentDomain();
    
    if (domain.includes('youtube.com')) {
      // YouTube的多种标题选择器（按优先级排序）
      const selectors = [
        'h1.ytd-watch-metadata yt-formatted-string',
        'h1.style-scope.ytd-watch-metadata yt-formatted-string',
        '#above-the-fold h1 yt-formatted-string',
        'h1.title.style-scope.ytd-video-primary-info-renderer',
        'h1 yt-formatted-string.style-scope.ytd-video-primary-info-renderer',
        'yt-formatted-string.style-scope.ytd-watch-metadata',
        'meta[name="title"]',
        'meta[property="og:title"]',
        'title'
      ];
      
      for (const selector of selectors) {
        try {
          const element = document.querySelector(selector);
          if (element) {
            let title = '';
            if (element.tagName === 'META') {
              title = element.getAttribute('content') || '';
            } else {
              title = element.textContent || element.innerText || '';
            }
            
            if (title.trim()) {
              // 移除" - YouTube"后缀
              return title.trim().replace(/ - YouTube$/, '');
            }
          }
        } catch (error) {
          if (typeof logger !== 'undefined') {
            logger.debug(`选择器错误 (${selector}):`, error);
          }
        }
      }
    }
    
    if (domain.includes('bilibili.com')) {
      // Bilibili的多种标题选择器
      const titleElement = document.querySelector('.video-title.tit') ||
                          document.querySelector('h1.video-title') ||
                          document.querySelector('.video-info-title') ||
                          document.querySelector('h1[title]') ||
                          document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                          document.querySelector('title');
      
      if (titleElement) {
        const title = titleElement.getAttribute ? 
          (titleElement.getAttribute('title') || titleElement.getAttribute('content') || titleElement.textContent) : 
          titleElement.textContent;
        // 移除"_哔哩哔哩_bilibili"后缀
        return title.trim().replace(/_哔哩哔哩.*$/, '');
      }
    }
    
    return '';
  }

  // 获取视频描述
  getVideoDescription() {
    const domain = this.getCurrentDomain();
    
    if (domain.includes('youtube.com')) {
      const descElement = document.querySelector('#description-inner') ||
                         document.querySelector('#description') ||
                         document.querySelector('ytd-text-inline-expander') ||
                         document.querySelector('.ytd-video-secondary-info-renderer');
      return descElement ? descElement.textContent.trim().substring(0, 500) : ''; // 限制长度
    }
    
    if (domain.includes('bilibili.com')) {
      const descElement = document.querySelector('.desc-info-text') ||
                         document.querySelector('.desc-info') ||
                         document.querySelector('.video-desc') ||
                         document.querySelector('.basic-desc-info');
      return descElement ? descElement.textContent.trim().substring(0, 500) : ''; // 限制长度
    }
    
    return '';
  }

  // 获取视频标签
  getVideoTags() {
    const domain = this.getCurrentDomain();
    
    if (domain.includes('youtube.com')) {
      // YouTube标签通常在描述中以#开头
      const description = this.getVideoDescription();
      const hashtagMatches = description.match(/#\w+/g) || [];
      
      // 也尝试获取分类信息
      const categoryElement = document.querySelector('meta[itemprop="genre"]');
      const category = categoryElement ? categoryElement.getAttribute('content') : '';
      
      return [...hashtagMatches, category].filter(Boolean).join(' ');
    }
    
    if (domain.includes('bilibili.com')) {
      const tagElements = document.querySelectorAll('.tag-link') ||
                         document.querySelectorAll('.tag-item') ||
                         document.querySelectorAll('.video-tag-container a');
      const tags = Array.from(tagElements).map(el => el.textContent.trim());
      
      // 也获取分区信息
      const categoryElement = document.querySelector('.channel-name') ||
                             document.querySelector('.video-data a');
      if (categoryElement) {
        tags.push(categoryElement.textContent.trim());
      }
      
      return tags.join(' ');
    }
    
    return '';
  }

  // 计算关键词匹配得分
  calculateKeywordScore(content, keywords) {
    let score = 0;
    const lowerContent = content.toLowerCase();
    
    keywords.forEach(keyword => {
      const regex = new RegExp(keyword.toLowerCase(), 'g');
      const matches = lowerContent.match(regex);
      if (matches) {
        score += matches.length;
      }
    });
    
    return score;
  }

  // 获取所有支持的网站列表
  getAllSupportedSites() {
    return {
      ...this.learningSites,
      ...this.contentDetectionSites
    };
  }

  // 检查当前页面是否为视频页面
  isVideoPage() {
    const domain = this.getCurrentDomain();
    const path = window.location.pathname;
    const url = window.location.href;
    
    if (this.isDomainMatch(domain, ['youtube.com'])) {
      return path.includes('/watch') || url.includes('watch?v=');
    }
    
    if (this.isDomainMatch(domain, ['bilibili.com'])) {
      return path.includes('/video/') || /\/BV[a-zA-Z0-9]+/.test(path);
    }
    
    return false;
  }
}

// 导出实例
const siteDetector = new SiteDetector(); 