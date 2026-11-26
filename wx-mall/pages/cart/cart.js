const api = require('../../utils/request')

Page({
  data: {
    rows: [],
    broken: {},
    count: 0,
    amountText: '0.00'
  },

  onShow() {
    this.load()
  },

  load() {
    api
      .request('GET', '/user/shoppingCart/list')
      .then((list) => {
        const rows = (list || []).map((r) => ({
          ...r,
          priceText: Number(r.amount || 0).toFixed(2)
        }))
        let count = 0
        let amount = 0
        rows.forEach((r) => {
          count += Number(r.number || 0)
          amount += Number(r.amount || 0) * Number(r.number || 0)
        })
        this.setData({ rows, count, amountText: amount.toFixed(2) })
        if (count > 0) {
          wx.setTabBarBadge({ index: 1, text: String(count) })
        } else {
          wx.removeTabBarBadge({ index: 1 })
        }
      })
      .catch((e) => api.toast(e.message))
  },

  add(e) {
    const { dish, setmeal } = e.currentTarget.dataset
    const body = setmeal ? { setmealId: setmeal } : { dishId: dish }
    api.request('POST', '/user/shoppingCart/add', body).then(() => this.load()).catch((err) => api.toast(err.message))
  },

  sub(e) {
    const { dish, setmeal } = e.currentTarget.dataset
    const body = setmeal ? { setmealId: setmeal } : { dishId: dish }
    api.request('POST', '/user/shoppingCart/sub', body).then(() => this.load()).catch((err) => api.toast(err.message))
  },

  clean() {
    wx.showModal({
      title: '清空购物车',
      content: '清空后需要重新选购',
      success: (r) => {
        if (!r.confirm) return
        api.request('DELETE', '/user/shoppingCart/clean').then(() => this.load()).catch((err) => api.toast(err.message))
      }
    })
  },

  imgError(e) {
    const id = e.currentTarget.dataset.id
    const broken = Object.assign({}, this.data.broken)
    broken[id] = true
    this.setData({ broken })
  },

  goCheckout() {
    wx.navigateTo({ url: '/pages/checkout/checkout' })
  },

  goMenu() {
    wx.switchTab({ url: '/pages/menu/menu' })
  }
})
