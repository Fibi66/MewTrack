// 弹出窗口逻辑
document.addEventListener('DOMContentLoaded', async () => {
  // 初始化i18n
  await i18n.init();
  i18n.applyTranslations();
  // 检查扩展上下文是否有效
  function isExtensionContextValid() {
    try {
      return !!(chrome && chrome.storage && chrome.storage.local);
    } catch (error) {
      return false;
    }
  }

  // 如果扩展上下文已失效，显示错误信息
  if (!isExtensionContextValid()) {
    document.body.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #dc3545;">
        <h3>🔄 插件需要重新加载</h3>
        <p>检测到插件已更新，请重新加载插件页面。</p>
        <button onclick="window.close()" style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">关闭</button>
      </div>
    `;
    return;
  }

  const storage = new MewTrackStorage();
  const siteDetector = new SiteDetector();

  // 初始化数据检查
  async function initializeData() {
    try {
      if (typeof logger !== 'undefined') {
        logger.debug('初始化数据检查...');
      }
      const data = await storage.getAllData();
      if (typeof logger !== 'undefined') {
        logger.debug('当前数据:', data);
      }
      
      // 如果数据结构不完整，重新初始化
      if (!data.globalStats) {
        if (typeof logger !== 'undefined') {
          logger.info('数据结构不完整，重新初始化...');
        }
        await storage.saveAllData(storage.defaultData);
        if (typeof logger !== 'undefined') {
          logger.info('数据初始化完成');
        }
      }
    } catch (error) {
      if (typeof logger !== 'undefined') {
        logger.error('数据初始化失败:', error);
      }
    }
  }

  const activeSitesEl = document.getElementById('activeSites');
  const totalStreakEl = document.getElementById('totalStreak');
  const sitesListEl = document.getElementById('sitesList');
  const emptyStateEl = document.getElementById('emptyState');
  const loadingEl = document.getElementById('loading');
  const settingsBtn = document.getElementById('settingsBtn');
  const exportBtn = document.getElementById('exportBtn');
  const aiToggle = document.getElementById('aiToggle');

  function showLoading() {
    loadingEl.classList.remove('hidden');
  }

  function hideLoading() {
    loadingEl.classList.add('hidden');
  }

  function getCatImage(streak) {
    let stage = 0;
    if (streak >= 30) stage = 3;
    else if (streak >= 10) stage = 2;
    else if (streak >= 1) stage = 1;
    return `images/cat-stage-${stage}.png`;
  }

  async function getSafeInfo(domain) {
    try {
      const info = await siteDetector.getSiteInfo(domain);
      return info || { name: domain, type: 'unknown' };
    } catch (error) {
      if (typeof logger !== 'undefined') {
        logger.warn(`获取网站信息失败: ${domain}`, error);
      }
      return { name: domain, type: 'unknown' };
    }
  }

  async function render() {
    showLoading();
    
    try {
      const stats = await storage.getStats();
      const globalStats = await storage.getGlobalStats();
      
      // 确保globalStats有效
      if (!globalStats) {
        if (typeof logger !== 'undefined') {
          logger.error('globalStats is null or undefined');
        }
        sitesListEl.innerHTML = '<div class="error-message">数据初始化中，请稍后刷新</div>';
        hideLoading();
        return;
      }
      
      activeSitesEl.textContent = stats.activeSites;
      totalStreakEl.textContent = stats.totalStreak;

      const sitesData = await storage.getAllSitesData();
      
      if (typeof logger !== 'undefined') {
        logger.debug('所有网站数据:', sitesData);
        logger.debug('YouTube数据:', sitesData['youtube.com']);
        logger.debug('www.youtube.com数据:', sitesData['www.youtube.com']);
      }
      
      const sites = Object.entries(sitesData);

      if (sites.length === 0) {
        sitesListEl.innerHTML = '';
        emptyStateEl.classList.remove('hidden');
      } else {
        emptyStateEl.classList.add('hidden');
        sites.sort(([, a], [, b]) => b.streak - a.streak);
        
        // 添加总体猫猫成长状态
        const globalCatImage = getCatImage(globalStats.totalStreak);
        const globalCatHTML = `
          <div class="global-cat-section">
            <h3>🐱 ${i18n.getMessage('globalGrowthStatus')}</h3>
            <div class="site-item global-cat">
              <div class="cat-container">
                <img src="${globalCatImage}" alt="${i18n.getMessage('globalCat')}" class="cat-image">
              </div>
              <div class="site-info">
                <div class="site-name">${i18n.getMessage('totalLearningRecord')}</div>
                <div class="site-stats">
                  ${i18n.format('globalStatsText', {
                    streak: globalStats.totalStreak,
                    total: globalStats.totalDays,
                    today: stats.checkedSitesToday
                  })}
                </div>
              </div>
              <span class="streak-badge global-badge">${globalStats.totalStreak}</span>
            </div>
          </div>
          <div class="section-divider"></div>
        `;
        
        const sitesHTML = await Promise.all(sites.map(async ([domain, siteData]) => {
          const siteInfo = await getSafeInfo(domain);
          const catImage = getCatImage(siteData.streak);
          const isActive = siteData.isActive;
          const progress = await storage.getTargetProgress(domain);
          
          let progressHTML = '';
          if (progress) {
            progressHTML = `
              <div class="progress-container">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${progress.percentage}%"></div>
                </div>
                <div class="progress-text">
                  ${i18n.format('progressText', {
                    current: progress.current,
                    target: progress.target,
                    percentage: progress.percentage
                  })}
                  ${progress.isCompleted ? `<span class="completed">✓ ${i18n.getMessage('completed')}</span>` : ''}
                </div>
              </div>
            `;
          }
          
          return `
            <div class="site-item ${isActive ? '' : 'inactive'}" data-domain="${domain}">
              <div class="cat-container">
                <img src="${catImage}" alt="${siteInfo.name}" class="cat-image">
              </div>
              <div class="site-info">
                <div class="site-name">${siteInfo.name}</div>
                <div class="site-stats">
                  ${i18n.format('siteStatsText', {
                    streak: siteData.streak,
                    total: siteData.totalDays
                  })}
                </div>
                ${progressHTML}
              </div>
              <span class="streak-badge">${siteData.streak}</span>
              <button class="delete-btn" data-domain="${domain}" title="${i18n.getMessage('deleteSite') || '删除网站'}">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 2C6 1.44772 6.44772 1 7 1H9C9.55228 1 10 1.44772 10 2V3H14C14.5523 3 15 3.44772 15 4C15 4.55228 14.5523 5 14 5H13V13C13 14.1046 12.1046 15 11 15H5C3.89543 15 3 14.1046 3 13V5H2C1.44772 5 1 4.55228 1 4C1 3.44772 1.44772 3 2 3H6V2ZM6 5H5V13H11V5H10M6 5V11M8 5V11M10 5V11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          `;
        }));
        
        sitesListEl.innerHTML = globalCatHTML + sitesHTML.join('');
      }
    } catch (error) {
      if (typeof logger !== 'undefined') {
        logger.error('渲染错误:', error);
      }
      sitesListEl.innerHTML = `<div class="error-message">${i18n.getMessage('loadError')}<br/>${i18n.getMessage('errorMessage')}: ${error.message}</div>`;
    }

    hideLoading();
  }

  settingsBtn.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('settings.html'));
    }
  });

  exportBtn.addEventListener('click', async () => {
    const data = await storage.getAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mewtrack-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  sitesListEl.addEventListener('click', async (e) => {
    // 处理删除按钮点击
    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
      e.stopPropagation(); // 阻止事件冒泡
      const domain = deleteBtn.dataset.domain;
      
      // 确认删除
      if (confirm(i18n.getMessage('confirmDeleteSite') || `确定要删除 ${domain} 的学习记录吗？`)) {
        try {
          await storage.resetSiteData(domain);
          // 重新渲染
          await render();
          showToast(i18n.getMessage('siteDeletedSuccess') || '网站已删除', 'success');
        } catch (error) {
          if (typeof logger !== 'undefined') {
            logger.error('删除网站失败:', error);
          }
          showToast(i18n.getMessage('siteDeleteFailed') || '删除失败', 'error');
        }
      }
      return;
    }
    
    // 处理网站点击
    const siteItem = e.target.closest('.site-item');
    if (siteItem && !siteItem.classList.contains('global-cat')) {
      const domain = siteItem.dataset.domain;
      
      // 安全使用chrome.tabs.create
      try {
        if (chrome && chrome.tabs && chrome.tabs.create) {
          chrome.tabs.create({ url: `https://${domain}` });
        } else {
          // 如果Chrome API不可用，使用window.open作为后备
          window.open(`https://${domain}`, '_blank');
        }
      } catch (error) {
        if (typeof logger !== 'undefined') {
          logger.warn('打开网站失败:', error);
        }
        // 后备方案
        window.open(`https://${domain}`, '_blank');
      }
    }
  });

  // 加载AI设置状态
  async function loadAIToggleState() {
    try {
      const aiEnabled = await storage.getAIContentDetectionSetting();
      aiToggle.checked = aiEnabled;
    } catch (error) {
      if (typeof logger !== 'undefined') {
        logger.error('加载AI设置失败:', error);
      }
    }
  }

  // AI开关事件处理
  aiToggle.addEventListener('change', async (e) => {
    try {
      const enabled = e.target.checked;
      await storage.setAIContentDetectionSetting(enabled);
      
      // 显示状态提示
      const statusText = enabled ? i18n.getMessage('aiEnabled') : i18n.getMessage('aiDisabled');
      if (typeof logger !== 'undefined') {
        logger.info(statusText);
      }
      
      // 可以在这里添加一个简单的Toast提示
      showToast(statusText, enabled ? 'success' : 'info');
    } catch (error) {
      if (typeof logger !== 'undefined') {
        logger.error('保存AI设置失败:', error);
      }
      // 如果保存失败，恢复开关状态
      e.target.checked = !e.target.checked;
      showToast(i18n.getMessage('settingSaveFailed'), 'error');
    }
  });

  // 简单的Toast提示函数
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      color: white;
      z-index: 10000;
      transition: all 0.3s ease;
      background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#667eea'};
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 2000);
  }

  // 初始化数据并渲染
  await initializeData();
  await loadAIToggleState();
  await render();
}); 