<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getAuditRecords, getCurrentStaff, batchApproveByStaff } from '../../api/staff.js'

const router = useRouter()

// 审核记录数据
const auditRecords = ref([])
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

// 分页
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0
})

// 每页显示条数选项
const pageSizeOptions = [5, 10, 15, 20, 30, 50, 100]

// 当前登录的工作人员信息
const currentStaff = ref(null)

// 防抖计时器
let debounceTimer = null

// 筛选条件
const searchParams = ref({
  username: '',
  studentId: '',
  date: '',
  status: '0'
})


// 筛选后的记录（按时间倒序）
const filteredRecords = computed(() => auditRecords.value)

// 加载审核记录列表
async function loadAuditRecords(targetPage) {
  loading.value = true
  errorMsg.value = ''

  try {
    if (!currentStaff.value) {
      currentStaff.value = getCurrentStaff()
    }

    // 确定请求的页码
    const requestPage = targetPage !== undefined ? targetPage : pagination.value.page

    const params = {
      username: searchParams.value.username || undefined,
      studentId: searchParams.value.studentId || undefined,
      date: searchParams.value.date || undefined,
      status: searchParams.value.status || 'all',
      staffId: currentStaff.value?._id || undefined,
      page: requestPage,
      pageSize: pagination.value.pageSize
    }

    const result = await getAuditRecords(params)
    const data = result

    auditRecords.value = (data.records || []).map(record => ({
      id: record._id || record.id,
      username: record.username || record.userName || '',
      studentId: record.studentId || '',
      date: record.date || record.checkInDate || '',
      time: record.time || record.checkInTime || '',
      status: record.status !== undefined ? record.status : 0,
      screenshot: record.screenshot || record.screenshotUrl || '',
      reasons: record.reasons || [],
      remark: record.remark || ''
    }))

    pagination.value.total = data.total || 0
    pagination.value.page = data.page || requestPage  // 更新页码为实际请求的页码
    pagination.value.pageSize = data.pageSize || pagination.value.pageSize
    pagination.value.totalPages = Math.ceil(pagination.value.total / pagination.value.pageSize)

  } catch (err) {
    console.error('加载审核记录失败:', err)
    errorMsg.value = err.message || '加载审核记录失败'
    auditRecords.value = []
    pagination.value.total = 0
    pagination.value.totalPages = 0
  } finally {
    loading.value = false
  }
}

// 分页方法
const prevPage = () => {
  const newPage = pagination.value.page - 1
  if (newPage >= 1) {
    loadAuditRecords(newPage)
  }
}

const nextPage = () => {
  const newPage = pagination.value.page + 1
  if (newPage <= pagination.value.totalPages) {
    loadAuditRecords(newPage)
  }
}

const goToPage = (page) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    loadAuditRecords(page)
  }
}

const goToFirstPage = () => {
  if (pagination.value.page !== 1) {
    loadAuditRecords(1)
  }
}

const goToLastPage = () => {
  const lastPage = pagination.value.totalPages
  if (pagination.value.page !== lastPage) {
    loadAuditRecords(lastPage)
  }
}

const changePageSize = (size) => {
  pagination.value.pageSize = size
  loadAuditRecords(1)  // 重置到第一页
}

// 可见页码计算
const visiblePages = computed(() => {
  const pages = []
  const total = pagination.value.totalPages
  const current = pagination.value.page
  const showPages = 5

  if (total <= showPages) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    let start = Math.max(1, current - Math.floor(showPages / 2))
    let end = start + showPages - 1
    if (end > total) {
      end = total
      start = Math.max(1, end - showPages + 1)
    }
    if (start > 1) {
      pages.push(1)
      if (start > 2) pages.push('...')
    }
    for (let i = start; i <= end; i++) pages.push(i)
    if (end < total) {
      if (end < total - 1) pages.push('...')
      pages.push(total)
    }
  }
  return pages
})

// 重置筛选
function resetFilters() {
  searchParams.value = {
    username: '',
    studentId: '',
    date: '',
    status: '0'
  }
  if (debounceTimer) clearTimeout(debounceTimer)
  pagination.value.page = 1
  loadAuditRecords(1)
}

