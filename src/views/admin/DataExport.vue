<script setup>
import { ref } from 'vue';
import { exportDataApi } from "@/api/admin.js";

// 导出选项
const exportOption = ref("award");

// 导出数据
const exportData = () => {
  exportDataApi(exportOption.value);
};
</script>

<template>
  <div class="data-export-page">
    <!-- 导出配置表单 -->
    <div class="export-form">
      <div class="form-section">
        <h3>导出配置</h3>

        <!-- 数据类型选择 -->
        <div class="form-item">
          <label class="form-label">数据类型</label>
          <div class="form-control">
            <select v-model="exportOption" class="select-control">
              <option value="award">获奖名单</option>
              <option value="record">打卡统计</option>
            </select>
          </div>
        </div>

        <!-- 导出按钮 -->
        <div class="form-actions">
          <button @click="exportData" class="btn btn-primary btn-lg">
            导出数据
          </button>
        </div>
      </div>
    </div>

    <!-- 导出说明 -->
    <div class="export-guide">
      <h3>导出说明</h3>
      <div class="guide-content">
        <div class="guide-item">
          <h4>获奖名单</h4>
          <p>包含根据打卡次数评选出的获奖用户信息，按照总次数进行排名，并分配一、二、三等奖。</p>
        </div>
        <div class="guide-item">
          <h4>打卡统计</h4>
          <p>包含所有用户的打卡统计信息，如姓名、书院、班级、学号、性别和总次数。</p>
        </div>
        <div class="guide-item">
          <h4>筛选规则</h4>
          <p>获奖名单仅导出完成率≥60%的用户，打卡统计导出全部用户数据。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.data-export-page {
  width: 100%;
  padding: 0;
}

/* 导出表单样式 */
.export-form {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 32px;
}

.form-section h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #303133;
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
}

.form-control {
  width: 100%;
}

.select-control {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  background-color: #ffffff;
  cursor: pointer;
  transition: border-color 0.3s ease;
  color: #606266;
}

.select-control:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

/* 日期范围选择样式 */
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

/* 复选框样式 */
.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
}

.checkbox-input {
  margin-right: 8px;
  cursor: pointer;
}

.checkbox-text {
  user-select: none;
}

/* 表单操作按钮样式 */
.form-actions {
  margin-top: 24px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
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

/* 导出说明样式 */
.export-guide {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.export-guide h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
}

.guide-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.guide-item h4 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
}

.guide-item p {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .date-range {
    flex-direction: column;
    align-items: stretch;
  }

  .date-input {
    width: 100%;
  }

  .guide-content {
    grid-template-columns: 1fr;
  }

  .data-export-page {
    padding: 12px;
  }
}
</style>