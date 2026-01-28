import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router/index.js'  // 导入路由
import store from './store/store.js'

// 创建 Vue 应用并使用路由
const app = createApp(App)
app.use(router)  // 注册路由
app.use(store)

app.mount('#app')

