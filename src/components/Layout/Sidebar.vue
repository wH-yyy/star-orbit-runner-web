<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'

const route = useRoute()
const store = useStore()

// 从store获取用户角色
const userRole = computed(() => store.state.user.role)

// 管理员菜单项
const adminMenuItems = [
  { path: '/admin/overview', icon: '📊', label: '概览' },
  { path: '/admin/user-management', icon: '👥', label: '用户管理' },
  { path: '/admin/staff-account', icon: '👤', label: '工作账号分派' },
  { path: '/admin/activity-config', icon: '⚙️', label: '活动配置' }
]

// 工作人员菜单项
const staffMenuItems = [
  { path: '/staff/audit', icon: '📋', label: '审核' },
  { path: '/staff/appeal', icon: '📄', label: '申诉' }
]

// 根据用户角色获取菜单项
const menuItems = computed(() => {
  if (userRole.value === 'admin') {
    return adminMenuItems
  } else if (userRole.value === 'staff') {
    return staffMenuItems
  }
  return []
})

// 获取侧边栏标题
const sidebarTitle = computed(() => {
  if (userRole.value === 'admin') {
    return '管理员端'
  } else if (userRole.value === 'staff') {
    return '工作人员端'
  }
  return '管理端'
})

// 判断菜单是否激活
const isActive = (path) => {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h1>星轨Runner</h1>
      <p>{{ sidebarTitle }}</p>
    </div>
    <nav class="sidebar-nav">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ 'router-link-active': isActive(item.path) }"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-text">{{ item.label }}</span>
      </router-link>
    </nav>
  </aside>
</template>

<style scoped>
/* 侧边栏样式 */
.sidebar {
  width: 240px;
  background-color: #1a3a5f;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.sidebar-header {
  padding: 24px;
  text-align: center;
  background-color: #1a3a5f;
}

.sidebar-header h1 {
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 4px;
}

.sidebar-header p {
  font-size: 12px;
  color: #a6a6a6;
}

.sidebar-nav {
  flex: 1;
  padding: 20px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  color: #ffffff;
  text-decoration: none;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.nav-item.router-link-active {
  background-color: rgba(64, 158, 255, 0.2);
  color: #ffffff;
  border-left-color: #409EFF;
}

.nav-icon {
  font-size: 18px;
  margin-right: 12px;
}

.nav-text {
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    width: 64px;
  }

  .sidebar-header h1,
  .sidebar-header p,
  .nav-text {
    display: none;
  }

  .nav-icon {
    margin-right: 0;
  }

  .nav-item {
    justify-content: center;
    padding: 12px;
  }
}
</style>
