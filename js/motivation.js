// 鸡汤文案生成模块
class MotivationGenerator {
  constructor() {
    this.motivationKeys = [
      'motivation1', 'motivation2', 'motivation3', 'motivation4', 'motivation5',
      'motivation6', 'motivation7', 'motivation8', 'motivation9', 'motivation10'
    ];

    this.streakMilestones = {
      1: 'streakDay1',
      10: 'streakDay10',
      30: 'streakDay30',
      50: 'streakDay50',
      100: 'streakDay100',
      365: 'streakDay365'
    };
  }

  // 获取随机鼓励文案
  getRandomMotivation() {
    const index = Math.floor(Math.random() * this.motivationKeys.length);
    return i18nHelper.getMessage(this.motivationKeys[index]);
  }

  // 根据 streak 获取特定鼓励文案
  getStreakMotivation(streak) {
    const milestones = Object.keys(this.streakMilestones)
      .map(Number)
      .sort((a, b) => b - a);
    
    for (const milestone of milestones) {
      if (streak >= milestone) {
        return i18nHelper.getMessage(this.streakMilestones[milestone]);
      }
    }
    
    return this.getRandomMotivation();
  }

  // 获取网站特定的鼓励文案
  getSiteSpecificMotivation(siteName) {
    const siteMotivationKeys = {
      'LeetCode': ['leetcodeMotiv1', 'leetcodeMotiv2', 'leetcodeMotiv3'],
      'Coursera': ['courseraMotiv1', 'courseraMotiv2', 'courseraMotiv3'],
      'YouTube': ['youtubeMotiv1', 'youtubeMotiv2'],
      'Bilibili': ['bilibiliMotiv1', 'bilibiliMotiv2'],
      '哔哩哔哩': ['bilibiliMotiv1', 'bilibiliMotiv2'],
      'GitHub': ['githubMotiv1', 'githubMotiv2', 'githubMotiv3']
    };

    const keys = siteMotivationKeys[siteName];
    if (keys && keys.length > 0) {
      const index = Math.floor(Math.random() * keys.length);
      return i18nHelper.getMessage(keys[index]);
    }
    return this.getRandomMotivation();
  }

  // 获取综合鼓励文案
  getComprehensiveMotivation(streak, siteName) {
    // 优先使用 streak 里程碑文案
    if (this.streakMilestones[streak]) {
      return i18nHelper.getMessage(this.streakMilestones[streak]);
    }
    
    // 其次使用网站特定文案
    const siteMotivation = this.getSiteSpecificMotivation(siteName);
    if (siteMotivation !== this.getRandomMotivation()) {
      return siteMotivation;
    }
    
    // 最后使用随机文案
    return this.getRandomMotivation();
  }

  // 生成个性化鼓励文案
  async generatePersonalizedMotivation(streak, siteName, isFirstTime = false) {
    // 确保 i18n 已初始化
    await i18nHelper.init();
    
    let motivation = '';
    
    if (isFirstTime) {
      motivation = i18nHelper.getMessage('welcomeFirstTime', { site: siteName });
    } else {
      motivation = this.getComprehensiveMotivation(streak, siteName);
    }
    
    return motivation;
  }
}

// 导出实例
const motivationGenerator = new MotivationGenerator();