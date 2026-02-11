<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAuditRecords, getAuditRecordDetail, submitAudit as submitAuditApi, getCurrentStaff } from '../../api/staff.js'

// 审核记录数据
const auditRecords = ref([])
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

// 当前登录的工作人员信息
const currentStaff = ref(null)

// 图片预览相关变量
const previewImage = ref('')
const showImagePreview = ref(false)

// 图片预览相关方法
const openImagePreview = (imageUrl) => {
  previewImage.value = imageUrl
  showImagePreview.value = true
}

const closeImagePreview = () => {
  showImagePreview.value = false
}

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
  reasons: [],
  remark: ''
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
  let filtered = auditRecords.value.filter(record => {
    // 将 record.status 转换为字符串便于比较
    const recordStatus = String(record.status)
    const searchStatus = searchParams.value.status ? String(searchParams.value.status) : ''
    const recordDate = searchParams.value.date ? formatDateOnly(record.date || record.time) : ''
    
    return (
      (searchParams.value.username ? record.username.includes(searchParams.value.username) : true) &&
      (searchParams.value.studentId ? record.studentId.includes(searchParams.value.studentId) : true) &&
      (searchParams.value.date ? recordDate === searchParams.value.date : true) &&
      (searchStatus ? recordStatus === searchStatus : true)
    )
  })
  
  // 按时间倒序排列（最新的在最上面）
  return filtered.sort((a, b) => {
    const dateA = new Date(a.date || a.time || 0)
    const dateB = new Date(b.date || b.time || 0)
    return dateB - dateA // 倒序
  })
})

const isPendingStatus = (status) => {
  return status === 0 || status === '0' || status === 'pending'
}

const canAuditSelected = computed(() => {
  if (!selectedRecord.value) return false
  return isPendingStatus(selectedRecord.value.status)
})

// 加载审核记录列表
async function loadAuditRecords() {
  loading.value = true
  errorMsg.value = ''
  
  try {
    console.log('开始加载审核记录...')
    
    // 获取当前登录的工作人员信息
    if (!currentStaff.value) {
      currentStaff.value = getCurrentStaff()
    }
    
    const params = {
      username: searchParams.value.username || undefined,
      studentId: searchParams.value.studentId || undefined,
      date: searchParams.value.date || undefined,
      status: searchParams.value.status || undefined,
      staffId: currentStaff.value?._id || undefined,  // 传入工作人员ID，只查询分配给自己的记录
      page: 1,
      pageSize: 100
    }
    
    console.log('查询参数:', params)
    
    const result = await getAuditRecords(params)
    
    console.log('审核记录加载成功:', result)
    
    // 处理返回的数据，确保格式正确
    auditRecords.value = (result.records || result.list || []).map(record => ({
      id: record._id || record.id,
      userId: record.userId,
      username: record.username || record.userName || '',
      studentId: record.studentId || '',
      distance: record.distance,
      duration: record.duration,
      date: record.date || record.checkInDate || '',
      time: record.time || record.checkInTime || '',
      status: record.status !== undefined ? record.status : 0,
      autoAuditResult: record.autoAuditResult || 'normal',
      screenshot: record.screenshot || record.screenshotUrl || '',
      reasons: record.reasons || [],
      remark: record.remark || ''
    }))
    
    console.log('处理后的记录数:', auditRecords.value.length)
    
  } catch (err) {
    console.error('加载审核记录失败:', err)
    errorMsg.value = err.message || '加载审核记录失败'
    auditRecords.value = []
  } finally {
    loading.value = false
  }
}

// 刷新列表
function refreshRecords() {
  loadAuditRecords()
}

// 打开审核对话框
async function openAuditDialog(record) {
  selectedRecord.value = record
  const normalizedResult = record.status === 1 || record.status === 'approved'
    ? 'approved'
    : record.status === 2 || record.status === 'rejected'
      ? 'rejected'
      : ''
  auditForm.value = {
    result: normalizedResult,
    reasons: [...(record.reasons || [])],
    remark: record.remark || ''
  }
  isAuditDialogVisible.value = true
  
  // 如果需要获取更详细的信息，可以调用详情接口
  try {
    const detail = await getAuditRecordDetail(record.id)
    console.log('审核记录详情:', detail)
    // 可以用详情数据更新 selectedRecord
    if (detail) {
      selectedRecord.value = { ...selectedRecord.value, ...detail }
    }
  } catch (err) {
    console.error('获取审核详情失败:', err)
    // 不影响对话框打开，可以使用列表中的数据
  }
}

