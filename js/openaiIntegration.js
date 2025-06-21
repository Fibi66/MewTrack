// AI API 集成模块（支持OpenAI和DeepSeek）
class AIIntegration {
  constructor() {
    // API配置
    this.providers = {
      openai: {
        apiKey: null,
        apiEndpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-3.5-turbo',
        name: 'OpenAI'
      },
      deepseek: {
        apiKey: null,
        apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
        model: 'deepseek-chat',
        name: 'DeepSeek'
      }
    };
    
    // 当前使用的提供商（优先使用配置了密钥的）
    this.currentProvider = null;
  }

  // 初始化API密钥
  async init() {
    try {
      // 使用Promise包装chrome.storage调用，增加超时保护
      const data = await new Promise((resolve, reject) => {
        // 设置超时
        const timeout = setTimeout(() => {
          reject(new Error('Storage access timeout'));
        }, 1000);
        
        // 尝试访问storage
        try {
          if (chrome && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get(['openaiApiKey', 'deepseekApiKey'], (result) => {
              clearTimeout(timeout);
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve(result);
              }
            });
          } else {
            clearTimeout(timeout);
            reject(new Error('Chrome storage API not available'));
          }
        } catch (err) {
          clearTimeout(timeout);
          reject(err);
        }
      });
      
      // 加载API密钥
      this.providers.openai.apiKey = data.openaiApiKey || null;
      this.providers.deepseek.apiKey = data.deepseekApiKey || null;
      
      // 选择有效的提供商（优先OpenAI，然后DeepSeek）
      if (this.providers.openai.apiKey) {
        this.currentProvider = 'openai';
        if (typeof logger !== 'undefined') {
          logger.info('使用 OpenAI API');
        }
      } else if (this.providers.deepseek.apiKey) {
        this.currentProvider = 'deepseek';
        if (typeof logger !== 'undefined') {
          logger.info('使用 DeepSeek API');
        }
      } else {
        this.currentProvider = null;
        if (typeof logger !== 'undefined') {
          logger.debug('未设置任何AI API密钥');
        }
      }
      
      return !!this.currentProvider;
    } catch (error) {
      // 处理各种错误情况
      if (error.message && error.message.includes('Extension context invalidated')) {
        if (typeof logger !== 'undefined') {
          logger.contextError('扩展上下文已失效，请刷新页面');
        }
      } else if (error.message && (error.message.includes('Chrome storage API not available') || error.message.includes('Storage access timeout'))) {
        if (typeof logger !== 'undefined') {
          logger.contextError('Chrome存储API不可用或超时');
        }
      } else {
        if (typeof logger !== 'undefined') {
          logger.warn('获取API密钥失败:', error.message || error);
        }
      }
      this.currentProvider = null;
      return false;
    }
  }

  // 检查扩展上下文是否有效
  isExtensionContextValid() {
    try {
      // 简化检查，只验证基本的chrome对象存在
      return !!(chrome && chrome.runtime && chrome.runtime.id);
    } catch (error) {
      return false;
    }
  }

  // 设置API密钥
  async setApiKey(provider, apiKey) {
    try {
      // 检查扩展上下文是否有效
      if (!this.isExtensionContextValid()) {
        if (typeof logger !== 'undefined') {
          logger.contextError('扩展上下文已失效，无法保存API密钥');
        }
        return false;
      }
      
      const storageKey = provider === 'openai' ? 'openaiApiKey' : 'deepseekApiKey';
      await chrome.storage.local.set({ [storageKey]: apiKey });
      this.providers[provider].apiKey = apiKey;
      
      // 如果当前没有提供商，或者设置的是OpenAI（优先级更高），则切换
      if (!this.currentProvider || provider === 'openai') {
        this.currentProvider = provider;
      }
      
      return true;
    } catch (error) {
      if (typeof logger !== 'undefined') {
        logger.error(`保存${provider} API密钥失败:`, error);
      }
      return false;
    }
  }

  // 获取当前的API密钥（用于兼容旧代码）
  get apiKey() {
    return this.currentProvider ? this.providers[this.currentProvider].apiKey : null;
  }

  // 分析网页内容是否为学习内容
  async analyzeContent(title, description, url) {
    if (!this.currentProvider) {
      if (typeof logger !== 'undefined') {
        logger.debug('未配置任何AI API密钥');
      }
      return null;
    }

    const provider = this.providers[this.currentProvider];
    const prompt = `请分析以下网站内容，判断这是否是学习/教育类内容。

视频标题: ${title}
视频描述和标签: ${description || '无描述'}
URL: ${url}

判断标准：
- 学习类内容包括：教程、课程、技术分享、知识科普、学术讲座、技能培训、编程教学、语言学习等
- 娱乐类内容包括：游戏实况、娱乐综艺、音乐MV、搞笑视频、生活vlog、美食探店、旅游分享等

请仔细分析网站标题，并给出判断。

请以JSON格式回答：
{
  "isLearning": true/false
}`;

    // 记录发送的请求
    if (typeof logger !== 'undefined') {
      logger.debug(`${provider.name} API 请求:`, {
        title,
        description: description ? description.substring(0, 100) + '...' : '无描述',
        url,
        prompt: prompt.substring(0, 200) + '...'
      });
    }

    try {
      const response = await fetch(provider.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            {
              role: 'system',
              content: '你是一个内容分类助手，专门识别网页内容是否属于学习/教育类。学习类内容包括：编程教程、技术文档、学术课程、技能培训、知识讲解等。娱乐类内容包括：游戏视频、vlog、吃播、搞笑视频、音乐MV等。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (typeof logger !== 'undefined') {
          logger.apiError(provider.name, {
            status: response.status,
            message: errorData.error?.message || response.statusText
          }, {
            statusText: response.statusText,
            error: errorData
          });
        }
        throw new Error(`API请求失败: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // 记录API响应
      if (typeof logger !== 'undefined') {
        logger.debug(`${provider.name} API 响应:`, {
          raw_response: content,
          usage: data.usage
        });
      }
      
      // 尝试解析JSON响应
      try {
        const result = JSON.parse(content);
        if (typeof logger !== 'undefined') {
          logger.debug(`${provider.name} API 解析结果:`, result);
        }
        return result;
      } catch (parseError) {
        if (typeof logger !== 'undefined') {
          logger.warn(`解析${provider.name}响应失败:`, parseError);
          logger.debug('原始响应内容:', content);
        }
        // 尝试从文本中提取信息
        const isLearning = content.includes('是') && !content.includes('否');
        const fallbackResult = {
          isLearning
        };
        if (typeof logger !== 'undefined') {
          logger.debug('使用后备解析结果:', fallbackResult);
        }
        return fallbackResult;
      }
    } catch (error) {
      if (typeof logger !== 'undefined') {
        logger.apiError(provider.name, error);
      }
      return null;
    }
  }

  // 批量分析多个URL
  async batchAnalyze(items) {
    const results = [];
    for (const item of items) {
      const result = await this.analyzeContent(item.title, item.description, item.url);
      results.push({
        ...item,
        analysis: result
      });
      // 避免API速率限制
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return results;
  }

  // 检查API密钥是否有效
  async validateApiKey(provider = null) {
    const targetProvider = provider || this.currentProvider;
    if (!targetProvider || !this.providers[targetProvider].apiKey) {
      return false;
    }

    const providerConfig = this.providers[targetProvider];
    
    try {
      const response = await fetch(providerConfig.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${providerConfig.apiKey}`
        },
        body: JSON.stringify({
          model: providerConfig.model,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 5
        })
      });

      return response.ok;
    } catch (error) {
      if (typeof logger !== 'undefined') {
        logger.warn(`${providerConfig.name} API密钥验证失败:`, error);
      }
      return false;
    }
  }
}

// 导出实例（保持向后兼容）
const openAIIntegration = new AIIntegration();
const aiIntegration = openAIIntegration; // 别名，更清晰的命名