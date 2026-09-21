import axios from 'axios'
import { ElMessage } from 'element-plus'
import { notifyAdminRequestError } from '@/utils/adminErrorMessage'

let isRedirectingToLogin = false

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3002/api/v1',
  timeout: 15000,
})

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  config.headers['X-Client-Contract'] = 'im-v1'
  config.headers['X-Client-Version'] = import.meta.env.VITE_APP_VERSION || '1.0.5'
  config.headers['X-Client-Platform'] = 'pc-admin'

  // 清除空字符串参数，避免 enum 校验失败
  if (config.params) {
    const cleaned = {}
    for (const [key, value] of Object.entries(config.params)) {
      if (value !== '' && value !== undefined && value !== null) {
        cleaned[key] = value
      }
    }
    config.params = cleaned
  }

  return config
})

request.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const status = err.response?.status
    if (status === 401) {
      if (err.config?.url?.endsWith('/auth/login')) {
        ElMessage.error('用户名或密码错误')
      } else {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        if (!isRedirectingToLogin && window.location.hash !== '#/login') {
          isRedirectingToLogin = true
          window.location.hash = '#/login'
        }
        ElMessage.error('登录已过期，请重新登录')
      }
    } else if (status === 403) {
      ElMessage.error('权限不足，需要管理员账号')
    } else {
      notifyAdminRequestError(err)
    }
    return Promise.reject(err)
  }
)

export default request

// 公共端点（找回/重置密码）：复用同一 baseURL，但不注入 Authorization 头、
// 也不挂 401 自动跳转登录的拦截器，避免把「重置令牌无效」误判成「登录过期」。
export const publicRequest = axios.create({
  baseURL: request.defaults.baseURL,
  timeout: 15000,
})

publicRequest.interceptors.response.use((res) => res.data)
