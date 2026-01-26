<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// 菜单项配置
const menuItems = [
  { path: '/dashboard', icon: '📊', label: '仪表盘' },
  { path: '/users', icon: '👥', label: '用户管理' },
  { path: '/appeals', icon: '📝', label: '申诉列表' }
]

// 判断菜单是否激活
const isActive = (path) => {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>

<template>
  <aside class="sidebar">
    <nav class="menu">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="menu-item"
        :class="{ active: isActive(item.path) }"
      >
        <span class="icon">{{ item.icon }}</span>
        <span class="label">{{ item.label }}</span>
      </router-link>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 200px;
  background: #001529;
  min-height: calc(100vh - 60px);
  padding: 20px 0;
}

.menu {
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 14px 24px;
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
  transition: all 0.3s;
  border-left: 3px solid transparent;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

.menu-item.active {
  background: #1890ff;
  color: white;
  border-left-color: #40a9ff;
}

.icon {
  font-size: 18px;
  margin-right: 12px;
}

.label {
  font-size: 14px;
}
</style>
