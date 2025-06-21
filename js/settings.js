// 设置页面的JavaScript逻辑
document.addEventListener('DOMContentLoaded', async () => {
  // 初始化i18n
  await i18n.init();
  i18n.applyTranslations();
  // 获取DOM元素
  // OpenAI API相关
  const apiKeyInput = document.getElementById('api-key');
  const toggleVisibilityBtn = document.getElementById('toggle-visibility');
  const saveApiKeyBtn = document.getElementById('save-api-key');
  const testApiKeyBtn = document.getElementById('test-api-key');
  const removeApiKeyBtn = document.getElementById('remove-api-key');
  const statusMessage = document.getElementById('status-message');
  
  // DeepSeek API相关
  const deepseekApiKeyInput = document.getElementById('deepseek-api-key');
  const toggleDeepseekVisibilityBtn = document.getElementById('toggle-deepseek-visibility');
  const saveDeepseekApiKeyBtn = document.getElementById('save-deepseek-api-key');
  const testDeepseekApiKeyBtn = document.getElementById('test-deepseek-api-key');
  const removeDeepseekApiKeyBtn = document.getElementById('remove-deepseek-api-key');
  const deepseekStatusMessage = document.getElementById('deepseek-status-message');
  
  const notificationsEnabled = document.getElementById('notifications-enabled');
  const autoDetectEnabled = document.getElementById('auto-detect-enabled');
  
  const exportDataBtn = document.getElementById('export-data');
  const importDataBtn = document.getElementById('import-data');
  const resetDataBtn = document.getElementById('reset-data');
  
  const customSiteUrlInput = document.getElementById('custom-site-url');
  const customSiteNameInput = document.getElementById('custom-site-name');
  const addCustomSiteBtn = document.getElementById('add-custom-site');
  const customSitesContainer = document.getElementById('custom-sites-container');
  
  // 语言切换
  const languageToggle = document.getElementById('language-toggle');

  // 加载现有设置
  await loadSettings();
  
  // 语言切换事件
  languageToggle.addEventListener('change', async (e) => {
    const newLanguage = e.target.checked ? 'en' : 'zh_CN';
    const success = await i18n.setLanguage(newLanguage);
    if (success) {
      showStatus(i18n.getMessage('languageUpdated') || 'Language settings updated', 'success');
      // 重新加载自定义网站列表以应用新语言
      await loadCustomSites();
    } else {
      showStatus(i18n.getMessage('languageUpdateFailed') || 'Language switch failed', 'error');
      // 恢复开关状态
      languageToggle.checked = !languageToggle.checked;
    }
  });

  // 切换密码可见性 - OpenAI
  toggleVisibilityBtn.addEventListener('click', () => {
    const type = apiKeyInput.type === 'password' ? 'text' : 'password';
    apiKeyInput.type = type;
    toggleVisibilityBtn.textContent = type === 'password' ? '👁️' : '🙈';
  });
  
  // 切换密码可见性 - DeepSeek
  toggleDeepseekVisibilityBtn.addEventListener('click', () => {
    const type = deepseekApiKeyInput.type === 'password' ? 'text' : 'password';
    deepseekApiKeyInput.type = type;
    toggleDeepseekVisibilityBtn.textContent = type === 'password' ? '👁️' : '🙈';
  });

  // 保存API密钥
  saveApiKeyBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus(i18n.getMessage('pleaseEnterApiKey'), 'error');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      showStatus(i18n.getMessage('invalidApiKeyFormat'), 'error');
      return;
    }

    try {
      await chrome.storage.local.set({ openaiApiKey: apiKey });
      showStatus(i18n.getMessage('apiKeySaved'), 'success');
      
      // 更新按钮状态
      removeApiKeyBtn.disabled = false;
      testApiKeyBtn.disabled = false;
    } catch (error) {
      showStatus(i18n.getMessage('saveFailed') + ': ' + error.message, 'error');
    }
  });

  // 测试API密钥
  testApiKeyBtn.addEventListener('click', async () => {
    showStatus(i18n.getMessage('testingConnection'), 'info');
    
    try {
      const data = await chrome.storage.local.get(['openaiApiKey']);
      if (!data.openaiApiKey) {
        showStatus(i18n.getMessage('pleaseSaveApiKeyFirst'), 'error');
        return;
      }

      // 测试API连接
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 5
        })
      });

      if (response.ok) {
        showStatus(i18n.getMessage('apiTestSuccess'), 'success');
      } else {
        const error = await response.json();
        showStatus(i18n.getMessage('apiTestFailed') + ': ' + (error.error?.message || i18n.getMessage('unknownError')), 'error');
      }
    } catch (error) {
      showStatus(i18n.getMessage('testFailed') + ': ' + error.message, 'error');
    }
  });

  // 删除API密钥
  removeApiKeyBtn.addEventListener('click', async () => {
    if (confirm(i18n.getMessage('confirmDeleteApiKey'))) {
      try {
        await chrome.storage.local.remove(['openaiApiKey']);
        apiKeyInput.value = '';
        showStatus(i18n.getMessage('apiKeyDeleted'), 'success');
        
        // 更新按钮状态
        removeApiKeyBtn.disabled = true;
        testApiKeyBtn.disabled = true;
      } catch (error) {
        showStatus(i18n.getMessage('deleteFailed') + ': ' + error.message, 'error');
      }
    }
  });

  // DeepSeek API 相关功能
  // 保存DeepSeek API密钥
  saveDeepseekApiKeyBtn.addEventListener('click', async () => {
    const apiKey = deepseekApiKeyInput.value.trim();
    
    if (!apiKey) {
      showDeepseekStatus(i18n.getMessage('pleaseEnterApiKey'), 'error');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      showDeepseekStatus(i18n.getMessage('invalidApiKeyFormat'), 'error');
      return;
    }

    try {
      await chrome.storage.local.set({ deepseekApiKey: apiKey });
      showDeepseekStatus(i18n.getMessage('apiKeySaved'), 'success');
      
      // 更新按钮状态
      removeDeepseekApiKeyBtn.disabled = false;
      testDeepseekApiKeyBtn.disabled = false;
    } catch (error) {
      showDeepseekStatus(i18n.getMessage('saveFailed') + ': ' + error.message, 'error');
    }
  });

  // 测试DeepSeek API密钥
  testDeepseekApiKeyBtn.addEventListener('click', async () => {
    showDeepseekStatus(i18n.getMessage('testingConnection'), 'info');
    
    try {
      const data = await chrome.storage.local.get(['deepseekApiKey']);
      if (!data.deepseekApiKey) {
        showDeepseekStatus(i18n.getMessage('pleaseSaveApiKeyFirst'), 'error');
        return;
      }

      // 测试API连接
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.deepseekApiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 5
        })
      });

      if (response.ok) {
        showDeepseekStatus(i18n.getMessage('apiTestSuccess'), 'success');
      } else {
        const error = await response.json();
        showDeepseekStatus(i18n.getMessage('apiTestFailed') + ': ' + (error.error?.message || i18n.getMessage('unknownError')), 'error');
      }
    } catch (error) {
      showDeepseekStatus(i18n.getMessage('testFailed') + ': ' + error.message, 'error');
    }
  });

  // 删除DeepSeek API密钥
  removeDeepseekApiKeyBtn.addEventListener('click', async () => {
    if (confirm(i18n.getMessage('confirmDeleteApiKey'))) {
      try {
        await chrome.storage.local.remove(['deepseekApiKey']);
        deepseekApiKeyInput.value = '';
        showDeepseekStatus(i18n.getMessage('apiKeyDeleted'), 'success');
        
        // 更新按钮状态
        removeDeepseekApiKeyBtn.disabled = true;
        testDeepseekApiKeyBtn.disabled = true;
      } catch (error) {
        showDeepseekStatus(i18n.getMessage('deleteFailed') + ': ' + error.message, 'error');
      }
    }
  });

  // 保存通知设置
  notificationsEnabled.addEventListener('change', async () => {
    try {
      const data = await chrome.storage.local.get(['mewtrack_data']);
      const mewtrackData = data.mewtrack_data || {};
      
      if (!mewtrackData.settings) {
        mewtrackData.settings = {};
      }
      
      mewtrackData.settings.notifications = notificationsEnabled.checked;
      await chrome.storage.local.set({ mewtrack_data: mewtrackData });
      
      showStatus(i18n.getMessage('notificationSettingUpdated'), 'success');
    } catch (error) {
      showStatus(i18n.getMessage('saveSettingsFailed') + ': ' + error.message, 'error');
    }
  });

  // 保存自动检测设置
  autoDetectEnabled.addEventListener('change', async () => {
    try {
      const data = await chrome.storage.local.get(['mewtrack_data']);
      const mewtrackData = data.mewtrack_data || {};
      
      if (!mewtrackData.settings) {
        mewtrackData.settings = {};
      }
      
      mewtrackData.settings.autoDetect = autoDetectEnabled.checked;
      await chrome.storage.local.set({ mewtrack_data: mewtrackData });
      
      showStatus(i18n.getMessage('autoDetectSettingUpdated'), 'success');
    } catch (error) {
      showStatus(i18n.getMessage('saveSettingsFailed') + ': ' + error.message, 'error');
    }
  });

  // 导出数据
  exportDataBtn.addEventListener('click', async () => {
    try {
      const data = await chrome.storage.local.get(null);
      const jsonData = JSON.stringify(data, null, 2);
      
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `mewtrack_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      showStatus(i18n.getMessage('dataExportSuccess'), 'success');
    } catch (error) {
      showStatus(i18n.getMessage('exportFailed') + ': ' + error.message, 'error');
    }
  });

  // 导入数据
  importDataBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (confirm(i18n.getMessage('confirmImportData'))) {
          await chrome.storage.local.set(data);
          showStatus(i18n.getMessage('dataImportSuccess'), 'success');
          
          // 重新加载设置
          await loadSettings();
        }
      } catch (error) {
        showStatus(i18n.getMessage('importFailed') + ': ' + error.message, 'error');
      }
    });
    
    input.click();
  });

  // 重置所有数据
  resetDataBtn.addEventListener('click', async () => {
    if (confirm(i18n.getMessage('confirmResetData'))) {
      try {
        await chrome.storage.local.clear();
        showStatus(i18n.getMessage('allDataReset'), 'success');
        
        // 重新加载设置
        apiKeyInput.value = '';
        notificationsEnabled.checked = true;
        autoDetectEnabled.checked = true;
        removeApiKeyBtn.disabled = true;
        testApiKeyBtn.disabled = true;
        await loadCustomSites();
      } catch (error) {
        showStatus(i18n.getMessage('resetFailed') + ': ' + error.message, 'error');
      }
    }
  });

  // 添加自定义网站
  addCustomSiteBtn.addEventListener('click', async () => {
    const url = customSiteUrlInput.value.trim();
    const name = customSiteNameInput.value.trim();
    
    if (!url) {
      showStatus(i18n.getMessage('pleaseEnterSiteUrl'), 'error');
      return;
    }
    
    try {
      const storage = mewTrackStorage || new MewTrackStorage();
      const result = await storage.addCustomSite(url, name);
      
      if (result.success) {
        showStatus(i18n.getMessage('siteAddedSuccess'), 'success');
        customSiteUrlInput.value = '';
        customSiteNameInput.value = '';
        await loadCustomSites();
        
        // 更新manifest的host_permissions（需要在实际部署时手动更新）
        if (typeof logger !== 'undefined') {
          logger.info(`提示：需要在manifest.json中添加 ${result.domain} 的权限`);
        }
      } else {
        showStatus(result.error || i18n.getMessage('addFailed'), 'error');
      }
    } catch (error) {
      showStatus(i18n.getMessage('addFailed') + ': ' + error.message, 'error');
    }
  });

  // 加载自定义网站列表
  async function loadCustomSites() {
    try {
      const storage = mewTrackStorage || new MewTrackStorage();
      const customSites = await storage.getCustomSites();
      
      if (Object.keys(customSites).length === 0) {
        customSitesContainer.innerHTML = `<div class="empty-custom-sites">${i18n.getMessage('noCustomSites')}</div>`;
        return;
      }
      
      const sitesHTML = Object.entries(customSites).map(([domain, site]) => `
        <div class="custom-site-item" data-domain="${domain}">
          <div class="custom-site-info">
            <div class="custom-site-name">${site.name}</div>
            <div class="custom-site-url">${domain}</div>
          </div>
          <div class="custom-site-actions">
            <label class="custom-site-toggle">
              <input type="checkbox" ${site.enabled ? 'checked' : ''} data-domain="${domain}">
              <span>${i18n.getMessage('enable')}</span>
            </label>
            <button class="btn-remove" data-domain="${domain}">${i18n.getMessage('delete')}</button>
          </div>
        </div>
      `).join('');
      
      customSitesContainer.innerHTML = sitesHTML;
      
      // 绑定事件
      customSitesContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', async (e) => {
          const domain = e.target.dataset.domain;
          await storage.toggleCustomSite(domain, e.target.checked);
          showStatus(i18n.format('siteToggleSuccess', {
            action: e.target.checked ? i18n.getMessage('enabled') : i18n.getMessage('disabled')
          }), 'success');
        });
      });
      
      customSitesContainer.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const domain = e.target.dataset.domain;
          if (confirm(i18n.format('confirmDeleteSite', { name: customSites[domain].name }))) {
            await storage.removeCustomSite(domain);
            showStatus(i18n.getMessage('siteDeleted'), 'success');
            await loadCustomSites();
          }
        });
      });
    } catch (error) {
      if (typeof logger !== 'undefined') {
        logger.error('加载自定义网站失败:', error);
      }
      customSitesContainer.innerHTML = `<div class="empty-custom-sites">${i18n.getMessage('loadFailed')}</div>`;
    }
  }

  // 加载现有设置
  async function loadSettings() {
    try {
      const data = await chrome.storage.local.get(['openaiApiKey', 'deepseekApiKey', 'mewtrack_data', 'userLanguage']);
      
      // 语言设置
      const currentLang = data.userLanguage || chrome.i18n.getUILanguage();
      languageToggle.checked = currentLang === 'en';
      
      // OpenAI API密钥
      if (data.openaiApiKey) {
        apiKeyInput.value = data.openaiApiKey;
        removeApiKeyBtn.disabled = false;
        testApiKeyBtn.disabled = false;
      } else {
        removeApiKeyBtn.disabled = true;
        testApiKeyBtn.disabled = true;
      }
      
      // DeepSeek API密钥
      if (data.deepseekApiKey) {
        deepseekApiKeyInput.value = data.deepseekApiKey;
        removeDeepseekApiKeyBtn.disabled = false;
        testDeepseekApiKeyBtn.disabled = false;
      } else {
        removeDeepseekApiKeyBtn.disabled = true;
        testDeepseekApiKeyBtn.disabled = true;
      }
      
      // 通知设置
      if (data.mewtrack_data && data.mewtrack_data.settings) {
        notificationsEnabled.checked = data.mewtrack_data.settings.notifications !== false;
        autoDetectEnabled.checked = data.mewtrack_data.settings.autoDetect !== false;
      }
      
      // 加载自定义网站
      await loadCustomSites();
    } catch (error) {
      if (typeof logger !== 'undefined') {
        logger.error('加载设置失败:', error);
      }
    }
  }

  // 显示状态消息 - OpenAI
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    
    // 3秒后自动隐藏
    setTimeout(() => {
      statusMessage.className = 'status-message';
    }, 3000);
  }
  
  // 显示状态消息 - DeepSeek
  function showDeepseekStatus(message, type) {
    deepseekStatusMessage.textContent = message;
    deepseekStatusMessage.className = `status-message ${type}`;
    
    // 3秒后自动隐藏
    setTimeout(() => {
      deepseekStatusMessage.className = 'status-message';
    }, 3000);
  }
});