// 提交审核
async function submitAudit() {
  if (!canAuditSelected.value) {
    errorMsg.value = '仅待审核记录可提交审核'
    return
  }
  if (!selectedRecord.value || !auditForm.value.result) {
    errorMsg.value = '请选择审核结果'
    return
  }
  
  // 如果是拒绝，必须选择原因
  if (auditForm.value.result === 'rejected' && auditForm.value.reasons.length === 0) {
    errorMsg.value = '拒绝审核时必须选择至少一个原因'
    return
  }
  
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''
  
  try {
    const auditData = {
      recordId: selectedRecord.value.id,
      result: auditForm.value.result,
      reasons: auditForm.value.reasons,
      remark: auditForm.value.remark || ''
    }
    
    console.log('提交审核数据:', auditData)
    
    console.log('提交新审核')
    const result = await submitAuditApi(auditData)
    
    console.log('审核提交成功:', result)
    
    successMsg.value = '审核已提交'
    
    // 更新本地记录
    const record = auditRecords.value.find(r => r.id === selectedRecord.value.id)
    if (record) {
      record.status = auditForm.value.result === 'approved' ? 1 : 2
      record.reasons = auditForm.value.reasons
      record.remark = auditForm.value.remark || ''
    }
    
    // 延迟关闭对话框，让用户看到成功消息
    setTimeout(() => {
      isAuditDialogVisible.value = false
      selectedRecord.value = null
      auditForm.value = {
        result: '',
        reasons: [],
        remark: ''
      }
      successMsg.value = ''
      
      // 重新加载列表
      loadAuditRecords()
    }, 1000)
    
  } catch (err) {
    console.error('提交审核失败:', err)
    errorMsg.value = err.message || '提交审核失败'
  } finally {
    loading.value = false
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
  // 重置后重新加载
  loadAuditRecords()
}

// 获取状态文本
function getStatusText(status) {
  // 支持数字状态码和字符串状态
  const statusMap = {
    0: '待审核',
    1: '通过',
    2: '不通过',
    3: '申诉中',
    'pending': '待审核',
    'approved': '通过',
    'rejected': '拒绝'
  }
  return statusMap[status] || status
}

// 获取状态类名
function getStatusClass(status) {
  // 支持数字状态码和字符串状态
  const classMap = {
    0: 'status-pending',
    1: 'status-approved',
    2: 'status-rejected',
    3: 'status-appeal',
    'pending': 'status-pending',
    'approved': 'status-approved',
    'rejected': 'status-rejected'
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

function formatDateTime(value) {
  if (!value) return ''
  const date = value.$date ? new Date(value.$date) : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const pad = (num) => String(num).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function formatDateOnly(value) {
  if (!value) return ''
  const date = value.$date ? new Date(value.$date) : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const pad = (num) => String(num).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// 组件挂载时加载数据
onMounted(() => {
  console.log('Audit 页面已挂载，开始加载数据')
  loadAuditRecords()
})
</script>

<template>
  <div class="audit-page">
    <!-- 消息提示 -->
    <div v-if="errorMsg" class="message-banner error">
      ❌ {{ errorMsg }}
      <button @click="errorMsg = ''" class="close-msg">×</button>
    </div>
    <div v-if="successMsg" class="message-banner success">
      ✅ {{ successMsg }}
      <button @click="successMsg = ''" class="close-msg">×</button>
    </div>

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
            <option value="0">待审核</option>
            <option value="1">通过</option>
            <option value="2">不通过</option>
            <option value="3">申诉中</option>
          </select>
        </div>
        <div class="filter-actions">
          <button @click="loadAuditRecords" class="search-btn" :disabled="loading">
            {{ loading ? '查询中...' : '🔍 查询' }}
          </button>
          <button @click="resetFilters" class="reset-btn" :disabled="loading">重置</button>
        </div>
      </div>
    </div>

    <!-- 审核记录列表 -->
    <div class="audit-list">
      <!-- 加载状态 -->
      <div v-if="loading && auditRecords.length === 0" class="loading-state">
        <div class="spinner"></div>
        <p>正在加载审核记录...</p>
      </div>

      <!-- 数据表格 -->
      <table v-else class="audit-table">
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
            <td>{{ formatDateTime(record.date || record.time) }}</td>
            <td>{{ getAutoAuditText(record.autoAuditResult) }}</td>
            <td>
              <span :class="['status-badge', getStatusClass(record.status)]">
                {{ getStatusText(record.status) }}
              </span>
            </td>
            <td>
              <button @click="openAuditDialog(record)" class="audit-btn" :disabled="loading">
                {{ isPendingStatus(record.status) ? '审核' : '查看' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- 空状态 -->
      <div v-if="!loading && filteredRecords.length === 0" class="empty-state">
        {{ errorMsg ? '加载失败' : '暂无审核记录' }}
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
              <span class="detail-value">{{ formatDateTime(selectedRecord.date || selectedRecord.time) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">自动审核：</span>
              <span class="detail-value">{{ getAutoAuditText(selectedRecord.autoAuditResult) }}</span>
            </div>
            
            <!-- 截图预览 -->
            <div class="screenshot-section">
              <h3>跑步截图</h3>
              <div class="screenshot-preview">
                <img
                    :src="selectedRecord.screenshot"
                    alt="跑步截图"
                    @click="openImagePreview(selectedRecord.screenshot)"
                    style="cursor: pointer;"
                />
              </div>
            </div>
            
            <!-- 审核操作 -->
            <div class="audit-section">
              <h3>审核结果</h3>
              <div class="audit-options">
                <label class="radio-option">
                  <input type="radio" v-model="auditForm.result" value="approved" :disabled="!canAuditSelected" />
                  <span>通过</span>
                </label>
                <label class="radio-option">
                  <input type="radio" v-model="auditForm.result" value="rejected" :disabled="!canAuditSelected" />
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
                      :disabled="!canAuditSelected"
                    />
                    <span>{{ reason }}</span>
                  </label>
                </div>
              </div>
              
              <!-- 备注 -->
              <div class="remark-section">
                <h4>备注（可选）</h4>
                <textarea 
                  v-model="auditForm.remark" 
                  placeholder="请输入备注信息..."
                  rows="3"
                  class="remark-input"
                  :disabled="!canAuditSelected"
                ></textarea>
              </div>
              
              <!-- 提示信息 -->
              <div v-if="selectedRecord && !canAuditSelected" class="warning-tip">
                ℹ️ 当前记录为已审核或申诉中的记录，仅支持查看
              </div>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button @click="isAuditDialogVisible = false" class="cancel-btn" :disabled="loading">
            取消
          </button>
          <button v-if="canAuditSelected" @click="submitAudit" class="submit-btn" :disabled="loading || !auditForm.result">
            {{ loading ? '提交中...' : '提交审核' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 图片预览弹窗 -->
  <div v-if="showImagePreview" class="image-preview-overlay" @click="closeImagePreview">
    <div class="image-preview-container" @click.stop>
      <button class="image-preview-close" @click="closeImagePreview">×</button>
      <img :src="previewImage" alt="预览图片" class="preview-image">
    </div>
  </div>
</template>

<style scoped>
.audit-page {
  padding: 20px 0;
}

/* 消息提示 */
.message-banner {
  padding: 12px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  animation: slideDown 0.3s ease;
}

.message-banner.error {
  background: #fff1f0;
  border: 1px solid #ffccc7;
  color: #ff4d4f;
}

.message-banner.success {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #52c41a;
}

.close-msg {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
  transition: opacity 0.3s;
}

.close-msg:hover {
  opacity: 1;
}

@keyframes slideDown {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
  gap: 12px;
  flex-wrap: wrap;
  align-items: flex-start;
}

.filter-item {
  flex: 1;
  min-width: 160px;
  display: flex;
  flex-direction: column;
}

.filter-item label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.filter-item input,
.filter-item select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
}

.filter-actions {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-top: auto;
  flex-shrink: 0;
  min-width: 220px;
}

.search-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: #667eea;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.search-btn:hover:not(:disabled) {
  background: #5a6fe0;
}

.search-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.reset-btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.reset-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.audit-btn:hover:not(:disabled) {
  background: #667eea;
  color: white;
}

.audit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.remark-section {
  margin-top: 20px;
}

.remark-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.remark-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
  transition: border-color 0.3s;
}

.remark-input:focus {
  outline: none;
  border-color: #667eea;
}

.warning-tip {
  margin-top: 20px;
  padding: 12px;
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 6px;
  color: #fa8c16;
  font-size: 13px;
  line-height: 1.6;
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

.cancel-btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.submit-btn:hover:not(:disabled) {
  background: #5a6fe0;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #ccc;
}

/* 图片预览样式 */
.image-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.image-preview-container {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.image-preview-close {
  position: absolute;
  top: -5%;
  right: -10%;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  width: 10px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10%;
  transition: all 0.3s;
  z-index: 2001;
}

.image-preview-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.preview-image {
  max-width: 100%;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
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