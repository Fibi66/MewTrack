// 弹窗通知管理模块
class NotificationManager {
  constructor() {
    this.notificationId = 'mewtrack-notification';
    this.isShowing = false;
  }

  // 检查扩展上下文是否有效
  isExtensionContextValid() {
    try {
      return !!(chrome && chrome.runtime && chrome.runtime.getURL);
    } catch (error) {
      return false;
    }
  }

  // 显示学习提醒弹窗
  async showLearningNotification(domain, siteName, globalStreak, isFirstTime = false, onConfirm) {
    if (this.isShowing) {
      return;
    }

    // 检查扩展上下文
    if (!this.isExtensionContextValid()) {
      if (typeof logger !== 'undefined') {
        logger.contextError('扩展上下文已失效，无法显示弹窗');
      }
      return;
    }

    this.isShowing = true;
    
    const motivation = motivationGenerator.generatePersonalizedMotivation(globalStreak, siteName, isFirstTime);
    
    // 创建弹窗元素
    const notification = this.createNotificationElement(motivation, domain, siteName, globalStreak);
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 绑定事件
    const closeBtn = notification.querySelector('.close-btn');
    const confirmBtn = notification.querySelector('.confirm-btn');
    const cancelBtn = notification.querySelector('.cancel-btn');

    closeBtn.addEventListener('click', () => this.hideNotification(notification));
    cancelBtn.addEventListener('click', () => this.hideNotification(notification));
    confirmBtn.addEventListener('click', () => {
      if (onConfirm) {
        onConfirm();
      }
      this.hideNotification(notification);
    });

    // 动画显示
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
  }

  // 创建弹窗元素
  createNotificationElement(motivation, domain, siteName, globalStreak) {
    const notification = document.createElement('div');
    notification.id = this.notificationId;
    notification.className = 'mewtrack-notification';
    
    // 使用全局streak来计算猫猫成长阶段
    const nextStreak = globalStreak + 1;
    const catStage = this.calculateCatStage(nextStreak);
    
    // 安全获取图片URL
    let catImage;
    try {
      if (this.isExtensionContextValid()) {
        catImage = chrome.runtime.getURL(`images/cat-stage-${catStage}.png`);
      } else {
        // 如果扩展上下文失效，使用占位符
        catImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNmZmY0ZDYiLz4KPHN2ZyB4PSI1IiB5PSI1IiB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01aDEwbC01IDV6IiBmaWxsPSIjNjY3ZWVhIi8+Cjwvc3ZnPgo8L3N2Zz4K';
      }
    } catch (error) {
      if (typeof logger !== 'undefined') {
        logger.debug('获取图片URL失败，使用占位符');
      }
      catImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNmZmY0ZDYiLz4KPHN2ZyB4PSI1IiB5PSI1IiB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01aDEwbC01IDV6IiBmaWxsPSIjNjY3ZWVhIi8+Cjwvc3ZnPgo8L3N2Zz4K';
    }
    
    // 获取成长阶段名称
    const stageName = this.getStageName(catStage);
    
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-header">
          <div class="cat-avatar">
            <img src="${catImage}" alt="猫猫" class="cat-image">
          </div>
          <div class="site-info">
            <h3>${siteName}</h3>
            <p class="streak-info">总学习连续 ${globalStreak} 天 → ${nextStreak} 天</p>
            <p class="cat-stage">猫猫成长: ${stageName}</p>
          </div>
          <button class="close-btn" title="关闭">×</button>
        </div>
        <div class="notification-body">
          <p class="motivation-text">${motivation}</p>
        </div>
        <div class="notification-footer">
          <button class="cancel-btn">以后再说</button>
          <button class="confirm-btn">为今天打卡! 🎉</button>
        </div>
      </div>
    `;
    
    return notification;
  }

  // 计算猫猫成长阶段
  calculateCatStage(streak) {
    if (streak >= 30) return 3; // 猫王
    if (streak >= 10) return 2; // 大猫
    if (streak >= 1) return 1;  // 小猫
    return 0; // 蛋
  }

  // 获取成长阶段名称
  getStageName(stage) {
    const stageNames = ['🥚 蛋蛋', '🐱 小猫咪', '😸 大猫猫', '👑 猫王'];
    return stageNames[stage] || '未知';
  }

  // 隐藏弹窗
  hideNotification(notification) {
    if (notification && notification.parentElement) {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentElement) {
          notification.parentElement.removeChild(notification);
        }
        this.isShowing = false;
      }, 300);
    }
  }

  // 显示提示
  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `mewtrack-toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 3000);
  }
}

// 导出实例
const notificationManager = new NotificationManager(); 