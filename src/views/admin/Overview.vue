<script setup>
import { ref, onMounted } from 'vue';

// 模拟数据
const stats = ref({
  totalUsers: 2580,
  totalRuns: 12560,
  totalDistance: 37890,
  pendingReviews: 128,
});

const recentActivities = ref([
  { id: 1, type: '用户注册', user: '张三', time: '2024-01-27 10:30' },
  { id: 2, type: '打卡审核', user: '李四', time: '2024-01-27 10:25' },
  { id: 3, type: '账号创建', user: '管理员', time: '2024-01-27 10:20' },
  { id: 4, type: '申诉处理', user: '王五', time: '2024-01-27 10:15' },
]);

onMounted(() => {
  // 这里可以添加实际的数据获取逻辑
  console.log('概览页面加载完成');
});
</script>

<template>
  <div class="overview-page">
    <h2 class="page-title">系统概览</h2>

    <!-- 统计卡片区域 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <h3>总用户数</h3>
          <p class="stat-value">{{ stats.totalUsers }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏃</div>
        <div class="stat-info">
          <h3>总打卡次数</h3>
          <p class="stat-value">{{ stats.totalRuns }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📍</div>
        <div class="stat-info">
          <h3>总里程(km)</h3>
          <p class="stat-value">{{ stats.totalDistance }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⏳</div>
        <div class="stat-info">
          <h3>待审核记录</h3>
          <p class="stat-value">{{ stats.pendingReviews }}</p>
        </div>
      </div>
    </div>

    <!-- 活动状态区域 -->
    <div class="status-section">
      <h3>活动状态</h3>
      <div class="status-card">
        <div class="status-item">
          <span class="status-label">当前活动周期</span>
          <span class="status-value">2024年春季学期</span>
        </div>
        <div class="status-item">
          <span class="status-label">活动时间</span>
          <span class="status-value">20:00 - 22:00</span>
        </div>
        <div class="status-item">
          <span class="status-label">活动状态</span>
          <span class="status-value status-active">进行中</span>
        </div>
      </div>
    </div>

    <!-- 最近活动区域 -->
    <div class="activity-section">
      <h3>最近活动</h3>
      <div class="activity-list">
        <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
          <div class="activity-type">{{ activity.type }}</div>
          <div class="activity-user">{{ activity.user }}</div>
          <div class="activity-time">{{ activity.time }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overview-page {
  width: 100%;
  padding: 0;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  color: #303133;
}

/* 统计卡片样式 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.12);
}

.stat-icon {
  font-size: 32px;
  margin-right: 16px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(64, 158, 255, 0.1);
  border-radius: 8px;
}

.stat-info h3 {
  font-size: 14px;
  font-weight: 500;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

/* 状态区域样式 */
.status-section {
  margin-bottom: 32px;
}

.status-section h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
}

.status-card {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #dcdfe6;
}

.status-item:last-child {
  border-bottom: none;
}

.status-label {
  font-size: 14px;
  color: #909399;
}

.status-value {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.status-active {
  color: #67c23a;
}

/* 最近活动区域样式 */
.activity-section {
  margin-bottom: 32px;
}

.activity-section h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
}

.activity-list {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #dcdfe6;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-type {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.activity-user {
  flex: 1;
  font-size: 14px;
  color: #909399;
}

.activity-time {
  font-size: 14px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .activity-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .overview-page {
    padding: 12px;
  }
}
</style>