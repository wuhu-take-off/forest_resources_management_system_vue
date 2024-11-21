// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import axios from 'axios'
import config from './config'
import WebSocketService from '@/services/websocket'

Vue.use(ElementUI)
Vue.config.productionTip = false

// 设置axios默认配置
axios.defaults.baseURL = config.baseURL

// 请求拦截器
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = token
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
axios.interceptors.response.use(
  response => {
    return response
  },
  error => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // token失效，清除token并跳转到登录页
          localStorage.removeItem('token')
          router.push('/')
          break
        default:
          Vue.prototype.$message.error(error.response.data.message || '服务器错误')
      }
    }
    return Promise.reject(error)
  }
)

// 将 axios 挂载到 Vue 原型上
Vue.prototype.$axios = axios
// 将 config 挂载到 Vue 原型上
Vue.prototype.$config = config

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>',
  beforeDestroy() {
    // 在应用关闭时断开 WebSocket 连接
    WebSocketService.disconnect()
  }
})
