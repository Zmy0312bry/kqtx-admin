import axios from 'axios'
import { useAuthStore } from '../stores/token'
/**
 * 创建一个axios实例
 */
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 3000,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
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
    return response.data
  },
  (error) => {
    console.error('Response error:', error)
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
