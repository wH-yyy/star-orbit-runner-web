<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 状态
const currentView = ref('list') // 'list' 或 'detail'
const appeals = ref([])
const appealDetail = ref(null)
const loading = ref(false)
const replyContent = ref('')

// 筛选状态
const statusFilter = ref('all')
const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已解决' },
  { value: 'rejected', label: '已驳回' }
]

// 模拟数据
const mockAppeals = [
  { id: 1, title: '账号被误封', user: '张三', userId: 1001, status: 'pending', createTime: '2024-05-20 10:30', priority: 'high', description: '我的账号昨天突然被封禁了，但我并没有违反任何规定。请帮忙核查，谢谢！', replies: [{ user: '客服小王', time: '2024-05-20 11:00', content: '您好，我们正在核查您的情况...' }] },
  { id: 2, title: '积分扣除错误', user: '李四', userId: 1002, status: 'processing', createTime: '2024-05-19 15:20', priority: 'medium', description: '我的积分被错误扣除了100分，请核实并恢复。', replies: [] },
  { id: 3, title: '无法登录', user: '王五', userId: 1003, status: 'resolved', createTime: '2024-05-18 09:15', priority: 'high', description: '输入密码后无法登录系统，提示密码错误。', replies: [{ user: '管理员', time: '2024-05-18 10:00', content: '已重置密码，请重新登录。' }] },
  { id: 4, title: '数据丢失', user: '赵六', userId: 1004, status: 'pending', createTime: '2024-05-17 14:45', priority: 'high', description: '昨天的跑步数据没有保存，请帮忙恢复。', replies: [] },
  { id: 5, title: '功能异常', user: '孙七', userId: 1005, status: 'rejected', createTime: '2024-05-16 11:20', priority: 'low', description: '审核功能无法正常使用。', replies: [{ user: '管理员', time: '2024-05-16 12:00', content: '经检测系统正常，请检查网络连接。' }] }
]

// 计算属性
const filteredAppeals = computed(() => {
  if (statusFilter.value === 'all') {
    return appeals.value
  }
  return appeals.value.filter(a => a.status === statusFilter.value)
})

// 工具函数
const getStatusText = (status) => {
  const option = statusOptions.find(opt => opt.value === status)
  return option ? option.label : status
}

const getStatusClass = (status) => {
  const classMap = {
    pending: 'status-pending',
    processing: 'status-processing',
    resolved: 'status-resolved',
    rejected: 'status-rejected'
  }
  return classMap[status] || ''
}

const getPriorityText = (priority) => {
  const map = { high: '高', medium: '中', low: '低' }
  return map[priority] || priority
}

// 列表页方法
const loadAppeals = () => {
  loading.value = true
  console.log('加载申诉列表...')

  setTimeout(() => {
    appeals.value = [...mockAppeals]
    loading.value = false
  }, 800)
}

const viewDetail = (appeal) => {
  console.log('查看申诉详情:', appeal)
  appealDetail.value = { ...appeal }
  currentView.value = 'detail'
}

const filterAppeals = () => {
  // 计算属性会自动更新，这里不需要额外逻辑
  console.log('筛选状态:', statusFilter.value)
}

// 详情页方法
const goBackToList = () => {
  currentView.value = 'list'
  appealDetail.value = null
}

const loadDetail = () => {
  if (route.params.id) {
    loading.value = true
    const appealId = parseInt(route.params.id)
    console.log('加载申诉详情，ID:', appealId)

    setTimeout(() => {
      const appeal = mockAppeals.find(a => a.id === appealId)
      if (appeal) {
        appealDetail.value = { ...appeal }
      } else {
        appealDetail.value = {
          id: appealId,
          title: '申诉不存在',
          user: '未知用户',
          userId: 0,
          status: 'rejected',
          priority: 'low',
          createTime: '2024-01-01 00:00',
          description: '该申诉不存在或已被删除。',
          replies: []
        }
      }
      loading.value = false
    }, 800)
  }
}

const submitReply = () => {
  if (!replyContent.value.trim()) {
    alert('请输入回复内容')
    return
  }

  console.log('提交回复:', replyContent.value)

  // 添加到回复列表
  appealDetail.value.replies.push({
    user: '管理员',
    time: new Date().toLocaleString('zh-CN'),
    content: replyContent.value
  })

  replyContent.value = ''
  alert('回复成功！')
}

const updateStatus = (newStatus) => {
  if (confirm('确定要更新申诉状态吗？')) {
    console.log('更新状态为:', newStatus)
    appealDetail.value.status = newStatus
    alert('状态更新成功！')

    // 同时更新列表中的数据
    const index = appeals.value.findIndex(a => a.id === appealDetail.value.id)
    if (index !== -1) {
      appeals.value[index].status = newStatus
    }
  }
}

