<script setup>
import { ref, onMounted, watch, onBeforeUnmount, nextTick } from 'vue';
import * as echarts from 'echarts';
import { getStatsForAdmin, exportDataApi } from "@/api/admin.js";

// 导入 SVG 图标（保持不变）
import UserManagementIcon from '@/assets/总用户数.svg'
import SubmissionIcon from '@/assets/提交数.svg'
import PendingReviewIcon from '@/assets/待审核.svg'

// 统计数据
const stats = ref({
  totalUsers: 0,
  totalSubmissions: 0,
  pendingReviews: 0,
  dailyStats: [],
  lastUpdated: null,
  loading: false,
  error: null
});

// 时间范围
const timeRange = ref({ start: null, end: null });

// 图表实例与容器
const chartContainer = ref(null);
let chartInstance = null;
let resizeDebounceTimer = null;

// 辅助函数：格式化日期为 YYYY-MM-DD
const formatDateForInput = (date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// 初始化时间范围（最近7天）
const initTimeRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  timeRange.value.start = formatDateForInput(start);
  timeRange.value.end = formatDateForInput(end);
};

// 格式化显示时间
const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// 格式化图表 X 轴显示 (MM-DD)
const formatChartDate = (dateStr) => {
  const date = new Date(dateStr);
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// 获取统计数据（不再使用模拟数据，直接报错提示）
const fetchStats = async () => {
  stats.value.loading = true;
  stats.value.error = null;
  try {
    const res = await getStatsForAdmin({
      startDate: timeRange.value.start,
      endDate: timeRange.value.end
    });
    if (res) {
      stats.value.totalUsers = res.totalUsers;
      stats.value.totalSubmissions = res.totalSubmissions;
      stats.value.pendingReviews = res.pendingReviews;
      // 确保 dailyStats 是数组并按日期排序
      stats.value.dailyStats = (res.dailyStats || []).slice().sort((a, b) => new Date(a.date) - new Date(b.date));
      stats.value.lastUpdated = new Date(res.lastUpdated);
    } else {
      throw new Error('云函数返回数据异常');
    }
  } catch (error) {
    console.error('获取统计数据失败:', error);
    stats.value.error = error.message || '数据加载失败';
  } finally {
    stats.value.loading = false;
    // 数据更新后，图表会自动通过 watch 更新，无需额外调用
  }
};

// 更新图表（仅更新数据，不销毁实例）
const updateChart = () => {
  if (!chartContainer.value) return;
  // 如果还没有实例，则创建
  if (!chartInstance) {
    chartInstance = echarts.init(chartContainer.value);
  }

  const chartData = stats.value.dailyStats || [];
  if (chartData.length === 0) {
    chartInstance.clear();
    return;
  }

  const isMobile = window.innerWidth <= 768;
  const baseFontSize = isMobile ? 12 : 14;
  const titleFontSize = isMobile ? 14 : 16;

  const option = {
    title: {
      text: '每日打卡人数折线图',
      left: 'center',
      textStyle: { fontSize: titleFontSize, fontWeight: 'bold' }
    },
    tooltip: {
      trigger: 'item',
      formatter: params => `${params.name}<br/>打卡人数: ${params.value}`,
      textStyle: { fontSize: baseFontSize }
    },
    grid: {
      left: '8%',
      right: '5%',
      bottom: '15%',
      top: '20%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: chartData.map(item => formatChartDate(item.date)),
      axisLabel: {
        rotate: isMobile ? 45 : 0,
        fontSize: baseFontSize,
        interval: isMobile ? 'auto' : 0
      }
    },
    yAxis: {
      type: 'value',
      name: '人数',
      min: 0,
      axisLabel: { fontSize: baseFontSize },
      nameTextStyle: { fontSize: baseFontSize }
    },
    series: [
      {
        name: '打卡人数',
        type: 'line',
        data: chartData.map(item => item.count),
        smooth: 0.3,
        lineStyle: { color: '#409eff', width: isMobile ? 2 : 3 },
        itemStyle: { color: '#409eff' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.4)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
          ])
        }
      }
    ]
  };
  chartInstance.setOption(option, true); // true 表示完全替换配置
};

// 重置时间范围并刷新
const resetTimeRange = () => {
  initTimeRange();
  fetchStats();
};

// 手动刷新
const refreshStats = () => {
  fetchStats();
};

// 窗口 resize 防抖处理
const handleResize = () => {
  if (resizeDebounceTimer) clearTimeout(resizeDebounceTimer);
  resizeDebounceTimer = setTimeout(() => {
    if (chartInstance) chartInstance.resize();
  }, 150);
};

