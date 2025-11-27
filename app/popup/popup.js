class KaomojiExtension {
  constructor() {
    this.currentType = 'kaomoji'
    this.currentCategory = 'recent'
    this.searchTerm = ''
    this.history = { kaomoji: [], symbols: [], emoji: [] }
    this.customKaomoji = {}
    this.maxHistorySize = 40
    this.currentEditTarget = null
    this.init()
  }

  async init() {
    this.applyTheme()
    await this.loadData()
    this.setupRandomHeader()

    // Set active main tab
    document.querySelectorAll('.main-tab').forEach((t) => {
      t.classList.toggle('active', t.dataset.type === this.currentType)
    })
    this.updateUIForType()

    this.generateCategoryTabs()
    this.renderKaomoji()
    this.bindEvents()
  }

  applyTheme() {
    // Default to Kaomoji theme
    document.documentElement.style.setProperty('--hue', '210')
  }

  setupRandomHeader() {
    const display = document.getElementById('randomDisplay')
    const wrapper = document.querySelector('.random-wrapper') // Get wrapper
    const copyBtn = document.getElementById('copyRandomBtn')

    // 如果是 Emoji 模式，改用 Emoji 字型顯示(新增 Emoji CLASS)
    if (this.currentType === 'emoji') {
      display.classList.add('emoji-mode')
    } else {
      display.classList.remove('emoji-mode')
    }

    const updateRandom = () => {
      const allData = this.getAllData()
      let allItems = []
      Object.values(allData).forEach((cat) => allItems.push(...cat.items))
      if (allItems.length > 0) {
        const randomItem = allItems[Math.floor(Math.random() * allItems.length)]
        display.textContent = randomItem.symbol
        display.classList.remove('animate')
        void display.offsetWidth // 強制重繪
        display.classList.add('animate')
      }
    }

    updateRandom()

    // Move click event to wrapper
    if (wrapper) {
      wrapper.addEventListener('click', (e) => {
        // Prevent triggering if clicking copy button
        if (e.target.closest('.copy-random-btn')) return
        updateRandom()
      })
    }

    copyBtn.addEventListener('click', async (e) => {
      e.stopPropagation()
      await this.handleClick(display.textContent)
    })
  }

  async loadData() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const result = await chrome.storage.local.get(['history', 'kaomojiHistory', 'customKaomoji', 'lastState'])
      this.customKaomoji = result.customKaomoji || {}

      if (result.history) {
        this.history = result.history
      } else if (result.kaomojiHistory) {
        // Migration
        this.history.kaomoji = result.kaomojiHistory
      }

      if (result.lastState) {
        this.currentType = result.lastState.type || 'kaomoji'
        this.currentCategory = result.lastState.category || 'recent'
      }
    } else {
      const hist = localStorage.getItem('history')
      const oldHist = localStorage.getItem('kaomojiHistory')
      const cust = localStorage.getItem('customKaomoji')
      const state = localStorage.getItem('lastState')

      this.customKaomoji = cust ? JSON.parse(cust) : {}

      if (hist) {
        this.history = JSON.parse(hist)
      } else if (oldHist) {
        this.history.kaomoji = JSON.parse(oldHist)
      }

      if (state) {
        const parsed = JSON.parse(state)
        this.currentType = parsed.type || 'kaomoji'
        this.currentCategory = parsed.category || 'recent'
      }
    }

    // Ensure structure integrity
    if (!this.history.kaomoji) this.history.kaomoji = []
    if (!this.history.symbols) this.history.symbols = []
    if (!this.history.emoji) this.history.emoji = []
  }

  async saveState() {
    const state = { type: this.currentType, category: this.currentCategory }
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ lastState: state })
    } else {
      localStorage.setItem('lastState', JSON.stringify(state))
    }
  }

  async saveData() {
    const data = { history: this.history, customKaomoji: this.customKaomoji }
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set(data)
    } else {
      localStorage.setItem('history', JSON.stringify(this.history))
      localStorage.setItem('customKaomoji', JSON.stringify(this.customKaomoji))
    }
  } // 取得合併資料 (預設+自訂)
  getAllData() {
    let combined = {}

    if (this.currentType === 'kaomoji') {
      combined = typeof defaultKaomojiData !== 'undefined' ? JSON.parse(JSON.stringify(defaultKaomojiData)) : {}

      Object.keys(this.customKaomoji).forEach((cat) => {
        if (!combined[cat]) combined[cat] = { categoryTags: [cat], items: [] }

        // 避免重複加入
        const existing = new Set(combined[cat].items.map((i) => i.symbol))
        this.customKaomoji[cat].items.forEach((item) => {
          if (!existing.has(item.symbol)) {
            // 加入 sourceCategory 方便反查
            combined[cat].items.push({
              ...item,
              isCustom: true,
              sourceCategory: cat,
            })
          }
        })
      })
    } else if (this.currentType === 'symbols') {
      combined = typeof defaultSymbolsData !== 'undefined' ? JSON.parse(JSON.stringify(defaultSymbolsData)) : {}
    } else if (this.currentType === 'emoji') {
      combined = typeof defaultEmojiData !== 'undefined' ? JSON.parse(JSON.stringify(defaultEmojiData)) : {}
    }

    return combined
  }

  exportData() {
    const exportObj = {
      version: 2,
      date: new Date().toISOString(),
      history: this.history,
      custom: this.customKaomoji,
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObj, null, 2))
    const a = document.createElement('a')
    a.href = dataStr
    a.download = `kaomoji_backup_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  importData(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (!data.history && !data.custom) throw new Error('無效的備份檔')
        if (confirm(`確定要匯入嗎？`)) {
          // Handle history import
          if (Array.isArray(data.history)) {
            // Old version backup (only kaomoji)
            const oldHistSym = new Set(this.history.kaomoji.map((h) => h.symbol))
            data.history.forEach((h) => {
              if (!oldHistSym.has(h.symbol)) this.history.kaomoji.push(h)
            })
            this.history.kaomoji.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            this.history.kaomoji = this.history.kaomoji.slice(0, this.maxHistorySize)
          } else if (data.history) {
            // New version backup
            ;['kaomoji', 'symbols', 'emoji'].forEach((type) => {
              if (data.history[type]) {
                const currentSyms = new Set(this.history[type].map((h) => h.symbol))
                data.history[type].forEach((h) => {
                  if (!currentSyms.has(h.symbol)) this.history[type].push(h)
                })
                this.history[type].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
                this.history[type] = this.history[type].slice(0, this.maxHistorySize)
              }
            })
          }

          if (data.custom) {
            Object.keys(data.custom).forEach((cat) => {
              if (!this.customKaomoji[cat]) this.customKaomoji[cat] = data.custom[cat]
              else {
                const curItems = this.customKaomoji[cat].items
                const curSyms = new Set(curItems.map((i) => i.symbol))
                data.custom[cat].items.forEach((newItem) => {
                  if (!curSyms.has(newItem.symbol)) curItems.push(newItem)
                })
              }
            })
          }
          await this.saveData()
          this.generateCategoryTabs()
          this.renderKaomoji()
          alert('匯入成功！')
        }
      } catch (err) {
        alert('匯入失敗：' + err.message)
      }
    }
    reader.readAsText(file)
  }

  generateCategoryTabs() {
    const tabsContainer = document.getElementById('categoryTabs')
    const allData = this.getAllData()

    const isActive = (cat) => (this.currentCategory === cat ? 'active' : '')

    let html = `
            <button class="tab-btn ${isActive(
              'recent'
            )}" data-cat="recent"><i class="fa-solid fa-star"></i> 常用</button>
        `

    if (this.currentType === 'kaomoji') {
      html += `<button class="tab-btn ${isActive(
        'custom'
      )}" data-cat="custom"><i class="fa-solid fa-pen"></i> 自訂</button>`
    }

    Object.keys(allData).forEach((cat) => {
      html += `<button class="tab-btn ${isActive(cat)}" data-cat="${cat}">${cat}</button>`
    })
    tabsContainer.innerHTML = html
  } // --- 關鍵修正部分 ---
  renderKaomoji() {
    const grid = document.getElementById('kaomojiGrid')
    let items = []
    const allData = this.getAllData()

    // 1. 決定基礎資料池
    if (this.currentCategory === 'recent') {
      items = [...this.history[this.currentType]]
    } else if (this.currentCategory === 'custom') {
      // 修正：遍歷原始自訂資料並手動補上 metadata (isCustom, sourceCategory)
      Object.entries(this.customKaomoji).forEach(([catKey, catData]) => {
        catData.items.forEach((item) => {
          items.push({
            ...item,
            isCustom: true, // 讓編輯按鈕顯示
            sourceCategory: catKey, // 讓編輯功能知道是哪個分類
          })
        })
      })
    } else if (allData[this.currentCategory]) {
      items = allData[this.currentCategory].items
    }

    // 2. 處理搜尋
    if (this.searchTerm) {
      const term = this.searchTerm.trim().toLowerCase()
      if (term.length > 0) {
        let results = []

        // 全域搜尋，確保能搜尋到分類標籤
        Object.entries(allData).forEach(([catName, catData]) => {
          const catTags = catData.categoryTags || []
          const isCatMatch =
            catName.toLowerCase().includes(term) || catTags.some((t) => t && t.toLowerCase().includes(term))

          catData.items.forEach((item) => {
            const itemTags = item.tags || []
            const isItemMatch =
              item.symbol.toLowerCase().includes(term) ||
              itemTags.some((t) => t && String(t).toLowerCase().includes(term))

            if (isCatMatch || isItemMatch) {
              // 複製物件以附加資訊，避免修改原始資料
              const resultItem = { ...item }
              // 如果沒有來源分類，補上目前遍歷到的分類
              if (!resultItem.sourceCategory) {
                resultItem.sourceCategory = catName
              }
              results.push(resultItem)
            }
          })
        })

        items = [...new Map(results.map((item) => [item.symbol, item])).values()]
      }
    }

    // 3. 渲染
    if (items.length === 0) {
      const randomIcons = [
        'fa-solid fa-poo',
        'fa-solid fa-kiwi-bird',
        'fa-solid fa-seedling',
        'fa-solid fa-leaf',
        'fa-solid fa-cat',
        'fa-solid fa-dog',
        'fa-solid fa-fish',
        'fa-solid fa-dove',
        'fa-solid fa-bug',
      ]
      const randomIcon = randomIcons[Math.floor(Math.random() * randomIcons.length)]

      grid.innerHTML = `<div style="width:100%;text-align:center;padding:80px 40px;color:#bdc3c7;">
      <i class="${randomIcon}" style="font-size:48px;margin-bottom:16px;display:block;"></i>
      目前沒有東西喔！
      </div>`
      return
    }

    grid.innerHTML = ''

    items.forEach((item) => {
      const el = document.createElement('div')
      el.className = 'kaomoji-item'
      el.dataset.symbol = item.symbol

      // Add tooltip if tags exist
      if (item.tags && item.tags.length > 0) {
        el.title = item.tags.join(', ')
      }

      let badgeHtml = ''
      if (this.currentCategory !== 'custom' && item.isCustom) badgeHtml = '<span class="badge badge-custom"></span>'
      if (this.currentCategory !== 'recent' && this.isRecent(item.symbol))
        badgeHtml = '<span class="badge badge-recent"></span>'

      let editBtnHtml = ''
      // 現在因為有補上 isCustom，所以在 Custom 分頁也能看到編輯按鈕
      if (item.isCustom) {
        editBtnHtml = `<div class="edit-btn" title="編輯"><i class="fa-solid fa-pen"></i></div>`
      }

      el.innerHTML = `
                ${editBtnHtml}
                ${badgeHtml}
                <div class="kaomoji-symbol">${item.symbol}</div>
            `

      if (item.isCustom) {
        const editBtn = el.querySelector('.edit-btn')
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation()
          // 優先使用 sourceCategory
          let category = item.sourceCategory
          if (!category) {
            // Fallback: 如果資料老舊沒有標記，嘗試反查
            for (const [cat, data] of Object.entries(this.customKaomoji)) {
              if (data.items.some((i) => i.symbol === item.symbol)) {
                category = cat
                break
              }
            }
          }
          this.openModal('edit', { ...item, category })
        })
      }

      el.addEventListener('click', () => this.handleClick(item.symbol))
      grid.appendChild(el)
    })
  }

  isRecent(symbol) {
    return this.history[this.currentType].some((i) => i.symbol === symbol)
  }

  async handleClick(symbol) {
    await navigator.clipboard.writeText(symbol)
    const msg = document.getElementById('copyMessage')
    msg.classList.add('show')
    setTimeout(() => msg.classList.remove('show'), 1500)

    // 更新 Recent
    let currentHistory = this.history[this.currentType]
    currentHistory = currentHistory.filter((i) => i.symbol !== symbol)
    currentHistory.unshift({ symbol, count: 1, timestamp: Date.now() })
    this.history[this.currentType] = currentHistory.slice(0, this.maxHistorySize)
    await this.saveData()

    // 如果在 Recent 分頁，重新渲染
    if (this.currentCategory === 'recent') this.renderKaomoji()
    else this.renderKaomoji() // 重新渲染以更新 badge
  }

  openModal(mode, data = null) {
    const modal = document.getElementById('addModal')
    const title = document.getElementById('modalTitle')
    const deleteBtn = document.getElementById('deleteBtn')
    const catSelect = document.getElementById('kaomojiCategory')
    const newCatInput = document.getElementById('newCategory')

    const allCats = Object.keys(this.getAllData())
    catSelect.innerHTML =
      `<option value="">選擇分類</option>` +
      allCats.map((c) => `<option value="${c}">${c}</option>`).join('') +
      `<option value="new">➕ 新增分類</option>`

    if (mode === 'edit' && data) {
      this.currentEditTarget = { symbol: data.symbol, category: data.category }
      title.innerHTML = `<i class="fa-solid fa-pen"></i> 編輯顏文字`
      document.getElementById('kaomojiSymbol').value = data.symbol
      document.getElementById('kaomojiTags').value = data.tags ? data.tags.join(',') : ''

      if (allCats.includes(data.category)) {
        catSelect.value = data.category
        newCatInput.style.display = 'none'
      } else {
        catSelect.value = 'new'
        newCatInput.style.display = 'block'
        newCatInput.value = data.category
      }
      deleteBtn.style.display = 'inline-flex'
    } else {
      this.currentEditTarget = null
      title.innerHTML = `<i class="fa-solid fa-plus"></i> 新增顏文字`
      document.getElementById('kaomojiSymbol').value = ''
      document.getElementById('kaomojiTags').value = ''
      catSelect.value = ''
      newCatInput.style.display = 'none'
      deleteBtn.style.display = 'none'
    }

    modal.style.display = 'block'
  }

  async handleAdd(symbol, category, tagsStr) {
    if (!symbol || !category) throw new Error('請填寫完整')
    const tags = tagsStr
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter((t) => t)
    if (!this.customKaomoji[category]) this.customKaomoji[category] = { categoryTags: [category], items: [] }

    // 簡單防呆：如果不允許重複符號
    if (this.customKaomoji[category].items.some((i) => i.symbol === symbol)) {
      // 若是編輯模式(先刪後增)可能會遇到自己跟自己比，暫時不擋，或者依需求修改
    }

    this.customKaomoji[category].items.push({
      symbol,
      tags,
      createdAt: Date.now(),
    })
    await this.saveData()
  }

  // 修正：handleUpdate 安全性
  async handleUpdate(oldData, newSymbol, newCategory, newTagsStr) {
    if (oldData && oldData.symbol && oldData.category) {
      // 先刪除舊的 (false 代表不立即存檔)
      await this.handleDelete(oldData.symbol, oldData.category, false)
    }
    // 再新增新的 (這裡會存檔)
    await this.handleAdd(newSymbol, newCategory, newTagsStr)
  }

  async handleDelete(symbol, category, autoSave = true) {
    if (this.customKaomoji[category]) {
      this.customKaomoji[category].items = this.customKaomoji[category].items.filter((i) => i.symbol !== symbol)
      if (this.customKaomoji[category].items.length === 0) {
        delete this.customKaomoji[category]
      }
    }
    if (autoSave) await this.saveData()
  }

  getRandomHue() {
    // Curated list of nice colors
    const hues = [
      210, // Blue
      260, // Purple
      330, // Pink
      170, // Teal
      200, // Light Blue
      280, // Violet
      350, // Red-Pink
      190, // Cyan
    ]
    return hues[Math.floor(Math.random() * hues.length)]
  }

  updateUIForType() {
    const addBtn = document.getElementById('addKaomoji')
    const grid = document.getElementById('kaomojiGrid')

    if (this.currentType === 'kaomoji') {
      // Use random hue from palette for Kaomoji
      const hue = this.getRandomHue()
      document.documentElement.style.setProperty('--hue', hue)
      addBtn.style.display = 'inline-flex'
      grid.classList.remove('square-mode')
      grid.classList.remove('emoji-mode')
    } else if (this.currentType === 'symbols') {
      document.documentElement.style.setProperty('--hue', '150') // Green
      addBtn.style.display = 'none'
      grid.classList.add('square-mode')
    } else if (this.currentType === 'emoji') {
      document.documentElement.style.setProperty('--hue', '30') // Orange
      addBtn.style.display = 'none'
      grid.classList.add('square-mode')
      grid.classList.add('emoji-mode')
    }
  }

  bindEvents() {
    // Main Tabs
    const mainTabs = document.querySelectorAll('.main-tab')
    mainTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        mainTabs.forEach((t) => t.classList.remove('active'))
        tab.classList.add('active')
        this.currentType = tab.dataset.type
        this.currentCategory = 'recent'
        this.searchTerm = ''
        document.getElementById('searchInput').value = ''
        document.getElementById('categoryWrapper').classList.remove('hidden')

        this.updateUIForType()

        this.generateCategoryTabs()
        this.renderKaomoji()
        this.saveState()

        // Update random header
        const display = document.getElementById('randomDisplay')

        // 如果是 Emoji 模式，改用 Emoji 字型顯示(新增 Emoji CLASS)
        if (this.currentType === 'emoji') {
          display.classList.add('emoji-mode')
        } else {
          display.classList.remove('emoji-mode')
        }

        if (display) display.click()
      })
    })

    const modal = document.getElementById('addModal')
    const closeModal = () => (modal.style.display = 'none')
    document.getElementById('closeModal').onclick = closeModal
    document.getElementById('cancelAdd').onclick = closeModal

    const catSelect = document.getElementById('kaomojiCategory')
    const newCatInput = document.getElementById('newCategory')
    catSelect.addEventListener('change', (e) => {
      newCatInput.style.display = e.target.value === 'new' ? 'block' : 'none'
      if (e.target.value === 'new') newCatInput.focus()
    })

    document.getElementById('confirmAdd').addEventListener('click', async () => {
      try {
        const symbol = document.getElementById('kaomojiSymbol').value
        const tags = document.getElementById('kaomojiTags').value
        let cat = catSelect.value === 'new' ? newCatInput.value : catSelect.value

        if (this.currentEditTarget) {
          await this.handleUpdate(this.currentEditTarget, symbol, cat, tags)
          alert('更新成功')
        } else {
          await this.handleAdd(symbol, cat, tags)
          alert('新增成功')
        }

        this.generateCategoryTabs()
        this.renderKaomoji()
        closeModal()
      } catch (err) {
        alert(err.message)
      }
    })

    document.getElementById('deleteBtn').addEventListener('click', async () => {
      if (!this.currentEditTarget) return
      if (confirm(`確定要刪除 ${this.currentEditTarget.symbol} 嗎？`)) {
        await this.handleDelete(this.currentEditTarget.symbol, this.currentEditTarget.category)
        this.generateCategoryTabs()
        this.renderKaomoji()
        closeModal()
      }
    })

    document.getElementById('addKaomoji').addEventListener('click', () => this.openModal('add'))

    const aboutModal = document.getElementById('aboutModal')
    document.getElementById('infoBtn').addEventListener('click', () => (aboutModal.style.display = 'block'))
    document.getElementById('closeAbout').addEventListener('click', () => (aboutModal.style.display = 'none'))

    document.getElementById('categoryTabs').addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-btn')
      if (btn) {
        document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'))
        btn.classList.add('active')
        this.currentCategory = btn.dataset.cat
        this.searchTerm = ''
        document.getElementById('searchInput').value = ''
        document.getElementById('categoryWrapper').classList.remove('hidden')
        this.renderKaomoji()
        this.saveState()
      }
    })

    const searchInput = document.getElementById('searchInput')
    searchInput.addEventListener('input', (e) => {
      this.searchTerm = e.target.value
      const catWrapper = document.getElementById('categoryWrapper')
      if (this.searchTerm.trim().length > 0) {
        catWrapper.classList.add('hidden')
      } else {
        catWrapper.classList.remove('hidden')
      }
      this.renderKaomoji()
    })

    document.getElementById('clearSearch').addEventListener('click', () => {
      searchInput.value = ''
      this.searchTerm = ''
      document.getElementById('categoryWrapper').classList.remove('hidden')
      this.renderKaomoji()
      searchInput.focus()
    })

    document.getElementById('clearHistory').addEventListener('click', async () => {
      if (confirm('清除紀錄？')) {
        this.history[this.currentType] = []
        await this.saveData()
        this.renderKaomoji()
      }
    })
    document.getElementById('exportBtn').addEventListener('click', () => this.exportData())
    const importInput = document.getElementById('importInput')
    document.getElementById('importBtn').addEventListener('click', () => importInput.click())
    importInput.addEventListener('change', (e) => {
      if (e.target.files.length) {
        this.importData(e.target.files[0])
        e.target.value = ''
      }
    })
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new KaomojiExtension()
})
