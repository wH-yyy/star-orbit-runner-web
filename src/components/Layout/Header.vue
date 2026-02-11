<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'
import EditProfileDialog from '../EditProfileDialog.vue'

const router = useRouter()
const route = useRoute()
const store = useStore()
const showDropdown = ref(false)
const currentTime = ref('')
const showEditDialog = ref(false)

// 从 store 获取用户信息
const userInfo = computed(() => ({
  name: store.state.user.info?.name || '用户',
  email: store.state.user.info?.email || '',
  avatar: '👤'
}))

// 获取当前页标题
const pageTitle = computed(() => {
  const routeMap = {
    'AdminOverview': '概览',
    'AdminUsers': '用户管理',
    'AdminStaff': '工作账号分派',
    'AdminDataExport': '数据导出',
    'AdminSettings': '活动配置',
    'StaffAudit': '审核',
    'StaffAppeal': '申诉'
  }
  return routeMap[route.name] || '星轨Runner'
})

// 更新当前时间
const updateCurrentTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 切换下拉菜单
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

// 关闭下拉菜单
const closeDropdown = () => {
  showDropdown.value = false
}

// 编辑个人信息
const editProfile = () => {
  closeDropdown()
  showEditDialog.value = true
}

// 保存个人信息
const saveProfile = (formData) => {
  console.log('保存个人信息:', formData)
  // 更新 store 中的用户信息
  store.dispatch('updateUserInfo', formData)
  
  // 显示保存成功的消息
  store.commit('SET_MESSAGE', {
    message: '个人信息更新成功',
    type: 'success'
  })
}

// 退出登录
const logout = async () => {
  closeDropdown()

  try {
    // 1. 调用 store 的退出登录 action
    await store.dispatch('logout')

    // 2. 清除所有相关存储
    // 清除 sessionStorage（如果有）
    sessionStorage.clear()

    // 清除 cookie（如果有）
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=')
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    })

    // 3. 显示退出成功消息（可选）
    store.commit('SET_MESSAGE', {
      message: '已成功退出登录',
      type: 'success'
    })

    // 4. 重定向到登录页
    await router.push('/login')

  } catch (error) {
    console.error('退出登录失败:', error)
    store.commit('SET_MESSAGE', {
      message: '退出登录失败，请重试',
      type: 'error'
    })
  }
}

// 初始化
onMounted(() => {
  updateCurrentTime()
  setInterval(updateCurrentTime, 1000)

  // 点击其他地方关闭下拉菜单
  document.addEventListener('click', (e) => {
    const target = e.target
    if (!target.closest('.user-info')) {
      closeDropdown()
    }
  })
})
</script>

<template>
  <header class="top-bar">
    <div class="top-bar-left">
      <h2 class="page-title">{{ pageTitle }}</h2>
      <span class="current-time">{{ currentTime }}</span>
    </div>
    <div class="top-bar-right">
      <div class="user-info" @click="toggleDropdown">
        <span class="user-avatar">{{ userInfo.avatar }}</span>
        <span class="user-name">{{ userInfo.name }}</span>
        <span class="dropdown-arrow">{{ showDropdown ? '▼' : '▶' }}</span>

        <!-- 下拉菜单 -->
        <div v-if="showDropdown" class="user-dropdown">
          <div class="dropdown-item" @click="editProfile">
            <span class="dropdown-icon">✏️</span>
            <span>编辑个人信息</span>
          </div>
          <div class="dropdown-item" @click="logout">
            <span class="dropdown-icon">🚪</span>
            <span>退出登录</span>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- 编辑个人信息弹窗 -->
  <EditProfileDialog 
    v-model:visible="showEditDialog"
    :userInfo="userInfo"
    @save="saveProfile"
  />
</template>

<style scoped>
/* 顶部横幅样式 */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 64px;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #000000;
  margin: 0;
}

.current-time {
  font-size: 14px;
  color: #6e7989;
}

.top-bar-right {
  display: flex;
  align-items: center;
}

/* 用户信息样式 */
.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  position: relative;
  transition: all 0.3s ease;
}

.user-info:hover {
  background-color: rgb(219, 219, 219);
}

.user-avatar {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgb(255, 255, 255);
  border-radius: 50%;
  color: #ffffff;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #1a365d;
}

.dropdown-arrow {
  font-size: 12px;
  color: #a0aec0;
  transition: transform 0.3s ease;
}

/* 下拉菜单样式 */
.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  width: 200px;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #1a365d;
}

.dropdown-item:hover {
  background-color: #f7fafc;
}

.dropdown-icon {
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .top-bar {
    padding: 0 16px;
  }

  .top-bar-left {
    gap: 12px;
  }

  .page-title {
    font-size: 16px;
  }

  .current-time {
    display: none;
  }

  .user-name {
    display: none;
  }
}
</style>
