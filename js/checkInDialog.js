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
              <p>💡 设置目标天数后，猫猫会陪伴您完成学习计划</p>
              <p>🎯 连续打卡可以让猫猫成长哦！</p>
            </div>
          </div>
          
          <div class="mewtrack-dialog-actions">
            <button class="mewtrack-btn mewtrack-btn-cancel" id="mewtrack-cancel-btn">
              暂不设置
            </button>
            <button class="mewtrack-btn mewtrack-btn-confirm" id="mewtrack-confirm-btn">
              创建打卡计划
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
        background: rgba(0, 0, 0, 0.7);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: mewtrack-fade-in 0.3s ease;
      }

      .mewtrack-checkin-dialog {
        background: white;
        border-radius: 16px;
        padding: 0;
        width: 90%;
        max-width: 450px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        animation: mewtrack-slide-up 0.3s ease;
        overflow: hidden;
      }

      .mewtrack-dialog-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        text-align: center;
        position: relative;
      }

      .mewtrack-dialog-cat {
        width: 60px;
        height: 60px;
        margin-bottom: 10px;
        animation: mewtrack-bounce 1s ease infinite;
      }

      .mewtrack-dialog-header h2 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
      }

      .mewtrack-dialog-content {
        padding: 30px;
      }

      .mewtrack-dialog-content p {
        margin: 0 0 15px 0;
        font-size: 16px;
        color: #333;
        text-align: center;
      }

      .mewtrack-dialog-content strong {
        color: #667eea;
        font-weight: 600;
      }

      .mewtrack-dialog-question {
        font-size: 18px !important;
        margin: 20px 0 !important;
      }

      .mewtrack-target-days {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin: 25px 0;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 12px;
      }

      .mewtrack-target-days label {
        font-size: 16px;
        color: #555;
      }

      .mewtrack-days-input {
        width: 80px;
        padding: 8px 12px;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        font-size: 18px;
        text-align: center;
        transition: all 0.3s ease;
      }

      .mewtrack-days-input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      .mewtrack-dialog-tips {
        background: #f0f4ff;
        border-radius: 12px;
        padding: 15px;
        margin-top: 20px;
      }

      .mewtrack-dialog-tips p {
        margin: 5px 0 !important;
        font-size: 14px !important;
        color: #666;
        text-align: left;
      }

      .mewtrack-dialog-actions {
        display: flex;
        gap: 12px;
        padding: 20px 30px 30px;
      }

      .mewtrack-btn {
        flex: 1;
        padding: 12px 20px;
        border: none;
        border-radius: 8px;
        font-size: 16px;
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
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
      }

      @keyframes mewtrack-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes mewtrack-slide-up {
        from { 
          transform: translateY(50px);
          opacity: 0;
        }
        to { 
          transform: translateY(0);
          opacity: 1;
        }
      }

      @keyframes mewtrack-bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
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
    this.dialogElement.style.animation = 'mewtrack-fade-out 0.3s ease';
    
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