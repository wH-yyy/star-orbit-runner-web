<template>
  <div class="user-management-page">
    <!-- 搜索和筛选区域 -->
    <div class="search-filter-section">
      <div class="search-box">
        <input
            type="text"
            v-model.lazy="searchKeyword"
            placeholder="请输入搜索关键词"
            class="search-input"
            @keyup.enter="handleSearch"
        />
        <button @click="handleSearch" class="btn btn-search">搜索</button>
        <button @click="resetSearch" class="btn btn-secondary">重置</button>
      </div>

      <div class="filter-section">
        <!-- 搜索字段选择 -->
        <div class="filter-group">
          <span class="filter-label">搜索字段：</span>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="searchFields" value="name" />
              姓名
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="searchFields" value="stu_id" />
              学号
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="searchFields" value="class_name" />
              班级
            </label>
          </div>
        </div>

        <!-- 校区筛选 -->
        <div class="filter-group">
          <span class="filter-label">校区：</span>
          <select v-model="selectedCampus" class="filter-select" @change="handleFilterChange">
            <option value="">全部校区</option>
            <option v-for="campus in campusOptions" :key="campus" :value="campus">
              {{ campus }}
            </option>
          </select>
        </div>

        <!-- 书院筛选 -->
        <div class="filter-group">
          <span class="filter-label">书院：</span>
          <select v-model="selectedCollege" class="filter-select" @change="handleFilterChange">
            <option value="">全部书院</option>
            <option v-for="college in collegeOptions" :key="college" :value="college">
              {{ college }}
            </option>
          </select>
        </div>

        <!-- 性别筛选 -->
        <div class="filter-group">
          <span class="filter-label">性别：</span>
          <select v-model="selectedGender" class="filter-select" @change="handleFilterChange">
            <option value="">全部性别</option>
            <option value="男">男</option>
            <option value="女">女</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 用户列表 -->
    <div class="user-list-section">
      <div class="table-header">
        <div class="page-size-selector">
          <span>每页显示：</span>
          <select v-model="pageSize" @change="handlePageSizeChange" class="page-size-select">
            <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
          </select>
          <span>条</span>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <p>加载中...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="loadUserList" class="btn btn-primary">重试</button>
      </div>

      <!-- 用户列表表格 -->
      <div v-else class="user-table-container">
        <table class="user-table">
          <thead>
          <tr>
            <th>序号</th>
            <th>学号</th>
            <th>姓名</th>
            <th>性别</th>
            <th>校区</th>
            <th>书院</th>
            <th>班级</th>
            <th>创建时间</th>
            <th>状态</th>
            <th>总里程(km)</th>
            <th>总时长(min)</th>
            <th>总次数</th>
            <th>违规次数</th>
            <th>操作</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(user, index) in userList" :key="user._id" class="user-row">
            <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td>{{ user.stu_id }}</td>
            <td>{{ user.name }}</td>
            <td>{{ user.gender }}</td>
            <td>{{ user.campus }}</td>
            <td>{{ user.college }}</td>
            <td>{{ user.class_name }}</td>
            <td>{{ user.createTime }}</td>
            <td>
                <span :class="['status-badge', getStatusClass(user.status)]">
                  {{ user.status }}
                </span>
            </td>
            <td>{{ user.totalDistance?.toFixed(2) || '0.00' }}</td>
            <td>{{ user.totalDuration?.toFixed(1) || '0.0' }}</td>
            <td>{{ user.totalCount || 0 }}</td>
            <td>{{ user.violationCount || 0 }}</td>
            <td>
              <div class="action-buttons">
                <!-- 正常状态：显示停跑和封号 -->
                <template v-if="user.status === '正常'">
                  <button
                      @click="handleSuspend(user._id)"
                      class="btn btn-warning btn-sm"
                  >
                    停跑
                  </button>
                  <button
                      @click="handleBan(user._id)"
                      class="btn btn-danger btn-sm"
                  >
                    封号
                  </button>
                </template>

                <!-- 停跑状态：显示取消停跑和封号 -->
                <template v-else-if="user.status === '停跑'">
                  <button
                      @click="handleActivate(user._id)"
                      class="btn btn-primary btn-sm"
                  >
                    取消停跑
                  </button>
                  <button
                      @click="handleBan(user._id)"
                      class="btn btn-danger btn-sm"
                  >
                    封号
                  </button>
                </template>

                <!-- 封号状态：显示解封 -->
                <template v-else-if="user.status === '封号'">
                  <button
                      @click="handleActivate(user._id)"
                      class="btn btn-primary btn-sm"
                  >
                    解封
                  </button>
                </template>
              </div>
            </td>
          </tr>
          </tbody>
        </table>

        <!-- 空状态 -->
        <div v-if="!loading && userList.length === 0" class="empty-state">
          <p>暂无用户数据</p>
        </div>
      </div>

      <!-- 分页器 -->
      <div v-if="total > 0" class="pagination-section">
        <div class="pagination-info">
          共 {{ total }} 条记录，第 {{ currentPage }} / {{ totalPages }} 页
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

          <!-- 页码按钮 -->
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

    <!-- 确认对话框 -->
    <div v-if="showConfirmDialog" class="confirm-dialog-overlay">
      <div class="confirm-dialog">
        <h3>{{ confirmTitle }}</h3>
        <p>{{ confirmMessage }}</p>
        <div class="dialog-actions">
          <button @click="cancelConfirm" class="btn btn-secondary">取消</button>
          <button @click="confirmAction" class="btn btn-danger">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getUserList, updateUserStatus } from '@/api/admin'

