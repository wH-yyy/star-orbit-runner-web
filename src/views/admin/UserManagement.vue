<template>
  <div class="search-filter-section">
    <div class="filter-section">
      <div class="filter-group">
        <span class="filter-label">校区：</span>
        <select v-model="selectedCampus" class="filter-select" @change="handleFilterChange">
          <option value="">全部校区</option>
          <option v-for="campus in campusOptions" :key="campus" :value="campus">
            {{ campus }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <span class="filter-label">书院：</span>
        <select v-model="selectedCollege" class="filter-select" @change="handleFilterChange">
          <option value="">全部书院</option>
          <option v-for="college in collegeOptions" :key="college" :value="college">
            {{ college }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <span class="filter-label">账号状态：</span>
        <select v-model="selectedStatus" class="filter-select" @change="handleFilterChange">
          <option value="">全部</option>
          <option value="0">正常</option>
          <option value="1">禁跑</option>
          <option value="2">封号</option>
        </select>
      </div>

      <div class="filter-group">
        <span class="filter-label">排序：</span>
        <select v-model="sortBy" @change="handleSortChange" class="filter-select">
          <option value="createTime">注册时间（新→旧）</option>
          <option value="violationCount">违规次数（多→少）</option>
        </select>
      </div>
    </div>

    <div class="search-box">
      <input
          type="text"
          v-model.lazy="searchKeyword"
          placeholder="请输入搜索关键词（支持班级、姓名、学号）"
          class="search-input"
          @keyup.enter="handleSearch"
      />
      <button @click="handleSearch" class="btn btn-search">搜索</button>
      <button @click="resetSearch" class="btn btn-secondary">重置</button>
    </div>
  </div>

  <div class="user-list-section">

    <div v-if="loading" class="loading-state">
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="loadUserList" class="btn btn-primary">重试</button>
    </div>

    <div v-else class="user-table-container">
      <table class="user-table">
        <thead>
        <tr>
          <th>序号</th>
          <th>学号</th>
          <th>姓名</th>
          <th>班级</th>
          <th>性别</th>
          <th>校区</th>
          <th>书院</th>
          <th>打卡通过</th>
          <th>违规次数</th>
          <th>账号状态</th>
          <th>操作</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(user, index) in userList" :key="user._id" class="user-row">
          <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
          <td>{{ user.stu_id }}</td>
          <td>{{ user.name }}</td>
          <td>{{ user.class_name }}</td>
          <td>{{ user.gender }}</td>
          <td>{{ user.campus }}</td>
          <td>{{ user.college }}</td>
          <td>{{ user.totalCount || 0 }}</td>
          <td>{{ user.violationCount || 0 }}</td>
          <td>
              <span :class="['status-badge', statusClassMap[user.status]]">
                {{ statusMap[user.status] || '未知' }}
              </span>
          </td>
          <td>
            <div class="action-buttons">
              <button @click="openHistory(user)" class="btn btn-info btn-sm">历史记录</button>

              <template v-if="user.status === 0">
                <button @click="handleSuspend(user._id)" class="btn btn-warning btn-sm">禁跑</button>
                <button @click="handleBan(user._id)" class="btn btn-danger btn-sm">封号</button>
              </template>

              <template v-else-if="user.status === 1">
                <button @click="handleActivate(user._id)" class="btn btn-primary btn-sm">取消禁跑</button>
                <button @click="handleBan(user._id)" class="btn btn-danger btn-sm">封号</button>
              </template>

              <template v-else-if="user.status === 2">
                <button @click="handleActivate(user._id)" class="btn btn-primary btn-sm">解封</button>
              </template>
            </div>
          </td>
        </tr>
        </tbody>
      </table>

      <div v-if="!loading && userList.length === 0" class="empty-state">
        <p>暂无用户数据</p>
      </div>
    </div>

    <div v-if="total > 0" class="pagination-section">
      <div class="pagination-left">
        <div class="page-size-selector">
          <span>每页显示：</span>
          <select v-model="pageSize" @change="handlePageSizeChange" class="page-size-select">
            <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
          </select>
          <span>条</span>
        </div>
        <div class="pagination-info">
          共 {{ total }} 条记录，第 {{ currentPage }} / {{ totalPages }} 页
        </div>
      </div>
      <div class="pagination-controls">
        <button
            @click="goToPage(1)"
            :disabled="currentPage === 1"
            class="btn btn-pagination"
        >
          首页
        </button>
        <button
            @click="prevPage"
            :disabled="currentPage === 1"
            class="btn btn-pagination"
        >
          上一页
        </button>

        <button
            v-for="pageNum in visiblePages"
            :key="pageNum"
            @click="goToPage(pageNum)"
            :class="['btn', 'btn-pagination', { 'active': pageNum === currentPage }]"
        >
          {{ pageNum }}
        </button>

        <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="btn btn-pagination"
        >
          下一页
        </button>
        <button
            @click="goToPage(totalPages)"
            :disabled="currentPage === totalPages"
            class="btn btn-pagination"
        >
          末页
        </button>
      </div>
    </div>
  </div>

  <div v-if="showConfirmDialog" class="confirm-dialog-overlay">
    <div class="confirm-dialog">
      <h3>{{ confirmTitle }}</h3>
      <p>{{ confirmMessage }}</p>
      <div v-if="pendingAction === 'suspend'" class="ban-days-selector">
        <label for="banDays">禁跑天数：</label>
        <select id="banDays" v-model="banDays" class="filter-select">
          <option v-for="day in banDaysOptions" :key="day" :value="day">{{ day }}天</option>
        </select>
      </div>
      <div class="dialog-actions">
        <button @click="cancelConfirm" class="btn btn-secondary">取消</button>
        <button @click="confirmAction" class="btn btn-danger">确认</button>
      </div>
    </div>
  </div>

  <div v-if="showHistoryModal" class="confirm-dialog-overlay" @click.self="closeHistory">
    <div class="history-dialog">
      <div class="history-header">
        <h3>{{ currentUserForHistory?.name || '用户' }} 的历史打卡照片</h3>
        <button class="close-btn" @click="closeHistory">×</button>
      </div>

      <div class="history-content">
        <div v-if="loadingHistory" class="loading-state">
          <p>加载中...</p>
        </div>
        <div v-else-if="userHistory.length === 0" class="empty-state">
          <p>该用户暂无打卡记录</p>
        </div>

        <div v-else class="image-grid">
          <div v-for="record in userHistory" :key="record._id" class="image-card">

            <div class="card-images-wrapper" @click="openImagePreview(record)" title="点击查看详情">
              <img :src="record.image_url" class="history-img" alt="路线截图" />
              <img v-if="record.stepImageId || record.stepImageFileID || record.step_image_url"
                   :src="record.step_image_url || record.stepImageId || record.stepImageFileID"
                   class="history-img step-img" alt="步数截图" />
            </div>

            <div class="image-info">
              <span>{{ formatDate(record.timestamp) }}</span>
              <span :class="['status-tag', getRecordStatusClass(record.status)]">
                {{ getRecordStatusText(record.status) }}
              </span>
            </div>
            <div class="image-extra" v-if="record.mode || record.audit_remark">
              <small>{{ record.mode || (record.type === 'playground' ? '操场' : '自由跑') }}</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-if="showImagePreview && currentPreviewRecord" class="image-preview-overlay" @click.self="closeImagePreview">
    <button class="preview-close-btn" @click="closeImagePreview">×</button>

    <div class="preview-modal">
      <div class="preview-images-area" @click.self="closeImagePreview">
        <img :src="currentPreviewRecord.image_url" class="preview-full-img" alt="路线截图" />
        <img v-if="currentPreviewRecord.stepImageId || currentPreviewRecord.stepImageFileID || currentPreviewRecord.step_image_url"
             :src="currentPreviewRecord.step_image_url || currentPreviewRecord.stepImageId || currentPreviewRecord.stepImageFileID"
             class="preview-full-img" alt="步数截图" />
      </div>

      <div class="preview-info-area">
        <h3 class="info-title">打卡详情</h3>
        <ul class="info-list">
          <li>
            <span class="info-label">当前状态：</span>
            <span :class="['status-tag', getRecordStatusClass(currentPreviewRecord.status)]">
              {{ getRecordStatusText(currentPreviewRecord.status) }}
            </span>
          </li>
          <li>
            <span class="info-label">跑步方式：</span>
            <span>{{ currentPreviewRecord.mode || (currentPreviewRecord.type === 'playground' ? '全程在操场' : '自由场地') }}</span>
          </li>
          <li>
            <span class="info-label">打卡时间：</span>
            <span>{{ formatDate(currentPreviewRecord.timestamp || currentPreviewRecord.create_time) }}</span>
          </li>
          <li v-if="currentPreviewRecord.assignedStaffName">
            <span class="info-label">审核人员：</span>
            <span>{{ currentPreviewRecord.assignedStaffName }}</span>
          </li>
          <li v-if="currentPreviewRecord.auditTime || currentPreviewRecord.audit_time">
            <span class="info-label">审核时间：</span>
            <span>{{ formatDate(currentPreviewRecord.auditTime || currentPreviewRecord.audit_time) }}</span>
          </li>
          <li v-if="Number(currentPreviewRecord.status) === 2" class="reject-item">
            <span class="info-label">不通过原因：</span>
            <span class="reject-reason">{{ currentPreviewRecord.audit_reason || currentPreviewRecord.audit_remark || '未填写详细原因' }}</span>
          </li>

          <template v-if="Number(currentPreviewRecord.status) === 3">
            <li class="reject-item">
              <span class="info-label">初审不通过原因：</span>
              <span class="reject-reason">{{ currentPreviewRecord.audit_reason || currentPreviewRecord.audit_remark || '未填写详细原因' }}</span>
            </li>
            <li class="appeal-item">
              <span class="info-label">用户申诉理由：</span>
              <span class="appeal-reason">{{ currentPreviewRecord.appealReason || '（未在数据库查到对应的申诉表单）' }}</span>
            </li>
          </template>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getUserList, updateUserStatus, fetchUserHistory } from '@/api/admin'
import { showSuccess, showError } from '@/utils/toast'

// 用户数据
const userList = ref([])
const loading = ref(false)
const error = ref('')

// 停跑天数选项
const banDays = ref(1)
const banDaysOptions = [1, 3, 7]

const statusMap = {
  0: '正常',
  1: '停跑',
  2: '封号'
}

const statusClassMap = {
  0: 'status-normal',
  1: 'status-suspended',
  2: 'status-banned'
}

// 分页相关
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

// 搜索和筛选相关
const searchKeyword = ref('')
const searchFields = ref(['name', 'stu_id', 'class_name'])
const selectedCampus = ref('')
const selectedCollege = ref('')
const selectedStatus = ref('')

// 确认对话框相关
const showConfirmDialog = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const pendingUserId = ref(null)
const pendingAction = ref('')

// 选项数据
const campusOptions = ['兴庆校区', '雁塔校区', '创新港', '曲江校区']
const collegeOptions = [
  '仲英书院', '文治书院', '彭康书院', '启德书院',
  '励志书院', '崇实书院', '南洋书院', '宗濂书院', '钱学森书院'
]
const pageSizeOptions = [20, 30, 50, 100, 200]

// 排序相关
const sortBy = ref('createTime')
const sortOrder = ref('desc')

// ==================== 历史记录相关逻辑 ====================
const showHistoryModal = ref(false)
const currentUserForHistory = ref(null)
const userHistory = ref([])
const loadingHistory = ref(false)

// 打开历史记录弹窗
const openHistory = async (user) => {
  currentUserForHistory.value = user
  showHistoryModal.value = true
  loadingHistory.value = true

  try {
    const result = await fetchUserHistory(user.stu_id)
    if (result.success || result.code === 200) {
      userHistory.value = result.data
    } else {
      showError(result.message)
    }
  } catch (err) {
    console.error("请求失败详情:", err)
    showError('获取失败：' + err.message)
  } finally {
    loadingHistory.value = false
  }
}

// 关闭弹窗
const closeHistory = () => {
  showHistoryModal.value = false
  currentUserForHistory.value = null
}

// ==================== 图片预览与详情面板相关逻辑 ====================
const showImagePreview = ref(false)
const currentPreviewRecord = ref(null) // 保存当前点击的完整记录对象

// 打开图片详情预览
const openImagePreview = (record) => {
  if (!record) return
  currentPreviewRecord.value = record
  showImagePreview.value = true
}

// 关闭图片详情预览
const closeImagePreview = () => {
  showImagePreview.value = false
  setTimeout(() => {
    currentPreviewRecord.value = null
  }, 300) // 延迟清空数据，让关闭动画平滑过渡
}
// ==========================================================

// 格式化日期显示工具 (处理时间戳)
const formatDate = (dateVal) => {
  if (!dateVal) return '未知时间'
  try {
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return dateVal // 如果是字符串则原样返回
    return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  } catch (e) {
    return '时间格式错误'
  }
}

// 解析历史记录的文本状态（包含状态 3：申诉中）
const getRecordStatusText = (status) => {
  const s = Number(status)
  if (s === 1) return '已通过'
  if (s === 2) return '已驳回'
  if (s === 3) return '申诉中'
  return '待审核'
}

// 解析历史记录的样式类名
const getRecordStatusClass = (status) => {
  const s = Number(status)
  if (s === 1) return 'passed'
  if (s === 2) return 'rejected'
  if (s === 3) return 'appealing'
  return 'pending'
}
// ==========================================================

// 排序变化处理
const handleSortChange = () => {
  currentPage.value = 1
  loadUserList()
}

// 计算可见的页码
const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)
  start = Math.max(1, end - maxVisible + 1)
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

