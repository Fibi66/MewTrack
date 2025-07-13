# MewTrack AI检测逻辑测试场景

## 测试目标
验证MewTrack扩展的AI检测逻辑是否正确工作，包括：
1. YouTube视频的学习/娱乐内容识别
2. 未知网站的AI智能检测
3. 预定义学习网站的处理

## 测试场景

### 场景1: YouTube娱乐视频
- **网址**: https://www.youtube.com/watch?v=abc123
- **标题**: "Funny Cat Videos Compilation 2024"
- **描述**: "The funniest cat videos on the internet!"
- **预期结果**: 应该弹窗，但标记为娱乐内容
- **逻辑**: YouTube设置了alwaysLearning: true，始终弹窗，但AI会识别内容类型

### 场景2: YouTube学习视频
- **网址**: https://www.youtube.com/watch?v=def456
- **标题**: "JavaScript Tutorial - Learn Async/Await in 20 Minutes"
- **描述**: "In this tutorial, we will learn about JavaScript async/await and promises"
- **预期结果**: 应该弹窗（AI检测为学习内容）
- **逻辑**: YouTube始终显示弹窗，但会记录是学习还是娱乐内容

### 场景3: 未知学习网站 (educative.io)
- **网址**: https://www.educative.io/courses/javascript-fundamentals
- **标题**: "JavaScript Fundamentals - Interactive Course"
- **描述**: "Learn JavaScript from scratch with interactive coding challenges"
- **预期结果**: 应该弹窗（AI检测为学习网站）
- **逻辑**: educative.io不在预定义列表中，需要AI检测，检测到学习内容则弹窗

### 场景4: 未知非学习网站 (Reddit)
- **网址**: https://www.reddit.com/r/funny
- **标题**: "Funny Memes and Jokes - Reddit"
- **描述**: "The funniest memes and jokes on Reddit"
- **预期结果**: 不应该弹窗（AI检测为非学习内容）
- **逻辑**: reddit.com不在预定义列表中，AI检测为娱乐内容，不弹窗

### 场景5: 预定义学习网站 (LeetCode)
- **网址**: https://leetcode.com/problems/two-sum/
- **标题**: "Two Sum - LeetCode"
- **描述**: "Can you solve this real interview question?"
- **预期结果**: 应该弹窗（预定义学习网站）
- **逻辑**: LeetCode在learningSites列表中，直接判定为学习网站

## 检测逻辑流程

```
1. 获取当前域名
2. 检查是否在learningSites中
   - 是 → 直接弹窗（学习网站）
   - 否 → 继续步骤3
3. 检查是否在customSites中
   - 是 → 直接弹窗（用户自定义）
   - 否 → 继续步骤4
4. 检查是否在contentDetectionSites中（YouTube/Bilibili）
   - 是 → AI检测内容类型，始终弹窗但记录类型
   - 否 → 继续步骤5
5. 未知网站 → AI检测
   - 检测为学习内容 → 弹窗
   - 检测为非学习内容 → 不弹窗
```

## AI检测算法（简化版）
1. 提取页面标题、描述、H1标签内容
2. 发送给OpenAI/DeepSeek API分析
3. 如果API不可用，使用关键词匹配：
   - 学习关键词：tutorial, learn, course, programming, algorithm等
   - 娱乐关键词：funny, game, entertainment, music, vlog等
4. 比较学习分数和娱乐分数，判断内容类型

## 注意事项
- YouTube和Bilibili始终显示弹窗（根据代码中alwaysLearning: true的设置）
- 未知网站只有在AI检测为学习内容时才弹窗
- 需要配置OpenAI或DeepSeek API密钥才能进行智能检测