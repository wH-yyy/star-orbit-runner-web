<script setup>
import Header from './Header.vue'
import Sidebar from './Sidebar.vue'
</script>

<template>
  <div class="layout">
    <!-- 顶部导航 -->
    <Header />
    
    <div class="layout-content">
      <!-- 侧边栏 -->
      <Sidebar />
      
      <!-- 主要内容区域 -->
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  background: #f0f2f5;
}

.layout-content {
  display: flex;
}

.main-content {
  flex: 1;
  padding: 24px;
  min-height: calc(100vh - 60px);
  overflow-y: auto;
}
</style>
