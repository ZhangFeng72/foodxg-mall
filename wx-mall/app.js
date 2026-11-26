App({
  globalData: {
    BASE: 'http://127.0.0.1:8080'
  },
  onLaunch() {
    const t = wx.getStorageSync('user_token')
    if (t) this.globalData.token = t
  }
})
