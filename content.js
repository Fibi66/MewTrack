// 内容脚本 - 在网页中运行
(async function() {
  'use strict';

  // 防止重复弹窗的标志
  let isShowingDialog = false;
  let lastDetectionTime = 0;
  let lastDetectionUrl = '';
  const MIN_DETECTION_INTERVAL = 2000; // 2秒内不重复检测同一URL
  // Track domains being processed to prevent duplicates
  const processingDomains = new Set();

  // 检查扩展上下文是否有效
  function isExtensionContextValid() {
    try {
      // 尝试访问 chrome.runtime.id 来验证扩展是否仍然有效
      return !!(chrome && chrome.runtime && chrome.runtime.id && chrome.storage && chrome.storage.local);
    } catch (error) {
      return false;
    }
  }

  // 如果扩展上下文已失效，停止执行
  if (!isExtensionContextValid()) {
    // Silently stop execution when context is invalid
    // Only show UI notice without console logs
    const hostname = window.location.hostname.toLowerCase();
    const supportedDomains = ['youtube.com', 'bilibili.com', 'leetcode.com', 'github.com', 'coursera.org'];
    
    if (supportedDomains.some(domain => hostname.includes(domain))) {
      // 显示页面内提示
      if (typeof contextInvalidNotice !== 'undefined') {
        contextInvalidNotice.show();
      }
    }
    return;
  }

  // 确保所有实例可用
  const mewTrackStorage = new MewTrackStorage();
  const siteDetector = new SiteDetector();
  
  // 初始化数据检查
  async function initializeDataIfNeeded() {
    try {
      // 再次检查扩展上下文
      if (!isExtensionContextValid()) {
        if (typeof logger !== 'undefined') {
          logger.contextError('扩展上下文在初始化时失效');
        }
        return false;
      }
      
      const data = await mewTrackStorage.getAllData();
      if (!data.globalStats) {
        if (typeof logger !== 'undefined') {
          logger.info('内容脚本检测到数据结构不完整，初始化中...');
        }
        await mewTrackStorage.saveAllData(mewTrackStorage.defaultData);
        if (typeof logger !== 'undefined') {
          logger.info('数据初始化完成');
        }
      }
      return true;
    } catch (error) {
      if (typeof logger !== 'undefined') {
        logger.error('数据初始化失败:', error);
      }
      return false;
    }
  }
  
  // 等待页面加载完成
  function waitForPageLoad() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve, { once: true });
      }
    });
  }

  // 主要检测逻辑
  async function runDetection() {
    try {
      // 防止短时间内重复检测同一URL
      const now = Date.now();
      const currentUrl = window.location.href;
      
      // 如果是同一URL且间隔太短，跳过
      if (currentUrl === lastDetectionUrl && now - lastDetectionTime < MIN_DETECTION_INTERVAL) {
        if (typeof logger !== 'undefined') {
          logger.debug('相同URL检测间隔太短，跳过此次检测');
        }
        return;
      }
      
      // 如果URL变化了，立即允许检测（对于SPA很重要）
      if (currentUrl !== lastDetectionUrl) {
        if (typeof logger !== 'undefined') {
          logger.debug('URL已变化，执行新的检测');
        }
      }
      
      lastDetectionTime = now;
      lastDetectionUrl = currentUrl;

      // 检查扩展上下文
      if (!isExtensionContextValid()) {
        // Silently stop when context is invalid
        return;
      }
      
      // 初始化OpenAI集成
      if (typeof openAIIntegration !== 'undefined') {
        await openAIIntegration.init();
      }
      
      const domain = siteDetector.getCurrentDomain();
      if (typeof logger !== 'undefined') {
        logger.debug(`当前检测域名: ${domain}`);
        logger.debug(`完整URL: ${window.location.href}`);
        logger.debug(`规范化域名: ${mewTrackStorage.normalizeDomain(domain)}`);
      }
      
      // 检查是否为支持的网站
      const isLearningSite = await siteDetector.isLearningSite(domain);
      if (typeof logger !== 'undefined') {
        logger.debug(`${domain} 是否为学习网站: ${isLearningSite}`);
      }
      
      if (!isLearningSite) {
        if (typeof logger !== 'undefined') {
          logger.debug(`${domain} 不是支持的学习网站`);
        }
        return;
      }
      
      const siteInfo = await siteDetector.getSiteInfo(domain);
      if (typeof logger !== 'undefined') {
        logger.info(`检测到学习网站 ${siteInfo?.name} (${domain})`);
      }
      
      if (!siteInfo) {
        if (typeof logger !== 'undefined') {
          logger.debug(`无法获取 ${domain} 的网站信息`);
        }
        return;
      }
      
      // 检查今天是否已经打卡过这个网站
      const hasVisitedToday = await mewTrackStorage.hasVisitedToday(domain);
      if (hasVisitedToday) {
        if (typeof logger !== 'undefined') {
          logger.debug(`今天已经为 ${domain} 打过卡了。`);
        }
        return;
      }

      // 检查是否正在显示弹窗
      if (isShowingDialog) {
        if (typeof logger !== 'undefined') {
          logger.debug('弹窗正在显示中，跳过此次检测');
        }
        return;
      }
      
      // Check if this domain is already being processed
      if (processingDomains.has(domain)) {
        if (typeof logger !== 'undefined') {
          logger.debug(`${domain} 正在处理中，跳过重复检测`);
        }
        return;
      }
      
      // Mark domain as being processed
      processingDomains.add(domain);
      
      // 检测是否为学习内容
      let isLearningContent = siteInfo.alwaysLearning;
      
      // 对于需要内容检测的网站（如YouTube），进行额外的AI检测
      if (siteInfo.needsContentDetection) {
        if (siteInfo.type === 'video' && !siteDetector.isVideoPage()) {
          if (typeof logger !== 'undefined') {
            logger.debug(`${domain} 不是视频页面，跳过检测`);
            logger.debug(`URL路径: ${window.location.pathname}`);
            logger.debug(`是否为视频页: ${siteDetector.isVideoPage()}`);
          }
          processingDomains.delete(domain); // 清理处理标记
          return;
        }
        
        // 对于视频网站，需要等待更长时间确保内容加载
        const waitTime = siteInfo.type === 'video' ? 3000 : 2000;
        if (typeof logger !== 'undefined') {
          logger.debug(`等待${waitTime}ms让页面加载完成`);
        }
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // 检测内容（但不影响打卡流程）
        const detectedAsLearning = await siteDetector.detectLearningContent();
        if (typeof logger !== 'undefined') {
          logger.info(`${domain} AI内容检测结果: ${detectedAsLearning ? '学习内容' : '娱乐内容'}`);
        }
        // 可以在这里记录检测结果，但不改变isLearningContent的值
      }
      
      if (isLearningContent) {
        // 使用规范化的域名
        const normalizedDomain = mewTrackStorage.normalizeDomain(domain);
        
        if (typeof logger !== 'undefined') {
          logger.debug(`处理学习内容 - 原始域名: ${domain}, 规范化域名: ${normalizedDomain}`);
        }
        
        const siteData = await mewTrackStorage.getSiteData(normalizedDomain);
        const globalStats = await mewTrackStorage.getGlobalStats();
        const isFirstTime = siteData.streak === 0;
        
        // 如果是第一次访问或没有设置目标天数，显示目标设置弹窗
        if (siteData.targetDays === 0) {
          if (typeof logger !== 'undefined') {
            logger.info(`显示目标天数设置弹窗 - ${siteInfo.name}`);
          }
          isShowingDialog = true;
          try {
            await checkInDialog.show(siteInfo.name, window.location.href, normalizedDomain);
          } finally {
            isShowingDialog = false;
          }
        } else {
          // 已经设置了目标天数，显示正常的打卡弹窗
          if (typeof logger !== 'undefined') {
            logger.info(`准备显示打卡弹窗 - ${siteInfo.name}`);
          }
          
          isShowingDialog = true;
          try {
            await notificationManager.showLearningNotification(
              normalizedDomain, 
              siteInfo.name, 
              globalStats.totalStreak, // 使用全局streak显示猫猫成长
              isFirstTime,
              async () => {
              // 用户点击"确认打卡"后执行的回调
              if (typeof logger !== 'undefined') {
                logger.info(`用户确认打卡 - ${siteInfo.name}`);
              }
              
              // 再次检查扩展上下文
              if (!isExtensionContextValid()) {
                // Silently return when context is invalid
                return;
              }
              
              const result = await mewTrackStorage.updateSiteVisit(normalizedDomain, true);
              
              if (result.isNewVisit) {
                const progress = await mewTrackStorage.getTargetProgress(normalizedDomain);
                let message = `已为 ${siteInfo.name} 打卡成功！总连续天数: ${result.globalStats.totalStreak} 天`;
                
                if (progress && !progress.isCompleted) {
                  message += `\n目标进度: ${progress.current}/${progress.target} 天 (${progress.percentage}%)`;
                } else if (progress && progress.isCompleted) {
                  message += `\n🎉 恭喜完成目标！`;
                }
                
                notificationManager.showToast(message);
                if (typeof logger !== 'undefined') {
                  logger.info(message);
                }
              }
            }
          );
          } finally {
            isShowingDialog = false;
          }
        }
      } else {
        if (typeof logger !== 'undefined') {
          logger.debug(`${domain} 当前页面不是学习内容`);
        }
      }
      
    } catch (error) {
      if (typeof logger !== 'undefined') {
        logger.error('检测错误:', error);
      }
    } finally {
      // Always remove domain from processing set
      processingDomains.delete(domain);
    }
  }

  // 监听页面变化（用于 SPA 应用，如 YouTube）
  function observePageChanges() {
    let lastUrl = window.location.href;
    const observer = new MutationObserver(() => {
      // 检查扩展上下文
      if (!isExtensionContextValid()) {
        // Silently stop observing when context is invalid
        observer.disconnect();
        return;
      }
      
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        if (typeof logger !== 'undefined') {
          logger.debug(`检测到页面变化 - ${currentUrl}`);
        }
        // URL 变化后延迟检测
        setTimeout(runDetection, 1000);
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    return observer;
  }

  // 初始化
  async function init() {
    await waitForPageLoad();
    
    const initSuccess = await initializeDataIfNeeded();
    if (!initSuccess) {
      if (typeof logger !== 'undefined') {
        logger.error('初始化失败，停止执行');
      }
      return;
    }
    
    if (typeof logger !== 'undefined') {
      logger.info('MewTrack 已启动，开始检测... 🐱');
      logger.debug(`当前域名: ${window.location.hostname}`);
    }
    
    // 立即运行一次检测
    await runDetection();
    
    // 开始监听页面变化
    const observer = observePageChanges();
    
    // 定期检测（用于某些动态加载的内容）
    const intervalId = setInterval(async () => {
      // 检查扩展上下文
      if (!isExtensionContextValid()) {
        // Silently stop periodic checks when context is invalid
        clearInterval(intervalId);
        if (observer) observer.disconnect();
        return;
      }
      
      const domain = siteDetector.getCurrentDomain();
      const isLearningSite = await siteDetector.isLearningSite(domain);
      if (isLearningSite) {
        const hasVisitedToday = await mewTrackStorage.hasVisitedToday(domain);
        if (!hasVisitedToday) {
          if (typeof logger !== 'undefined') {
            logger.debug('定期检测触发');
          }
          await runDetection();
        }
      }
    }, 30000); // 每30秒检测一次
  }

  init();

})(); 