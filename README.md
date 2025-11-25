<div align="center">
    <h1>🎨 顏文字複製工具</h1>
    <p>快速複製各種可愛的顏文字表情 (๑˃̵ᴗ˂̵)و</p>
    <p>一個簡單好用的 Chrome 擴充功能</p>
</div>

## ✨ 功能特色

- 📚 **豐富的顏文字庫** - 收錄數百個精選顏文字表情
- 🔍 **智能搜尋** - 快速找到你想要的表情
- 📁 **分類瀏覽** - 依情境分類，方便查找
- 📋 **一鍵複製** - 點擊即可複製到剪貼簿
- 🎲 **隨機表情** - 讓你每次都有新驚喜
- 💾 **自訂收藏** - 新增、編輯、管理你的專屬顏文字
- 📊 **使用統計** - 追蹤你的使用習慣
- 🎨 **隨機主題** - 每次開啟都有不同的色彩
- 🌓 **深色模式** - 保護你的眼睛

## 🚀 安裝方式

### 從 Chrome Web Store 安裝

（待上架後更新連結）

### 手動安裝（開發者模式）

1. 下載或克隆此專案到本地

   ```bash
   git clone https://github.com/your-username/kaomoji-extension.git
   ```

2. 開啟 Chrome 瀏覽器，進入擴充功能頁面

   - 在網址列輸入 `chrome://extensions/`
   - 或點選「更多工具」→「擴充功能」

3. 開啟右上角的「開發人員模式」

4. 點選「載入未封裝項目」

5. 選擇本專案的資料夾

6. 完成！你應該會在工具列看到顏文字圖示

## 📖 使用說明

### 基本操作

1. 點擊工具列上的顏文字圖示開啟面板
2. 瀏覽或搜尋你想要的顏文字
3. 點擊任一顏文字即可自動複製
4. 貼上到任何你想使用的地方

### 功能詳解

#### 🎲 隨機表情

- 面板頂部會顯示一個隨機顏文字
- 點擊「複製」按鈕可快速複製
- 點擊「換一個」可重新隨機

#### 🔍 搜尋功能

- 在搜尋框輸入關鍵字（支援中英文）
- 即時顯示相關的顏文字
- 支援模糊搜尋

#### 📁 分類標籤

預設分類包括：

- 😊 快樂
- 😢 悲傷
- 😡 生氣
- 😍 愛心
- 🤔 思考
- 💪 加油
- 🎉 慶祝
- 🙏 感謝
- 更多...

#### 💾 自訂管理

- 點擊「自訂」標籤
- 使用「+ 新增」按鈕建立你的專屬顏文字
- 可編輯和刪除已新增的項目
- 資料會自動儲存在本地

#### 📊 歷史記錄

- 自動記錄最近使用的顏文字
- 點擊「歷史」標籤快速存取
- 最多保留 40 筆記錄

#### ⚙️ 設定

- 點擊右上角齒輪圖示進入設定頁面
- 可切換深色/淺色主題
- 可清除使用記錄和自訂內容

## 🛠️ 技術資訊

- **Manifest Version**: 3
- **權限需求**:
  - `clipboardWrite` - 複製到剪貼簿
  - `storage` - 儲存使用者設定和自訂內容
- **支援瀏覽器**:
  - Chrome / Chromium
  - Microsoft Edge
  - Brave
  - 其他基於 Chromium 的瀏覽器

## 🔧 開發

### 專案結構

```
chrome-extension-v3-starter/
├── manifest.json          # 擴充功能設定檔
├── popup/
│   ├── popup.html        # 彈出視窗頁面
│   ├── popup.css         # 樣式檔
│   └── popup.js          # 主要邏輯
├── settings/
│   ├── settings.html     # 設定頁面
│   └── settings.css      # 設定樣式
├── data/
│   └── kaomoji-data.js   # 顏文字資料庫
├── logo/                 # 圖示檔案
└── service-worker.js     # 背景服務
```

### 本地開發

1. 修改程式碼
2. 到 `chrome://extensions/` 頁面
3. 點擊擴充功能卡片上的「重新載入」按鈕
4. 測試你的修改

### 新增顏文字資料

編輯 `data/kaomoji-data.js` 檔案，依照現有格式新增：

```javascript
{
  kaomoji: "(๑˃̵ᴗ˂̵)و",
  tags: ["快樂", "加油"],
  category: "快樂"
}
```

## 📝 授權

本專案基於 MIT License 授權。

- 原始專案框架：[Chrome Extension v3 Starter](https://github.com/SimGus/chrome-addon-v3-starter) by SimGus
- 顏文字工具開發：[Your Name]

詳見 [LICENSE](LICENSE) 檔案。

## 🤝 貢獻

歡迎提出 Issue 或 Pull Request！

如果你有想要新增的顏文字或功能建議，請隨時告訴我。

## 📮 聯絡方式

- GitHub: [@your-username](https://github.com/your-username)
- Email: your-email@example.com

## 🙏 致謝

- 感謝 [SimGus](https://github.com/SimGus) 提供的 Chrome Extension v3 起始模板
- 感謝所有顏文字創作者們

---

<div align="center">
    <p>如果這個工具對你有幫助，請給個 ⭐️ 吧！</p>
    <p>Made with ❤️ and (´｡• ᵕ •｡`) ♡</p>
</div>
