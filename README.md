# 顏文字小工具 (Kaomoji Extension)

快速複製各種可愛的顏文字表情符號與 Emoji！  
一個簡單好用的 Chrome 擴充功能，支援深色模式與自訂功能！

![主要圖片](other/app-main.png)

## 功能說明

- 符號複製 - 整合「顏文字」、「特殊符號」、「Emoji」，點選按鈕後可以複製
- 自訂符號 - 顏文字、符號、Emoji 各自擁有獨立的常用紀錄，方便快速取用，顏文字也支援自行新增
- 快速搜尋 - 支援關鍵字與標籤搜尋，快速找到你想要的表情或符號

## 安裝方式

1. 下載這個專案，點選 Code 綠色的按鈕，選擇 Download ZIP 將專案下載下來。  

2. 解壓縮這個專案，裡面會有兩個資料夾，其中 app 資料夾，就是這個瀏覽器擴充工具。請將這個資料夾放到自己熟悉的位置中，並且重新命名。   

3. 開啟 Chrome 瀏覽器，進入擴充功能頁面。 
   - 在網址列輸入 `chrome://extensions/`。 
   - 或點選「更多工具」→「擴充功能」。 

4. 開啟右上角的「開發人員模式」。 

5. 點選「載入未封裝項目」，選擇本專案的資料夾。 

6. 完成，你應該會在工具列看到顏文字圖示！(ﾉ>ω<)ﾉ    

https://private-user-images.githubusercontent.com/66624001/519777369-662a7593-d71b-4638-84cc-59d343f082e4.mp4?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjQyNTQ4MDMsIm5iZiI6MTc2NDI1NDUwMywicGF0aCI6Ii82NjYyNDAwMS81MTk3NzczNjktNjYyYTc1OTMtZDcxYi00NjM4LTg0Y2MtNTlkMzQzZjA4MmU0Lm1wND9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNTExMjclMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjUxMTI3VDE0NDE0M1omWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPTQ1ZWZiMGMwOGMyYjg0YjEwNTkzY2VkOWJiMjgzNDE4MDFjNjdhM2Q0ODE0ZjQ2NGFiNGZkYzI5MjAzMzY4OTMmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.Pf9uVSxun4ySfg4ubkz3zfdRZ80w4bvMKSa9G2Y0KGE

## 使用說明

### 介面導覽

1. **頂部頁籤**：切換「顏文字」、「符號」、「Emoji」三大模式。

   - **顏文字**：經典的文字表情，主題色為藍色。
   - **符號**：各種特殊符號（箭頭、數學、貨幣等），主題色為綠色。
   - **Emoji**：標準 Emoji 表情，主題色為橘色。

2. **常用紀錄**：每個大分類下的第一個分頁即為「常用」，自動記錄您最近使用的項目。

3. **搜尋**：在搜尋框輸入關鍵字（如「開心」、「箭頭」），可搜尋所有分類與標籤。

### 自訂顏文字

1. 切換至「顏文字」頁籤。
2. 點擊右下角的「+ 新增」按鈕。
3. 輸入符號、選擇或新增分類、輸入標籤（方便搜尋）。
4. 自訂的顏文字會顯示在「自訂」分頁中，並可隨時編輯或刪除。

### 資料備份

1. 點擊右下角的「匯出」按鈕下載 `.json` 備份檔。
2. 在新電腦或重新安裝時，點擊「匯入」按鈕並選擇備份檔即可還原。

### 專案結構

```
app/
├── manifest.json          # 擴充功能設定檔
├── popup/
│   ├── popup.html        # 主要介面
│   ├── popup.css         # 樣式與主題
│   └── popup.js          # 核心邏輯
├── data/
│   ├── kaomoji-data.js   # 顏文字資料
│   ├── symbols-data.js   # 符號資料
│   └── emoji-data.js     # Emoji 資料
├── logo/                 # 圖示檔案
└── README.md             # 說明文件
```

## 參考資料

1. Chrome Extension v3 Starter  
   https://github.com/SimGus/chrome-extension-v3-starter
2. 豐富的顏文字庫 | 顏文字卡  
   https://facemood.grtimed.com/

## 授權

本專案基於 MIT License 授權。