// 生命周期
onMounted(() => {
  if (route.params.id) {
    currentView.value = 'detail'
    loadDetail()
  } else {
    loadAppeals()
  }
})
</script>

<template>
  <div class="appeal-container">
    <!-- 列表视图 -->
    <div v-if="currentView === 'list'" class="appeal-list">
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

    <!-- 详情视图 -->
    <div v-else class="appeal-detail">
      <div class="header-actions">
        <button @click="goBackToList" class="back-btn">← 返回列表</button>
        <h2 class="page-title">📝 申诉详情</h2>
      </div>

      <div v-if="loading" class="loading">加载中...</div>

      <div v-else-if="appealDetail" class="detail-content">
        <!-- 基本信息 -->
        <div class="info-card">
          <h3>基本信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>申诉编号：</label>
              <span>{{ appealDetail.id }}</span>
            </div>
            <div class="info-item">
              <label>申诉标题：</label>
              <span class="title">{{ appealDetail.title }}</span>
            </div>
            <div class="info-item">
              <label>申诉人：</label>
              <span>{{ appealDetail.user }} (ID: {{ appealDetail.userId }})</span>
            </div>
            <div class="info-item">
              <label>创建时间：</label>
              <span>{{ appealDetail.createTime }}</span>
            </div>
            <div class="info-item">
              <label>优先级：</label>
              <span :class="'priority-' + appealDetail.priority">{{ getPriorityText(appealDetail.priority) }}</span>
            </div>
            <div class="info-item">
              <label>状态：</label>
              <span :class="'status-' + appealDetail.status">{{ getStatusText(appealDetail.status) }}</span>
            </div>
          </div>
        </div>

        <!-- 申诉内容 -->
        <div class="content-card">
          <h3>申诉内容</h3>
          <p class="description">{{ appealDetail.description }}</p>
        </div>

        <!-- 回复记录 -->
        <div class="reply-card">
          <h3>回复记录 ({{ appealDetail.replies.length }})</h3>
          <div class="reply-list">
            <div v-for="(reply, index) in appealDetail.replies" :key="index" class="reply-item">
              <div class="reply-header">
                <strong>{{ reply.user }}</strong>
                <span class="time">{{ reply.time }}</span>
              </div>
              <div class="reply-content">{{ reply.content }}</div>
            </div>
          </div>

          <!-- 添加回复 -->
          <div class="add-reply">
            <h4>添加回复</h4>
            <textarea
                v-model="replyContent"
                placeholder="请输入回复内容..."
                rows="4"
            ></textarea>
            <button @click="submitReply" class="submit-btn">提交回复</button>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-card">
          <h3>处理操作</h3>
          <div class="action-buttons">
            <button @click="updateStatus('processing')" class="btn-processing">
              标记为处理中
            </button>
            <button @click="updateStatus('resolved')" class="btn-resolved">
              标记为已解决
            </button>
            <button @click="updateStatus('rejected')" class="btn-rejected">
              驳回申诉
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.appeal-container {
  max-width: 1200px;
}

/* 列表样式 */
.page-title {
  margin: 0 0 24px 0;
  font-size: 24px;
  color: #333;
}

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

/* 详情样式 */
.appeal-detail {
  max-width: 900px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.back-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.back-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card,
.content-card,
.reply-card,
.action-card {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #333;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 12px;
}

h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #555;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  gap: 8px;
}

.info-item label {
  color: #999;
  font-size: 14px;
  min-width: 80px;
}

.info-item span {
  color: #333;
  font-size: 14px;
}

.info-item .title {
  font-weight: 600;
  color: #1890ff;
}

.description {
  color: #555;
  line-height: 1.8;
  margin: 0;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
}

.reply-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.reply-item {
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  border-left: 3px solid #1890ff;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.reply-header strong {
  color: #333;
  font-size: 14px;
}

.time {
  color: #999;
  font-size: 12px;
}

.reply-content {
  color: #555;
  font-size: 14px;
  line-height: 1.6;
}

.add-reply textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
}

.add-reply textarea:focus {
  outline: none;
  border-color: #1890ff;
}

.submit-btn {
  margin-top: 12px;
  padding: 10px 24px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.submit-btn:hover {
  background: #40a9ff;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-buttons button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-processing {
  background: #e6f7ff;
  color: #1890ff;
}

.btn-processing:hover {
  background: #1890ff;
  color: white;
}

.btn-resolved {
  background: #f6ffed;
  color: #52c41a;
}

.btn-resolved:hover {
  background: #52c41a;
  color: white;
}

.btn-rejected {
  background: #fff1f0;
  color: #ff4d4f;
}

.btn-rejected:hover {
  background: #ff4d4f;
  color: white;
}
</style>