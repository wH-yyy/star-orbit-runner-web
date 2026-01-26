import { createRouter, createWebHistory } from 'vue-router'

// 导入页面组件
import Login from '../views/Login.vue'
import Layout from '../components/Layout/Layout.vue'
import Dashboard from '../views/Dashboard.vue'
import UserList from '../views/Users/Userlist.vue'
import AppealList from '../views/Appeals/AppealList.vue'
import AppealDetail from '../views/Appeals/AppealDetail.vue'

// 定义路由规则
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: { title: '仪表盘' }
      },
      {
        path: 'users',
        name: 'UserList',
        component: UserList,
        meta: { title: '用户管理' }
      },
      {
        path: 'appeals',
        name: 'AppealList',
        component: AppealList,
        meta: { title: '申诉列表' }
      },
      {
        path: 'appeals/:id',
        name: 'AppealDetail',
        component: AppealDetail,
        meta: { title: '申诉详情' }
      }
    ]
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：检查登录状态
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  // 如果访问的不是登录页，且没有 token，则跳转到登录页
  if (to.path !== '/login' && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    // 如果已登录且访问登录页，跳转到首页
    next('/dashboard')
  } else {
    next()
  }
})

export default router
