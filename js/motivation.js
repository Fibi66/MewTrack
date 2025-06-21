// 鸡汤文案生成模块
class MotivationGenerator {
  constructor() {
    this.motivations = [
      "今天的你比昨天的你更棒！继续加油，猫猫为你骄傲！🐱✨",
      "学习使我快乐，成长使我强大！你正在成为更好的自己！🌟",
      "每一行代码都是进步，每一个算法都是成长！编程猫为你点赞！💻🐱",
      "知识就是力量，学习就是魔法！你已经掌握了成长的秘诀！🔮",
      "今天的努力是明天的收获！继续前进，胜利就在前方！🏆",
      "学习路上不孤单，有猫猫陪伴你！一起变得更优秀吧！😸",
      "每一次点击都是进步，每一个页面都是成长！你太棒了！👏",
      "知识改变命运，学习改变人生！你正在书写自己的传奇！📚✨",
      "今天的你比昨天更聪明，比明天更努力！继续加油！💪",
      "学习是一种习惯，优秀是一种选择！你已经选择了优秀！🎯",
      "每一分钟的学习都是投资，每一份努力都有回报！💰",
      "知识就是财富，学习就是赚钱！你正在积累人生财富！💎",
      "今天的汗水是明天的收获！继续努力，成功就在眼前！🌱",
      "学习使我快乐，成长使我强大！你正在成为更好的自己！🌟",
      "每一次挑战都是机会，每一次学习都是成长！加油！🚀",
      "知识就是武器，学习就是修炼！你已经很厉害了！⚔️",
      "今天的努力是明天的骄傲！继续前进，你是最棒的！🏅",
      "学习路上不孤单，有猫猫为你加油！一起变得更强大！😺",
      "每一次进步都是胜利，每一次学习都是成功！太棒了！🎉",
      "知识就是魔法，学习就是施法！你已经掌握了成长魔法！🔮✨"
    ];

    this.streakMotivations = {
      1: "第一天！猫猫蛋出现了，新的学习之旅开始啦！🐣",
      10: "坚持十天，猫猫成功孵化！一只可爱的小猫正期待与你一起成长！😸",
      30: "坚持三十天，小猫长成了大猫！它看起来更专注了！继续加油！😼",
      50: "五十天！你的猫猫已经成了键盘大师！这气场，是猫王没错了！👑🐱",
      100: "一百天！猫神降临！你的毅力无人能及！🐱✨",
      365: "一年！你是真正的学习之神！你的猫猫已经为你写好了一套操作系统！🎊"
    };
  }

  // 获取随机鼓励文案
  getRandomMotivation() {
    const index = Math.floor(Math.random() * this.motivations.length);
    return this.motivations[index];
  }

  // 根据 streak 获取特定鼓励文案
  getStreakMotivation(streak) {
    const milestones = Object.keys(this.streakMotivations)
      .map(Number)
      .sort((a, b) => b - a);
    
    for (const milestone of milestones) {
      if (streak >= milestone) {
        return this.streakMotivations[milestone];
      }
    }
    
    return this.getRandomMotivation();
  }

  // 获取网站特定的鼓励文案
  getSiteSpecificMotivation(siteName) {
    const siteMotivations = {
      'LeetCode': [
        "今天的算法题又解决了一个！你的逻辑思维越来越强了！🧠",
        "LeetCode 刷题中，代码能力蹭蹭涨！继续加油！💻",
        "算法题算什么，你比算法更聪明！太棒了！🎯"
      ],
      'Coursera': [
        "Coursera 课程学习中，知识面越来越广！📚",
        "在线课程真棒，你的学习能力超强！🌟",
        "Coursera 让你成为终身学习者！继续加油！🎓"
      ],
      'YouTube': [
        "YouTube 学习视频真棒，你的自学能力超强！📺",
        "视频学习也是一种技能，你已经掌握了！🎬",
      ],
      '哔哩哔哩': [
        "B站学习区真棒，你的学习热情很高！📺",
        "视频学习也是一种技能，你已经掌握了！🎬",
      ],
      'GitHub': [
        "GitHub 代码管理中，你的项目越来越棒！💻",
        "开源精神真棒，你正在成为优秀的开发者！🌟",
        "代码仓库管理得很好，继续加油！📁"
      ]
    };

    const motivations = siteMotivations[siteName] || this.motivations;
    const index = Math.floor(Math.random() * motivations.length);
    return motivations[index];
  }

  // 获取综合鼓励文案
  getComprehensiveMotivation(streak, siteName) {
    // 优先使用 streak 里程碑文案
    if (this.streakMotivations[streak]) {
      return this.streakMotivations[streak];
    }
    
    // 其次使用网站特定文案
    if (siteName) {
      return this.getSiteSpecificMotivation(siteName);
    }
    
    // 最后使用随机文案
    return this.getRandomMotivation();
  }

  // 生成个性化鼓励文案
  generatePersonalizedMotivation(streak, siteName, isFirstTime = false) {
    let motivation = '';
    
    if (isFirstTime) {
      motivation = `欢迎来到 ${siteName}！今天是你的第一次学习，猫猫为你加油！🐱✨`;
    } else {
      motivation = this.getComprehensiveMotivation(streak, siteName);
    }
    
    return motivation;
  }
}

// 导出实例
const motivationGenerator = new MotivationGenerator(); 