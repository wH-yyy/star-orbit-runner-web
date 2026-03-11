<script setup>
import Header from './Header.vue'
import Sidebar from './Sidebar.vue'
</script>

<template>
  <div class="app-container">
    <!-- 左侧导航栏 -->
    <Sidebar />

    <!-- 主内容区域 -->
    <div class="main-container">
      <!-- 顶部横幅 -->
      <Header />

      <!-- 内容区域 -->
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* 主容器样式 */
.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background-color: #f0f2f5;
}

/* 主内容区域样式 */
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px 24px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    padding: 16px;
  }
}
</style>
