<script setup>
import { ref } from 'vue';
import { showInfo } from '@/utils/toast';

// 活动配置数据
const activityConfig = ref({
  name: '2024年春季学期星荧夜跑',
  startTime: '2024-02-20',
  endTime: '2024-06-30',
  runningHours: {
    start: '20:00',
    end: '22:00'
  },
  pauseDays: ['2024-04-01', '2024-05-01'], // 停跑日期
  rules: {
    minDistance: 2, // 最小距离(km)
    maxPace: 10, // 最大配速(min/km)
    minPace: 3, // 最小配速(min/km)
    maxRunsPerDay: 1 // 每天最大打卡次数
  }
});

// 保存配置
const saveConfig = () => {
  console.log('保存活动配置:', activityConfig.value);
  // 这里可以添加API调用逻辑
  showInfo('活动配置已保存，实际项目中会调用后端API更新配置');
};

// 添加停跑日期
const addPauseDay = () => {
  activityConfig.value.pauseDays.push('');
};

// 删除停跑日期
const removePauseDay = (index) => {
  activityConfig.value.pauseDays.splice(index, 1);
};
</script>

<template>
  <div class="activity-config-page">
    <!-- 活动基本信息 -->
    <div class="config-section">
      <h3>基本信息</h3>
      <div class="form-item">
        <label class="form-label">活动名称</label>
        <input
            type="text"
            v-model="activityConfig.name"
            class="form-input"
        />
      </div>
    </div>

    <!-- 活动时间配置 -->
    <div class="config-section">
      <h3>活动时间</h3>
      <div class="form-item">
        <label class="form-label">活动周期</label>
        <div class="date-range">
          <input
              type="date"
              v-model="activityConfig.startTime"
              class="date-input"
              placeholder="开始日期"
          />
          <span class="date-separator">至</span>
          <input
              type="date"
              v-model="activityConfig.endTime"
              class="date-input"
              placeholder="结束日期"
          />
        </div>
      </div>
      <div class="form-item">
        <label class="form-label">夜跑时间段</label>
        <div class="time-range">
          <input
              type="time"
              v-model="activityConfig.runningHours.start"
              class="time-input"
              placeholder="开始时间"
          />
          <span class="time-separator">至</span>
          <input
              type="time"
              v-model="activityConfig.runningHours.end"
              class="time-input"
              placeholder="结束时间"
          />
        </div>
      </div>
    </div>

    <!-- 停跑日期配置 -->
    <div class="config-section">
      <h3>停跑日期</h3>
      <div class="pause-days-list">
        <div
            v-for="(day, index) in activityConfig.pauseDays"
            :key="index"
            class="pause-day-item"
        >
          <input
              type="date"
              v-model="activityConfig.pauseDays[index]"
              class="date-input"
              placeholder="停跑日期"
          />
          <button
              @click="removePauseDay(index)"
              class="btn btn-danger btn-sm"
          >
            删除
          </button>
        </div>
      </div>
      <button @click="addPauseDay" class="btn btn-secondary btn-sm">
        添加停跑日期
      </button>
    </div>

    <!-- 活动规则配置 -->
    <div class="config-section">
      <h3>活动规则</h3>
      <div class="rules-grid">
        <div class="form-item">
          <label class="form-label">最小距离(km)</label>
          <input
              type="number"
              v-model.number="activityConfig.rules.minDistance"
              class="form-input"
              min="0"
              step="0.1"
          />
        </div>
        <div class="form-item">
          <label class="form-label">最大配速(min/km)</label>
          <input
              type="number"
              v-model.number="activityConfig.rules.maxPace"
              class="form-input"
              min="0"
              step="0.1"
          />
        </div>
        <div class="form-item">
          <label class="form-label">最小配速(min/km)</label>
          <input
              type="number"
              v-model.number="activityConfig.rules.minPace"
              class="form-input"
              min="0"
              step="0.1"
          />
        </div>
        <div class="form-item">
          <label class="form-label">每天最大打卡次数</label>
          <input
              type="number"
              v-model.number="activityConfig.rules.maxRunsPerDay"
              class="form-input"
              min="1"
              step="1"
          />
        </div>
      </div>
    </div>

    <!-- 保存按钮 -->
    <div class="form-actions">
      <button @click="saveConfig" class="btn btn-primary btn-lg">
        保存配置
      </button>
    </div>
  </div>
</template>

<style scoped>
.activity-config-page {
  width: 100%;
  padding: 0;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  color: #303133;
}

/* 配置区块样式 */
.config-section {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 24px;
}

.config-section h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 8px;
}

/* 表单样式 */
.form-item {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s ease;
  color: #606266;
}

.form-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.form-input::placeholder {
  color: #c0c4cc;
}

/* 日期范围样式 */
.date-range {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.date-input {
  flex: 1;
  min-width: 150px;
  padding: 10px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s ease;
  color: #606266;
}

.date-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.date-input::placeholder {
  color: #c0c4cc;
}

.date-separator {
  color: #909399;
  white-space: nowrap;
}

/* 时间范围样式 */
.time-range {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.time-input {
  flex: 1;
  min-width: 100px;
  padding: 10px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s ease;
  color: #606266;
}

.time-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.time-input::placeholder {
  color: #c0c4cc;
}

.time-separator {
  color: #909399;
  white-space: nowrap;
}

/* 停跑日期样式 */
.pause-days-list {
  margin-bottom: 16px;
}

.pause-day-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.pause-day-item .date-input {
  flex: 1;
}

/* 规则网格样式 */
.rules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

/* 按钮样式 */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-lg {
  padding: 12px 24px;
  font-size: 16px;
}

.btn-primary {
  background-color: #409eff;
  color: #ffffff;
  border: 1px solid #409eff;
}

.btn-primary:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

.btn-primary:active {
  background-color: #3a8ee6;
  border-color: #3a8ee6;
}

.btn-secondary {
  background-color: #909399;
  color: #ffffff;
  border: 1px solid #909399;
}

.btn-secondary:hover {
  background-color: #a6a9ad;
  border-color: #a6a9ad;
}

.btn-secondary:active {
  background-color: #82848a;
  border-color: #82848a;
}

.btn-danger {
  background-color: #f56c6c;
  color: #ffffff;
  border: 1px solid #f56c6c;
}

.btn-danger:hover {
  background-color: #f78989;
  border-color: #f78989;
}

.btn-danger:active {
  background-color: #dd6161;
  border-color: #dd6161;
}

/* 表单操作区域 */
.form-actions {
  margin-top: 32px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .date-range,
  .time-range {
    flex-direction: column;
    align-items: stretch;
  }

  .date-input,
  .time-input {
    width: 100%;
  }

  .rules-grid {
    grid-template-columns: 1fr;
  }

  .pause-day-item {
    flex-direction: column;
    align-items: stretch;
  }

  .activity-config-page {
    padding: 12px;
  }
}
</style>