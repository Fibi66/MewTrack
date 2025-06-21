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
      this.currentLanguage = data.userLanguage;
      
      // 如果没有设置语言，使用浏览器语言
      if (!this.currentLanguage) {
        const browserLang = chrome.i18n.getUILanguage();
        // 如果是中文系语言，统一使用 zh_CN
        if (browserLang.startsWith('zh')) {
          this.currentLanguage = 'zh_CN';
        } else {
          this.currentLanguage = 'en';
        }
      }
      
      // 确保语言在支持范围内
      if (!['en', 'zh_CN'].includes(this.currentLanguage)) {
        this.currentLanguage = 'en';
      }
      
      // 加载消息文件
      await this.loadMessages(this.currentLanguage);
      
      return this.currentLanguage;
    } catch (error) {
      // 默认使用英文
      this.currentLanguage = 'en';
      await this.loadMessages('en');
      return 'en';
    }
  }

  // 加载语言消息文件
  async loadMessages(language) {
    try {
      const response = await fetch(chrome.runtime.getURL(`_locales/${language}/messages.json`));
      const data = await response.json();
      this.messages = {};
      
      // 转换格式，提取message字段
      Object.keys(data).forEach(key => {
        this.messages[key] = data[key].message;
      });
    } catch (error) {
      console.error('Failed to load messages:', error);
      this.messages = {};
    }
  }

  // 获取消息
  getMessage(key, substitutions) {
    let message = this.messages[key] || key;
    
    // 处理替换参数
    if (substitutions) {
      if (Array.isArray(substitutions)) {
        substitutions.forEach((sub, index) => {
          message = message.replace(new RegExp(`\\$${index + 1}`, 'g'), sub);
        });
      } else if (typeof substitutions === 'string') {
        message = message.replace(/\$1/g, substitutions);
      }
    }
    
    return message;
  }

  // 设置语言
  async setLanguage(language) {
    try {
      // 保存语言设置
      await chrome.storage.local.set({ userLanguage: language });
      this.currentLanguage = language;
      
      // 重新加载消息
      await this.loadMessages(language);
      
      // 重新应用翻译到当前页面
      this.applyTranslations();
      
      return true;
    } catch (error) {
      console.error('Failed to set language:', error);
      return false;
    }
  }

  // 应用翻译到页面
  applyTranslations() {
    // 查找所有带有 data-i18n 属性的元素
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const message = this.getMessage(key);
      
      if (element.hasAttribute('placeholder')) {
        element.placeholder = message;
      } else {
        element.textContent = message;
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

    // 查找所有带有 data-i18n-placeholder 属性的元素
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      const message = this.getMessage(key);
      if (message) {
        element.placeholder = message;
      }
    });
  }

  // 格式化带参数的消息
  format(key, params) {
    let message = this.getMessage(key);
    if (!message) return key;

    // 替换 {paramName} 格式的参数
    if (params && typeof params === 'object') {
      Object.keys(params).forEach(param => {
        const regex = new RegExp(`\\{${param}\\}`, 'g');
        message = message.replace(regex, params[param]);
      });
    }

    return message;
  }

  // 获取当前语言
  getCurrentLanguage() {
    return this.currentLanguage;
  }
}

// 导出实例
const i18n = new I18nHelper();