// 加载用户列表
const loadUserList = async () => {
  loading.value = true
  error.value = ''

  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      searchKeyword: searchKeyword.value.trim(),
      searchFields: searchFields.value,
      campus: selectedCampus.value ? [selectedCampus.value] : [],
      college: selectedCollege.value ? [selectedCollege.value] : [],
      status: selectedStatus.value ? [parseInt(selectedStatus.value)] : [],
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    }

    const data = await getUserList(params)
    userList.value = data.list
    total.value = data.total
  } catch (err) {
    error.value = err.message || '获取用户列表失败'
    console.error('获取用户列表失败:', err)
  } finally {
    loading.value = false
  }
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
  loadUserList()
}

// 重置搜索
const resetSearch = () => {
  searchKeyword.value = ''
  searchFields.value = ['name', 'stu_id', 'class_name']
  selectedCampus.value = ''
  selectedCollege.value = ''
  selectedStatus.value = ''
  currentPage.value = 1
  loadUserList()
}

// 筛选变化处理函数
const handleFilterChange = () => {
  currentPage.value = 1
  loadUserList()
}

// 分页操作
const goToPage = (pageNum) => {
  if (pageNum >= 1 && pageNum <= totalPages.value) {
    currentPage.value = pageNum
    loadUserList()
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    loadUserList()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    loadUserList()
  }
}

