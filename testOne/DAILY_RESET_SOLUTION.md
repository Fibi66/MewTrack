# MewTrack 每日重置解决方案

## 问题描述

用户反馈：所有学习网站（不只是YouTube）在第二天都不会弹出打卡窗口。

## 问题分析

### 根本原因
`checkedSitesToday` 数组存储了当天已经打卡的网站，但这个数组没有在新的一天开始时被清空。导致：
- 第一天: youtube.com 打卡后记录在 `checkedSitesToday`
- 第二天: `hasVisitedToday('youtube.com')` 仍然返回 true
- 结果: 不显示打卡弹窗

### 数据结构
```javascript
globalStats: {
  totalStreak: 1,
  lastCheckDate: "Sat Jun 21 2025",  // 上次检查日期
  checkedSitesToday: ["youtube.com", "leetcode.com"],  // 今日已打卡
  totalDays: 1
}
```

## 多层清理机制

### 1. 数据读取时清理（主要机制）
```javascript
// storage.js - getAllData()
if (lastCheckDate !== today) {
  data.globalStats.checkedSitesToday = [];
  data.globalStats.lastCheckDate = today;
  await this.saveAllData(data);
}
```

### 2. 检查时双重验证
```javascript
// storage.js - hasVisitedToday()
if (data.globalStats.lastCheckDate !== today) {
  // 不应该发生，但如果发生了返回 false
  return false;
}
```

### 3. 午夜定时清理
```javascript
// background.js - setupMidnightTimer()
// 每天00:00自动清理过期数据
setTimeout(() => {
  cleanupDailyData();
  setupMidnightTimer(); // 设置下一个定时器
}, millisecondsUntilMidnight);
```

### 4. 浏览器启动清理
```javascript
// background.js - chrome.runtime.onStartup
// 浏览器启动时检查并清理
await cleanupDailyData();
```

## 工作流程

### 第一天
1. 用户访问 YouTube
2. `hasVisitedToday('youtube.com')` → false
3. 显示打卡弹窗
4. 用户打卡
5. `checkedSitesToday` = ['youtube.com']
6. `lastCheckDate` = 'Sat Jun 21 2025'

### 第二天
1. 用户访问 YouTube
2. `getAllData()` 检测到日期变化
3. 清空 `checkedSitesToday` = []
4. 更新 `lastCheckDate` = 'Sun Jun 22 2025'
5. `hasVisitedToday('youtube.com')` → false
6. 显示打卡弹窗（连续第2天）

## 特殊情况处理

### 1. 同一天多次访问同一网站
- 第一次: 弹窗
- 后续: 不弹窗（已在 checkedSitesToday 中）

### 2. 同一天访问不同网站
- YouTube: 弹窗 → 记录
- LeetCode: 弹窗 → 记录
- 再访问 YouTube: 不弹窗

### 3. 跨越多天
- 自动检测到日期差异
- 清理旧数据
- 可能重置连续天数（如果超过1天）

## 测试验证

✅ 同一天内重复访问 → 只弹窗一次
✅ 第二天访问 → 正常弹窗
✅ 浏览器重启 → 数据保持正确
✅ 跨越午夜 → 自动清理

## 用户体验

1. **每天第一次访问**：看到打卡弹窗和鼓励
2. **连续天数显示**：第2天显示"连续2天"
3. **特殊鼓励**：第2、3、7天有特别的鼓励语
4. **猫猫成长**：随着天数增加，猫猫形象变化

## 注意事项

- 数据清理是自动的，用户无需任何操作
- 时区使用用户本地时间
- 即使浏览器关闭，重新打开也会正确处理