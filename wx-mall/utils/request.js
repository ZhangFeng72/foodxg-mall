const BASE = 'http://127.0.0.1:8080'
let loginTask = null

function token() {
  return wx.getStorageSync('user_token') || ''
}

// 本地开发免微信登录：后端 dev 分支识别 dev_ 前缀的 code
function ensureLogin() {
  if (token()) return Promise.resolve(token())
  if (loginTask) return loginTask
  loginTask = new Promise((resolve, reject) => {
    wx.request({
      url: BASE + '/user/user/login',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { code: 'dev_wx_' + Math.random().toString(36).slice(2, 10) },
      success(res) {
        const body = res.data || {}
        if (body.code === 1 && body.data && body.data.token) {
          wx.setStorageSync('user_token', body.data.token)
          loginTask = null
          resolve(body.data.token)
        } else {
          loginTask = null
          reject(new Error(body.msg || '登录失败'))
        }
      },
      fail(err) {
        loginTask = null
        reject(err)
      }
    })
  })
  return loginTask
}

function request(method, url, data) {
  return ensureLogin().then(
    () =>
      new Promise((resolve, reject) => {
        wx.request({
          url: BASE + url,
          method: method,
          data: data || {},
          header: {
            'Content-Type': 'application/json',
            // 用户端令牌头名是 authentication（不是 token）
            authentication: token()
          },
          success(res) {
            const body = res.data || {}
            if (res.statusCode === 200 && body.code === 1) {
              resolve(body.data)
            } else if (res.statusCode === 401) {
              wx.removeStorageSync('user_token')
              reject(new Error('登录状态已失效，请重新进入'))
            } else {
              reject(new Error(body.msg || '请求失败(' + res.statusCode + ')'))
            }
          },
          fail(err) {
            reject(new Error(err.errMsg || '网络异常'))
          }
        })
      })
  )
}

function toast(msg) {
  wx.showToast({ title: msg, icon: 'none' })
}

function pad(n) {
  return String(n).padStart(2, '0')
}

// 后端 LocalDateTime 需要 "yyyy-MM-dd HH:mm:ss"
function fmtDateTime(date) {
  return (
    date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
    ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds())
  )
}

module.exports = { BASE, request, ensureLogin, token, toast, fmtDateTime }
