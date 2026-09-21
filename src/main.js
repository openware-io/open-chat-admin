import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import App from './App.vue'
import router from './router'
import './styles/global.css'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })

// 邮箱重置链接是无 hash 的路径（如 https://admin.dev.example.com/reset-password?token=xxx），
// 而应用使用 hash 路由，这里在挂载前统一重写为 #/reset-password?token=xxx。
const pathname = window.location.pathname.replace(/\/+$/, '')
if (pathname === '/reset-password' || pathname === '/forgot-password') {
  window.location.replace('/#' + pathname + window.location.search)
} else {
  app.mount('#app')
}
