<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAppealsList, getAppealDetail, processAppeal, getCurrentStaff } from '@/api/staff'
import { showSuccess, showError, showWarning } from '@/utils/toast'

const route = useRoute()
const router = useRouter()

// 状态
const currentView = ref('list') // 'list' 或 'detail'
const appeals = ref([])
const appealDetail = ref(null)
const loading = ref(false)
const processing = ref(false)

// 弹窗状态
const showPassConfirmDialog = ref(false)
const showRejectDialog = ref(false)
const rejectReason = ref('')
const selectedReasons = ref([])

// 通用消息弹窗
const showMessageDialog = ref(false)
const messageTitle = ref('提示')
const messageContent = ref('')

// 通用确认弹窗
const showConfirmDialog = ref(false)
const confirmTitle = ref('确认')
const confirmContent = ref('')
const confirmCallback = ref(null)  // 确认时执行
const cancelCallback = ref(null)   // 取消时执行（可选）

// 图片预览
const previewImage = ref('')
const showImagePreview = ref(false)

// 打开消息提示框
const openMessage = (content, title = '提示') => {
  messageTitle.value = title
  messageContent.value = content
  showMessageDialog.value = true
}

// 打开确认框
const openConfirm = (content, onConfirm, onCancel = null, title = '确认') => {
  confirmTitle.value = title
  confirmContent.value = content
  confirmCallback.value = onConfirm
  cancelCallback.value = onCancel
  showConfirmDialog.value = true
}

// 确认按钮处理
const handleConfirm = () => {
  if (confirmCallback.value) confirmCallback.value()
  showConfirmDialog.value = false
}

// 取消按钮处理
const handleCancelConfirm = () => {
  if (cancelCallback.value) cancelCallback.value()
  showConfirmDialog.value = false
}

// 常见驳回理由选项
const commonRejectReasons = [
  { id: 1, text: '未上传截图' },
  { id: 2, text: '截图不完整' },
  { id: 3, text: '截图有误' },
  { id: 4, text: '截图疑似经过处理或P图' },
  { id: 5, text: '截图信息不清晰，无法识别' }
]

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