// 一键通过
async function handleBatchApprove() {
  if (!currentStaff.value) {
    currentStaff.value = getCurrentStaff()
    if (!currentStaff.value) {
      errorMsg.value = '未获取到工作人员信息，请重新登录'
      return
    }
  }

  if (!confirm('确定要将所有待审核记录一键通过吗？')) return

  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    const result = await batchApproveByStaff(currentStaff.value._id)
    successMsg.value = `一键通过完成，成功 ${result.successCount} 条`
    await loadAuditRecords()
  } catch (err) {
    console.error('一键通过失败:', err)
    errorMsg.value = err.message || '一键通过失败'
  } finally {
    loading.value = false
  }
}

// 快速审核：跳转到第一条记录的详情页，并传递所有记录的ID列表
async function openQuickAudit() {
  if (!currentStaff.value) {
    currentStaff.value = getCurrentStaff()
    if (!currentStaff.value) {
      errorMsg.value = '未获取到工作人员信息，请重新登录'
      return
    }
  }

  loading.value = true
  try {
    // 获取分配给当前工作人员的所有记录（全部状态）
    const result = await getAuditRecords({
      staffId: currentStaff.value._id,
      page: 1,
      pageSize: 1000 // 足够大
    })
    const records = (result.records || result.list || []).map(record => ({
      id: record._id || record.id,
      username: record.username || record.userName || '',
      studentId: record.studentId || '',
      date: record.date || record.checkInDate || '',
      time: record.time || record.checkInTime || '',
      status: record.status !== undefined ? record.status : 0,
      screenshot: record.screenshot || record.screenshotUrl || '',
      reasons: record.reasons || [],
      remark: record.remark || ''
    }))

    if (records.length === 0) {
      successMsg.value = '暂无任何记录'
      return
    }

    // 将记录ID列表转为逗号分隔字符串
    const ids = records.map(r => r.id).join(',')
    // 跳转到详情页，索引为0
    await router.push({
      path: `/staff/audit/${records[0].id}`,
      query: {ids, index: 0}
    })
  } catch (err) {
    console.error('加载快速审核记录失败:', err)
    errorMsg.value = err.message || '加载快速审核记录失败'
  } finally {
    loading.value = false
  }
}

// 普通审核：点击某一行，跳转到详情页（只包含该记录）
function goToAuditDetail(record) {
  // 获取当前筛选后的所有记录ID列表
  const allIds = filteredRecords.value.map(r => r.id)
  const currentIndex = filteredRecords.value.findIndex(r => r.id === record.id)
  router.push({
    path: `/staff/audit/${record.id}`,
    query: { 
      ids: allIds.join(','), 
      index: currentIndex 
    }
  })
}

// 工具函数
function getStatusText(status) {
  const map = { 0: '待审核', 1: '已通过', 2: '不通过', 3: '申诉中' }
  return map[status] || status
}

function getStatusClass(status) {
  const map = { 0: 'status-pending', 1: 'status-approved', 2: 'status-rejected', 3: 'status-appeal' }
  return map[status] || ''
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

// 监听筛选条件变化，自动加载数据（防抖 300ms）
watch(searchParams, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    pagination.value.page = 1  // 重置为第一页
    loadAuditRecords(1)
  }, 100)
}, { deep: true, immediate: false })

