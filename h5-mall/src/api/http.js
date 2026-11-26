import axios from 'axios'
import { ref } from 'vue'
import { showToast } from 'vant'

export const cartCount = ref(0)

const http = axios.create({ baseURL: '', timeout: 20000 })

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('user_token')
  if (token) {
    config.headers.authentication = token
    config.headers.token = token
  }
  return config
})

http.interceptors.response.use(
  (resp) => {
    const data = resp.data
    if (data && data.code === 1) return data.data
    const msg = (data && data.msg) || '操作失败'
    showToast(msg)
    return Promise.reject(new Error(msg))
  },
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('user_token')
    }
    showToast(err.response?.status === 401 ? '登录已失效' : '网络异常，请稍后重试')
    return Promise.reject(err)
  }
)

let loginTask = null

/** 本地联调登录：code 以 dev_ 开头，后端直接放行并生成 openid */
export function ensureLogin() {
  if (localStorage.getItem('user_token')) return Promise.resolve()
  if (loginTask) return loginTask
  loginTask = http
    .post('/user/user/login', { code: 'dev_h5_local' })
    .then((data) => {
      localStorage.setItem('user_token', data.token)
      localStorage.setItem('user_id', String(data.id))
      return data
    })
    .finally(() => {
      loginTask = null
    })
  return loginTask
}

export async function refreshCartCount() {
  try {
    const list = await http.get('/user/shoppingCart/list')
    cartCount.value = (list || []).reduce((sum, item) => sum + Number(item.number || 0), 0)
  } catch (e) {
    cartCount.value = 0
  }
}

export default http