const handlePageSizeChange = () => {
  currentPage.value = 1
  loadUserList()
}

// 用户状态操作
const handleSuspend = (userId) => {
  pendingUserId.value = userId
  pendingAction.value = 'suspend'
  confirmTitle.value = '确认停跑'
  confirmMessage.value = '请选择停跑天数：'
  banDays.value = 1
  showConfirmDialog.value = true
}

const handleBan = (userId) => {
  pendingUserId.value = userId
  pendingAction.value = 'ban'
  confirmTitle.value = '确认封号'
  confirmMessage.value = '确定要将该用户设置为封号状态吗？'
  showConfirmDialog.value = true
}

const handleActivate = (userId) => {
  pendingUserId.value = userId
  pendingAction.value = 'activate'
  confirmTitle.value = '确认恢复正常'
  confirmMessage.value = '确定要将该用户状态恢复正常吗？'
  showConfirmDialog.value = true
}

// 确认操作
const confirmAction = async () => {
  if (!pendingUserId.value) return

  let status
  let extraData = {}
  switch (pendingAction.value) {
    case 'suspend':
      status = 1
      extraData.banDays = banDays.value
      break
    case 'ban':
      status = 2
      break
    case 'activate':
      status = 0
      break
    default:
      return
  }

  try {
    await updateUserStatus(pendingUserId.value, status, extraData.banDays)
    showConfirmDialog.value = false
    await loadUserList()
    const actionText = {
      suspend: '禁跑',
      ban: '封号',
      activate: '恢复正常'
    }[pendingAction.value]
    showSuccess(`用户${actionText}成功！`)
  } catch (err) {
    console.error('更新用户状态失败:', err)
    showError(`操作失败: ${err.message}`)
  } finally {
    resetPendingAction()
  }
}

