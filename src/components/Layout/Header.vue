<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref(localStorage.getItem('username') || '用户')

// 退出登录
const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    console.log('用户退出登录')
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    router.push('/login')
  }
}
</script>

<template>
  <header class="header">
    <div class="header-left">
      <h1>🌟 星轨Runner 管理端</h1>
    </div>
    <div class="header-right">
      <span class="username">👤 {{ username }}</span>
      <button @click="handleLogout" class="logout-btn">退出</button>
    </div>
  </header>
</template>

<style scoped>
.header {
  height: 60px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header-left h1 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.username {
  color: #666;
  font-size: 14px;
}

.logout-btn {
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.logout-btn:hover {
  background: #fff;
  border-color: #667eea;
  color: #667eea;
}
</style>
