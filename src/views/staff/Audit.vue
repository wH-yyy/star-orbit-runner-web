<script setup>
import { ref, computed } from 'vue'

// 模拟审核记录数据
const auditRecords = ref([
  {
    id: 1,
    userId: 1001,
    username: '张三',
    studentId: '20230001',
    distance: 3.2,
    duration: 25,
    date: '2024-01-15',
    time: '20:30',
    status: 'pending',
    autoAuditResult: 'suspicious',
    screenshot: 'https://via.placeholder.com/400x300?text=Running+Screenshot',
    reasons: []
  },
  {
    id: 2,
    userId: 1002,
    username: '李四',
    studentId: '20230002',
    distance: 4.5,
    duration: 32,
    date: '2024-01-15',
    time: '21:15',
    status: 'pending',
    autoAuditResult: 'normal',
    screenshot: 'https://via.placeholder.com/400x300?text=Running+Screenshot',
    reasons: []
  },
  {
    id: 3,
    userId: 1003,
    username: '王五',
    studentId: '20230003',
    distance: 2.8,
    duration: 18,
    date: '2024-01-15',
    time: '21:45',
    status: 'rejected',
    autoAuditResult: 'suspicious',
    screenshot: 'https://via.placeholder.com/400x300?text=Running+Screenshot',
    reasons: ['配速异常']
  },
  {
    id: 4,
    userId: 1004,
    username: '赵六',
    studentId: '20230004',
    distance: 5.1,
    duration: 38,
    date: '2024-01-15',
    time: '20:15',
    status: 'approved',
    autoAuditResult: 'normal',
    screenshot: 'https://via.placeholder.com/400x300?text=Running+Screenshot',
    reasons: []
  }
])

// 筛选条件
const searchParams = ref({
  username: '',
  studentId: '',
  date: '',
  status: ''
})

// 选中的记录
const selectedRecord = ref(null)
const isAuditDialogVisible = ref(false)

// 审核表单
const auditForm = ref({
  result: '',
  reasons: []
})

// 预设的拒绝原因
const rejectReasons = [
  '配速异常',
  '距离不足',
  '时间不符合要求',
  '截图不清晰',
  '截图信息不完整',
  '其他原因'
]

// 筛选后的记录
const filteredRecords = computed(() => {
  return auditRecords.value.filter(record => {
    return (
      (searchParams.value.username ? record.username.includes(searchParams.value.username) : true) &&
      (searchParams.value.studentId ? record.studentId.includes(searchParams.value.studentId) : true) &&
      (searchParams.value.date ? record.date === searchParams.value.date : true) &&
      (searchParams.value.status ? record.status === searchParams.value.status : true)
    )
  })
})

// 打开审核对话框
function openAuditDialog(record) {
  selectedRecord.value = record
  auditForm.value = {
    result: record.status === 'approved' ? 'approved' : record.status === 'rejected' ? 'rejected' : '',
    reasons: [...record.reasons]
  }
  isAuditDialogVisible.value = true
}

// 提交审核
function submitAudit() {
  if (!selectedRecord.value || !auditForm.value.result) {
    return
  }

  // 更新记录状态
  const record = auditRecords.value.find(r => r.id === selectedRecord.value.id)
  if (record) {
    record.status = auditForm.value.result
    record.reasons = auditForm.value.reasons
  }

  // 关闭对话框
  isAuditDialogVisible.value = false
  selectedRecord.value = null
  auditForm.value = {
    result: '',
    reasons: []
  }
}

// 重置筛选
function resetFilters() {
  searchParams.value = {
    username: '',
    studentId: '',
    date: '',
    status: ''
  }
}

// 获取状态文本
function getStatusText(status) {
  const statusMap = {
    pending: '待审核',
    approved: '通过',
    rejected: '拒绝'
  }
  return statusMap[status] || status
}

// 获取状态类名
function getStatusClass(status) {
  const classMap = {
    pending: 'status-pending',
    approved: 'status-approved',
    rejected: 'status-rejected'
  }
  return classMap[status] || ''
}

// 获取自动审核结果文本
function getAutoAuditText(result) {
  const resultMap = {
    normal: '正常',
    suspicious: '疑似异常',
    error: '错误'
  }
  return resultMap[result] || result
}
</script>

