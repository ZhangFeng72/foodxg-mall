const api = require('../../utils/request')

const STATUS = {
  1: '待付款',
  2: '待接单',
  3: '已接单',
  4: '派送中',
  5: '已完成',
  6: '已取消'
}

Page({
  data: {
    rows: []
  },

  onShow() {
    this.load()
  },

  onPullDownRefresh() {
    this.load().then(() => wx.stopPullDownRefresh())
  },

  load() {
    return api
      .request('GET', '/user/order/historyOrders?page=1&pageSize=10')
      .then((page) => {
        const list = (page && page.records) || []
        const rows = list.map((o) => ({
          ...o,
          statusText: STATUS[o.status] || '未知',
          amountText: Number(o.amount || 0).toFixed(2)
        }))
        this.setData({ rows })
      })
      .catch((e) => api.toast(e.message))
  },

  detail(e) {
    const id = e.currentTarget.dataset.id
    api
      .request('GET', '/user/order/orderDetail/' + id)
      .then((o) => {
        const lines = (o.orderDetailList || [])
          .map((d) => d.name + ' x' + d.number + '  ¥' + Number(d.amount || 0).toFixed(2))
          .join('\n')
        wx.showModal({
          title: '订单详情',
          content:
            '状态：' + (STATUS[o.status] || '未知') +
            '\n收货人：' + (o.consignee || '') + ' ' + (o.phone || '') +
            '\n地址：' + (o.address || '') +
            '\n\n' + lines +
            '\n\n合计：¥' + Number(o.amount || 0).toFixed(2),
          showCancel: false
        })
      })
      .catch((err) => api.toast(err.message))
  },

  cancel(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '取消订单',
      content: '确定取消这笔订单吗？',
      success: (r) => {
        if (!r.confirm) return
        api
          .request('PUT', '/user/order/cancel/' + id + '?cancelReason=' + encodeURIComponent('用户主动取消'))
          .then(() => {
            api.toast('已取消')
            this.load()
          })
          .catch((err) => api.toast(err.message))
      }
    })
  },

  goMenu() {
    wx.switchTab({ url: '/pages/menu/menu' })
  }
})
