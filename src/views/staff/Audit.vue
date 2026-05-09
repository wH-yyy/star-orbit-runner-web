<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAuditRecords, getCurrentStaff, batchApproveByStaff, batchApproveByStaffWithDate } from '../../api/staff.js'

const route = useRoute()
const router = useRouter()

const auditRecords = ref([])
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const batchLoading = ref(false)

const pagination = ref({
  page: 1,
  pageSize: 50,
  total: 0,
  totalPages: 0
})

const pageSizeOptions = [50, 100, 200]
const currentStaff = ref(null)
let debounceTimer = null
let initializedFromRoute = false
let suppressSearchWatch = false

const showDatePicker = ref(false)
const dateType = ref('all')
const singleDate = ref('')
const rangeStart = ref('')
const rangeEnd = ref('')

const defaultSearchParams = () => ({
  username: '',
  studentId: '',
  date: '',
  status: '0',
  sortOrder: 'desc'
})

const searchParams = ref(defaultSearchParams())
const filteredRecords = computed(() => auditRecords.value)
const currentListQuery = computed(() => ({
  username: searchParams.value.username || '',
  studentId: searchParams.value.studentId || '',
  date: searchParams.value.date || '',
  status: searchParams.value.status || '0',
  page: String(pagination.value.page || 1),
  pageSize: String(pagination.value.pageSize || 50),
  sortOrder: searchParams.value.sortOrder === 'asc' ? 'asc' : 'desc'
}))