// 取消确认
const cancelConfirm = () => {
  showConfirmDialog.value = false
  resetPendingAction()
}

// 重置待处理操作
const resetPendingAction = () => {
  pendingUserId.value = null
  pendingAction.value = ''
  confirmTitle.value = ''
  confirmMessage.value = ''
}

// 组件挂载时加载数据
onMounted(() => {
  loadUserList()
})
</script>

<style scoped>
/* ========================================= */
/* 原有基础搜索与表格样式 */
/* ========================================= */
.search-filter-section {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.search-box {
  display: flex;
  gap: 10px;
  margin: 20px 0 0 0;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.3s ease;
  color: #606266;
}

.search-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.filter-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 16px;
  color: #606266;
  font-weight: 500;
}

.filter-select {
  padding: 5px 5px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 16px;
  background-color: #ffffff;
  cursor: pointer;
  transition: border-color 0.3s ease;
  color: #606266;
  min-height: 30px;
}

.filter-select[multiple] {
  min-height: 80px;
}

.filter-select:focus {
  outline: none;
  border-color: #409eff;
}

/* 用户列表样式 */
.user-list-section {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.table-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #606266;
}

.page-size-select {
  padding: 6px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 16px;
}

.user-table-container {
  overflow-x: auto;
  margin-bottom: 20px;
  width: 100%;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1200px;
  table-layout: auto;
}

