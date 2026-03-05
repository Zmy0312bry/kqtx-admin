import axios from 'axios'
import { useAuthStore } from '../stores/token'
/**
 * 创建一个axios实例
 */
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 15000,
})

/**
 * 请求拦截器
 */
instance.interceptors.request.use(
  (config) => {
    const token = useAuthStore().getToken()
    if (token) {
      config.headers.Authorization = token
    }
    // 只有在上传文件时才使用 multipart/form-data
    // GET 请求和普通 POST 请求使用 application/json
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data'
    } else if (config.method !== 'get' && config.data) {
      config.headers['Content-Type'] = 'application/json'
    }
    console.log('[Request]', config.method?.toUpperCase(), config.url, config)
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  },
)

/**
 * 响应拦截器
 */
instance.interceptors.response.use(
  (response) => {
    console.log('[Response]', response.config.url, response.data)
    return response.data
  },
  (error) => {
    console.error('[Response Error]', error.config?.url, error.message, error)
    return Promise.reject(error)
  },
)

/**
 * 封装请求方法
 * @param {string} url - 请求路径
 * @param {Object} options - 请求配置选项
 * @returns {Promise}
 */
export const request = {
  get: (url, options = {}) => {
    return instance.get(url, options)
  },
  post: (url, data = {}, options = {}) => {
    return instance.post(url, data, options)
  },
  put: (url, data = {}, options = {}) => {
    return instance.put(url, data, options)
  },
  delete: (url, options = {}) => {
    return instance.delete(url, options)
  },
}

export default instance