// 计算确定按钮是否可用
const isRejectConfirmDisabled = computed(() => {
  return !rejectReason.value.trim()
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

const getRunningRecordStatusText = (status) => {
  const map = {
    0: '待审核',
    1: '通过',
    2: '不通过',
    3: '申诉中'
  }
  return map[status] || '未知状态'
}

const getRunningRecordStatusClass = (status) => {
  const classMap = {
    0: 'status-pending',
    1: 'status-resolved',
    2: 'status-rejected',
    3: 'status-processing'
  }
  return classMap[status] || ''
}

const formatTime = (time) => {
  if (!time) return '-'
  try {
    const date = time.$date ? new Date(time.$date) : new Date(time)
    // 格式：YYYY-MM-DD HH:mm:ss
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

const formatDate = (time) => {
  if (!time) return '-'
  try {
    const date = time.$date ? new Date(time.$date) : new Date(time)
    return date.toLocaleDateString('zh-CN')
  } catch {
    return time
  }
}

// 选择常见驳回理由
const selectCommonReason = (reason) => {
  const index = selectedReasons.value.indexOf(reason.id)
  if (index === -1) {
    // 添加
    selectedReasons.value.push(reason.id)
    // 如果当前理由已存在于输入框中，不重复添加
    const reasonText = reason.text
    if (!rejectReason.value.includes(reasonText)) {
      rejectReason.value = (rejectReason.value + (rejectReason.value ? '；' : '') + reasonText).trim()
    }
  } else {
    // 移除
    selectedReasons.value.splice(index, 1)
    // 从输入框中移除该理由
    const reasonText = reason.text
    rejectReason.value = rejectReason.value.replace(reasonText, '').replace(/\s+/g, ' ').trim()
  }
}

// 检查某个理由是否被选中
const isReasonSelected = (reasonId) => {
  return selectedReasons.value.includes(reasonId)
}

// 清空驳回弹窗
const clearRejectDialog = () => {
  showRejectDialog.value = false
  rejectReason.value = ''
  selectedReasons.value = []
}

// 图片预览
const openImagePreview = (imageUrl) => {
  previewImage.value = imageUrl
  showImagePreview.value = true
}

const closeImagePreview = () => {
  showImagePreview.value = false
}

// 列表页方法
const loadAppeals = async () => {
  loading.value = true
  console.log('加载申诉列表...')

  try {
    const params = {
      status: statusFilter.value,
      page: pagination.page,
      pageSize: pagination.pageSize
    }

    const data = await getAppealsList(params)
    appeals.value = data.list || []

    // 更新分页信息
    if (data.pagination) {
      Object.assign(pagination, data.pagination)
    }

    console.log('加载申诉列表成功:', appeals.value.length)
  } catch (error) {
    console.error('加载申诉列表失败:', error)
    showError('加载申诉列表失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const viewDetail = async (appeal) => {
  console.log('查看申诉详情:', appeal._id)
  loading.value = true

  try {
    const data = await getAppealDetail(appeal._id)
    appealDetail.value = data
    currentView.value = 'detail'
  } catch (error) {
    console.error('加载申诉详情失败:', error)
    showError('加载申诉详情失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const filterAppeals = () => {
  pagination.page = 1 // 重置到第一页
  loadAppeals()
}

// 每页显示条数改变
const changePageSize = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  loadAppeals()
}

// 详情页方法
const goBackToList = () => {
  currentView.value = 'list'
  appealDetail.value = null
}

// 处理申诉 - 接受
const handleAppealPass = () => {
  // 打开自定义确认弹窗，而不是直接使用 confirm()
  showPassConfirmDialog.value = true
}

// 确认接受申诉
const confirmAppealPass = async () => {
  // 关闭弹窗
  showPassConfirmDialog.value = false

  if (!appealDetail.value || !appealDetail.value._id) {
    showWarning('申诉信息不完整')
    return
  }

  processing.value = true

  try {
    // 接受申诉，审核结果为固定文本"申诉已被接受"
    await processAppeal(appealDetail.value._id, 1, '申诉已被接受')

    // 更新本地数据
    appealDetail.value.status = 1
    appealDetail.value.auditResult = '申诉已被接受'
    appealDetail.value.auditTime = new Date()

    // 更新跑步记录状态 - 改为数字类型
    if (appealDetail.value.runningRecord) {
      appealDetail.value.runningRecord.status = 1 // 改为数字 1，不再是字符串 "1"
      appealDetail.value.runningRecord.audit_reason = "申诉已被接受"
    }

    // 更新列表中的数据
    const index = appeals.value.findIndex(a => a._id === appealDetail.value._id)
    if (index !== -1) {
      appeals.value[index].status = 1
    }

    showSuccess('申诉处理成功！')
  } catch (error) {
    console.error('处理申诉失败:', error)
    showError('处理申诉失败: ' + error.message)
  } finally {
    processing.value = false
  }
}

// 取消接受申诉
const cancelAppealPass = () => {
  showPassConfirmDialog.value = false
}

// 处理申诉 - 驳回
const handleAppealReject = async () => {
  if (!appealDetail.value || !appealDetail.value._id) {
    showWarning('申诉信息不完整')
    return
  }

  // 打开驳回弹窗
  showRejectDialog.value = true
}

// 提交驳回申诉
const submitAppealReject = () => {
  // 输入校验
  if (isRejectConfirmDisabled.value) {
    openMessage('请输入驳回理由')
    return
  }

  // 打开自定义确认弹窗
  openConfirm(
      '确定驳回该申诉吗？驳回后对应的跑步记录将保持"不通过"状态。',
      async () => {
        processing.value = true

        try {
          // 调用云函数处理驳回
          await processAppeal(appealDetail.value._id, 2, rejectReason.value.trim())

          // 更新本地数据
          appealDetail.value.status = 2
          appealDetail.value.auditResult = rejectReason.value.trim()
          appealDetail.value.auditTime = new Date()

          // 更新跑步记录状态
          if (appealDetail.value.runningRecord) {
            appealDetail.value.runningRecord.status = 2
            appealDetail.value.runningRecord.audit_reason = rejectReason.value.trim()
          }

          // 更新列表中的数据
          const index = appeals.value.findIndex(a => a._id === appealDetail.value._id)
          if (index !== -1) {
            appeals.value[index].status = 2
          }

          openMessage('申诉处理成功！')
          clearRejectDialog()
        } catch (error) {
          console.error('处理申诉失败:', error)
          openMessage('处理申诉失败: ' + error.message)
        } finally {
          processing.value = false
        }
      },
      () => {
        // 可选的取消回调（什么都不做）
      },
      '确认驳回' // 弹窗标题
  )
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

// 跳转到第一页
const goToFirstPage = () => {
  pagination.page = 1
  loadAppeals()
}

// 跳转到最后一页
const goToLastPage = () => {
  pagination.page = pagination.totalPages
  loadAppeals()
}

const visiblePages = computed(() => {
  const pages = []
  const total = pagination.totalPages
  const current = pagination.page
  const showPages = 5 // 显示5个页码按钮（包括当前页）

  if (total <= showPages) {
    // 如果总页数小于等于显示页数，显示所有页码
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // 计算起始和结束页码
    let start = Math.max(1, current - Math.floor(showPages / 2))
    let end = start + showPages - 1

    if (end > total) {
      end = total
      start = Math.max(1, end - showPages + 1)
    }

    // 添加第一页和省略号
    if (start > 1) {
      pages.push(1)
      if (start > 2) {
        pages.push('...')
      }
    }

    // 添加中间页码
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    // 添加省略号和最后一页
    if (end < total) {
      if (end < total - 1) {
        pages.push('...')
      }
      pages.push(total)
    }
  }

  return pages
})



// 生命周期
onMounted(() => {
  if (route.params.id) {
    currentView.value = 'detail'
    loadDetail()
  } else {
    loadAppeals()
  }
})

// 从路由参数加载详情
const loadDetail = async () => {
  const appealId = route.params.id
  if (appealId) {
    loading.value = true

    try {
      const data = await getAppealDetail(appealId)
      appealDetail.value = data
    } catch (error) {
      console.error('加载申诉详情失败:', error)
      showError('加载申诉详情失败: ' + error.message)
      goBackToList()
    } finally {
      loading.value = false
    }
  }
}
</script>

<template>
  <div class="appeal-container">
    <!-- 列表视图 -->
    <div v-if="currentView === 'list'" class="appeal-list">
      <!-- 统计 -->
      <div class="stats-info">
        <p>待处理申诉: <strong>{{ appeals.filter(a => a.status === 0).length }}</strong> 条</p>
        <p>总申诉数: <strong>{{ pagination.total }}</strong> 条</p>
      </div>

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
        <div v-if="loading" class="loading">加载中...</div>

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
                <span
                    class="status-badge"
                    :class="getStatusClass(appeal.status)"
                >
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

        <div v-if="!loading && filteredAppeals.length === 0" class="empty-state">
          暂无申诉数据
        </div>
      </div>

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
            第 {{ pagination.page }} 页 / 共 {{ pagination.totalPages }} 页
            (共 {{ pagination.total }} 条)
          </span>
        </div>
      </div>
    </div>

    <!-- 详情视图 -->
    <div v-else class="appeal-detail">
      <div class="header-actions">
        <button @click="goBackToList" class="back-btn">← 返回列表</button>
        <h2 class="page-title">申诉详情</h2>
      </div>

      <div v-if="loading" class="loading">加载中...</div>

      <div v-else-if="appealDetail" class="detail-content">
        <!-- 申诉基本信息 -->
        <div class="info-card">
          <h3>申诉基本信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>学号：</label>
              <span>{{ appealDetail.stu_id }}</span>
            </div>
            <div class="info-item">
              <label>姓名：</label>
              <span>{{ appealDetail.name }}</span>
            </div>
            <div class="info-item">
              <label>申诉时间：</label>
              <span>{{ formatTime(appealDetail.createTime) }}</span>
            </div>
            <div class="info-item">
              <label>状态：</label>
              <span :class="'status-badge ' + getStatusClass(appealDetail.status)">
                {{ getStatusText(appealDetail.status) }}
              </span>
            </div>
            <div v-if="appealDetail.auditResult" class="info-item">
              <label>审核结果：</label>
              <span>{{ appealDetail.auditResult }}</span>
            </div>
            <div v-if="appealDetail.auditTime" class="info-item">
              <label>审核时间：</label>
              <span>{{ formatTime(appealDetail.auditTime) }}</span>
            </div>
            <div v-if="appealDetail.auditor" class="info-item">
              <label>审核人：</label>
              <span>{{ appealDetail.auditor }}</span>
            </div>
          </div>
        </div>

        <!-- 申诉内容 -->
        <div class="content-card">
          <h3>申诉理由</h3>
          <div class="description-box">
            {{ appealDetail.appealReason || '无' }}
          </div>
        </div>

        <!-- 申诉图片 -->
        <div v-if="appealDetail.appealImageUrls && appealDetail.appealImageUrls.length > 0" class="content-card">
          <h3>申诉材料 ({{ appealDetail.appealImageUrls.length }}张)</h3>
          <div class="image-gallery">
            <div v-for="(imageUrl, index) in appealDetail.appealImageUrls" :key="index" class="image-item">
              <img
                  :src="imageUrl"
                  :alt="'申诉图片' + (index + 1)"
                  @click="openImagePreview(imageUrl)"
              >
              <span class="image-label">图片 {{ index + 1 }}</span>
            </div>
          </div>
        </div>

        <!-- 对应的跑步记录 -->
        <div v-if="appealDetail.runningRecord" class="content-card">
          <h3>对应的跑步记录</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>跑步日期：</label>
              <span>{{ appealDetail.runningRecord.running_date || '-' }}</span>
            </div>
            <div class="info-item">
              <label>跑步距离：</label>
              <span>{{ appealDetail.runningRecord.running_distance || '0' }} 公里</span>
            </div>
            <div class="info-item">
              <label>跑步时长：</label>
              <span>{{ appealDetail.runningRecord.running_duration || '-' }}</span>
            </div>
            <div class="info-item">
              <label>跑步配速：</label>
              <span>{{ appealDetail.runningRecord.running_pace || '-' }}</span>
            </div>
            <div class="info-item">
              <label>审核状态：</label>
              <span :class="'status-badge ' + getRunningRecordStatusClass(appealDetail.runningRecord.status)">
                {{ getRunningRecordStatusText(appealDetail.runningRecord.status) }}
              </span>
            </div>
            <div v-if="appealDetail.runningRecord.audit_reason" class="info-item full-width">
              <label>审核结果：</label>
              <span>{{ appealDetail.runningRecord.audit_reason }}</span>
            </div>
          </div>
        </div>

        <div v-if="appealDetail.runningRecordImageUrl" class="content-card">
          <h3>跑步记录截图</h3>
          <div class="image-gallery">
            <div class="image-item">
              <img
                  :src="appealDetail.runningRecordImageUrl"
                  alt="跑步记录截图"
                  @click="openImagePreview(appealDetail.runningRecordImageUrl)"
              >
              <span class="image-label">跑步记录截图</span>
            </div>
          </div>
        </div>

        <!-- 处理申诉 -->
        <div v-if="appealDetail.status === 0" class="action-card">
          <h3>处理申诉</h3>
          <div class="action-buttons">
            <button
                @click="handleAppealPass"
                class="btn-resolved"
                :disabled="processing"
            >
              {{ processing ? '处理中...' : '接受申诉' }}
            </button>
            <button
                @click="handleAppealReject"
                class="btn-rejected"
                :disabled="processing"
            >
              {{ processing ? '处理中...' : '驳回申诉' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 驳回申诉弹窗 -->
  <div v-if="showRejectDialog" class="modal-overlay" @click.self="clearRejectDialog">
    <div class="modal-dialog">
      <div class="modal-header">
        <h3>驳回申诉</h3>
        <button class="modal-close" @click="clearRejectDialog">×</button>
      </div>

      <div class="modal-content">
        <div class="form-group">
          <label>驳回理由：</label>
          <textarea
              v-model="rejectReason"
              placeholder="请输入驳回申诉的理由..."
              rows="4"
              @input="rejectReason = $event.target.value"
          ></textarea>
          <p class="form-hint">请输入详细的驳回理由</p>
        </div>

        <div class="common-reasons">
          <h4>常见驳回理由（可多选）</h4>
          <div class="reason-options">
            <button
                v-for="reason in commonRejectReasons"
                :key="reason.id"
                @click="selectCommonReason(reason)"
                :class="['reason-option', { 'selected': isReasonSelected(reason.id) }]"
            >
              {{ reason.text }}
            </button>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="clearRejectDialog">取消</button>
        <button
            class="btn-confirm"
            @click="submitAppealReject"
            :disabled="isRejectConfirmDisabled"
            :class="{ 'disabled': isRejectConfirmDisabled }"
        >
          确定驳回
        </button>
      </div>
    </div>
  </div>

  <!-- 接受申诉确认弹窗 -->
  <div v-if="showPassConfirmDialog" class="modal-overlay" @click.self="cancelAppealPass">
    <div class="modal-dialog pass-confirm-dialog">
      <div class="modal-header">
        <h3>确认接受申诉</h3>
        <button class="modal-close" @click="cancelAppealPass">×</button>
      </div>

      <div class="modal-content">
        <p class="confirm-message">
          确定接受该申诉吗？接受后对应的跑步记录将变为"通过"状态。
        </p>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="cancelAppealPass">取消</button>
        <button class="btn-confirm" @click="confirmAppealPass">
          确定接受
        </button>
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

  <!-- 通用消息弹窗 -->
  <div v-if="showMessageDialog" class="modal-overlay" @click.self="showMessageDialog = false">
    <div class="modal-dialog message-dialog">
      <div class="modal-header">
        <h3>{{ messageTitle }}</h3>
        <button class="modal-close" @click="showMessageDialog = false">×</button>
      </div>
      <div class="modal-content">
        <p style="text-align: center;">{{ messageContent }}</p>
      </div>
      <div class="modal-footer">
        <button class="btn-confirm" @click="showMessageDialog = false">确定</button>
      </div>
    </div>
  </div>

  <!-- 通用确认弹窗 -->
  <div v-if="showConfirmDialog" class="modal-overlay" @click.self="handleCancelConfirm">
    <div class="modal-dialog confirm-dialog">
      <div class="modal-header">
        <h3>{{ confirmTitle }}</h3>
        <button class="modal-close" @click="handleCancelConfirm">×</button>
      </div>
      <div class="modal-content">
        <p style="text-align: center;">{{ confirmContent }}</p>
      </div>
      <div class="modal-footer">
        <button class="btn-cancel" @click="handleCancelConfirm">取消</button>
        <button class="btn-confirm" @click="handleConfirm">确定</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.appeal-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* 列表样式 */
.page-title {
  font-size: 20px;
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
  font-weight: 500;
}

.filter-group select {
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
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
  font-size: 14px;
  transition: all 0.3s;
}

.refresh-btn:hover:not(:disabled) {
  background: #40a9ff;
}

.refresh-btn:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
}

.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
}

.loading, .empty-state {
  text-align: center;
  padding: 60px;
  color: #999;
  font-size: 16px;
}

.appeal-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.appeal-table th {
  background: #fafafa;
  padding: 16px 12px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e8e8e8;
  white-space: nowrap;
}

.appeal-table td {
  padding: 14px 12px;
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
  border: 1px solid #91d5ff;
  border-radius: 4px;
  font-size: 13px;
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
  color: #1890ff;
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

.stats-info {
  background: white;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  gap: 30px;
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
  margin-left: 4px;
}

/* 详情样式 */
.appeal-detail {
  max-width: 1200px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.back-btn {
  padding: 8px 20px;
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

.info-card, .content-card, .action-card {
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
  align-items: flex-start;
  gap: 8px;
  min-height: 32px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-item label {
  color: #666;
  font-size: 14px;
  min-width: 80px;
  flex-shrink: 0;
}

.info-item span {
  color: #333;
  font-size: 14px;
  word-break: break-all;
}

.description-box {
  color: #555;
  line-height: 1.6;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
  border-left: 3px solid #1890ff;
}

/* 图片样式 */
.image-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.image-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.image-item img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.3s;
  border: 1px solid #f0f0f0;
}

.image-item img:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.image-label {
  font-size: 12px;
  color: #666;
}

/* 处理申诉按钮 */
.action-buttons {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.action-buttons button {
  padding: 12px 32px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.3s;
  min-width: 140px;
}

.action-buttons button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-buttons button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-resolved {
  background: #52c41a;
  color: white;
}

.btn-resolved:hover:not(:disabled) {
  background: #73d13d;
}

.btn-rejected {
  background: #ff4d4f;
  color: white;
}

.btn-rejected:hover:not(:disabled) {
  background: #ff7875;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-dialog {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
  border-bottom: none;
  padding-bottom: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.3s;
}

.modal-close:hover {
  background: #f5f5f5;
  color: #333;
}

.modal-content {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
  transition: border-color 0.3s;
}

.form-group textarea:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.form-hint {
  margin: 8px 0 0 0;
  color: #999;
  font-size: 12px;
}

.common-reasons {
  margin-top: 24px;
}

.common-reasons h4 {
  margin-bottom: 12px;
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.reason-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 10px;
}

.reason-option {
  padding: 10px 12px;
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  text-align: left;
  color: #666;
  transition: all 0.3s;
  line-height: 1.4;
}

.reason-option:hover {
  background: #e6f7ff;
  border-color: #91d5ff;
  color: #1890ff;
}

.reason-option.selected {
  background: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
  font-weight: 500;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #f0f0f0;
}

.modal-footer button {
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 100px;
}

.btn-cancel {
  background: white;
  border: 1px solid #d9d9d9;
  color: #666;
}

.btn-cancel:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.btn-confirm {
  background: #ff4d4f;
  border: 1px solid #ff4d4f;
  color: white;
}

.btn-confirm:hover:not(.disabled) {
  background: #ff7875;
  border-color: #ff7875;
}

.btn-confirm.disabled {
  background: #f5f5f5;
  border-color: #d9d9d9;
  color: #bfbfbf;
  cursor: not-allowed;
}

/* 接受申诉确认弹窗的特殊样式 */
.pass-confirm-dialog {
  max-width: 450px;
}

.confirm-message {
  text-align: center;
  color: #333;
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 20px;
}

/* 修改确认按钮颜色为绿色 */
.pass-confirm-dialog .btn-confirm {
  background: #52c41a;
  border: 1px solid #52c41a;
}

.pass-confirm-dialog .btn-confirm:hover:not(.disabled) {
  background: #73d13d;
  border-color: #73d13d;
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
  right: -8%;
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
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}
</style>