<script setup>
import { ref, onMounted } from 'vue'

// 活动统计数据
const activityStats = ref({
  totalParticipants: 1256,
  totalDistance: 5689.7,
  totalCheckins: 3245,
  totalApproved: 2987,
  totalRejected: 258,
  totalAppeals: 45
})

// 每日打卡数据（用于图表）
const dailyData = ref([
  { date: '2024-01-10', checkins: 120, distance: 420 },
  { date: '2024-01-11', checkins: 135, distance: 480 },
  { date: '2024-01-12', checkins: 110, distance: 390 },
  { date: '2024-01-13', checkins: 145, distance: 520 },
  { date: '2024-01-14', checkins: 160, distance: 580 },
  { date: '2024-01-15', checkins: 155, distance: 560 },
  { date: '2024-01-16', checkins: 130, distance: 470 }
])

// 学院参与数据
const collegeData = ref([
  { college: '彭康书院', participants: 320, checkins: 850, distance: 1850 },
  { college: '仲英书院', participants: 280, checkins: 720, distance: 1600 },
  { college: '文治书院', participants: 220, checkins: 580, distance: 1250 },
  { college: '宗濂书院', participants: 180, checkins: 480, distance: 1050 },
  { college: '其他', participants: 256, checkins: 615, distance: 939.7 }
])

// 筛选条件
const filterParams = ref({
  startDate: '2024-01-10',
  endDate: '2024-01-16'
})

onMounted(() => {
  // 这里可以添加实际的API调用，获取真实数据
  console.log('Activity stats mounted')
})
</script>

<template>
  <div class="activity-stats">
    <!-- 筛选器 -->
    <div class="filter-section">
      <div class="filter-row">
        <div class="filter-item">
          <label>开始日期</label>
          <input v-model="filterParams.startDate" type="date" />
        </div>
        <div class="filter-item">
          <label>结束日期</label>
          <input v-model="filterParams.endDate" type="date" />
        </div>
        <div class="filter-actions">
          <button class="filter-btn">查询</button>
        </div>
      </div>
    </div>

    <!-- 关键指标 -->
    <div class="key-metrics">
      <div class="metric-card">
        <div class="metric-icon">👥</div>
        <div class="metric-content">
          <div class="metric-value">{{ activityStats.totalParticipants }}</div>
          <div class="metric-label">总参与人数</div>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">🏃</div>
        <div class="metric-content">
          <div class="metric-value">{{ activityStats.totalDistance.toFixed(1) }} km</div>
          <div class="metric-label">总里程</div>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">📅</div>
        <div class="metric-content">
          <div class="metric-value">{{ activityStats.totalCheckins }}</div>
          <div class="metric-label">总打卡次数</div>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">✅</div>
        <div class="metric-content">
          <div class="metric-value">{{ activityStats.totalApproved }}</div>
          <div class="metric-label">通过审核</div>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">❌</div>
        <div class="metric-content">
          <div class="metric-value">{{ activityStats.totalRejected }}</div>
          <div class="metric-label">拒绝审核</div>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">📝</div>
        <div class="metric-content">
          <div class="metric-value">{{ activityStats.totalAppeals }}</div>
          <div class="metric-label">申诉数量</div>
        </div>
      </div>
    </div>

    <!-- 每日打卡趋势 -->
    <div class="chart-section">
      <h2>每日打卡趋势</h2>
      <div class="chart-container">
        <div class="chart-placeholder">
          <div class="chart-title">打卡次数与里程趋势</div>
          <div class="chart-data">
            <div v-for="item in dailyData" :key="item.date" class="chart-bar">
              <div class="bar-label">{{ item.date.substring(5) }}</div>
              <div class="bar-container">
                <div 
                  class="bar checkins-bar" 
                  :style="{ height: (item.checkins / 200) * 100 + '%' }"
                >
                  {{ item.checkins }}
                </div>
              </div>
              <div class="bar-container">
                <div 
                  class="bar distance-bar" 
                  :style="{ height: (item.distance / 600) * 100 + '%' }"
                >
                  {{ item.distance }}
                </div>
              </div>
            </div>
          </div>
          <div class="chart-legend">
            <div class="legend-item">
              <div class="legend-color checkins-color"></div>
              <span>打卡次数</span>
            </div>
            <div class="legend-item">
              <div class="legend-color distance-color"></div>
              <span>里程(km)</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 学院参与统计 -->
    <div class="table-section">
      <h2>学院参与统计</h2>
      <div class="table-container">
        <table class="stats-table">
          <thead>
            <tr>
              <th>学院</th>
              <th>参与人数</th>
              <th>打卡次数</th>
              <th>总里程(km)</th>
              <th>人均打卡</th>
              <th>人均里程</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in collegeData" :key="item.college">
              <td>{{ item.college }}</td>
              <td>{{ item.participants }}</td>
              <td>{{ item.checkins }}</td>
              <td>{{ item.distance.toFixed(1) }}</td>
              <td>{{ (item.checkins / item.participants).toFixed(2) }}</td>
              <td>{{ (item.distance / item.participants).toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 导出按钮 -->
    <div class="export-section">
      <button class="export-btn">
        📤 导出统计报表
      </button>
    </div>
  </div>
</template>

<style scoped>
.activity-stats {
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

.filter-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
}

.filter-row {
  display: flex;
  gap: 16px;
  align-items: flex-end;
}

.filter-item {
  flex: 1;
  min-width: 150px;
}

.filter-item label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.filter-item input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.filter-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: #667eea;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  background: #5a6fe0;
}

.key-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.metric-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.metric-icon {
  font-size: 28px;
  margin-right: 16px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.metric-label {
  font-size: 14px;
  color: #666;
}

.chart-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 30px;
}

.chart-section h2 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.chart-placeholder {
  width: 100%;
}

.chart-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

.chart-data {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 300px;
  margin-bottom: 20px;
}

.chart-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 80px;
}

.bar-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.bar-container {
  width: 100%;
  height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.bar {
  width: 100%;
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  color: white;
  transition: height 0.5s ease;
}

.checkins-bar {
  background: linear-gradient(to top, #667eea, #764ba2);
  margin-bottom: 4px;
}

.distance-bar {
  background: linear-gradient(to top, #f093fb, #f5576c);
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 30px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.checkins-color {
  background: linear-gradient(to right, #667eea, #764ba2);
}

.distance-color {
  background: linear-gradient(to right, #f093fb, #f5576c);
}

.table-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 30px;
}

.table-section h2 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.table-container {
  overflow-x: auto;
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
}

.stats-table th,
.stats-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.stats-table th {
  background: #f9f9f9;
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.stats-table td {
  font-size: 14px;
  color: #666;
}

.stats-table tr:hover {
  background: #f9f9f9;
}

.export-section {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.export-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  background: #667eea;
  color: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.export-btn:hover {
  background: #5a6fe0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .key-metrics {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .chart-data {
    height: 200px;
  }
  
  .chart-bar {
    max-width: 60px;
  }
  
  .bar {
    font-size: 10px;
  }
}
</style>