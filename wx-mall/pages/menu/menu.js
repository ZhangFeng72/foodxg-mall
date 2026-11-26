const api = require('../../utils/request')

Page({
  data: {
    shopOpen: true,
    categories: [],
    activeId: null,
    activeName: '',
    items: [],
    isSetmeal: false,
    broken: {},
    cartCount: 0,
    cartAmountText: '0.00',
    countMap: {}
  },

  onShow() {
    this.loadAll()
  },

  loadAll() {
    Promise.all([this.loadShop(), this.loadCategories(), this.loadCart()]).catch((e) => api.toast(e.message))
  },

  loadShop() {
    // 免登录接口
    return new Promise((resolve) => {
      wx.request({
        url: api.BASE + '/user/shop/status',
        success: (res) => {
          const b = res.data || {}
          if (b.code === 1) this.setData({ shopOpen: b.data === 1 })
          resolve()
        },
        fail: () => resolve()
      })
    })
  },

  loadCategories() {
    return api.request('GET', '/user/category/list?type=1').then((list) => {
      const categories = (list || []).map((c) => ({ id: c.id, name: c.name }))
      this.setData({ categories })
      if (categories.length) this.pickCategory(categories[0].id, false)
    })
  },

  switchCat(e) {
    const id = e.currentTarget.dataset.id
    this.pickCategory(id, true)
  },

  pickCategory(id, scroll) {
    const cat = this.data.categories.find((c) => c.id === id)
    this.setData({ activeId: id, activeName: cat ? cat.name : '', isSetmeal: false })
    this.loadItems(id)
  },

  loadItems(categoryId) {
    return api.request('GET', '/user/dish/list?categoryId=' + categoryId).then((list) => {
      const items = (list || []).map((d) => ({
        ...d,
        priceText: Number(d.price || 0).toFixed(2)
      }))
      this.setData({ items, isSetmeal: false })
    })
  },

  loadCart() {
    return api.request('GET', '/user/shoppingCart/list').then((list) => {
      const rows = list || []
      const countMap = {}
      let count = 0
      let amount = 0
      rows.forEach((r) => {
        const key = r.setmealId ? 's' + r.setmealId : 'd' + r.dishId
        countMap[r.dishId || r.setmealId] = Number(r.number || 0)
        count += Number(r.number || 0)
        amount += Number(r.amount || 0) * Number(r.number || 0)
      })
      this.setData({ countMap, cartCount: count, cartAmountText: amount.toFixed(2) })
      this.syncTabBar(count)
    })
  },

  syncTabBar(count) {
    if (count > 0) {
      wx.setTabBarBadge({ index: 1, text: String(count) }).catch(() => {})
    } else {
      wx.removeTabBarBadge({ index: 1 }).catch(() => {})
    }
  },

  add(e) {
    const id = e.currentTarget.dataset.id
    api
      .request('POST', '/user/shoppingCart/add', { dishId: id })
      .then(() => this.loadCart())
      .catch((err) => api.toast(err.message))
  },

  sub(e) {
    const id = e.currentTarget.dataset.id
    api
      .request('POST', '/user/shoppingCart/sub', { dishId: id })
      .then(() => this.loadCart())
      .catch((err) => api.toast(err.message))
  },

  imgError(e) {
    const id = e.currentTarget.dataset.id
    const broken = Object.assign({}, this.data.broken)
    broken[id] = true
    this.setData({ broken })
  },

  goCart() {
    wx.switchTab({ url: '/pages/cart/cart' })
  },

  goCheckout() {
    if (!this.data.shopOpen) return api.toast('店铺休息中')
    if (this.data.cartCount === 0) return api.toast('购物车是空的')
    wx.navigateTo({ url: '/pages/checkout/checkout' })
  }
})
