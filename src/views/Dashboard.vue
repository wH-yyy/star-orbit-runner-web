<script setup>
import { ref, onMounted } from 'vue'

// 统计数据
const stats = ref([
  { title: '总用户数', value: 1234, icon: '👥', color: '#1890ff' },
  { title: '今日新增', value: 56, icon: '📈', color: '#52c41a' },
  { title: '待处理申诉', value: 23, icon: '📝', color: '#faad14' },
  { title: '系统运行天数', value: 365, icon: '⏰', color: '#722ed1' }
])

// 最近活动
const activities = ref([])

// 模拟加载数据
onMounted(() => {
  console.log('仪表盘页面加载')
  
  // 模拟最近活动数据
  activities.value = [
    { time: '10:30', user: '张三', action: '提交了新的申诉' },
    { time: '09:45', user: '李四', action: '完成了身份认证' },
    { time: '09:20', user: '王五', action: '更新了个人信息' },
    { time: '08:55', user: '赵六', action: '登录了系统' }
  ]
})
</script>

<template>
  <div class="dashboard">
    <h2 class="page-title">📊 数据概览</h2>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div 
        v-for="stat in stats" 
        :key="stat.title"
        class="stat-card"
        :style="{ borderLeftColor: stat.color }"
      >
        <div class="stat-icon" :style="{ background: stat.color + '20' }">
          {{ stat.icon }}
        </div>
        <div class="stat-info">
          <div class="stat-title">{{ stat.title }}</div>
          <div class="stat-value" :style="{ color: stat.color }">
            {{ stat.value }}
          </div>
        </div>
      </div>
    </div>

    <!-- 最近活动 -->
    <div class="activity-section">
      <h3>📌 最近活动</h3>
      <div class="activity-list">
        <div 
          v-for="(activity, index) in activities" 
          :key="index"
          class="activity-item"
        >
          <div class="activity-time">{{ activity.time }}</div>
          <div class="activity-content">
            <strong>{{ activity.user }}</strong> {{ activity.action }}
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <h3>⚡ 快捷操作</h3>
      <div class="action-buttons">
        <router-link to="/users" class="action-btn">
          <span class="btn-icon">👥</span>
          <span>用户管理</span>
        </router-link>
        <router-link to="/appeals" class="action-btn">
          <span class="btn-icon">📝</span>
          <span>申诉列表</span>
        </router-link>
        <button class="action-btn" @click="console.log('导出数据')">
          <span class="btn-icon">📥</span>
          <span>导出数据</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1200px;
}

.page-title {
  margin: 0 0 24px 0;
  font-size: 24px;
  color: #333;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-info {
  flex: 1;
}

.stat-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
}

/* 最近活动 */
.activity-section,
.quick-actions {
  background: white;
  padding: 24px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.activity-section h3,
.quick-actions h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #333;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  gap: 16px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
  border-left: 3px solid #1890ff;
}

.activity-time {
  color: #999;
  font-size: 14px;
  min-width: 50px;
}

.activity-content {
  color: #666;
  font-size: 14px;
}

/* 快捷操作 */
.action-buttons {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 16px 24px;
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  text-decoration: none;
  color: #333;
  font-size: 14px;
  transition: all 0.3s;
}

.action-btn:hover {
  background: white;
  border-color: #1890ff;
  color: #1890ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(24, 144, 255, 0.2);
}

.btn-icon {
  font-size: 20px;
}
</style>