.user-table th,
.user-table td {
  padding: 8px 12px;
  text-align: center;
  border-bottom: 1px solid #ebeef5;
  font-size: 16px;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-table th {
  background-color: #fafafa;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
}

.user-table td {
  color: #606266;
}

.user-row:hover {
  background-color: #f5f7fa;
}

/* 状态标签样式 */
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}
.status-normal { color: #67c23a; background-color: #f0f9eb; }
.status-suspended { color: #e6a23c; background-color: #fdf6ec; }
.status-banned { color: #f56c6c; background-color: #fef0f0; }

/* 操作按钮样式 */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 14px;
}

.btn-primary {
  background-color: #409eff;
  color: #fff;
}

.btn-primary:hover {
  background-color: #66b1ff;
}

.btn-primary:active {
  background-color: #3a8ee6;
}

.btn-secondary {
  background-color: #909399;
  color: #fff;
}

.btn-secondary:hover {
  background-color: #a6a9ad;
}

.btn-search {
  background-color: #409eff;
  color: #fff;
}

.btn-search:hover {
  background-color: #66b1ff;
}

.btn-warning {
  background-color: #e6a23c;
  color: #fff;
}

.btn-warning:hover {
  background-color: #ebb563;
}

.btn-danger {
  background-color: #f56c6c;
  color: #fff;
}

.btn-danger:hover {
  background-color: #f78989;
}

/* 历史记录按钮样式 */
.btn-info {
  background-color: #9c27b0;
  color: #fff;
}
.btn-info:hover {
  background-color: #ab47bc;
}

.ban-days-selector {
  margin: 16px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}
.ban-days-selector label {
  font-size: 16px;
  color: #606266;
  font-weight: 500;
}
.ban-days-selector select {
  width: 120px;
  padding: 6px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #fff;
  font-size: 16px;
}

/* 分页器样式 */
.pagination-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.pagination-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.pagination-info {
  font-size: 16px;
  color: #606266;
}

.pagination-controls {
  display: flex;
  gap: 6px;
}

.btn-pagination {
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  background-color: #fff;
  color: #606266;
}

.btn-pagination:hover:not(:disabled) {
  background-color: #f5f7fa;
  border-color: #c0c4cc;
}
.btn-pagination.active {
  background-color: #409eff;
  color: #fff;
  border-color: #409eff;
}

.btn-pagination:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* 加载状态样式 */
.loading-state,
.error-state,
.empty-state {
  padding: 60px 0;
  text-align: center;
  font-size: 16px;
}
.loading-state { color: #409eff; }
.error-state { color: #f56c6c; }
.empty-state { color: #909399; }
.error-state .btn { margin-top: 16px; }

/* 确认对话框样式 */
.confirm-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.confirm-dialog {
  background-color: #fff;
  border-radius: 8px;
  padding: 24px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.confirm-dialog h3 {
  margin-top: 0;
  margin-bottom: 16px;
  color: #303133;
  font-size: 20px;
}

.confirm-dialog p {
  margin-bottom: 24px;
  color: #606266;
  font-size: 16px;
  line-height: 1.5;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* ========================================= */
/* 历史照片列表弹窗基础样式 */
/* ========================================= */
.history-dialog {
  background-color: #f5f7fa;
  border-radius: 12px;
  width: 80%;
  max-width: 900px;
  height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}

.history-header {
  background-color: #fff;
  padding: 16px 24px;
  border-radius: 12px 12px 0 0;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #909399;
  line-height: 1;
  transition: color 0.3s;
}

.close-btn:hover {
  color: #f56c6c;
}

.history-content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.image-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: transform 0.3s, box-shadow 0.3s;
}

.image-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.1);
}

.image-info {
  padding: 10px 16px;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  color: #303133;
}

.image-extra {
  padding: 0 16px 10px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

/* 状态标签样式体系 */
.status-tag {
  font-weight: 500;
  font-size: 13px;
}
.status-tag.passed { color: #67c23a; }
.status-tag.rejected { color: #f56c6c; }
.status-tag.pending { color: #e6a23c; }
.status-tag.appealing { color: #409eff; } /* 申诉中状态专属颜色 */

/* ========================================= */
/* 双图并排预览样式 */
/* ========================================= */
.card-images-wrapper {
  display: flex;
  height: 250px;
  cursor: pointer;
  overflow: hidden;
  background-color: #f5f7fa;
}

.card-images-wrapper .history-img {
  flex: 1;
  height: 100%;
  object-fit: cover;
  min-width: 0; /* 必须加这个，防止双图时溢出容器 */
  border-right: 1px solid #ebeef5;
  transition: transform 0.3s;
}

.card-images-wrapper:hover .history-img {
  transform: scale(1.05); /* 鼠标悬浮放大效果 */
}

.card-images-wrapper .history-img:last-child {
  border-right: none;
}

/* ========================================= */
/* 升级版：全屏图片与详情侧边栏样式 */
/* ========================================= */
.image-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3000;
}

.preview-close-btn {
  position: absolute;
  top: 20px;
  right: 30px;
  background: none;
  border: none;
  color: #fff;
  font-size: 40px;
  cursor: pointer;
  transition: color 0.3s;
  z-index: 3001;
}

.preview-close-btn:hover {
  color: #f56c6c;
}

.preview-modal {
  display: flex;
  width: 90vw;
  max-width: 1200px;
  height: 85vh;
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  animation: zoomIn 0.25s ease-out;
}

/* 左侧全屏黑底大图展示区 */
.preview-images-area {
  flex: 1;
  background-color: #111;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 20px;
  overflow-x: auto;
}

.preview-images-area .preview-full-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
}

/* 右侧白底审核详情区 */
.preview-info-area {
  width: 340px;
  padding: 30px;
  background-color: #fff;
  overflow-y: auto;
  border-left: 1px solid #ebeef5;
}

.info-title {
  margin-top: 0;
  margin-bottom: 24px;
  font-size: 20px;
  color: #303133;
  font-weight: 600;
  border-bottom: 2px solid #409eff;
  padding-bottom: 10px;
  display: inline-block;
}

.info-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-list li {
  font-size: 15px;
  color: #303133;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-label {
  color: #909399;
  font-size: 13px;
}

.reject-item {
  margin-top: 10px;
  padding: 12px;
  background-color: #fef0f0;
  border-radius: 6px;
  border-left: 4px solid #f56c6c;
}

.reject-reason {
  color: #f56c6c;
  font-weight: 500;
  line-height: 1.5;
}

/* 新增：申诉理由容器样式 */
.appeal-item {
  margin-top: 10px;
  padding: 12px;
  background-color: #ecf5ff; /* 浅蓝色背景以示区分 */
  border-radius: 6px;
  border-left: 4px solid #409eff;
}

.appeal-reason {
  color: #409eff;
  font-weight: 500;
  line-height: 1.5;
}

@keyframes zoomIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* ========================================= */
/* 响应式媒体查询 */
/* ========================================= */
@media (max-width: 1200px) {
  .filter-section {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .search-box {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-section {
    grid-template-columns: 1fr;
  }

  .pagination-section {
    flex-direction: column;
    gap: 15px;
  }

  .pagination-controls {
    flex-wrap: wrap;
    justify-content: center;
  }

  .action-buttons {
    flex-direction: column;
  }

  .history-dialog {
    width: 95%;
    height: 90vh;
  }

  /* 手机端预览弹窗改为上下布局 */
  .preview-modal {
    flex-direction: column;
    height: 90vh;
  }

  .preview-info-area {
    width: 100%;
    height: auto;
    max-height: 40%;
    border-left: none;
    border-top: 1px solid #ebeef5;
    padding: 20px;
  }

  .preview-images-area {
    flex-direction: column;
  }
}
</style>
