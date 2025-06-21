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

  const totalSitesEl = document.getElementById('totalSites');
  const activeSitesEl = document.getElementById('activeSites');
  const totalStreakEl = document.getElementById('totalStreak');
  const maxStreakEl = document.getElementById('maxStreak');
  const sitesListEl = document.getElementById('sitesList');
  const emptyStateEl = document.getElementById('emptyState');
  const loadingEl = document.getElementById('loading');
  const settingsBtn = document.getElementById('settingsBtn');
  const exportBtn = document.getElementById('exportBtn');

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
      
      totalSitesEl.textContent = stats.totalSites;
      activeSitesEl.textContent = stats.activeSites;
      totalStreakEl.textContent = stats.totalStreak;
      maxStreakEl.textContent = stats.maxStreak;

      const sitesData = await storage.getAllSitesData();
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
            <h3>🐱 总体成长状态</h3>
            <div class="site-item global-cat">
              <div class="cat-container">
                <img src="${globalCatImage}" alt="总体猫猫" class="cat-image">
              </div>
              <div class="site-info">
                <div class="site-name">总学习记录</div>
                <div class="site-stats">
                  连续 ${globalStats.totalStreak} 天 · 总计 ${globalStats.totalDays} 天 · 今日已打卡 ${stats.checkedSitesToday} 个网站
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
                  ${progress.current}/${progress.target} 天 (${progress.percentage}%)
                  ${progress.isCompleted ? '<span class="completed">✓ 已完成</span>' : ''}
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
                  连续 ${siteData.streak} 天 · 总计 ${siteData.totalDays} 天
                </div>
                ${progressHTML}
              </div>
              <span class="streak-badge">${siteData.streak}</span>
            </div>
          `;
        }));
        
        sitesListEl.innerHTML = globalCatHTML + sitesHTML.join('');
      }
    } catch (error) {
      if (typeof logger !== 'undefined') {
        logger.error('渲染错误:', error);
      }
      sitesListEl.innerHTML = '<div class="error-message">加载数据时出错，请刷新重试<br/>错误信息: ' + error.message + '</div>';
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

  sitesListEl.addEventListener('click', (e) => {
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

  // 初始化数据并渲染
  await initializeData();
  await render();
}); 