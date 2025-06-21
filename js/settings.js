// 设置页面的JavaScript逻辑
document.addEventListener('DOMContentLoaded', async () => {
  // 获取DOM元素
  const apiKeyInput = document.getElementById('api-key');
  const toggleVisibilityBtn = document.getElementById('toggle-visibility');
  const saveApiKeyBtn = document.getElementById('save-api-key');
  const testApiKeyBtn = document.getElementById('test-api-key');
  const removeApiKeyBtn = document.getElementById('remove-api-key');
  const statusMessage = document.getElementById('status-message');
  
  const notificationsEnabled = document.getElementById('notifications-enabled');
  const autoDetectEnabled = document.getElementById('auto-detect-enabled');
  
  const exportDataBtn = document.getElementById('export-data');
  const importDataBtn = document.getElementById('import-data');
  const resetDataBtn = document.getElementById('reset-data');
  
  const customSiteUrlInput = document.getElementById('custom-site-url');
  const customSiteNameInput = document.getElementById('custom-site-name');
  const addCustomSiteBtn = document.getElementById('add-custom-site');
  const customSitesContainer = document.getElementById('custom-sites-container');

  // 加载现有设置
  await loadSettings();

  // 切换密码可见性
  toggleVisibilityBtn.addEventListener('click', () => {
    const type = apiKeyInput.type === 'password' ? 'text' : 'password';
    apiKeyInput.type = type;
    toggleVisibilityBtn.textContent = type === 'password' ? '👁️' : '🙈';
  });

  // 保存API密钥
  saveApiKeyBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus('请输入API密钥', 'error');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      showStatus('API密钥格式不正确，应该以 sk- 开头', 'error');
      return;
    }

    try {
      await chrome.storage.local.set({ openaiApiKey: apiKey });
      showStatus('API密钥已保存成功！', 'success');
      
      // 更新按钮状态
      removeApiKeyBtn.disabled = false;
      testApiKeyBtn.disabled = false;
    } catch (error) {
      showStatus('保存失败：' + error.message, 'error');
    }
  });

  // 测试API密钥
  testApiKeyBtn.addEventListener('click', async () => {
    showStatus('正在测试API连接...', 'info');
    
    try {
      const data = await chrome.storage.local.get(['openaiApiKey']);
      if (!data.openaiApiKey) {
        showStatus('请先保存API密钥', 'error');
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
        showStatus('API连接测试成功！密钥有效。', 'success');
      } else {
        const error = await response.json();
        showStatus(`API测试失败：${error.error?.message || '未知错误'}`, 'error');
      }
    } catch (error) {
      showStatus('测试失败：' + error.message, 'error');
    }
  });

  // 删除API密钥
  removeApiKeyBtn.addEventListener('click', async () => {
    if (confirm('确定要删除API密钥吗？')) {
      try {
        await chrome.storage.local.remove(['openaiApiKey']);
        apiKeyInput.value = '';
        showStatus('API密钥已删除', 'success');
        
        // 更新按钮状态
        removeApiKeyBtn.disabled = true;
        testApiKeyBtn.disabled = true;
      } catch (error) {
        showStatus('删除失败：' + error.message, 'error');
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
      
      showStatus('通知设置已更新', 'success');
    } catch (error) {
      showStatus('保存设置失败：' + error.message, 'error');
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
      
      showStatus('自动检测设置已更新', 'success');
    } catch (error) {
      showStatus('保存设置失败：' + error.message, 'error');
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
      showStatus('数据导出成功', 'success');
    } catch (error) {
      showStatus('导出失败：' + error.message, 'error');
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
        
        if (confirm('导入数据将覆盖现有数据，确定要继续吗？')) {
          await chrome.storage.local.set(data);
          showStatus('数据导入成功', 'success');
          
          // 重新加载设置
          await loadSettings();
        }
      } catch (error) {
        showStatus('导入失败：' + error.message, 'error');
      }
    });
    
    input.click();
  });

  // 重置所有数据
  resetDataBtn.addEventListener('click', async () => {
    if (confirm('确定要重置所有数据吗？此操作不可撤销！')) {
      if (confirm('再次确认：真的要删除所有学习记录和设置吗？')) {
        try {
          await chrome.storage.local.clear();
          showStatus('所有数据已重置', 'success');
          
          // 重新加载设置
          apiKeyInput.value = '';
          notificationsEnabled.checked = true;
          autoDetectEnabled.checked = true;
          removeApiKeyBtn.disabled = true;
          testApiKeyBtn.disabled = true;
          await loadCustomSites();
        } catch (error) {
          showStatus('重置失败：' + error.message, 'error');
        }
      }
    }
  });

  // 添加自定义网站
  addCustomSiteBtn.addEventListener('click', async () => {
    const url = customSiteUrlInput.value.trim();
    const name = customSiteNameInput.value.trim();
    
    if (!url) {
      showStatus('请输入网站地址', 'error');
      return;
    }
    
    try {
      const storage = mewTrackStorage || new MewTrackStorage();
      const result = await storage.addCustomSite(url, name);
      
      if (result.success) {
        showStatus('网站添加成功！', 'success');
        customSiteUrlInput.value = '';
        customSiteNameInput.value = '';
        await loadCustomSites();
        
        // 更新manifest的host_permissions（需要在实际部署时手动更新）
        if (typeof logger !== 'undefined') {
          logger.info(`提示：需要在manifest.json中添加 ${result.domain} 的权限`);
        }
      } else {
        showStatus(result.error || '添加失败', 'error');
      }
    } catch (error) {
      showStatus('添加失败：' + error.message, 'error');
    }
  });

  // 加载自定义网站列表
  async function loadCustomSites() {
    try {
      const storage = mewTrackStorage || new MewTrackStorage();
      const customSites = await storage.getCustomSites();
      
      if (Object.keys(customSites).length === 0) {
        customSitesContainer.innerHTML = '<div class="empty-custom-sites">还没有添加自定义网站</div>';
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
              <span>启用</span>
            </label>
            <button class="btn-remove" data-domain="${domain}">删除</button>
          </div>
        </div>
      `).join('');
      
      customSitesContainer.innerHTML = sitesHTML;
      
      // 绑定事件
      customSitesContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', async (e) => {
          const domain = e.target.dataset.domain;
          await storage.toggleCustomSite(domain, e.target.checked);
          showStatus(`网站${e.target.checked ? '启用' : '禁用'}成功`, 'success');
        });
      });
      
      customSitesContainer.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const domain = e.target.dataset.domain;
          if (confirm(`确定要删除 ${customSites[domain].name} 吗？`)) {
            await storage.removeCustomSite(domain);
            showStatus('网站已删除', 'success');
            await loadCustomSites();
          }
        });
      });
    } catch (error) {
      if (typeof logger !== 'undefined') {
        logger.error('加载自定义网站失败:', error);
      }
      customSitesContainer.innerHTML = '<div class="empty-custom-sites">加载失败</div>';
    }
  }

  // 加载现有设置
  async function loadSettings() {
    try {
      const data = await chrome.storage.local.get(['openaiApiKey', 'mewtrack_data']);
      
      // API密钥
      if (data.openaiApiKey) {
        apiKeyInput.value = data.openaiApiKey;
        removeApiKeyBtn.disabled = false;
        testApiKeyBtn.disabled = false;
      } else {
        removeApiKeyBtn.disabled = true;
        testApiKeyBtn.disabled = true;
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

  // 显示状态消息
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    
    // 3秒后自动隐藏
    setTimeout(() => {
      statusMessage.className = 'status-message';
    }, 3000);
  }
});