function sanitizePage(value) {
  const page = Number.parseInt(value, 10)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function sanitizePageSize(value) {
  const pageSize = Number.parseInt(value, 10)
  return pageSizeOptions.includes(pageSize) ? pageSize : 50
}

function sanitizeSortOrder(value) {
  return value === 'asc' ? 'asc' : 'desc'
}

function normalizeRouteQuery(query = {}) {
  return {
    username: typeof query.username === 'string' ? query.username : '',
    studentId: typeof query.studentId === 'string' ? query.studentId : '',
    date: typeof query.date === 'string' ? query.date : '',
    status: typeof query.status === 'string' && query.status !== '' ? query.status : '0',
    page: String(sanitizePage(query.page)),
    pageSize: String(sanitizePageSize(query.pageSize)),
    sortOrder: sanitizeSortOrder(query.sortOrder)
  }
}

function applyListQuery(query) {
  searchParams.value = {
    username: query.username,
    studentId: query.studentId,
    date: query.date,
    status: query.status,
    sortOrder: query.sortOrder
  }
  pagination.value.page = sanitizePage(query.page)
  pagination.value.pageSize = sanitizePageSize(query.pageSize)
}

async function syncRouteQuery() {
  const nextQuery = currentListQuery.value
  const normalizedCurrent = normalizeRouteQuery(route.query)
  if (JSON.stringify(nextQuery) === JSON.stringify(normalizedCurrent)) {
    return
  }

  await router.replace({
    path: '/staff/audit',
    query: nextQuery
  })
}

function openDatePicker() {
  showDatePicker.value = true
  dateType.value = 'all'
  singleDate.value = ''
  rangeStart.value = ''
  rangeEnd.value = ''
}

function closeDatePicker() {
  showDatePicker.value = false
}

async function loadAuditRecords(targetPage, options = {}) {
  const { syncRoute = true } = options
  loading.value = true
  errorMsg.value = ''

  try {
    if (!currentStaff.value) {
      currentStaff.value = getCurrentStaff()
    }

    const requestPage = targetPage !== undefined ? targetPage : pagination.value.page
    pagination.value.page = requestPage

    if (syncRoute) {
      await syncRouteQuery()
    }

    const params = {
      username: searchParams.value.username || undefined,
      studentId: searchParams.value.studentId || undefined,
      date: searchParams.value.date || undefined,
      status: searchParams.value.status || 'all',
      sortOrder: searchParams.value.sortOrder,
      staffId: currentStaff.value?._id || undefined,
      page: requestPage,
      pageSize: pagination.value.pageSize
    }

    const data = await getAuditRecords(params)

    auditRecords.value = (data.records || []).map((record) => ({
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
    pagination.value.page = data.page || requestPage
    pagination.value.pageSize = data.pageSize || pagination.value.pageSize
    pagination.value.totalPages = Math.ceil(pagination.value.total / pagination.value.pageSize)

    if (syncRoute) {
      await syncRouteQuery()
    }
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
  pagination.value.pageSize = Number(size)
  loadAuditRecords(1)
}

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

async function resetFilters() {
  suppressSearchWatch = true
  searchParams.value = defaultSearchParams()
  if (debounceTimer) clearTimeout(debounceTimer)
  pagination.value.page = 1
  await nextTick()
  suppressSearchWatch = false
  loadAuditRecords(1)
}

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

async function confirmBatchApprove() {
  let startDate = null
  let endDate = null

  if (dateType.value === 'single') {
    if (!singleDate.value) {
      errorMsg.value = '请选择日期'
      return
    }
    startDate = singleDate.value
    endDate = singleDate.value
  } else if (dateType.value === 'range') {
    if (!rangeStart.value || !rangeEnd.value) {
      errorMsg.value = '请填写完整的日期范围'
      return
    }
    if (rangeStart.value > rangeEnd.value) {
      errorMsg.value = '开始日期不能晚于结束日期'
      return
    }
    startDate = rangeStart.value
    endDate = rangeEnd.value
  }

  let confirmMsg = '确认将所有符合条件的待审核记录设为“通过”吗？'
  if (startDate && endDate && startDate !== endDate) {
    confirmMsg = `确认将 ${startDate} 至 ${endDate} 之间的待审核记录设为“通过”吗？`
  } else if (startDate) {
    confirmMsg = `确认将 ${startDate} 当天的待审核记录设为“通过”吗？`
  }
  if (!confirm(confirmMsg)) return

  if (!currentStaff.value) {
    currentStaff.value = getCurrentStaff()
    if (!currentStaff.value) {
      errorMsg.value = '未获取到工作人员信息，请重新登录'
      return
    }
  }

  batchLoading.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    const result = await batchApproveByStaffWithDate(currentStaff.value._id, startDate, endDate)
    successMsg.value = `一键通过完成，成功 ${result.successCount} 条，失败 ${result.failedCount || 0} 条`
    if (result.totalProcessed && result.totalProcessed > result.successCount) {
      successMsg.value += `（共处理 ${result.totalProcessed} 条记录）`
    }
    await loadAuditRecords()
  } catch (err) {
    console.error('一键通过失败:', err)
    errorMsg.value = err.message || '一键通过失败'
  } finally {
    batchLoading.value = false
    closeDatePicker()
  }
}

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
    const result = await getAuditRecords({
      staffId: currentStaff.value._id,
      status: 0,
      sortOrder: searchParams.value.sortOrder,
      page: 1,
      pageSize: 30
    })

    const records = (result.records || result.list || []).map((record) => ({
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
      successMsg.value = '暂无待审记录'
      return
    }

    const ids = records.map((record) => record.id).join(',')
    await router.push({
      path: `/staff/audit/${records[0].id}`,
      query: {
        ids,
        index: 0,
        ...currentListQuery.value
      }
    })
  } catch (err) {
    console.error('加载快速审核记录失败:', err)
    errorMsg.value = err.message || '加载快速审核记录失败'
  } finally {
    loading.value = false
  }
}

function goToAuditDetail(record) {
  const allIds = filteredRecords.value.map((item) => item.id)
  const currentIndex = filteredRecords.value.findIndex((item) => item.id === record.id)
  router.push({
    path: `/staff/audit/${record.id}`,
    query: {
      ids: allIds.join(','),
      index: currentIndex,
      ...currentListQuery.value
    }
  })
}

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

watch(
  searchParams,
  () => {
    if (!initializedFromRoute || suppressSearchWatch) return
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      pagination.value.page = 1
      loadAuditRecords(1)
    }, 100)
  },
  { deep: true, immediate: false }
)

watch(
  () => route.query,
  async (query) => {
    const normalizedQuery = normalizeRouteQuery(query)
    const listQueryChanged = JSON.stringify(normalizedQuery) !== JSON.stringify(currentListQuery.value)

    if (!initializedFromRoute || listQueryChanged) {
      initializedFromRoute = true
      suppressSearchWatch = true
      applyListQuery(normalizedQuery)
      await nextTick()
      suppressSearchWatch = false
      await loadAuditRecords(pagination.value.page, { syncRoute: false })
    }
  },
  { immediate: true, deep: true }
)
</script>

<template>
  <div class="audit-page">
    <div v-if="errorMsg" class="message-banner error">
      {{ errorMsg }}
      <button @click="errorMsg = ''" class="close-msg">×</button>
    </div>
    <div v-if="successMsg" class="message-banner success">
      {{ successMsg }}
      <button @click="successMsg = ''" class="close-msg">×</button>
    </div>

    <div v-if="showDatePicker" class="modal-overlay" @click.self="closeDatePicker">
      <div class="modal-container">
        <h3>一键通过</h3>
        <div class="date-options">
          <label><input v-model="dateType" type="radio" value="all" /> 全部日期</label>
          <label><input v-model="dateType" type="radio" value="single" /> 指定日期</label>
          <label><input v-model="dateType" type="radio" value="range" /> 日期范围</label>
        </div>

        <div v-if="dateType === 'single'" class="date-input">
          <label>选择日期：</label>
          <input v-model="singleDate" type="date" />
        </div>

        <div v-if="dateType === 'range'" class="date-range">
          <label>开始日期：</label>
          <input v-model="rangeStart" type="date" />
          <label>结束日期：</label>
          <input v-model="rangeEnd" type="date" />
        </div>

        <div class="modal-buttons">
          <button @click="closeDatePicker" class="cancel-btn">取消</button>
          <button @click="confirmBatchApprove" class="confirm-btn" :disabled="batchLoading">确认</button>
        </div>
      </div>
    </div>

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
        <div class="filter-item">
          <label>打卡时间</label>
          <select v-model="searchParams.sortOrder">
            <option value="desc">倒序</option>
            <option value="asc">正序</option>
          </select>
        </div>
        <div class="filter-actions">
          <button @click="resetFilters" class="reset-btn" :disabled="loading">重置</button>
          <button @click="openQuickAudit" class="quick-audit-btn" :disabled="loading">快速审核</button>
          <button @click="openDatePicker" class="batch-approve-btn" :disabled="loading">一键通过</button>
        </div>
      </div>
    </div>

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
              :class="{ current: pageNum === pagination.page }"
              :disabled="pageNum === '...'"
            >
              {{ pageNum }}
            </button>
          </span>
          <button @click="nextPage" :disabled="pagination.page >= pagination.totalPages">下一页</button>
          <button @click="goToLastPage" :disabled="pagination.page >= pagination.totalPages">末页</button>
          <span class="page-info">第{{ pagination.page }}页 / 共{{ pagination.totalPages }}页(共{{ pagination.total }}条)</span>
        </div>
      </div>

      <div v-if="!loading && auditRecords.length === 0" class="empty-state">
        {{ errorMsg ? '加载失败' : '暂无待审记录' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.audit-page {
  padding: 0;
}

.message-banner {
  padding: 12px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
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
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
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
  font-size: 16px;
  color: #666;
  font-weight: 500;
}

.filter-item input,
.filter-item select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
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
  font-size: 16px;
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
  font-size: 16px;
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
  font-size: 16px;
  color: #333;
}

.audit-table td {
  font-size: 16px;
  color: #666;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
}

.status-pending {
  background: rgba(255, 193, 7, 0.1);
  color: #ffc107;
}

.status-approved {
  background: rgba(40, 167, 69, 0.1);
  color: #28a745;
}

.status-rejected {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
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
  font-size: 16px;
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
  font-size: 16px;
}

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
  font-size: 16px;
}

.pagination-left select {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 16px;
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
  font-size: 16px;
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
  font-size: 16px;
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
  font-size: 16px;
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

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-container {
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal-container h3 {
  margin-top: 0;
  font-size: 18px;
}

.date-options {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.date-options label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.date-input,
.date-range {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.date-input input,
.date-range input {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.cancel-btn,
.confirm-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn {
  background: #f0f0f0;
}

.confirm-btn {
  background: #28a745;
  color: white;
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
  }

  .filter-item {
    width: 100%;
  }

  .audit-table {
    font-size: 16px;
  }

  .pagination {
    flex-direction: column;
    gap: 15px;
  }

  .pagination-center {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
