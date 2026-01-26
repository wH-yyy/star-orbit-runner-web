<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 申诉列表数据
const appeals = ref([])
const loading = ref(false)

// 状态筛选
const statusFilter = ref('all')
const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已解决' },
  { value: 'rejected', label: '已驳回' }
]

// 加载申诉数据
const loadAppeals = () => {
  loading.value = true
  console.log('加载申诉列表...')
  
  setTimeout(() => {
    appeals.value = [
      { id: 1, title: '账号被误封', user: '张三', status: 'pending', createTime: '2024-05-20 10:30', priority: 'high' },
      { id: 2, title: '积分扣除错误', user: '李四', status: 'processing', createTime: '2024-05-19 15:20', priority: 'medium' },
      { id: 3, title: '无法登录', user: '王五', status: 'resolved', createTime: '2024-05-18 09:15', priority: 'high' },
      { id: 4, title: '数据丢失', user: '赵六', status: 'pending', createTime: '2024-05-17 14:45', priority: 'high' },
      { id: 5, title: '功能异常', user: '孙七', status: 'rejected', createTime: '2024-05-16 11:20', priority: 'low' }
    ]
    loading.value = false
  }, 800)
}

// 获取状态文本
const getStatusText = (status) => {
  const option = statusOptions.find(opt => opt.value === status)
  return option ? option.label : status
}

// 获取状态样式类
const getStatusClass = (status) => {
  const classMap = {
    pending: 'status-pending',
    processing: 'status-processing',
    resolved: 'status-resolved',
    rejected: 'status-rejected'
  }
  return classMap[status] || ''
}

// 获取优先级文本
const getPriorityText = (priority) => {
  const map = { high: '高', medium: '中', low: '低' }
  return map[priority] || priority
}

// 查看申诉详情
const viewDetail = (appeal) => {
  console.log('查看申诉详情:', appeal)
  router.push(`/appeals/${appeal.id}`)
}

// 筛选申诉
const filteredAppeals = ref([])
const filterAppeals = () => {
  if (statusFilter.value === 'all') {
    filteredAppeals.value = appeals.value
  } else {
    filteredAppeals.value = appeals.value.filter(a => a.status === statusFilter.value)
  }
}

onMounted(() => {
  loadAppeals()
  // 延迟更新筛选数据
  setTimeout(() => {
    filteredAppeals.value = appeals.value
  }, 900)
})
</script>

<template>
  <div class="appeal-list">
    <h2 class="page-title">📝 申诉列表</h2>

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
      <button @click="loadAppeals" class="refresh-btn">🔄 刷新</button>
    </div>

    <!-- 申诉列表 -->
    <div class="table-container">
      <div v-if="loading" class="loading">加载中...</div>
      
      <table v-else class="appeal-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>标题</th>
            <th>申诉人</th>
            <th>优先级</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="appeal in filteredAppeals" :key="appeal.id">
            <td>{{ appeal.id }}</td>
            <td class="title-cell">{{ appeal.title }}</td>
            <td>{{ appeal.user }}</td>
            <td>
              <span 
                class="priority-badge"
                :class="'priority-' + appeal.priority"
              >
                {{ getPriorityText(appeal.priority) }}
              </span>
            </td>
            <td>
              <span 
                class="status-badge"
                :class="getStatusClass(appeal.status)"
              >
                {{ getStatusText(appeal.status) }}
              </span>
            </td>
            <td>{{ appeal.createTime }}</td>
            <td>
              <button @click="viewDetail(appeal)" class="btn-detail">
                查看详情
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!loading && filteredAppeals.length === 0" class="empty-state">
        暂无申诉数据
      </div>
    </div>

    <!-- 统计 -->
    <div class="stats-info">
      <p>共 <strong>{{ filteredAppeals.length }}</strong> 条申诉</p>
    </div>
  </div>
</template>

<style scoped>
.appeal-list {
  max-width: 1200px;
}

.page-title {
  margin: 0 0 24px 0;
  font-size: 24px;
  color: #333;
}

/* 筛选栏 */
.filter-bar {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
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
  font-size: 14px;
}

.filter-group select {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.refresh-btn {
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.refresh-btn:hover {
  background: white;
  border-color: #1890ff;
  color: #1890ff;
}

/* 表格 */
.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
}

.loading,
.empty-state {
  text-align: center;
  padding: 60px;
  color: #999;
  font-size: 16px;
}

.appeal-table {
  width: 100%;
  border-collapse: collapse;
}

.appeal-table th {
  background: #fafafa;
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e8e8e8;
}

.appeal-table td {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.appeal-table tr:hover {
  background: #fafafa;
}

.title-cell {
  font-weight: 500;
  color: #333;
}

/* 优先级标签 */
.priority-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.priority-high {
  background: #fff1f0;
  color: #ff4d4f;
}

.priority-medium {
  background: #fff7e6;
  color: #fa8c16;
}

.priority-low {
  background: #f6ffed;
  color: #52c41a;
}

/* 状态标签 */
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-pending {
  background: #fff7e6;
  color: #fa8c16;
}

.status-processing {
  background: #e6f7ff;
  color: #1890ff;
}

.status-resolved {
  background: #f6ffed;
  color: #52c41a;
}

.status-rejected {
  background: #fff1f0;
  color: #ff4d4f;
}

/* 操作按钮 */
.btn-detail {
  padding: 6px 16px;
  background: #e6f7ff;
  color: #1890ff;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-detail:hover {
  background: #1890ff;
  color: white;
}

/* 统计信息 */
.stats-info {
  background: white;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stats-info p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.stats-info strong {
  color: #1890ff;
  font-size: 16px;
}
</style>
