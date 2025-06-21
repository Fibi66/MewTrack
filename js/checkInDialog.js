// 打卡天数设置弹窗模块
class CheckInDialog {
  constructor() {
    this.dialogElement = null;
    this.isOpen = false;
  }

  // 创建弹窗HTML
  createDialogHTML(siteName, siteUrl) {
    return `
      <div class="mewtrack-checkin-dialog-overlay">
        <div class="mewtrack-checkin-dialog">
          <div class="mewtrack-dialog-header">
            <img src="${chrome.runtime.getURL('images/cat-stage-2.png')}" alt="猫猫" class="mewtrack-dialog-cat">
            <h2>发现学习内容！</h2>
          </div>
          
          <div class="mewtrack-dialog-content">
            <p>检测到您正在 <strong>${siteName}</strong> 学习</p>
            <p class="mewtrack-dialog-question">要为这个网站创建打卡计划吗？</p>
            
            <div class="mewtrack-target-days">
              <label for="mewtrack-target-days-input">目标打卡天数：</label>
              <input 
                type="number" 
                id="mewtrack-target-days-input" 
                min="1" 
                max="365" 
                value="30" 
                class="mewtrack-days-input"
              >
              <span>天</span>
            </div>
            
            <div class="mewtrack-dialog-tips">
              <p>💡 设置目标，猫猫陪您学习</p>
              <p>🎯 连续打卡让猫猫成长</p>
            </div>
          </div>
          
          <div class="mewtrack-dialog-actions">
            <button class="mewtrack-btn mewtrack-btn-cancel" id="mewtrack-cancel-btn">
              跳过
            </button>
            <button class="mewtrack-btn mewtrack-btn-confirm" id="mewtrack-confirm-btn">
              创建计划
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // 创建弹窗样式
  createDialogStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .mewtrack-checkin-dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: transparent;
        z-index: 999999;
        pointer-events: none;
        animation: mewtrack-fade-in 0.3s ease;
      }

      .mewtrack-checkin-dialog {
        position: absolute;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 12px;
        padding: 0;
        width: 280px;
        max-width: 90vw;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        animation: mewtrack-slide-in-right 0.3s ease;
        overflow: hidden;
        pointer-events: auto;
      }

      .mewtrack-dialog-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 16px;
        text-align: center;
        position: relative;
      }

      .mewtrack-dialog-cat {
        width: 32px;
        height: 32px;
        margin-bottom: 6px;
        animation: mewtrack-bounce 2s ease infinite;
      }

      .mewtrack-dialog-header h2 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }

      .mewtrack-dialog-content {
        padding: 16px;
      }

      .mewtrack-dialog-content p {
        margin: 0 0 8px 0;
        font-size: 13px;
        color: #333;
        text-align: center;
        line-height: 1.4;
      }

      .mewtrack-dialog-content strong {
        color: #667eea;
        font-weight: 600;
      }

      .mewtrack-dialog-question {
        font-size: 14px !important;
        margin: 12px 0 !important;
        font-weight: 500;
      }

      .mewtrack-target-days {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        margin: 12px 0;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 8px;
      }

      .mewtrack-target-days label {
        font-size: 12px;
        color: #555;
        white-space: nowrap;
      }

      .mewtrack-days-input {
        width: 50px;
        padding: 4px 8px;
        border: 2px solid #e0e0e0;
        border-radius: 6px;
        font-size: 14px;
        text-align: center;
        transition: all 0.3s ease;
      }

      .mewtrack-days-input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
      }

      .mewtrack-dialog-tips {
        background: #f0f4ff;
        border-radius: 8px;
        padding: 10px;
        margin-top: 12px;
      }

      .mewtrack-dialog-tips p {
        margin: 3px 0 !important;
        font-size: 11px !important;
        color: #666;
        text-align: left;
        line-height: 1.3;
      }

      .mewtrack-dialog-actions {
        display: flex;
        gap: 8px;
        padding: 12px 16px 16px;
      }

      .mewtrack-btn {
        flex: 1;
        padding: 8px 12px;
        border: none;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .mewtrack-btn-cancel {
        background: #f0f0f0;
        color: #666;
      }

      .mewtrack-btn-cancel:hover {
        background: #e0e0e0;
      }

      .mewtrack-btn-confirm {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .mewtrack-btn-confirm:hover {
        transform: translateY(-1px);
        box-shadow: 0 3px 12px rgba(102, 126, 234, 0.3);
      }

      @keyframes mewtrack-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes mewtrack-slide-in-right {
        from { 
          transform: translateX(100%);
          opacity: 0;
        }
        to { 
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes mewtrack-bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }

      @keyframes mewtrack-fade-out {
        from { 
          opacity: 1;
          transform: translateX(0);
        }
        to { 
          opacity: 0;
          transform: translateX(100%);
        }
      }
    `;
    document.head.appendChild(style);
  }

