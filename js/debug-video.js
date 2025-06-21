// 视频检测调试脚本
console.log('MewTrack Debug: 开始视频检测调试');

// 等待页面加载
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkInterval = setInterval(() => {
      const element = document.querySelector(selector);
      if (element) {
        clearInterval(checkInterval);
        resolve(element);
      }
      
      if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }
    }, 100);
  });
}

// 调试YouTube视频检测
async function debugYouTube() {
  console.log('MewTrack Debug: 检测YouTube页面');
  
  // 尝试所有可能的标题选择器
  const titleSelectors = [
    'h1.ytd-watch-metadata yt-formatted-string',
    'h1.title.style-scope.ytd-video-primary-info-renderer',
    'h1 yt-formatted-string.style-scope.ytd-video-primary-info-renderer',
    'yt-formatted-string.style-scope.ytd-video-primary-info-renderer',
    '#container h1 yt-formatted-string',
    'meta[name="title"]',
    'meta[property="og:title"]',
    'title'
  ];
  
  console.log('MewTrack Debug: 尝试获取标题...');
  
  for (const selector of titleSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        let title = '';
        if (element.tagName === 'META') {
          title = element.getAttribute('content');
        } else {
          title = element.textContent || element.innerText;
        }
        
        if (title) {
          console.log(`MewTrack Debug: 找到标题 (${selector}):`, title);
        }
      }
    } catch (error) {
      console.log(`MewTrack Debug: 选择器错误 (${selector}):`, error);
    }
  }
  
  // 等待动态内容加载
  console.log('MewTrack Debug: 等待动态内容加载...');
  
  try {
    await waitForElement('h1.ytd-watch-metadata yt-formatted-string');
    console.log('MewTrack Debug: 动态内容已加载');
    
    const titleElement = document.querySelector('h1.ytd-watch-metadata yt-formatted-string');
    if (titleElement) {
      console.log('MewTrack Debug: 最终标题:', titleElement.textContent);
    }
  } catch (error) {
    console.log('MewTrack Debug: 等待超时:', error);
  }
  
  // 检查页面结构
  console.log('MewTrack Debug: 页面结构分析:');
  console.log('- URL:', window.location.href);
  console.log('- 是否为视频页面:', window.location.pathname.includes('/watch'));
  console.log('- 页面标题:', document.title);
  
  // 查找所有h1标签
  const allH1 = document.querySelectorAll('h1');
  console.log(`MewTrack Debug: 找到 ${allH1.length} 个h1标签`);
  allH1.forEach((h1, index) => {
    console.log(`  h1[${index}]:`, h1.className, h1.textContent?.substring(0, 50));
  });
}

// 调试Bilibili视频检测
async function debugBilibili() {
  console.log('MewTrack Debug: 检测Bilibili页面');
  
  // 尝试所有可能的标题选择器
  const titleSelectors = [
    '.video-title.tit',
    'h1.video-title',
    '.video-info-title',
    'h1[title]',
    '.video-info-container h1',
    'meta[property="og:title"]',
    'meta[name="title"]',
    'title'
  ];
  
  console.log('MewTrack Debug: 尝试获取标题...');
  
  for (const selector of titleSelectors) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        let title = '';
        if (element.tagName === 'META') {
          title = element.getAttribute('content');
        } else {
          title = element.getAttribute('title') || element.textContent || element.innerText;
        }
        
        if (title) {
          console.log(`MewTrack Debug: 找到标题 (${selector}):`, title);
        }
      }
    } catch (error) {
      console.log(`MewTrack Debug: 选择器错误 (${selector}):`, error);
    }
  }
  
  // 等待动态内容加载
  console.log('MewTrack Debug: 等待动态内容加载...');
  
  try {
    await waitForElement('.video-title', 3000);
    console.log('MewTrack Debug: 动态内容已加载');
  } catch (error) {
    console.log('MewTrack Debug: 等待超时:', error);
  }
  
  // 检查页面结构
  console.log('MewTrack Debug: 页面结构分析:');
  console.log('- URL:', window.location.href);
  console.log('- 是否为视频页面:', /\/video\//.test(window.location.pathname));
  console.log('- 页面标题:', document.title);
}

// 自动检测当前网站
async function autoDebug() {
  const hostname = window.location.hostname;
  
  if (hostname.includes('youtube.com')) {
    await debugYouTube();
  } else if (hostname.includes('bilibili.com')) {
    await debugBilibili();
  } else {
    console.log('MewTrack Debug: 不是YouTube或Bilibili页面');
  }
}

// 延迟执行，确保页面加载
setTimeout(autoDebug, 2000);

// 导出供手动调用
window.MewTrackDebug = {
  debugYouTube,
  debugBilibili,
  autoDebug
};