// 导出数据相关
const showExportDialog = ref(false);
const exportOption = ref('award');
const exportDate = ref(formatDateForInput(new Date()));
const todayDate = formatDateForInput(new Date());
const openExportDialog = () => {
  if (!exportDate.value) {
    exportDate.value = todayDate;
  }
  showExportDialog.value = true;
};
const closeExportDialog = () => { showExportDialog.value = false; };
const exportData = () => {
  exportDataApi({
    option: exportOption.value,
    date: exportDate.value
  });
  closeExportDialog();
};

// 监听 dailyStats 变化，自动更新图表
watch(() => stats.value.dailyStats, () => {
  // 确保 DOM 已更新
  nextTick(() => updateChart());
}, { deep: true });

// 监听时间范围变化，重新获取数据
watch(timeRange, () => {
  if (timeRange.value.start && timeRange.value.end) {
    fetchStats();
  }
}, { deep: true });

onMounted(() => {
  initTimeRange();
  fetchStats();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
  window.removeEventListener('resize', handleResize);
  if (resizeDebounceTimer) clearTimeout(resizeDebounceTimer);
});
</script>

<template>
  <div class="overview-page">
    <!-- 加载状态 -->
    <div v-if="stats.loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>正在加载数据...</p>
    </div>

    <!-- 错误提示 -->
    <div v-else-if="stats.error" class="error-container">
      <p class="error-message">数据加载失败: {{ stats.error }}</p>
      <button @click="refreshStats" class="retry-btn">重试</button>
    </div>

    <!-- 统计卡片区域 -->
    <div v-else class="stats-grid">
      <div class="stat-card">
        <img :src="UserManagementIcon" class="stat-icon" />
        <div class="stat-info">
          <h3>总用户数</h3>
          <p class="stat-value">{{ stats.totalUsers.toLocaleString() }}</p>
        </div>
      </div>
      <div class="stat-card">
        <img :src="SubmissionIcon" class="stat-icon" />
        <div class="stat-info">
          <h3>总提交数</h3>
          <p class="stat-value">{{ stats.totalSubmissions.toLocaleString() }}</p>
        </div>
      </div>
      <div class="stat-card">
        <img :src="PendingReviewIcon" class="stat-icon" />
        <div class="stat-info">
          <h3>待审核数</h3>
          <p class="stat-value">{{ stats.pendingReviews.toLocaleString() }}</p>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="chart-container" v-show="!stats.loading && !stats.error">
      <div class="chart-header">
        <h3>打卡统计</h3>
        <button @click="openExportDialog" class="export-btn">导出数据</button>
      </div>
      <div class="time-range-selector">
        <div class="form-item">
          <label class="form-label">折线图时间范围</label>
          <div class="date-range">
            <input type="date" v-model="timeRange.start" class="date-input" :max="timeRange.end" />
            <span class="date-separator">至</span>
            <input type="date" v-model="timeRange.end" class="date-input" :min="timeRange.start" />
            <button @click="resetTimeRange" class="reset-btn">最近7天</button>
          </div>
        </div>
      </div>
      <div ref="chartContainer" class="chart"></div>
      <div class="chart-summary" v-if="stats.dailyStats.length > 0">
        <div class="summary-item">
          <span class="summary-label">统计天数:</span>
          <span class="summary-value">{{ stats.dailyStats.length }} 天</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">平均打卡人数:</span>
          <span class="summary-value">{{ Math.round(stats.dailyStats.reduce((sum, day) => sum + day.count, 0) / stats.dailyStats.length) }} 人/天</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">最高打卡人数:</span>
          <span class="summary-value">{{ Math.max(...stats.dailyStats.map(day => day.count)) }} 人</span>
        </div>
      </div>
      <div v-else class="no-data">当前时间段内暂无打卡数据</div>
    </div>

    <!-- 更新时间 -->
    <div v-if="!stats.loading && !stats.error" class="update-time">
      <p>数据更新时间: {{ formatTime(stats.lastUpdated) }}</p>
    </div>

    <!-- 导出对话框 -->
    <div v-if="showExportDialog" class="export-dialog-overlay" @click="closeExportDialog">
      <div class="export-dialog" @click.stop>
        <div class="dialog-header">
          <h3>导出数据</h3>
          <button class="close-btn" @click="closeExportDialog">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-item">
            <label class="form-label">数据类型</label>
            <select v-model="exportOption" class="form-select">
              <option value="award">获奖名单</option>
              <option value="record">累计打卡统计</option>
              <option value="dailyUsers">当天打卡用户</option>
            </select>
          </div>
          <div class="form-item" v-if="exportOption === 'dailyUsers'">
            <label class="form-label">导出日期</label>
            <input type="date" v-model="exportDate" class="date-input" :max="todayDate" />
          </div>
          <div class="export-tips">
            <h4>导出说明</h4>
            <p v-if="exportOption === 'award'">导出完成率≥60%的用户获奖名单</p>
            <p v-else-if="exportOption === 'record'">导出所有用户的累计打卡次数统计</p>
            <p v-else>导出所选日期内完成打卡的用户名单</p>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="closeExportDialog">取消</button>
          <button class="btn-confirm" @click="exportData">确认导出</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 基础重置，确保所有元素使用border-box模型 */
