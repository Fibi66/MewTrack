// 扩展上下文失效提示模块
class ContextInvalidNotice {
  constructor() {
    this.noticeId = 'mewtrack-context-invalid-notice';
  }

  // 显示提示
  show() {
    // 如果已经存在提示，不重复显示
    if (document.getElementById(this.noticeId)) {
      return;
    }

    // 创建提示元素
    const notice = document.createElement('div');
    notice.id = this.noticeId;
    notice.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 8px;
        padding: 15px 20px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        max-width: 350px;
        animation: slideIn 0.3s ease;
      ">
        <div style="display: flex; align-items: start; gap: 10px;">
          <div style="font-size: 24px; line-height: 1;">⚠️</div>
          <div style="flex: 1;">
            <div style="font-weight: 600; color: #856404; margin-bottom: 5px;">
              MewTrack 需要刷新
            </div>
            <div style="color: #856404; margin-bottom: 10px;">
              扩展已更新，请刷新页面以继续使用打卡功能。
            </div>
            <div style="display: flex; gap: 10px;">
              <button onclick="location.reload()" style="
                background: #667eea;
                color: white;
                border: none;
                padding: 6px 16px;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: background 0.2s;
              " onmouseover="this.style.background='#5a6fd8'" onmouseout="this.style.background='#667eea'">
                刷新页面
              </button>
              <button onclick="document.getElementById('${this.noticeId}').remove()" style="
                background: transparent;
                color: #856404;
                border: 1px solid #856404;
                padding: 6px 16px;
                border-radius: 6px;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.2s;
              " onmouseover="this.style.background='#856404'; this.style.color='white'" onmouseout="this.style.background='transparent'; this.style.color='#856404'">
                稍后提醒
              </button>
            </div>
          </div>
          <button onclick="document.getElementById('${this.noticeId}').remove()" style="
            background: transparent;
            border: none;
            color: #856404;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: background 0.2s;
          " onmouseover="this.style.background='rgba(133, 100, 4, 0.1)'" onmouseout="this.style.background='transparent'">
            ×
          </button>
        </div>
      </div>
      <style>
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      </style>
    `;

    document.body.appendChild(notice);

    // 30秒后自动消失
    setTimeout(() => {
      const element = document.getElementById(this.noticeId);
      if (element) {
        element.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => element.remove(), 300);
      }
    }, 30000);
  }
}

// 导出实例
const contextInvalidNotice = new ContextInvalidNotice();