onMounted(() => {
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
            <option value="0">待审核</option>
            <option value="1">已通过</option>
            <option value="2">不通过</option>
            <option value="3">申诉中</option>
            <option value="all">全部</option>
          </select>
        </div>
        <div class="filter-actions">
          <button @click="resetFilters" class="reset-btn" :disabled="loading">重置</button>
          <button @click="openQuickAudit" class="quick-audit-btn" :disabled="loading">
            快速审核
          </button>
          <button @click="handleBatchApprove" class="batch-approve-btn" :disabled="loading">
            一键通过所有待审核
          </button>
        </div>
      </div>
    </div>

    <!-- 审核记录列表 -->
    <div class="audit-list">
      <div v-if="loading && auditRecords.length === 0" class="loading-state">
        <div class="spinner"></div>
        <p>正在加载审核记录...</p>
      </div>

      <table v-else class="audit-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>姓名</th>
            <th>学号</th>
            <th>打卡时间</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(record, index) in auditRecords" :key="record.id">
            <td>{{ (pagination.page - 1) * pagination.pageSize + index + 1 }}</td>
            <td>{{ record.username }}</td>
            <td>{{ record.studentId }}</td>
            <td>{{ formatDateTime(record.date || record.time) }}</td>
            <td>
              <span :class="['status-badge', getStatusClass(record.status)]">
                {{ getStatusText(record.status) }}
              </span>
            </td>
            <td>
              <button @click="goToAuditDetail(record)" class="audit-btn" :disabled="loading">
                {{ record.status === 0 ? '审核' : '查看' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 分页 -->
      <div v-if="!loading && pagination.total > 0" class="pagination">
        <div class="pagination-left">
          <span>每页显示：</span>
          <select v-model="pagination.pageSize" @change="changePageSize(pagination.pageSize)">
            <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}条</option>
          </select>
        </div>
        <div class="pagination-center">
          <button @click="goToFirstPage" :disabled="pagination.page <= 1">首页</button>
          <button @click="prevPage" :disabled="pagination.page <= 1">上一页</button>
        
          <span class="page-buttons">
            <button
              v-for="pageNum in visiblePages"
              :key="pageNum"
              @click="goToPage(pageNum)"
              :class="{ 'current': pageNum === pagination.page }"
              :disabled="pageNum === '...'"
            >
              {{ pageNum }}
            </button>
          </span>
        
          <button @click="nextPage" :disabled="pagination.page >= pagination.totalPages">下一页</button>
          <button @click="goToLastPage" :disabled="pagination.page >= pagination.totalPages">末页</button>
        
          <span class="page-info">
            第 {{ pagination.page }} 页 / 共 {{ pagination.totalPages }} 页 (共 {{ pagination.total }} 条)
          </span>
        </div>
      </div>

      <div v-if="!loading && auditRecords.length === 0" class="empty-state">
        {{ errorMsg ? '加载失败' : '暂无审核记录' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.audit-page {
  padding: 0;
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
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 10px;
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

.reset-btn {
  padding: 8px 16px;
  border-radius: 6px;
  background: #667eea;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.reset-btn:hover:not(:disabled) {
  background: #5a6fe0;
}

.reset-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.quick-audit-btn,
.batch-approve-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quick-audit-btn {
  background: #17a2b8;
  color: white;
}

.quick-audit-btn:hover:not(:disabled) {
  background: #138496;
}

.batch-approve-btn {
  background: #28a745;
  color: white;
}

.batch-approve-btn:hover:not(:disabled) {
  background: #218838;
}

.quick-audit-btn:disabled,
.batch-approve-btn:disabled {
  opacity: 0.5;
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

.status-appeal {
  background: rgba(23, 162, 184, 0.1);
  color: #17a2b8;
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

.option-btn input[type="radio"],
.option-btn input[type="checkbox"] {
  display: none;
}

/* 快速审核对话框的导航按钮 */
.nav-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.nav-btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 快速审核对话框宽度稍大 */
.quick-audit-dialog {
  max-width: 900px;
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-top: 0;
}
.pagination-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.pagination-left span {
  color: #666;
  font-size: 14px;
}
.pagination-left select {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}
.pagination-center {
  display: flex;
  align-items: center;
  gap: 20px;
}
.pagination-center button {
  padding: 8px 20px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}
.pagination-center button:hover:not(:disabled) {
  border-color: #1890ff;
  color: #ffffff;
}
.pagination-center button:disabled {
  color: #d9d9d9;
  cursor: not-allowed;
}
.page-info {
  color: #666;
  font-size: 14px;
}
.page-buttons {
  display: flex;
  gap: 4px;
}
.page-buttons button {
  min-width: 36px;
  height: 36px;
  padding: 0 8px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}
.page-buttons button:hover:not(:disabled):not(.current) {
  border-color: #1890ff;
  color: #1890ff;
}
.page-buttons button.current {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
  font-weight: 500;
}
.page-buttons button:disabled {
  color: #999;
  cursor: default;
  background: #f5f5f5;
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