// 用户数据
const userList = ref([])
const loading = ref(false)
const error = ref('')

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

// 搜索和筛选相关
const searchKeyword = ref('')
const searchFields = ref(['name', 'stu_id', 'class_name'])
const selectedCampus = ref('')
const selectedCollege = ref('')
const selectedGender = ref('')

// 确认对话框相关
const showConfirmDialog = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const pendingUserId = ref(null)
const pendingAction = ref('')

// 选项数据
const campusOptions = ['兴庆校区', '雁塔校区', '曲江校区', '创新港校区']
const collegeOptions = [
  '仲英书院', '文治书院', '彭康书院', '启德书院',
  '励志书院', '崇实书院', '南洋书院', '宗濂书院', '钱学森书院'
]
const pageSizeOptions = [5, 10, 15, 20, 25, 30, 50, 100, 200]

// 计算可见的页码
const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  // 调整起始位置
  start = Math.max(1, end - maxVisible + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

// 获取状态样式类
const getStatusClass = (status) => {
  switch (status) {
    case '正常': return 'status-normal'
    case '停跑': return 'status-suspended'
    case '封号': return 'status-banned'
    default: return ''
  }
}

// 加载用户列表
const loadUserList = async () => {
  loading.value = true
  error.value = ''

  try {
    // 构建查询参数
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      searchKeyword: searchKeyword.value.trim(),
      searchFields: searchFields.value,
      // 只有当不是"全部"时才传递筛选条件
      campus: selectedCampus.value ? [selectedCampus.value] : [],
      college: selectedCollege.value ? [selectedCollege.value] : [],
      gender: selectedGender.value ? [selectedGender.value] : []
    }

    console.log('加载用户列表参数:', params)

    // 调用正确的函数
    const data = await getUserList(params)
    userList.value = data.list
    total.value = data.total
    console.log('加载用户列表成功:', data)
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
  selectedGender.value = ''
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
  confirmMessage.value = '确定要将该用户设置为停跑状态吗？'
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
  switch (pendingAction.value) {
    case 'suspend':
      status = 'suspended'
      break
    case 'ban':
      status = 'banned'
      break
    case 'activate':
      status = 'active'
      break
    default:
      return
  }

  try {
    await updateUserStatus(pendingUserId.value, status)
    showConfirmDialog.value = false

    // 重新加载当前页数据
    loadUserList()

    // 显示成功提示
    let actionText = ''
    switch (pendingAction.value) {
      case 'suspend': actionText = '停跑'; break
      case 'ban': actionText = '封号'; break
      case 'activate': actionText = '恢复正常'; break
    }
    alert(`用户${actionText}成功！`)

  } catch (err) {
    console.error('更新用户状态失败:', err)
    alert(`操作失败: ${err.message}`)
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

// 监听搜索字段变化
watch(searchFields, (newVal) => {
  if (newVal.length === 0) {
    // 如果所有选项都被取消，恢复默认选择
    setTimeout(() => {
      searchFields.value = ['name', 'stu_id', 'class_name']
    })
  }
})

// 组件挂载时加载数据
onMounted(() => {
  loadUserList()
})
</script>

<style scoped>
.user-management-page {
  width: 100%;
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
  box-sizing: border-box; /* 添加这行，确保 padding 不增加宽度 */
}

/* 搜索和筛选区域样式 */
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
  margin-bottom: 20px;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
}

.filter-select {
  padding: 5px 5px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
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
  font-size: 14px;
  color: #606266;
}

.page-size-select {
  padding: 6px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
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
  text-align: left;
  border-bottom: 1px solid #ebeef5;
  font-size: 14px;
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
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.status-normal {
  background-color: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.status-suspended {
  background-color: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
}

.status-banned {
  background-color: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

/* 操作按钮样式 */
.action-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
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

/* 分页器样式 */
.pagination-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.pagination-info {
  font-size: 14px;
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

.btn-pagination:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.btn-pagination.active {
  background-color: #409eff;
  color: #fff;
  border-color: #409eff;
}

/* 加载状态样式 */
.loading-state {
  padding: 60px 0;
  text-align: center;
  color: #409eff;
  font-size: 14px;
}

/* 错误状态样式 */
.error-state {
  padding: 60px 0;
  text-align: center;
  color: #f56c6c;
  font-size: 14px;
}

.error-state .btn {
  margin-top: 16px;
}

/* 空状态样式 */
.empty-state {
  padding: 60px 0;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

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
  font-size: 18px;
}

.confirm-dialog p {
  margin-bottom: 24px;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .filter-section {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .user-management-page {
    padding: 10px;
  }

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
}
</style>