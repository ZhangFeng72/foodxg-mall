import axios from 'axios'
import { ElMessage } from 'element-plus'

const http = axios.create({ baseURL: '', timeout: 20000 })

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) config.headers.token = token
  return config
})

http.interceptors.response.use(
  (resp) => {
    const data = resp.data
    if (data && data.code === 1) return data.data
    const msg = (data && data.msg) || '操作失败'
    ElMessage.error(msg)
    return Promise.reject(new Error(msg))
  },
  (err) => {
    const status = err.response && err.response.status
    if (status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_name')
      ElMessage.error('登录已失效，请重新登录')
      if (location.hash !== '#/login') location.hash = '#/login'
    } else {
      ElMessage.error('请求失败：' + (err.message || status))
    }
    return Promise.reject(err)
  }
)

export default http