*,
*::before,
*::after {
  box-sizing: border-box;
}

.overview-page {
  width: 100%;
  max-width: 100vw;
  padding: clamp(12px, 2vw, 20px);
  overflow-x: hidden;
}


.export-btn {
  padding: clamp(6px, 0.8vw, 8px) clamp(12px, 1.5vw, 16px);
  background-color: #67c23a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: clamp(0.875rem, 1vw, 1rem);
  transition: background-color 0.3s;
  white-space: nowrap;
  min-height: 36px;
}

.export-btn:hover {
  background-color: #85ce61;
}

/* 导出对话框样式 */
.export-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.export-dialog {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.dialog-header h3 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #909399;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.3s;
}

.close-btn:hover {
  background: #f5f7fa;
  color: #606266;
}

.dialog-body {
  padding: 20px;
}

.form-item {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 16px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
}

.form-select {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 16px;
  background-color: #ffffff;
  cursor: pointer;
  transition: border-color 0.3s;
  color: #606266;
}

.form-select:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.export-tips {
  margin-top: 16px;
  padding: 12px;
  background: #f4f4f5;
  border-radius: 4px;
}

.export-tips h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #606266;
}

.export-tips p {
  margin: 0;
  font-size: 16px;
  color: #909399;
  line-height: 1.5;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e4e7ed;
}

.btn-cancel, .btn-confirm {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel {
  background: #ffffff;
  color: #606266;
  border: 1px solid #dcdfe6;
}

.btn-cancel:hover {
  color: #409eff;
  border-color: #c6e2ff;
  background: #ecf5ff;
}

.btn-confirm {
  background: #409eff;
  color: white;
  border: 1px solid #409eff;
}

.btn-confirm:hover {
  background: #66b1ff;
  border-color: #66b1ff;
}

/* 时间范围选择器 */
.time-range-selector {
  background-color: #ffffff;
  margin: 20px;
}

.form-item {
  width: 100%;
}

.form-label {
  display: block;
  font-size: clamp(1rem, 1vw, 1rem); /* 16px */
  font-weight: 500;
  color: #606266;
  margin-bottom: clamp(8px, 1vw, 10px);
}

.date-range {
  display: flex;
  align-items: center;
  gap: clamp(8px, 1vw, 12px);
  flex-wrap: wrap;
  width: 100%;
}

.date-input {
  flex: 1;
  min-width: min(150px, 100%);
  padding: clamp(8px, 1vw, 10px) clamp(12px, 1.5vw, 16px);
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: clamp(1rem, 1vw, 1rem);
  transition: border-color 0.3s ease;
  color: #606266;
  height: clamp(36px, 5vw, 40px);
}

.date-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.date-separator {
  color: #909399;
  white-space: nowrap;
  font-size: clamp(1rem, 1vw, 1rem);
}

.reset-btn {
  padding: clamp(8px, 1vw, 10px) clamp(12px, 1.5vw, 16px);
  background-color: #f0f2f5;
  color: #606266;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  font-size: clamp(1rem, 1vw, 1rem);
  transition: all 0.3s ease;
  white-space: nowrap;
  min-height: clamp(36px, 5vw, 40px);
}

.reset-btn:hover {
  background-color: #e4e6eb;
  border-color: #c0c4cc;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: clamp(40px, 10vw, 60px) 0;
  width: 100%;
}

.loading-spinner {
  width: clamp(32px, 5vw, 40px);
  height: clamp(32px, 5vw, 40px);
  border: 4px solid #f3f3f3;
  border-top: 4px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: clamp(12px, 2vw, 16px);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-container p {
  font-size: clamp(1rem, 1.2vw, 1.125rem);
  color: #606266;
}

/* 错误提示 */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: clamp(40px, 10vw, 60px) 0;
  background-color: #fef0f0;
  border-radius: 8px;
  margin-bottom: clamp(16px, 2vw, 20px);
  width: 100%;
}

.error-message {
  color: #f56c6c;
  margin-bottom: clamp(12px, 2vw, 16px);
  font-size: clamp(1rem, 1.2vw, 1.125rem);
  text-align: center;
  padding: 0 clamp(16px, 3vw, 24px);
}

.retry-btn {
  padding: clamp(6px, 0.8vw, 8px) clamp(12px, 1.5vw, 16px);
  background-color: #f56c6c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: clamp(1rem, 1vw, 1rem);
  min-height: 36px;
}

.retry-btn:hover {
  background-color: #f78989;
}

/* 统计卡片区域 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
  gap: clamp(16px, 2vw, 20px);
  margin-bottom: clamp(24px, 3vw, 30px);
  width: 100%;
}

.stat-card {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: clamp(16px, 2vw, 20px);
  display: flex;
  align-items: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  min-height: 100px;
  width: 100%;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: clamp(32px, 4vw, 40px);
  height: clamp(32px, 4vw, 40px);
  margin-right: clamp(12px, 2vw, 20px);
  flex-shrink: 0;
  object-fit: contain;
}

.stat-info {
  flex: 1;
  min-width: 0; /* 防止文本溢出 */
}

