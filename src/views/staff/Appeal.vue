<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { getAppealsList } from '@/api/staff'
import { showError } from '@/utils/toast'

const router = useRouter()

// 状态
const appeals = ref([])
const loading = ref(false)

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0
})

// 每页显示条数选项
const pageSizeOptions = [5, 10, 15, 20, 30, 50, 100]

// 筛选状态
const statusFilter = ref('all')
const statusOptions = [
  { value: 'all', label: '全部' },
  { value: '0', label: '待处理' },
  { value: '1', label: '已接受' },
  { value: '2', label: '已驳回' }
]

// 计算属性
const filteredAppeals = computed(() => {
  if (statusFilter.value === 'all') {
    return appeals.value
  }
  return appeals.value.filter(a => a.status.toString() === statusFilter.value)
})

// 工具函数
const getStatusText = (status) => {
  const map = {
    0: '待处理',
    1: '已接受',
    2: '已驳回'
  }
  return map[status] || '未知状态'
}

const getStatusClass = (status) => {
  const classMap = {
    0: 'status-pending',
    1: 'status-resolved',
    2: 'status-rejected'
  }
  return classMap[status] || ''
}

const formatTime = (time) => {
  if (!time) return '-'
  try {
    const date = time.$date ? new Date(time.$date) : new Date(time)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  } catch {
    return time
  }
}

// 加载申诉列表
const loadAppeals = async () => {
  loading.value = true
  try {
    const params = {
      status: statusFilter.value,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const data = await getAppealsList(params)
    appeals.value = data.list || []
    if (data.pagination) {
      Object.assign(pagination, data.pagination)
    }
  } catch (error) {
    console.error('加载申诉列表失败:', error)
    showError('加载申诉列表失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 筛选
const filterAppeals = () => {
  pagination.page = 1
  loadAppeals()
}

// 每页条数改变
const changePageSize = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  loadAppeals()
}

// 查看详情（跳转到详情页）
const viewDetail = (appeal) => {
  router.push(`/staff/appeal/${appeal._id}`)
}

// 分页方法
const prevPage = () => {
  if (pagination.page > 1) {
    pagination.page--
    loadAppeals()
  }
}

const nextPage = () => {
  if (pagination.page < pagination.totalPages) {
    pagination.page++
    loadAppeals()
  }
}

const goToPage = (page) => {
  if (page >= 1 && page <= pagination.totalPages) {
    pagination.page = page
    loadAppeals()
  }
}

const goToFirstPage = () => {
  pagination.page = 1
  loadAppeals()
}

const goToLastPage = () => {
  pagination.page = pagination.totalPages
  loadAppeals()
}

// 可见页码计算
const visiblePages = computed(() => {
  const pages = []
  const total = pagination.totalPages
  const current = pagination.page
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

onMounted(() => {
  loadAppeals()
})
</script>

<template>
  <div class="appeal-container">
    <!-- 统计 -->
    <!-- <div class="stats-info">
      <p>待处理申诉: <strong>{{ appeals.filter(a => a.status === 0).length }}</strong> 条</p>
      <p>总申诉数: <strong>{{ pagination.total }}</strong> 条</p>
    </div> -->

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-group">
        <label>状态筛选：</label>
        <select v-model="statusFilter" @change="filterAppeals">
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
      <button @click="loadAppeals" class="refresh-btn" :disabled="loading">
        {{ loading ? '加载中...' : '刷新' }}
      </button>
    </div>

    <!-- 申诉列表 -->
    <div class="table-container">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>正在加载申诉记录...</p>
      </div>

      <table v-else class="appeal-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>姓名</th>
            <th>学号</th>
            <th>申诉理由</th>
            <th>申诉时间</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(appeal, index) in filteredAppeals" :key="appeal._id">
            <td class="index-cell">{{ (pagination.page - 1) * pagination.pageSize + index + 1 }}</td>
            <td>{{ appeal.name }}</td>
            <td>{{ appeal.stu_id }}</td>
            <td class="reason-cell">{{ appeal.appealReason || '-' }}</td>
            <td>{{ formatTime(appeal.createTime) }}</td>
            <td>
              <span class="status-badge" :class="getStatusClass(appeal.status)">
                {{ getStatusText(appeal.status) }}
              </span>
            </td>
            <td>
              <button @click="viewDetail(appeal)" class="btn-detail">
                查看详情
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

          <!-- 页码按钮 -->
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

      <div v-if="!loading && filteredAppeals.length === 0" class="empty-state">
        暂无申诉数据
      </div>
    </div>
    
  </div>
</template>

<style scoped>
.appeal-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* 统计卡片 */
.stats-info {
  background: white;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  gap: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
}
.stats-info p {
  margin: 0;
  color: #666;
  font-size: 14px;
}
.stats-info strong {
  color: #1890ff;
  font-size: 16px;
  margin-left: 4px;
}

/* 筛选栏 */
.filter-bar {
  background: white;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}
.filter-group label {
  color: #666;
  font-size: 16px;
  font-weight: 500;
}
.filter-group select {
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  min-width: 120px;
}
.filter-group select:focus {
  border-color: #1890ff;
  outline: none;
}
.refresh-btn {
  padding: 8px 20px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}
.refresh-btn:hover:not(:disabled) {
  background: #40a9ff;
}
.refresh-btn:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
}

/* 表格容器 */
.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
}
.loading, .empty-state {
  text-align: center;
  padding: 60px;
  color: #999;
  font-size: 16px;
}

/* 表格样式 */
.appeal-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 16px;
}
.appeal-table th {
  background: #fafafa;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e8e8e8;
  white-space: nowrap;
}
.appeal-table td {
  text-align: left;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
}
.appeal-table tr:hover {
  background: #fafafa;
}

.index-cell {
  color: #666;
  text-align: center;
  width: 60px;
}
.reason-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
}
.status-pending {
  background: #fff7e6;
  color: #fa8c16;
}
.status-resolved {
  background: #f6ffed;
  color: #52c41a;
}
.status-rejected {
  background: #fff1f0;
  color: #ff4d4f;
}

.btn-detail {
  padding: 6px 16px;
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-detail:hover {
  background: #1890ff;
  color: white;
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
</style>