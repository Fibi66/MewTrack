// 国际化辅助模块
class I18nHelper {
  constructor() {
    this.currentLanguage = null;
    this.messages = {};
  }

  // 初始化语言
  async init() {
    try {
      // 从存储中获取用户设置的语言
      const data = await chrome.storage.local.get(['userLanguage']);
      this.currentLanguage = data.userLanguage || chrome.i18n.getUILanguage();
      
      // 如果是中文系语言，统一使用 zh_CN
      if (this.currentLanguage.startsWith('zh')) {
        this.currentLanguage = 'zh_CN';
      } else if (!['en', 'zh_CN'].includes(this.currentLanguage)) {
        // 其他语言默认使用英文
        this.currentLanguage = 'en';
      }
      
      return this.currentLanguage;
    } catch (error) {
      // 默认使用英文
      this.currentLanguage = 'en';
      return 'en';
    }
  }

  // 获取消息
  getMessage(key, substitutions) {
    // 使用 Chrome 的 i18n API
    return chrome.i18n.getMessage(key, substitutions);
  }

  // 设置语言
  async setLanguage(language) {
    try {
      await chrome.storage.local.set({ userLanguage: language });
      this.currentLanguage = language;
      // 重新加载扩展以应用新语言
      chrome.runtime.reload();
    } catch (error) {
      console.error('Failed to set language:', error);
    }
  }

  // 应用翻译到页面
  applyTranslations() {
    // 查找所有带有 data-i18n 属性的元素
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const message = this.getMessage(key);
      if (message) {
        if (element.tagName === 'INPUT' && element.getAttribute('placeholder')) {
          element.placeholder = message;
        } else {
          element.textContent = message;
        }
      }
    });

    // 查找所有带有 data-i18n-title 属性的元素
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      const message = this.getMessage(key);
      if (message) {
        element.title = message;
      }
    });
  }

  // 格式化带参数的消息
  format(key, params) {
    let message = this.getMessage(key);
    if (!message) return key;

    // 替换 {paramName} 格式的参数
    Object.keys(params).forEach(param => {
      const regex = new RegExp(`\\{${param}\\}`, 'g');
      message = message.replace(regex, params[param]);
    });

    return message;
  }
}

// 导出实例
const i18n = new I18nHelper();