const api = require('../../utils/request')

Page({
  data: {
    items: [],
    count: 0,
    amountText: '0.00',
    address: null,
    editMode: false,
    remark: '',
    submitting: false,
    form: {
      consignee: '卞同学',
      phone: '13800000000',
      detail: '徐州工程学院 敬文楼 20X'
    }
  },

  onLoad() {
    this.load()
  },

  load() {
    Promise.all([
      api.request('GET', '/user/shoppingCart/list'),
      api.request('GET', '/user/addressBook/default').catch(() => null)
    ])
      .then(([cart, addr]) => {
        const items = (cart || []).map((r) => ({
          ...r,
          lineText: (Number(r.amount || 0) * Number(r.number || 0)).toFixed(2)
        }))
        let count = 0
        let amount = 0
        items.forEach((r) => {
          count += Number(r.number || 0)
          amount += Number(r.amount || 0) * Number(r.number || 0)
        })
        this.setData({
          items,
          count,
          amountText: amount.toFixed(2),
          address: addr || null,
          editMode: !addr
        })
        if (!items.length) api.toast('购物车是空的')
      })
      .catch((e) => api.toast(e.message))
  },

  onInput(e) {
    const key = e.currentTarget.dataset.key
    this.setData({ ['form.' + key]: e.detail.value })
  },

  onRemark(e) {
    this.setData({ remark: e.detail.value })
  },

  toggleEdit() {
    this.setData({ editMode: true })
  },

  saveAddress() {
    const f = this.data.form
    if (!f.consignee || !f.phone || !f.detail) return api.toast('请填写完整地址')
    api
      .request('POST', '/user/addressBook', {
        consignee: f.consignee,
        phone: f.phone,
        sex: '1',
        provinceName: '江苏省',
        provinceCode: '320000',
        cityName: '徐州市',
        cityCode: '320300',
        districtName: '云龙区',
        districtCode: '320303',
        detail: f.detail,
        label: '学校',
        isDefault: 1
      })
      .then(() => api.request('GET', '/user/addressBook/list'))
      .then((list) => {
        const last = list && list.length ? list[list.length - 1] : null
        if (last) return api.request('PUT', '/user/addressBook/default', { id: last.id })
      })
      .then(() => api.request('GET', '/user/addressBook/default'))
      .then((addr) => {
        this.setData({ address: addr, editMode: false })
        api.toast('地址已保存')
      })
      .catch((e) => api.toast(e.message))
  },

  submit() {
    const { address, items, amountText, remark } = this.data
    if (!address) return api.toast('请先填写配送地址')
    if (!items.length) return api.toast('购物车是空的')
    if (this.data.submitting) return

    this.setData({ submitting: true })
    api
      .request('POST', '/user/order/submit', {
        addressBookId: address.id,
        amount: Number(amountText),
        payMethod: 1,
        remark: remark,
        deliveryStatus: 1,
        tablewareNumber: 0,
        tablewareStatus: 0,
        packAmount: 0,
        estimatedDeliveryTime: api.fmtDateTime(new Date(Date.now() + 30 * 60 * 1000))
      })
      .then((order) =>
        api.request('PUT', '/user/order/payment', { orderNumber: order.orderNumber, payMethod: 1 }).then(() => order)
      )
      .then((order) => {
        this.setData({ submitting: false })
        wx.showModal({
          title: '下单成功',
          content: '订单号 ' + order.orderNumber + '\n已模拟支付，可在订单页查看进度',
          showCancel: false,
          confirmText: '查看订单',
          success: () => wx.switchTab({ url: '/pages/orders/orders' })
        })
      })
      .catch((e) => {
        this.setData({ submitting: false })
        api.toast(e.message)
      })
  }
})
