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

  // 显示通知
  async showNotification(domain, siteName, globalStreak, isFirstTime = false, onConfirmCallback = null, willIncreaseTotalStreak = false) {
    if (this.isShowing) {
      if (typeof logger !== 'undefined') {
        logger.debug('通知已显示，跳过此次显示');
      }
      return;
    }

    // 确保 i18n 已初始化
    await i18nHelper.init();

    // 检查扩展上下文
    if (!this.isExtensionContextValid()) {
      if (typeof logger !== 'undefined') {
        logger.debug('扩展上下文无效，跳过通知显示');
      }
      return;
    }

    this.isShowing = true;
    this.notification = null;
    this.onConfirmCallback = onConfirmCallback; // 保存回调函数
    
    const motivation = await motivationGenerator.generatePersonalizedMotivation(globalStreak, siteName, isFirstTime);
    
    // 创建弹窗元素
    const notification = this.createNotificationElement(motivation, domain, siteName, globalStreak, willIncreaseTotalStreak);
    this.notification = notification;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 添加显示动画
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    // 设置自动隐藏
    this.autoHideTimer = setTimeout(() => {
      this.hideNotification();
    }, 8000);
    
    // 绑定事件
    this.bindEvents(notification, domain);
  }

  // 创建通知元素
  createNotificationElement(motivation, domain, siteName, globalStreak, willIncreaseTotalStreak = false) {
    // 只有在今天第一次打卡时才会增加totalStreak
    const nextStreak = willIncreaseTotalStreak ? globalStreak + 1 : globalStreak;
    const stage = Math.min(Math.floor(globalStreak / 10), 3);
    const stageName = this.getStageName(stage);
    const catImage = chrome.runtime.getURL(`images/cat-stage-${stage + 1}.png`);
    
    const notification = document.createElement('div');
    notification.className = 'mewtrack-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-header">
          <div class="cat-avatar">
            <img src="${catImage}" alt="${i18nHelper.getMessage('catAlt')}" class="cat-image">
          </div>
          <div class="site-info">
            <h3>${siteName}</h3>
            <p class="streak-info">${i18nHelper.getMessage('totalLearningStreak')} ${globalStreak} ${i18nHelper.getMessage('days')}${globalStreak !== nextStreak ? ` → ${nextStreak} ${i18nHelper.getMessage('days')}` : ''}</p>
            <p class="cat-stage">${i18nHelper.getMessage('catGrowth')}: ${stageName}</p>
          </div>
          <button class="close-btn" title="${i18nHelper.getMessage('close')}">×</button>
        </div>
        <div class="notification-body">
          <p class="motivation-text">${motivation}</p>
        </div>
        <div class="notification-footer">
          <button class="cancel-btn">${i18nHelper.getMessage('laterBtn')}</button>
          <button class="confirm-btn">${i18nHelper.getMessage('checkInTodayBtn')}</button>
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
    const stageKeys = ['catStageEgg', 'catStageKitten', 'catStageBigCat', 'catStageCatKing'];
    return i18nHelper.getMessage(stageKeys[stage] || 'catStageUnknown');
  }

  // 显示学习通知（别名，保持兼容性）
  async showLearningNotification(domain, siteName, globalStreak, isFirstTime = false, onConfirmCallback = null, willIncreaseTotalStreak = false) {
    return this.showNotification(domain, siteName, globalStreak, isFirstTime, onConfirmCallback, willIncreaseTotalStreak);
  }

  // 隐藏弹窗
  hideNotification() {
    // 清理定时器
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
    
    if (this.notification && this.notification.parentElement) {
      this.notification.classList.remove('show');
      setTimeout(() => {
        if (this.notification && this.notification.parentElement) {
          this.notification.parentElement.removeChild(this.notification);
        }
        this.isShowing = false;
        this.notification = null;
        this.onConfirmCallback = null;
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

  // 绑定事件
  bindEvents(notification, domain) {
    const closeBtn = notification.querySelector('.close-btn');
    const confirmBtn = notification.querySelector('.confirm-btn');
    const cancelBtn = notification.querySelector('.cancel-btn');

    closeBtn.addEventListener('click', () => this.hideNotification());
    cancelBtn.addEventListener('click', async () => {
      // 记录今天跳过这个网站
      if (typeof mewTrackStorage !== 'undefined') {
        await mewTrackStorage.markSiteAsSkippedToday(domain);
        if (typeof logger !== 'undefined') {
          logger.info(`用户选择稍后打卡 - ${domain}`);
        }
      }
      this.hideNotification();
    });
    confirmBtn.addEventListener('click', () => {
      // 执行回调函数
      if (this.onConfirmCallback && typeof this.onConfirmCallback === 'function') {
        this.onConfirmCallback();
      }
      this.hideNotification();
    });
  }
}

// 导出实例
const notificationManager = new NotificationManager(); 