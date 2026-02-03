<script setup>
import { ref, onMounted } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const stats = ref({
  pendingAudits: 23,
  pendingAppeals: 5,
  todayAudits: 45,
  totalParticipants: 1200,
  totalDistance: 5600,
  totalCheckins: 3200
})

const recentActivities = ref([
  { id: 1, type: '审核通过', user: '张三', time: '10分钟前' },
  { id: 2, type: '审核拒绝', user: '李四', time: '25分钟前' },
  { id: 3, type: '申诉处理', user: '王五', time: '40分钟前' },
  { id: 4, type: '审核通过', user: '赵六', time: '1小时前' }
])

onMounted(() => {
  // 这里可以添加实际的API调用，获取真实数据
  console.log('Staff overview mounted')
})
</script>

<template>
  <div class="staff-overview">
    <div class="page-header">
      <h1>欢迎回来，{{ store.state.user.name || '工作人员' }}！</h1>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon pending">📋</div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.pendingAudits }}</div>
          <div class="stat-label">待审核</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon appeal">⚖️</div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.pendingAppeals }}</div>
          <div class="stat-label">待处理申诉</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon today">✅</div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.todayAudits }}</div>
          <div class="stat-label">今日已审核</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon total">👥</div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalParticipants }}</div>
          <div class="stat-label">总参与人数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon distance">🏃</div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalDistance }}</div>
          <div class="stat-label">总里程(km)</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon checkins">📅</div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalCheckins }}</div>
          <div class="stat-label">总打卡次数</div>
        </div>
      </div>
    </div>

    <div class="recent-activities">
      <h2>近期操作</h2>
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
.staff-overview {
  padding: 20px 0;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.page-header p {
  color: #666;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  font-size: 28px;
  margin-right: 16px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.stat-icon.pending {
  background: rgba(255, 193, 7, 0.1);
  color: #FFC107;
}

.stat-icon.appeal {
  background: rgba(102, 126, 234, 0.1);
  color: #667EEA;
}

.stat-icon.today {
  background: rgba(40, 167, 69, 0.1);
  color: #28A745;
}

.stat-icon.total {
  background: rgba(0, 123, 255, 0.1);
  color: #007BFF;
}

.stat-icon.distance {
  background: rgba(23, 162, 184, 0.1);
  color: #17A2B8;
}

.stat-icon.checkins {
  background: rgba(220, 53, 69, 0.1);
  color: #DC3545;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.recent-activities {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.recent-activities h2 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  background: #f9f9f9;
  transition: background-color 0.3s ease;
}

.activity-item:hover {
  background: #f0f0f0;
}

.activity-type {
  font-weight: 500;
  color: #333;
  flex: 1;
}

.activity-user {
  color: #666;
  flex: 1;
}

.activity-time {
  color: #999;
  font-size: 12px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .activity-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>