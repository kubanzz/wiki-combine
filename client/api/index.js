import axios from 'axios'
import store from '../store'

// 1.创建axios的实例
const instance = axios.create({
  baseURL: '/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  },
  changeOrigin: true
})

// 2.axios的拦截器
// 2.1.请求拦截的作用
instance.interceptors.request.use(config => {
  return config
}, err => {

})

// 2.2.响应拦截
instance.interceptors.response.use(res => {
  // 未设置状态码则默认成功状态
  const code = res.data.code || 200
  const message = res.data.message
  // 二进制数据则直接返回
  if (res.request.responseType === 'blob' || res.request.responseType === 'arraybuffer') {
    return res.data
  }

  if (code !== 200) {
    store.commit('showNotification', {
      style: 'red',
      message: message || '服务器内部错误。',
      icon: 'alert'
    })
    return Promise.reject(res.data)
  }

  return res.data
}, err => {
  err.message = err.message || '服务器内部错误。'
  store.commit('showNotification', {
    style: 'red',
    message: err.message,
    icon: 'alert'
  })
  console.error(err)
  return Promise.reject(err)
})

export default instance
