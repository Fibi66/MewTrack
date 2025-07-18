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

  // 检测未知网站的内容
  async function detectUnknownSiteContent(domain) {
    try {
      // 检查AI识别设置
      let aiEnabled = true;
      if (typeof mewTrackStorage !== 'undefined') {
        try {
          aiEnabled = await mewTrackStorage.getAIContentDetectionSetting();
          if (typeof logger !== 'undefined') {
            logger.debug('AI内容检测设置:', aiEnabled ? '已开启' : '已关闭');
          }
        } catch (error) {
          if (typeof logger !== 'undefined') {
            logger.debug('获取AI设置失败，使用默认值:', error);
          }
        }
      }

      if (!aiEnabled) {
        if (typeof logger !== 'undefined') {
          logger.info('AI智能检测已关闭，跳过未知网站检测');
        }
        return false;
      }

      // 使用OpenAI API分析页面内容
      if (typeof openAIIntegration !== 'undefined') {
        await openAIIntegration.init();
        if (typeof logger !== 'undefined') {
          logger.debug('OpenAI API密钥状态:', openAIIntegration.apiKey ? '已配置' : '未配置');
        }
        
        if (openAIIntegration.apiKey) {
          try {
            // 获取页面标题和描述
            const pageTitle = document.title || '';
            const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
            const h1Text = document.querySelector('h1')?.textContent || '';
            const pageContent = `${pageTitle} ${metaDescription} ${h1Text}`;
            
            if (typeof logger !== 'undefined') {
              logger.debug('准备分析未知网站内容:', {
                domain: domain,
                title: pageTitle,
                description: metaDescription.substring(0, 100) + '...',
                url: window.location.href
              });
            }
            
            const analysis = await openAIIntegration.analyzeContent(
              pageTitle,
              pageContent,
              window.location.href
            );
            
            if (analysis && analysis.isLearning !== undefined) {
              if (typeof logger !== 'undefined') {
                logger.info('AI智能分析完成:', {
                  domain: domain,
                  isLearning: analysis.isLearning,
                  contentType: analysis.contentType,
                  reason: analysis.reason
                });
              }
              return analysis.isLearning;
            } else {
              if (typeof logger !== 'undefined') {
                logger.warn('AI返回了无效的分析结果:', analysis);
              }
            }
          } catch (error) {
            if (typeof logger !== 'undefined') {
              logger.warn('AI智能分析失败:', error.message);
            }
          }
        } else {
          if (typeof logger !== 'undefined') {
            logger.info('OpenAI API未配置，无法进行智能检测');
          }
          // 显示提示：需要配置API密钥
          if (typeof notificationManager !== 'undefined') {
            notificationManager.showToast(
              chrome.i18n.getMessage('aiDetectionRequired') || 
              '需要配置AI API密钥才能智能识别未知网站'
            );
          }
        }
      }
      
      // 如果AI检测失败或未配置，默认返回false
      return false;
    } catch (error) {
      if (typeof logger !== 'undefined') {
        logger.error('检测未知网站内容时发生错误:', error);
      }
      return false;
    }
  }

  // 主要检测逻辑
  async function runDetection() {
    let domain = null; // Define domain outside try block
    
    try {
      // 发送消息给 Service Worker 以唤醒它并记录日志
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ 
          action: 'siteDetectionStarted', 
          url: window.location.href,
          timestamp: Date.now()
        }).catch(() => {
          // 忽略错误
        });
      }
      
      // 确保 i18n 已初始化
      await i18nHelper.init();
      
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
      
      domain = siteDetector.getCurrentDomain();
      if (typeof logger !== 'undefined') {
        logger.debug(`当前检测域名: ${domain}`);
        logger.debug(`完整URL: ${window.location.href}`);
        logger.debug(`规范化域名: ${mewTrackStorage.normalizeDomain(domain)}`);
      }
      
      // 移除白名单限制 - 现在对所有网站进行检测
      // 获取网站信息（预定义网站、自定义网站或新网站）
      let siteInfo = await siteDetector.getSiteInfo(domain);
      
      // 如果不是预定义或自定义网站，创建临时的网站信息用于AI检测
      if (!siteInfo) {
        if (typeof logger !== 'undefined') {
          logger.info(`${domain} 不在预定义列表中，将进行AI智能检测`);
        }
        
        // 创建临时网站信息
        siteInfo = {
          name: domain,
          type: 'unknown',
          alwaysLearning: false,  // 需要AI检测
          needsAIDetection: true  // 标记需要AI检测
        };
      }
      
      if (typeof logger !== 'undefined') {
        logger.debug(`检测网站: ${siteInfo.name} (${domain})`);
      }
      
      // 检查今天是否已经打卡过这个网站
      const hasVisitedToday = await mewTrackStorage.hasVisitedToday(domain);
      if (hasVisitedToday) {
        if (typeof logger !== 'undefined') {
          logger.debug(`今天已经为 ${domain} 打过卡了。`);
        }
        return;
      }
      
      // 检查今天是否已经跳过这个网站
      const hasSkippedToday = await mewTrackStorage.hasSkippedToday(domain);
      if (hasSkippedToday) {
        if (typeof logger !== 'undefined') {
          logger.debug(`今天已经跳过 ${domain}，不再提示。`);
        }
        return;
      } else {
        if (typeof logger !== 'undefined') {
          logger.info(`${domain} 今天还未打卡，准备显示打卡弹窗`);
          
          // 获取当前的统计数据用于调试
          const data = await mewTrackStorage.getAllData();
          logger.debug('当前全局统计:', {
            totalStreak: data.globalStats.totalStreak,
            lastCheckDate: data.globalStats.lastCheckDate,
            checkedSitesToday: data.globalStats.checkedSitesToday,
            今天日期: new Date().toDateString()
          });
        }
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
      
      // 对于需要内容检测的网站（如YouTube）或未知网站，进行AI检测
      if (siteInfo.needsContentDetection || siteInfo.needsAIDetection) {
        // 对于视频类型网站，检查是否在视频页面
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
        
        // 检测内容并更新isLearningContent的值
        const detectedAsLearning = await siteDetector.detectLearningContent();
        if (typeof logger !== 'undefined') {
          logger.info(`${domain} AI内容检测结果: ${detectedAsLearning ? '学习内容' : '娱乐内容'}`);
        }
        // 修复：使用AI检测结果更新isLearningContent
        isLearningContent = detectedAsLearning;
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
            // 计算是否会增加totalStreak
            // 1. 今天还没有任何网站打卡
            // 2. 昨天有打卡记录（连续）
            const willIncreaseTotalStreak = await (async () => {
              if (globalStats.checkedSitesToday.length > 0) {
                // 今天已经有其他网站打卡了
                return false;
              }
              
              // 检查昨天是否有打卡
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStr = yesterday.toDateString();
              
              const data = await mewTrackStorage.getAllData();
              const hasYesterdayRecord = Object.values(data.sites).some(site => 
                site.lastVisitDate === yesterdayStr
              );
              
              // 如果昨天有打卡，会增加；如果totalStreak是0（第一次），也会增加到1
              return hasYesterdayRecord || globalStats.totalStreak === 0;
            })();
            
            if (typeof logger !== 'undefined') {
              logger.debug('打卡弹窗计算:', {
                currentTotalStreak: globalStats.totalStreak,
                willIncreaseTotalStreak: willIncreaseTotalStreak,
                checkedSitesToday: globalStats.checkedSitesToday
              });
            }
            
            await notificationManager.showNotification(
              normalizedDomain, 
              siteInfo.name, 
              globalStats.totalStreak, // 使用全局streak显示猫猫成长
              isFirstTime,
              async () => {
              // 用户点击"确认打卡"后执行的回调
              if (typeof logger !== 'undefined') {
                logger.info(`用户确认打卡 - ${siteInfo.name}`, {
                  domain: normalizedDomain,
                  isLearningContent: isLearningContent,
                  siteType: siteInfo.type,
                  alwaysLearning: siteInfo.alwaysLearning
                });
              }
              
              // 再次检查扩展上下文
              if (!isExtensionContextValid()) {
                // Silently return when context is invalid
                return;
              }
              
              const result = await mewTrackStorage.updateSiteVisit(normalizedDomain, isLearningContent);
              
              // 始终显示成功消息，因为弹窗只在未打卡时显示
              const progress = await mewTrackStorage.getTargetProgress(normalizedDomain);
              
              let message = i18nHelper.getMessage('checkInSuccessMsg', {
                site: siteInfo.name,
                days: result.globalStats.totalStreak
              });
              
              if (progress && !progress.isCompleted) {
                message += '\n' + i18nHelper.getMessage('targetProgressMsg', {
                  current: progress.current,
                  target: progress.target,
                  percentage: progress.percentage
                });
              } else if (progress && progress.isCompleted) {
                message += '\n' + i18nHelper.getMessage('congratsGoalComplete');
              }
              
              notificationManager.showToast(message);
              if (typeof logger !== 'undefined') {
                logger.info(`打卡成功 - ${siteInfo.name}, 连续天数: ${result.globalStats.totalStreak}`);
              }
            },
            willIncreaseTotalStreak
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
        logger.error('错误堆栈:', error.stack);
        logger.error('错误详情:', {
          message: error.message,
          name: error.name,
          url: window.location.href,
          domain: domain,
          timestamp: new Date().toISOString()
        });
      }
      // 发送错误信息到后台
      try {
        if (chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({
            action: 'detectionError',
            error: {
              message: error.message,
              stack: error.stack,
              url: window.location.href,
              domain: domain
            }
          }).catch(() => {});
        }
      } catch (e) {
        // 忽略发送错误
      }
    } finally {
      // Always remove domain from processing set
      if (domain) {
        processingDomains.delete(domain);
      }
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
    
    // 不再进行定期检测，避免重复提示和API调用
  }

  init();

})(); 