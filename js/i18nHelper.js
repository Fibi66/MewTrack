// Helper module for i18n in content scripts
class I18nHelper {
  constructor() {
    this.messages = {};
    this.language = 'zh_CN'; // Default language
    this.initialized = false;
  }

  // Initialize and load messages
  async init() {
    if (this.initialized) {
      return;
    }

    try {
      // Detect language
      let lang = 'zh_CN';
      try {
        const uiLang = chrome.i18n.getUILanguage();
        lang = uiLang.startsWith('en') ? 'en' : 'zh_CN';
      } catch (error) {
        // Fallback to browser language
        lang = (navigator.language || '').startsWith('en') ? 'en' : 'zh_CN';
      }
      
      this.language = lang;

      // Load messages from the extension's locale files
      const url = chrome.runtime.getURL(`_locales/${lang}/messages.json`);
      const response = await fetch(url);
      const data = await response.json();
      
      // Convert to simple key-value format
      this.messages = {};
      for (const key in data) {
        this.messages[key] = data[key].message;
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to load i18n messages:', error);
      // Fallback to empty messages
      this.messages = {};
      this.initialized = true;
    }
  }

  // Get message by key
  getMessage(key, substitutions) {
    if (!this.initialized) {
      console.warn('I18nHelper not initialized, returning key:', key);
      return key;
    }

    let message = this.messages[key] || key;
    
    // Handle substitutions
    if (substitutions) {
      if (typeof substitutions === 'object') {
        // Replace {key} format
        for (const sub in substitutions) {
          const regex = new RegExp(`\\{${sub}\\}`, 'g');
          message = message.replace(regex, substitutions[sub]);
        }
      } else if (typeof substitutions === 'string') {
        // Replace $1 format
        message = message.replace(/\$1/g, substitutions);
      } else if (Array.isArray(substitutions)) {
        // Replace $1, $2, etc.
        substitutions.forEach((sub, index) => {
          const regex = new RegExp(`\\$${index + 1}`, 'g');
          message = message.replace(regex, sub);
        });
      }
    }
    
    return message;
  }

  // Get current language
  getLanguage() {
    return this.language;
  }

  // Check if current language is English
  isEnglish() {
    return this.language === 'en';
  }
}

// Create and export instance
const i18nHelper = new I18nHelper();