<template>
  <div class="audit-page">
    <!-- 搜索筛选 -->
    <div class="search-filters">
      <div class="filter-row">
        <div class="filter-item">
          <label>姓名</label>
          <input v-model="searchParams.username" placeholder="请输入姓名" />
        </div>
        <div class="filter-item">
          <label>学号</label>
          <input v-model="searchParams.studentId" placeholder="请输入学号" />
        </div>
        <div class="filter-item">
          <label>日期</label>
          <input v-model="searchParams.date" type="date" />
        </div>
        <div class="filter-item">
          <label>状态</label>
          <select v-model="searchParams.status">
            <option value="">全部</option>
            <option value="pending">待审核</option>
            <option value="approved">通过</option>
            <option value="rejected">拒绝</option>
          </select>
        </div>
        <div class="filter-actions">
          <button @click="resetFilters" class="reset-btn">重置</button>
        </div>
      </div>
    </div>

    <!-- 审核记录列表 -->
    <div class="audit-list">
      <table class="audit-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>姓名</th>
            <th>学号</th>
            <th>距离(km)</th>
            <th>时长(min)</th>
            <th>打卡时间</th>
            <th>自动审核</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(record, index) in filteredRecords" :key="record.id">
            <td>{{ index + 1 }}</td>
            <td>{{ record.username }}</td>
            <td>{{ record.studentId }}</td>
            <td>{{ record.distance }}</td>
            <td>{{ record.duration }}</td>
            <td>{{ record.date }} {{ record.time }}</td>
            <td>{{ getAutoAuditText(record.autoAuditResult) }}</td>
            <td>
              <span :class="['status-badge', getStatusClass(record.status)]">
                {{ getStatusText(record.status) }}
              </span>
            </td>
            <td>
              <button @click="openAuditDialog(record)" class="audit-btn">
                {{ record.status === 'pending' ? '审核' : '修改' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="filteredRecords.length === 0" class="empty-state">
        暂无审核记录
      </div>
    </div>

    <!-- 审核对话框 -->
    <div v-if="isAuditDialogVisible" class="audit-dialog-overlay">
      <div class="audit-dialog">
        <div class="dialog-header">
          <h2>审核详情</h2>
          <button @click="isAuditDialogVisible = false" class="close-btn">×</button>
        </div>
        <div class="dialog-content">
          <div v-if="selectedRecord" class="record-details">
            <div class="detail-row">
              <span class="detail-label">姓名：</span>
              <span class="detail-value">{{ selectedRecord.username }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">学号：</span>
              <span class="detail-value">{{ selectedRecord.studentId }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">距离：</span>
              <span class="detail-value">{{ selectedRecord.distance }} km</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">时长：</span>
              <span class="detail-value">{{ selectedRecord.duration }} 分钟</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">打卡时间：</span>
              <span class="detail-value">{{ selectedRecord.date }} {{ selectedRecord.time }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">自动审核：</span>
              <span class="detail-value">{{ getAutoAuditText(selectedRecord.autoAuditResult) }}</span>
            </div>
            
            <!-- 截图预览 -->
            <div class="screenshot-section">
              <h3>跑步截图</h3>
              <div class="screenshot-preview">
                <img :src="selectedRecord.screenshot" alt="跑步截图" />
              </div>
            </div>
            
            <!-- 审核操作 -->
            <div class="audit-section">
              <h3>审核结果</h3>
              <div class="audit-options">
                <label class="radio-option">
                  <input type="radio" v-model="auditForm.result" value="approved" />
                  <span>通过</span>
                </label>
                <label class="radio-option">
                  <input type="radio" v-model="auditForm.result" value="rejected" />
                  <span>拒绝</span>
                </label>
              </div>
              
              <!-- 拒绝原因 -->
              <div v-if="auditForm.result === 'rejected'" class="reasons-section">
                <h4>拒绝原因（可多选）</h4>
                <div class="reasons-list">
                  <label v-for="reason in rejectReasons" :key="reason" class="checkbox-option">
                    <input 
                      type="checkbox" 
                      :value="reason" 
                      v-model="auditForm.reasons" 
                    />
                    <span>{{ reason }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button @click="isAuditDialogVisible = false" class="cancel-btn">取消</button>
          <button @click="submitAudit" class="submit-btn">提交审核</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.audit-page {
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

.search-filters {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
}

.filter-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
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

.filter-item input,
.filter-item select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.filter-actions {
  display: flex;
  align-items: flex-end;
}

.reset-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.reset-btn:hover {
  background: #f5f5f5;
}

.audit-list {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.audit-table {
  width: 100%;
  border-collapse: collapse;
}

.audit-table th,
.audit-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.audit-table th {
  background: #f9f9f9;
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.audit-table td {
  font-size: 14px;
  color: #666;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-pending {
  background: rgba(255, 193, 7, 0.1);
  color: #FFC107;
}

.status-approved {
  background: rgba(40, 167, 69, 0.1);
  color: #28A745;
}

.status-rejected {
  background: rgba(220, 53, 69, 0.1);
  color: #DC3545;
}

.audit-btn {
  padding: 6px 12px;
  border: 1px solid #667eea;
  border-radius: 6px;
  background: white;
  color: #667eea;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.audit-btn:hover {
  background: #667eea;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 14px;
}

/* 审核对话框 */
.audit-dialog-overlay {
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

.audit-dialog {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.dialog-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.dialog-content {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.record-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  gap: 8px;
}

.detail-label {
  font-weight: 500;
  color: #333;
  min-width: 80px;
}

.detail-value {
  color: #666;
}

.screenshot-section {
  margin-top: 24px;
}

.screenshot-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.screenshot-preview {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.screenshot-preview img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 4px;
}

.audit-section {
  margin-top: 24px;
}

.audit-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.audit-options {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.reasons-section {
  margin-top: 20px;
}

.reasons-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.reasons-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  min-width: 120px;
}

.dialog-footer {
  padding: 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn {
  padding: 10px 20px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: #f5f5f5;
}

.submit-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background: #667eea;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.submit-btn:hover {
  background: #5a6fe0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
  }
  
  .filter-item {
    width: 100%;
  }
  
  .audit-table {
    font-size: 12px;
  }
  
  .audit-table th,
  .audit-table td {
    padding: 8px 12px;
  }
  
  .audit-options {
    flex-direction: column;
    gap: 12px;
  }
  
  .reasons-list {
    flex-direction: column;
    gap: 8px;
  }
}
</style>