# 🐱 MewTrack - Cat Growth Tracker

> Track your learning progress and let adorable cats accompany your journey every day!

## ✨ Features

### 🎯 Smart Learning Tracking
- **Multi-Site Support**: 20+ learning websites including LeetCode, Coursera, YouTube, Bilibili, GitHub
- **Intelligent Content Recognition**: Automatically distinguish between learning and entertainment content (YouTube/Bilibili videos)
- **Independent Site Check-ins**: Track each website independently while sharing overall growth records
- **AI Content Analysis**: Support OpenAI API for more precise content identification
- **Goal Setting Feature**: Set check-in target days for each website and track progress
- **Custom Websites**: Add any website for learning check-in tracking

### 🐱 Adorable Cat Growth System
- **🥚 Egg Stage** (0 days): Just starting little egg
- **🐱 Kitten Stage** (1-9 days): Cute little kitten
- **😸 Big Cat Stage** (10-29 days): Growing big cat
- **👑 Cat King Stage** (30+ days): King of Learning!

### 📊 Detailed Statistics
- **Total Consecutive Days**: Core metric affecting cat growth
- **Independent Site Tracking**: Personal streak records for each website
- **Smart Continuity Management**: Sites turn gray when interrupted but don't reset records
- **Daily Check-in Stats**: Shows number of sites checked in today

## 🚀 Installation & Usage

### 1. Install Extension
1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the MewTrack folder

### 2. Getting Started
1. Visit supported learning websites
2. First-time visitors will see a popup asking to set check-in target days
3. Click "Check in for today!" when you see the check-in popup
4. Click the extension icon to view learning progress
5. Watch your cat grow!

### 3. Settings (Optional)
1. Click the extension icon, then click "Settings"
2. Configure OpenAI API key to enable AI content recognition
3. Add custom websites for check-in tracking
4. Adjust notification and auto-detection settings
5. Import/export data backups

## 📱 Interface Preview

### Check-in Popup
- Display current website information
- Show overall learning progress
- Preview cat growth stages
- Motivational messages

### Main Interface
- Overall cat growth status
- Independent tracking for each website
- Detailed statistics
- Data export functionality

## 🌐 Supported Websites

### 📚 Learning Websites (Always Learning Content)
- **Programming Learning**: LeetCode, GitHub, Stack Overflow, freeCodeCamp, Codecademy
- **Online Courses**: Coursera, Udemy, edX, Khan Academy
- **Technical Documentation**: MDN Web Docs, W3Schools, GeeksforGeeks
- **Competitive Programming**: HackerRank, CodeChef, Codeforces, AtCoder

### 🎥 Video Websites (Content Detection Required)
- **YouTube**: Automatically identify learning vs entertainment videos
- **Bilibili**: Intelligently distinguish tutorials/educational vs entertainment content

### 🔧 Custom Websites
- Add any website through settings page
- Custom websites default to learning content, showing check-in popup on each visit
- Support enable/disable and deletion management

## 🎮 Check-in Logic Example

```
Day 1: Check-in bilibili + coursera
→ Total: 1 day, bilibili: 1 day, coursera: 1 day

Day 2: Only check-in bilibili
→ Total: 2 days, bilibili: 2 days, coursera: 1 day (grayed out)

Day 3: Check-in bilibili + leetcode
→ Total: 3 days, bilibili: 3 days, coursera: 1 day (grayed out), leetcode: 1 day
```

## 🔧 Technical Features

- **Local Storage**: Uses Chrome Storage API for secure and reliable data
- **Smart Detection**: SPA page change monitoring, compatible with modern web apps
- **Performance Optimization**: Prevents duplicate popups, intelligent timed detection
- **User-Friendly**: Elegant UI design with smooth animations

## 📁 Project Structure

```
MewTrack/
├── manifest.json          # Extension configuration
├── popup.html            # Popup interface
├── settings.html         # Settings page
├── content.js            # Content script
├── background.js         # Background script
├── js/
│   ├── storage.js        # Data storage management
│   ├── siteDetector.js   # Website recognition & detection
│   ├── notification.js   # Popup notification management
│   ├── motivation.js     # Motivational message generation
│   ├── popup.js          # Popup interface logic
│   ├── settings.js       # Settings page logic
│   ├── openaiIntegration.js  # OpenAI API integration
│   └── checkInDialog.js  # Check-in target days dialog
├── styles/
│   ├── popup.css         # Popup interface styles
│   ├── notification.css  # Notification popup styles
│   └── settings.css      # Settings page styles
├── icons/                # Extension icons
├── images/               # Cat growth images
└── test.html            # Test page
```

## 🐛 Troubleshooting

For detailed troubleshooting guide, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

### Quick Solutions

**"Extension context invalidated" Error**:
- Refresh the webpage (F5) or reload the extension

**YouTube/Bilibili Not Showing Popup**:
- Ensure page is fully loaded (wait 3-5 seconds)
- Check if already checked in today
- Check console to confirm if content is classified as entertainment

**OpenAI API Issues**:
- Confirm API key is valid and has quota
- Check console for detailed error messages

## 📄 License

MIT License - Contributions and suggestions welcome!

## 🎉 Changelog

### v1.2.0 (2024-06-21)
- ✨ Added custom website feature, support adding any website for check-ins
- 🔧 Fixed YouTube and Bilibili video title retrieval issues
- 🤖 Optimized AI content recognition accuracy
- 📱 Improved video website content detection logic
- 🎯 Support enable/disable management for custom websites

### v1.1.0 (2024-06-21)
- ✨ Added OpenAI API integration, support AI content recognition
- 🎯 Added target days setting feature
- 📊 Added progress bar showing goal completion
- ⚙️ Added settings page, support API configuration and data management
- 🔧 Optimized popup interaction experience

### v1.0.0 (2024-06-20)
- ✨ Initial release
- 🐱 Cat growth system
- 📊 Multi-website independent tracking
- 🎯 Smart content detection
- 💫 Beautiful UI interface

---

**Make learning more fun, let cats accompany your growth journey!** 🐱✨ 