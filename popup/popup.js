class KaomojiExtension {
  constructor() {
    this.currentCategory = 'all'
    this.searchTerm = ''
    this.recentHistory = []
    this.customKaomoji = {}
    this.maxHistorySize = 40
    this.currentEditTarget = null
    this.init()
  }

  async init() {
    this.applyTheme()
    await this.loadData()
    this.setupRandomHeader()
    this.generateCategoryTabs()
    this.renderKaomoji()
    this.bindEvents()
    this.updateStats()
  }

  applyTheme() {
    const randomHue = Math.floor(Math.random() * 360)
    document.documentElement.style.setProperty('--hue', randomHue)
  }

  setupRandomHeader() {
    const display = document.getElementById('randomDisplay')
    const copyBtn = document.getElementById('copyRandomBtn')

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

    display.addEventListener('click', updateRandom)
    copyBtn.addEventListener('click', async (e) => {
      e.stopPropagation()
      await this.handleClick(display.textContent)
    })
  }

  async loadData() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const result = await chrome.storage.local.get(['kaomojiHistory', 'customKaomoji'])
      this.recentHistory = result.kaomojiHistory || []
      this.customKaomoji = result.customKaomoji || {}
    } else {
      const hist = localStorage.getItem('kaomojiHistory')
      const cust = localStorage.getItem('customKaomoji')
      this.recentHistory = hist ? JSON.parse(hist) : []
      this.customKaomoji = cust ? JSON.parse(cust) : {}
    }
  }

  async saveData() {
    const data = { kaomojiHistory: this.recentHistory, customKaomoji: this.customKaomoji }
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set(data)
    } else {
      localStorage.setItem('kaomojiHistory', JSON.stringify(this.recentHistory))
      localStorage.setItem('customKaomoji', JSON.stringify(this.customKaomoji))
    }
  }

  // 取得合併資料 (預設+自訂)
  getAllData() {
    // 假設 defaultKaomojiData 來自於 kaomoji-data.js
    const combined = typeof defaultKaomojiData !== 'undefined' ? JSON.parse(JSON.stringify(defaultKaomojiData)) : {}

    Object.keys(this.customKaomoji).forEach((cat) => {
      if (!combined[cat]) combined[cat] = { categoryTags: [cat], items: [] }

      // 避免重複加入
      const existing = new Set(combined[cat].items.map((i) => i.symbol))
      this.customKaomoji[cat].items.forEach((item) => {
        if (!existing.has(item.symbol)) {
          // 加入 sourceCategory 方便反查
          combined[cat].items.push({ ...item, isCustom: true, sourceCategory: cat })
        }
      })
    })
    return combined
  }

  exportData() {
    const exportObj = {
      version: 1,
      date: new Date().toISOString(),
      history: this.recentHistory,
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
          const oldHistSym = new Set(this.recentHistory.map((h) => h.symbol))
          ;(data.history || []).forEach((h) => {
            if (!oldHistSym.has(h.symbol)) this.recentHistory.push(h)
          })
          this.recentHistory.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
          this.recentHistory = this.recentHistory.slice(0, this.maxHistorySize)
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
          this.updateStats()
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
    let html = `
            <button class="tab-btn" data-cat="recent"><i class="fa-solid fa-clock-rotate-left"></i> 紀錄</button>
            <button class="tab-btn active" data-cat="all"><i class="fa-solid fa-layer-group"></i> 全部</button>
            <button class="tab-btn" data-cat="custom"><i class="fa-solid fa-user-pen"></i> 自訂</button>
        `
    Object.keys(allData).forEach((cat) => {
      html += `<button class="tab-btn" data-cat="${cat}">${cat}</button>`
    })
    tabsContainer.innerHTML = html
  }

  // --- 關鍵修正部分 ---
  renderKaomoji() {
    const grid = document.getElementById('kaomojiGrid')
    let items = []
    const allData = this.getAllData()

    // 1. 決定基礎資料池
    if (this.currentCategory === 'recent') {
      items = [...this.recentHistory]
    } else if (this.currentCategory === 'all') {
      Object.values(allData).forEach((cat) => items.push(...cat.items))
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
        let searchPool = items

        // 搜尋模式擴大範圍
        if (['recent', 'all', 'custom'].includes(this.currentCategory)) {
          searchPool = []
          Object.values(allData).forEach((cat) => searchPool.push(...cat.items))
        }

        const matchingCats = Object.keys(allData).filter((key) => {
          const catData = allData[key]
          if (key.toLowerCase().includes(term)) return true
          if (catData.categoryTags && catData.categoryTags.some((t) => t && t.toLowerCase().includes(term))) return true
          return false
        })

        items = searchPool.filter((item) => {
          if (item.symbol.toLowerCase().includes(term)) return true
          const itemTags = Array.isArray(item.tags) ? item.tags : []
          if (itemTags.some((t) => t && String(t).toLowerCase().includes(term))) return true

          // 嘗試找出分類，優先使用 metadata 中的 sourceCategory
          const itemCatKey =
            item.sourceCategory ||
            Object.keys(allData).find((cat) => allData[cat].items.some((i) => i.symbol === item.symbol))
          if (itemCatKey && matchingCats.includes(itemCatKey)) return true
          return false
        })

        items = [...new Map(items.map((item) => [item.symbol, item])).values()]
      }
    }

    // 3. 渲染
    if (items.length === 0) {
      grid.innerHTML = `<div style="width:100%;text-align:center;padding:40px;color:#bdc3c7;">沒有找到顏文字</div>`
      return
    }

    grid.innerHTML = ''

    items.forEach((item) => {
      const el = document.createElement('div')
      el.className = 'kaomoji-item'
      el.dataset.symbol = item.symbol

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
    return this.recentHistory.some((i) => i.symbol === symbol)
  }

  async handleClick(symbol) {
    await navigator.clipboard.writeText(symbol)
    const msg = document.getElementById('copyMessage')
    msg.classList.add('show')
    setTimeout(() => msg.classList.remove('show'), 1500)

    // 更新 Recent
    this.recentHistory = this.recentHistory.filter((i) => i.symbol !== symbol)
    this.recentHistory.unshift({ symbol, count: 1, timestamp: Date.now() })
    this.recentHistory = this.recentHistory.slice(0, this.maxHistorySize)
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

    this.customKaomoji[category].items.push({ symbol, tags, createdAt: Date.now() })
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

  updateStats() {
    const total = Object.values(this.getAllData()).reduce((acc, cat) => acc + cat.items.length, 0)
    document.getElementById('totalCount').innerText = total
  }

  bindEvents() {
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
        this.updateStats()
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
        this.updateStats()
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
        this.recentHistory = []
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
