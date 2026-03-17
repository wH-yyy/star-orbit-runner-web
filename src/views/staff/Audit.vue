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
const filteredRecords = computed(() => {
  let filtered = auditRecords.value.filter(record => {
    const recordStatus = String(record.status)
    const searchStatus = (searchParams.value.status && searchParams.value.status !== 'all')
      ? String(searchParams.value.status)
      : ''
    const recordDate = searchParams.value.date ? formatDateOnly(record.date || record.time) : ''

    return (
      (searchParams.value.username ? record.username.includes(searchParams.value.username) : true) &&
      (searchParams.value.studentId ? record.studentId.includes(searchParams.value.studentId) : true) &&
      (searchParams.value.date ? recordDate === searchParams.value.date : true) &&
      (searchStatus ? recordStatus === searchStatus : true)
    )
  })

  // 按时间倒序排列
  return filtered.sort((a, b) => {
    const dateA = new Date(a.date || a.time || 0)
    const dateB = new Date(b.date || b.time || 0)
    return dateB - dateA
  })
})

// 加载审核记录列表
async function loadAuditRecords() {
  loading.value = true
  errorMsg.value = ''

  try {
    if (!currentStaff.value) {
      currentStaff.value = getCurrentStaff()
    }

    const params = {
      username: searchParams.value.username || undefined,
      studentId: searchParams.value.studentId || undefined,
      date: searchParams.value.date || undefined,
      status: searchParams.value.status || 'all',
      staffId: currentStaff.value?._id || undefined,
      page: 1,
      pageSize: 100
    }

    const result = await getAuditRecords(params)

    auditRecords.value = (result.records || result.list || []).map(record => ({
      id: record._id || record.id,
      userId: record.userId,
      username: record.username || record.userName || '',
      studentId: record.studentId || '',
      date: record.date || record.checkInDate || '',
      time: record.time || record.checkInTime || '',
      status: record.status !== undefined ? record.status : 0,
      screenshot: record.screenshot || record.screenshotUrl || '',
      reasons: record.reasons || [],
      remark: record.remark || ''
    }))
  } catch (err) {
    console.error('加载审核记录失败:', err)
    errorMsg.value = err.message || '加载审核记录失败'
    auditRecords.value = []
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
    status: '0'
  }
  // 取消防抖计时器
  if (debounceTimer) clearTimeout(debounceTimer)
  // 立即加载
  loadAuditRecords()
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
    loadAuditRecords()
  }, 300)
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
          <tr v-for="(record, index) in filteredRecords" :key="record.id">
            <td>{{ index + 1 }}</td>
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

      <div v-if="!loading && filteredRecords.length === 0" class="empty-state">
        {{ errorMsg ? '加载失败' : '暂无待审记录' }}
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
}
</style>