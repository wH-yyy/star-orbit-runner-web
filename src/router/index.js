import {createRouter, createWebHistory} from 'vue-router'
import store from "../store/store.js"

// 页面导入
const Login = () => import('../views/Login.vue')
const NotFound = () => import('../views/NotFound.vue')

// 系统管理员端
const AdminLayout = () => import('../views/admin/AdminLayout.vue')
const AdminOverview = () => import('../views/admin/Overview.vue')
const AdminUserManagement = () => import('../views/admin/UserManagement.vue')
const AdminStaffAccount = () => import('../views/admin/StaffAccount.vue')
const AdminDataExport = () => import('../views/admin/DataExport.vue')
const AdminActivityConfig = () => import('../views/admin/ActivityConfig.vue')

// 工作人员页面
const StaffLayout = () => import('../views/staff/StaffLayout.vue')
const StaffAudit = () => import('../views/staff/Audit.vue')
const StaffAppeal = () => import('../views/staff/Appeal.vue')

// 路由规则
const routes = [
    {
        path: '/',
        redirect: () => {
            // 根据登录状态动态重定向
            const isAuthenticated = store.state.user.token
            const userRole = store.state.user.role

            if (!isAuthenticated) {
                return '/login'
            } else if (userRole === 'admin') {
                return '/admin/overview'
            } else if (userRole === 'staff') {
                return '/staff/audit'
            }
            return '/login'
        }
    },
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: {guest: true}
    },
    {
        path: '/admin',
        component: AdminLayout,
        meta: {requiresAuth: true, role: 'admin'},
        children: [
            {path: '', redirect: 'overview'},
            {
                path: 'overview', name: 'AdminOverview', component: AdminOverview,
                meta: {requiresAuth: true, role: 'admin'}
            },
            {
                path: 'user-management', name: 'AdminUsers', component: AdminUserManagement,
                meta: {requiresAuth: true, role: 'admin'}
            },
            {
                path: 'staff-account', name: 'AdminStaff', component: AdminStaffAccount,
                meta: {requiresAuth: true, role: 'admin'}
            },
            {
                path: 'data-export', name: 'AdminDataExport', component: AdminDataExport,
                meta: {requiresAuth: true, role: 'admin'}
            },
            {
                path: 'activity-config', name: 'AdminSettings', component: AdminActivityConfig,
                meta: {requiresAuth: true, role: 'admin'}
            }
        ]
    },
    {
        path: '/staff',
        component: StaffLayout,
        meta: {requiresAuth: true, role: 'staff'},
        children: [
            {path: '', redirect: 'audit'},
            {
                path: 'audit', name: 'StaffAudit', component: StaffAudit,
                meta: {requiresAuth: true, role: 'staff'}
            },
            {
                path: 'appeal', name: 'StaffAppeal', component: StaffAppeal,
                meta: {requiresAuth: true, role: 'staff'}
            }
        ]
    },
    {path: '/:pathMatch(.*)*', component: NotFound}
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
    const isAuthenticated = store.state.user.token
    const userRole = store.state.user.role

    // 获取所有匹配的路由记录（包括父路由）
    const matchedRecords = to.matched

    // 检查是否需要认证
    const needsAuth = matchedRecords.some(record => record.meta.requiresAuth)
    const requiredRole = matchedRecords.reduce((role, record) => {
        return record.meta.role || role
    }, null)

    // 认证检查
    if (needsAuth && !isAuthenticated) {
        next('/login')
        return
    }

    // 角色检查
    if (needsAuth && requiredRole && requiredRole !== userRole) {
        // 角色不符，重定向到用户有权访问的首页
        const fallbackRoute = userRole === 'admin' ? '/admin/overview' : '/staff/audit'
        next(fallbackRoute)
        return
    }

    // 已登录访问登录页
    if (to.meta.guest && isAuthenticated) {
        const fallbackRoute = userRole === 'admin' ? '/admin/overview' : '/staff/audit'
        next(fallbackRoute)
        return
    }

    // 根路径重定向
    if (to.path === '/') {
        if (!isAuthenticated) {
            next('/login')
        } else if (userRole === 'admin') {
            next('/admin/overview')
        } else if (userRole === 'staff') {
            next('/staff/audit')
        } else {
            next('/login')
        }
        return
    }

    next()
})

export default router