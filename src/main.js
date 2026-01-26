import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'  // 导入路由

// 创建 Vue 应用并使用路由
createApp(App)
  .use(router)  // 注册路由
  .mount('#app')