.stat-info h3 {
  font-size: clamp(1rem, 1vw, 1rem);
  font-weight: 500;
  color: #909399;
  margin: 0 0 clamp(4px, 0.5vw, 8px) 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-value {
  font-size: clamp(1.5rem, 2vw, 1.75rem); /* 24-28px */
  font-weight: 600;
  color: #303133;
  margin: 0;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 图表容器 */
.chart-container {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: clamp(16px, 2vw, 20px);
  margin-bottom: clamp(24px, 3vw, 30px);
  width: 100%;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  margin: 10px 20px;
}

.chart-header h3 {
  font-size: 22rpx;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.chart {
  width: 100%;
  height: clamp(300px, 50vh, 500px);
  min-height: 250px;
}

.no-data {
  text-align: center;
  padding: clamp(30px, 8vw, 40px) 0;
  color: #909399;
  font-size: clamp(1rem, 1vw, 1rem);
}

.chart-summary {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: clamp(12px, 2vw, 16px);
  margin-top: clamp(16px, 2vw, 20px);
  padding-top: clamp(16px, 2vw, 20px);
  border-top: 1px solid #f0f0f0;
  width: 100%;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 120px;
}

.summary-label {
  font-size: clamp(0.875rem, 0.9vw, 0.875rem);
  color: #909399;
  margin-bottom: 4px;
  text-align: center;
}

.summary-value {
  font-size: clamp(1rem, 1vw, 1rem);
  font-weight: 600;
  color: #303133;
  text-align: center;
  word-break: break-word;
}

/* 更新时间 */
.update-time {
  text-align: right;
  margin-bottom: clamp(20px, 3vw, 30px);
  width: 100%;
}

.update-time p {
  font-size: clamp(0.875rem, 0.9vw, 0.875rem);
  color: #909399;
  margin: 0;
}

/* 响应式设计 - 平板 */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
  }

  .chart {
    height: clamp(280px, 45vh, 450px);
  }

  .date-range {
    flex-direction: column;
    align-items: stretch;
  }

  .date-input, .reset-btn {
    width: 100%;
  }

  .date-separator {
    text-align: center;
  }
}

/* 响应式设计 - 手机 */
@media (max-width: 768px) {
  .overview-page {
    padding: 8px;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .header-actions {
    width: 100%;
  }

  .refresh-btn, .export-btn {
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    min-height: 90px;
  }

  .stat-icon {
    font-size: 2rem;
    margin-right: 16px;
  }

  .chart {
    height: clamp(250px, 40vh, 400px);
  }

  .chart-summary {
    flex-direction: column;
    align-items: stretch;
  }

  .summary-item {
    min-width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
  }

  .summary-label {
    margin-bottom: 0;
    text-align: left;
  }

  .summary-value {
    text-align: right;
  }
}

/* 响应式设计 - 小手机 */
@media (max-width: 480px) {
  .page-header h1 {
    font-size: 1.125rem;
  }

  .stat-card {
    padding: 12px;
    min-height: 80px;
  }

  .stat-icon {
    font-size: 1.75rem;
    margin-right: 12px;
  }

  .stat-value {
    font-size: 1.125rem;
  }

  .chart {
    height: clamp(220px, 35vh, 350px);
  }

  .chart-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>