  // 显示弹窗
  async show(siteName, siteUrl, domain) {
    if (this.isOpen) return;

    // 检查是否已经为该网站设置过打卡天数
    const siteData = await mewTrackStorage.getSiteData(domain);
    if (siteData.targetDays > 0) {
      console.log('MewTrack: 该网站已设置打卡天数，跳过弹窗');
      return;
    }

    this.isOpen = true;

    // 创建样式
    this.createDialogStyles();

    // 创建弹窗元素
    const dialogContainer = document.createElement('div');
    dialogContainer.innerHTML = this.createDialogHTML(siteName, siteUrl);
    this.dialogElement = dialogContainer.firstElementChild;
    document.body.appendChild(this.dialogElement);

    // 绑定事件
    this.bindEvents(domain);
  }

  // 绑定事件
  bindEvents(domain) {
    const cancelBtn = document.getElementById('mewtrack-cancel-btn');
    const confirmBtn = document.getElementById('mewtrack-confirm-btn');
    const daysInput = document.getElementById('mewtrack-target-days-input');

    // 取消按钮
    cancelBtn.addEventListener('click', () => {
      this.close();
    });

    // 确认按钮
    confirmBtn.addEventListener('click', async () => {
      const targetDays = parseInt(daysInput.value) || 30;
      
      // 保存目标天数
      await mewTrackStorage.setTargetDays(domain, targetDays);
      
      // 显示成功提示
      notificationManager.showToast(`已为该网站设置 ${targetDays} 天的打卡目标！加油！🎯`);
      
      this.close();
      
      // 立即进行一次打卡
      const result = await mewTrackStorage.updateSiteVisit(domain, true);
      if (result.isNewVisit) {
        const siteInfo = await siteDetector.getSiteInfo(domain);
        const message = `已为 ${siteInfo.name} 打卡成功！总连续天数: ${result.globalStats.totalStreak} 天`;
        notificationManager.showToast(message);
      }
    });

    // 点击遮罩关闭
    this.dialogElement.addEventListener('click', (e) => {
      if (e.target === this.dialogElement) {
        this.close();
      }
    });

    // ESC键关闭
    document.addEventListener('keydown', this.handleEscKey);
  }

  // 处理ESC键
  handleEscKey = (e) => {
    if (e.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }

  // 关闭弹窗
  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    
    // 移除事件监听
    document.removeEventListener('keydown', this.handleEscKey);
    
    // 添加退出动画
    const dialog = this.dialogElement.querySelector('.mewtrack-checkin-dialog');
    dialog.style.animation = 'mewtrack-fade-out 0.3s ease';
    
    setTimeout(() => {
      if (this.dialogElement && this.dialogElement.parentNode) {
        this.dialogElement.parentNode.removeChild(this.dialogElement);
      }
      this.dialogElement = null;
    }, 300);
  }
}

// 导出实例
const checkInDialog = new CheckInDialog();