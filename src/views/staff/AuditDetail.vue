<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAuditRecordDetail, submitAudit as submitAuditApi, updateAuditResult, getCurrentStaff } from '../../api/staff.js'

const route = useRoute()
const router = useRouter()

// 当前工作人员
const currentStaff = ref(null)

// 记录ID列表和当前索引
const currentId = ref('')
const recordIds = ref([])
const currentIndex = ref(0)

// 当前记录详情
const recordDetail = ref(null)
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const toastVisible = ref(false)
const toastText = ref('')
const toastType = ref('') // 'error' 或 'success'
let toastTimer = null

// 审核表单
const auditForm = ref({
  result: '',
  reasons: [],
  remark: ''
})

// 预设拒绝原因
const rejectReasons = [
  '配速异常',
  '距离不足',
  '时间不符合要求',
  '截图不清晰',
  '截图信息不完整',
  '其他原因'
]

const imageSize = ref('small') // 可选值: 'small', 'medium', 'large'

const showConfirm = ref(false)
const confirmType = ref('') // 'approve' 或 'reject'
const confirmLoading = ref(false)

// 放大：小→中，中→大，大不变（按钮禁用）
function zoomIn() {
  if (imageSize.value === 'small') {
    imageSize.value = 'medium'
  } else if (imageSize.value === 'medium') {
    imageSize.value = 'large'
  }
  // 已经是 large 时不操作
}

// 缩小：大→中，中→小，小不变（按钮禁用）
function zoomOut() {
  if (imageSize.value === 'large') {
    imageSize.value = 'medium'
  } else if (imageSize.value === 'medium') {
    imageSize.value = 'small'
  }
  // 已经是 small 时不操作
}


// 图片预览
const previewImage = ref('')
const showImagePreview = ref(false)

// 状态映射函数
function getStatusText(status) {
  const map = { 0: '待审核', 1: '已通过', 2: '不通过', 3: '申诉中' }
  return map[status] || status
}

function getStatusClass(status) {
  const map = { 0: 'status-pending', 1: 'status-approved', 2: 'status-rejected', 3: 'status-appeal' }
  return map[status] || ''
}

// 格式化日期时间函数
function formatDateTime(value) {
  if (!value) return ''

  // 处理云开发返回的日期对象格式 { $date: "2026-02-12T12:36:33.376Z" }
  const date = value.$date ? new Date(value.$date) : new Date(value)

  if (Number.isNaN(date.getTime())) return String(value)

  const pad = (num) => String(num).padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const seconds = pad(date.getSeconds())

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 图片预览方法
function openImagePreview(url) {
  previewImage.value = url
  showImagePreview.value = true
}

function closeImagePreview() {
  showImagePreview.value = false
}

// 计算属性：是否还有上一条/下一条
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < recordIds.value.length - 1)

// 计算属性：不通过按钮是否可点击
const canReject = computed(() => {
  if (recordDetail.value && (recordDetail.value.status === 2 || recordDetail.value.status === 3)) {
    return false
  }
  const hasReasons = auditForm.value.reasons.length > 0
  if (!hasReasons) return false
  // 如果包含“其他原因”，必须填写备注
  if (auditForm.value.reasons.includes('其他原因')) {
    return auditForm.value.remark && auditForm.value.remark.trim() !== ''
  }
  return true
})

// 计算属性：是否允许修改（状态为待审核或已通过时才允许修改）
const canEdit = computed(() => {
  return recordDetail.value && (recordDetail.value.status === 0 || recordDetail.value.status === 1)
})

// 解析路由参数
function parseRouteParams() {
  const id = route.params.id
  const idsQuery = route.query.ids
  const indexQuery = route.query.index

  if (!id) {
    // 如果没有 id，可能路由错误，可跳转回列表页
    router.push('/staff/audit')
    return
  }

  currentId.value = id

  // 解析 ID 列表
  if (idsQuery && typeof idsQuery === 'string') {
    recordIds.value = idsQuery.split(',').filter(id => id.trim() !== '')
  } else {
    // 如果没有 ids 参数，则列表只有当前 ID
    recordIds.value = [id]
  }

  // 确定当前索引
  if (indexQuery !== undefined) {
    const idx = parseInt(indexQuery, 10)
    if (!isNaN(idx) && idx >= 0 && idx < recordIds.value.length) {
      currentIndex.value = idx
    } else {
      // 索引无效，根据当前 ID 查找
      const foundIdx = recordIds.value.findIndex(i => i === id)
      currentIndex.value = foundIdx !== -1 ? foundIdx : 0
    }
  } else {
    // 没有索引，根据当前 ID 查找
    const foundIdx = recordIds.value.findIndex(i => i === id)
    currentIndex.value = foundIdx !== -1 ? foundIdx : 0
  }
}

// 根据当前索引加载记录详情
async function loadCurrentRecord() {
  if (recordIds.value.length === 0 || currentIndex.value < 0 || currentIndex.value >= recordIds.value.length) {
    recordDetail.value = null
    return
  }

  const recordId = recordIds.value[currentIndex.value]
  loading.value = true
  errorMsg.value = ''

  try {
    const detail = await getAuditRecordDetail(recordId)
    recordDetail.value = detail

    // 初始化表单为当前记录的状态
    auditForm.value = {
      result: '',
      reasons: [],
      remark: detail.remark || ''
    }
  } catch (err) {
    console.error('加载记录详情失败:', err)
    showToast(err.message || '加载记录详情失败', 'error')
    recordDetail.value = null
  } finally {
    loading.value = false
  }
}

// 上下条切换
function goPrev() {
  if (hasPrev.value) {
    currentIndex.value--
    const newId = recordIds.value[currentIndex.value]
    router.push({
      path: `/staff/audit/${newId}`,
      query: {
        ids: recordIds.value.join(','),
        index: currentIndex.value
      }
    })
  }
}

function goNext() {
  if (hasNext.value) {
    currentIndex.value++
    const newId = recordIds.value[currentIndex.value]
    router.push({
      path: `/staff/audit/${newId}`,
      query: {
        ids: recordIds.value.join(','),
        index: currentIndex.value
      }
    })
  }
}

function openConfirm(type) {
  if (type === 'reject' && !canReject.value) {
    showToast('请选择不通过原因', 'error')
    return
  }
  if (type === 'approve' && !canEdit.value) {
    showToast('当前记录不支持修改', 'error')
    return
  }
  confirmType.value = type
  showConfirm.value = true
}

async function handleConfirm() {
  confirmLoading.value = true
  try {
    if (confirmType.value === 'approve') {
      await submitApprove()
    } else {
      await submitReject()
    }
    showConfirm.value = false
  } catch (err) {
    // 错误已在对应函数中处理为 Toast
  } finally {
    confirmLoading.value = false
  }
}

// 提交通过审核
async function submitApprove() {
  if (!recordDetail.value) return

  // 状态为不通过或申诉中时，不允许操作
  if (recordDetail.value.status === 2 || recordDetail.value.status === 3) {
    showToast('不通过或申诉中的记录不支持修改状态', 'error')
    return
  }

  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    const auditData = {
      recordId: recordDetail.value._id,
      result: 'approved',
      reasons: [],
      remark: auditForm.value.remark || ''
    }

    let result
    if (recordDetail.value.status === 0) {
      // 待审核记录，调用 submitAudit（会更新统计）
      result = await submitAuditApi(auditData)
    } else {
      // 已审核记录，调用 updateAuditResult（只改状态，不更新统计）
      result = await updateAuditResult(auditData)
    }

    showToast('已通过', 'success')

    // 更新本地记录的状态
    if (recordDetail.value) {
      recordDetail.value.status = 1
      recordDetail.value.reasons = []
      recordDetail.value.remark = auditForm.value.remark || ''
    }

    // 如果有下一条，自动跳转
    if (hasNext.value) {
      setTimeout(() => {
        goNext()
        successMsg.value = '' // 清除提示，避免累积
      }, 1000)
    } else {
      // 没有下一条，停留并显示完成提示
      setTimeout(() => {
        showToast('所有记录审核完成', 'success')
      }, 1000)
    }
  } catch (err) {
    console.error('提交通过失败:', err)
    showToast(err.message || '提交通过失败', 'error')
  } finally {
    loading.value = false
  }
}

// 提交不通过审核（带确认弹窗）
async function submitReject() {
  if (!recordDetail.value) return

  // 状态为不通过或申诉中时，不允许操作
  if (recordDetail.value.status === 2 || recordDetail.value.status === 3) {
    showToast('不通过或申诉中的记录不支持修改状态', 'error')
    return
  }

  if (auditForm.value.reasons.length === 0) {
    showToast('请至少选择一个不通过原因', 'error')
    return
  }

  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    const auditData = {
      recordId: recordDetail.value._id,
      result: 'rejected',
      reasons: auditForm.value.reasons,
      remark: auditForm.value.remark || ''
    }

    let result
    if (recordDetail.value.status === 0) {
      // 待审核记录，调用 submitAudit（会更新统计）
      result = await submitAuditApi(auditData)
    } else {
      // 已审核记录，调用 updateAuditResult（只改状态，不更新统计）
      result = await updateAuditResult(auditData)
    }

    showToast('已拒绝', 'success')

    // 更新本地记录的状态
    if (recordDetail.value) {
      recordDetail.value.status = 2
      recordDetail.value.reasons = auditForm.value.reasons
      recordDetail.value.remark = auditForm.value.remark || ''
    }

    // 如果有下一条，自动跳转
    if (hasNext.value) {
      setTimeout(() => {
        goNext()
        successMsg.value = '' // 清除提示，避免累积
      }, 1000)
    } else {
      // 没有下一条，停留并显示完成提示
      setTimeout(() => {
        showToast('所有记录审核完成', 'success')
      }, 1000)
    }
  } catch (err) {
    console.error('提交不通过失败:', err)
    showToast(err.message || '提交不通过失败', 'error')
  } finally {
    loading.value = false
  }
}

// 显示 Toast 的方法
function showToast(message, type = 'success') {
  if (toastTimer) clearTimeout(toastTimer)
  toastText.value = message
  toastType.value = type
  toastVisible.value = true
  toastTimer = setTimeout(() => {
    toastVisible.value = false
  }, 3000)
}

// 返回列表页
function goBack() {
  router.push('/staff/audit')
}

// 监听路由参数变化
watch(
  () => [route.params.id, route.query.ids, route.query.index],
  () => {
    parseRouteParams()
    loadCurrentRecord()
  },
  { immediate: true }
)

onMounted(() => {
  currentStaff.value = getCurrentStaff()
  if (!currentStaff.value) {
    showToast('未获取到工作人员信息，请重新登录', 'error')
    // 可跳转到登录页
  }
})
</script>

<template>
  <div class="audit-detail-page">
    <!-- 两栏内容 -->
    <div v-if="loading && !recordDetail" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="recordDetail" class="detail-layout">
      <!-- 左侧：截图 -->
      <div class="left-col">
        <div class="left-col-header">
          <button @click="goBack" class="back-btn"> < 返回 </button>
          <h3>跑步截图</h3>
          <div class="image-size-controls">
            <button @click="zoomOut" :disabled="imageSize === 'small'" class="size-btn">🔍 缩小</button>
            <button @click="zoomIn" :disabled="imageSize === 'large'" class="size-btn">🔍 放大</button>
          </div>
        </div>
      
        <div class="mode-info">{{ recordDetail.mode }}</div>

        <!-- 根据 mode 显示不同布局 -->
        <div v-if="recordDetail.mode === '在任意场地跑，提供步数截图'" class="dual-image-layout">
          <div :class="['screenshot-container', `size-${imageSize}`]">
            <img :src="recordDetail.screenshot" alt="跑步截图" @click="openImagePreview(recordDetail.screenshot)" />
          </div>
          <div :class="['screenshot-container', `size-${imageSize}`]">
            <img :src="recordDetail.stepImageFileID" alt="步数截图" @click="openImagePreview(recordDetail.stepImageFileID)" />
          </div>
        </div>
        <div v-else class="single-image-layout">
          <div :class="['screenshot-container', `size-${imageSize}`]">
            <img :src="recordDetail.screenshot" alt="跑步截图" @click="openImagePreview(recordDetail.screenshot)" />
          </div>
        </div>
      </div>

      <!-- 右侧：审核裁决 -->
      <div class="right-col">
        <!-- 1. 绑定学生信息 -->
        
        <div class="student-info">
          <div class="student-name">{{ recordDetail.username }}</div>
          <div class="student-meta">
            {{ recordDetail.studentId || '—' }}
          </div>
        </div>

        <!-- 3. 当前状态（包含审核结果） -->
        <div class="info-block">
          <h3>当前状态</h3>
          <div class="info-item">
            <span class="label">审核状态：</span>
            <span :class="['status-badge', getStatusClass(recordDetail.status)]">
              {{ getStatusText(recordDetail.status) }}
            </span>
          </div>
          <div v-if="recordDetail.auditReason" class="info-item">
            <span class="label">审核原因：</span>
            <span class="value">{{ recordDetail.auditReason }}</span>
          </div>
          <div v-if="recordDetail.auditTime" class="info-item">
            <span class="label">审核时间：</span>
            <span class="value">{{ formatDateTime(recordDetail.auditTime) }}</span>
          </div>
        </div>



        <h3>审核裁决</h3>

        <!-- 拒绝原因（多选按钮样式） -->
        <div class="reasons-section">
          <h4>不通过原因（可多选）</h4>
          <div class="reasons-list">
            <label v-for="reason in rejectReasons" :key="reason"
                   :class="['option-btn', { active: auditForm.reasons.includes(reason), disabled: !canEdit }]">
              <input type="checkbox" :value="reason"
                     v-model="auditForm.reasons"
                     :disabled="!canEdit"
                     hidden />
              <span>{{ reason }}</span>
            </label>
          </div>
        </div>

        <!-- 备注 -->
        <div class="remark-section">
            <h4>
              备注
              <span v-if="auditForm.reasons.includes('其他原因') && !auditForm.remark" class="required-tip">
                请输入原因
              </span>
            </h4>
          <textarea
            v-model="auditForm.remark"
            placeholder="请输入备注信息..."
            rows="4"
            class="remark-input"
            :disabled="!canEdit"
          ></textarea>
        </div>

        <!-- 通过/不通过 按钮 -->
        <div class="action-buttons">
          <button @click="openConfirm('reject')" class="reject-btn"
                  :disabled="loading || !canEdit || !canReject">
            {{ loading ? '处理中...' : '不通过' }}
          </button>
          <button @click="openConfirm('approve')" class="approve-btn"
                  :disabled="loading || !canEdit || (recordDetail.status === 1)">
            {{ loading ? '处理中...' : '通过' }}
          </button>
        </div>

        <!-- 下排导航按钮 -->
        <div class="nav-buttons">
          <button @click="goPrev" :disabled="!hasPrev || loading" class="nav-btn prev-btn">< 上一条</button>
          <p> {{ currentIndex + 1 }} / {{ recordIds.length }} </p>
          <button @click="goNext" :disabled="!hasNext || loading" class="nav-btn next-btn">下一条 ></button>
        </div>

        <!-- 状态提示：当记录为不通过或申诉中时 -->
        <div v-if="recordDetail && (recordDetail.status === 2 || recordDetail.status === 3)" class="status-warning">
          ⚠️ 当前记录状态为{{ getStatusText(recordDetail.status) }}，不支持修改
        </div>

      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!loading && !recordDetail" class="empty-state">
      未找到记录
    </div>

    <!-- 图片预览弹窗 -->
    <div v-if="showImagePreview" class="image-preview-overlay" @click="closeImagePreview">
      <div class="image-preview-container" @click.stop>
        <button class="image-preview-close" @click="closeImagePreview">×</button>
        <img :src="previewImage" alt="预览图片" class="preview-image">
      </div>
    </div>
  </div>

  <!-- 浮动消息提示 -->
  <transition name="fade">
    <div v-if="toastVisible" class="toast-message" :class="toastType">
      {{ toastText }}
    </div>
  </transition>

  <!-- 自定义确认对话框 -->
  <div v-if="showConfirm" class="confirm-dialog-overlay" @click.self="showConfirm=false">
    <div class="confirm-dialog">
      <p>确定要将此记录判为{{ confirmType === 'approve' ? '通过' : '不通过' }}吗？</p>
      <div class="confirm-actions">
        <button @click="showConfirm=false" :disabled="confirmLoading">取消</button>
        <button @click="handleConfirm" :disabled="confirmLoading">确定</button>
      </div>
    </div>
  </div>

</template>

<style scoped>
.audit-detail-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0;
}

.detail-header {
  display: flex;
  align-items: center;
  padding-bottom: 10px;
}

.detail-header h2 {
  margin: 0 0 0 20px;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.back-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.back-btn:hover {
  background: #f5f5f5;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.nav-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.detail-layout {
  display: flex;
  gap: 24px;
  min-height: 700px;
}

.left-col,
.right-col {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.left-col {
  flex: 1.2;
  display: block;
  flex-direction: column;
}

.right-col {
  flex: 1;
}

.left-col-header {
  display: flex;
  align-items: center;
  justify-content: space-between; /* 左右分布，标题居中靠 flex 自然居中 */
  margin-bottom: 0;
  position: relative; /* 可选，为绝对定位标题做准备 */
}

.left-col-header h3 {
  margin: 0;
  position: absolute; /* 使用绝对定位使标题严格居中 */
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap; /* 防止换行 */
}

.left-col h3{
  margin-top: 0;
  margin-bottom: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.mode-info {
  font-size: 14px;
  color: #999;
  margin-bottom: 0;
  text-align: center;
  padding: 0 4px;
  word-break: break-word;
}

.right-col h3 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

/* 图片尺寸控制按钮组 */
.image-size-controls {
  display: flex;
  gap: 8px;
}

.size-btn {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.size-btn:hover:not(:disabled) {
  background: #f0f0f0;
}

.size-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f5f5f5;
}

.screenshot-container {
  /* 移除 flex: 1 */
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  background: #fafafa;
  border-radius: 8px;
  padding: 4px;
  transition: all 0.3s ease;
  width: 100%;               /* 确保容器宽度占满 */
}

.screenshot-container img {
  max-width: 100%;
  height: auto;              /* 高度自适应，保持宽高比 */
  object-fit: contain;
  cursor: pointer;
  border-radius: 4px;
  transition: max-height 0.3s ease;
}

/* 定义三个尺寸 */
.screenshot-container.size-small img {
  max-height: 75vh;
}

.screenshot-container.size-medium img {
  max-height: 100vh;
}

.screenshot-container.size-large img {
  max-height: 120vh;
}

/* 双图布局 */
.dual-image-layout {
  display: flex;
  gap: 12px;
  width: 100%;
}

.dual-image-layout .screenshot-container {
  flex: 1;
  width: 50%;
  max-width: 50%;
}

/* 单图布局 */
.single-image-layout .screenshot-container {
  width: 100%;
}

.info-item {
  display: flex;
  margin-bottom: 12px;
  font-size: 15px;
  line-height: 1.5;
}

.info-item .label {
  width: 90px;
  color: #666;
  font-weight: 500;
}

.info-item .value {
  color: #333;
  flex: 1;
}

/* 绑定学生信息卡片样式 */
.student-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  margin-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.student-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  background: #f0f0f0; /* 背景色，当图片加载失败时显示 */
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-text {
  color: white;
  font-size: 24px;
  font-weight: 500;
  text-transform: uppercase;
  background: #667eea; /* 主题色 */
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-text {
  color: white;
  font-size: 24px;
  font-weight: 500;
  text-transform: uppercase;
}

.student-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.student-name {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  line-height: 1.3;
}

.student-meta {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  line-height: 1.3;
}

.status-badge {
  display: inline-block;
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

/* 中间列区块分割 */
.info-block {
  margin-bottom: 10px;
  padding-bottom: 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-block:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.block-header h3 {
  margin: 0;
  padding: 0;
}

.ocr-badge {
  font-size: 12px;
  color: #116f7c;
  background: #cbecff;
  padding: 2px 8px;
  border-radius: 12px;
  margin-bottom: 12px;
}

/* 带状态的值 */
.value-with-status {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.value-with-status .value {
  font-weight: 500;
  margin-bottom: 4px;
}

.value-with-status .status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: normal;
  width: fit-content;
}

.value-with-status .status-badge.success {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.value-with-status .status-badge.fail {
  background: #fff1f0;
  color: #f5222d;
  border: 1px solid #ffa39e;
}

.value-with-status .status-badge.unknown {
  background: #f5f5f5;
  color: #999;
  border: 1px solid #d9d9d9;
}

.info-item {
  display: flex;
  margin-bottom: 12px;
  font-size: 14px;
  line-height: 1.5;
}

.info-item .label {
  width: 90px;
  color: #666;
  font-weight: 500;
  flex-shrink: 0;
}

.info-item .value {
  color: #333;
  flex: 1;
}


.reasons-section h4,
.remark-section h4 {
  font-weight: 500;
  margin: 10px auto;
}

/* 状态警告提示 */
.status-warning {
  background: #fff3cd;
  border: 1px solid #ffeeba;
  color: #856404;
  padding: 12px 20px;
  border-radius: 8px;
  margin: 14px 0;
  font-size: 14px;
}

/* 按钮样式 */
.reasons-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.option-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 20px;
  background: white;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.option-btn.active {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

.option-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f5f5f5;
}

.option-btn input {
  display: none;
}

.required-tip {
  color: red;
  font-size: 12px;
  margin-left: 8px;
  font-weight: normal;
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
  margin-bottom: 10px;
}

.remark-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.approve-btn,
.reject-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.approve-btn {
  background: #28a745;
  color: white;
}

.approve-btn:hover:not(:disabled) {
  background: #218838;
}

.reject-btn {
  background: #dc3545;
  color: white;
}

.reject-btn:hover:not(:disabled) {
  background: #c82333;
}

/* 禁用状态的通过按钮 */
.approve-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #a8d5ba;  /* 绿灰色 */
}

/* 禁用状态的不通过按钮 */
.reject-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f4b0b0;  /* 红灰色 */
}

/* 下排导航按钮 */
.nav-buttons {
  display: flex;
  gap: 12px;
  width: 100%;
}

.nav-buttons p {
  margin: 0;                /* 移除默认上下边距 */
  line-height: 1;           /* 防止多余行高影响高度 */
  display: flex;
  align-items: center;      /* 文本垂直居中 */
  color: #666;              /* 保持与现有文字颜色一致（可选） */
  font-size: 14px;          /* 可根据需要调整字号 */
}

.nav-buttons .nav-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

/* 可点击状态 - 蓝色背景 */
.nav-buttons .nav-btn:not(:disabled) {
  background: #667eea;  /* 蓝色背景 */
}

/* 可点击状态悬停效果 */
.nav-buttons .nav-btn:not(:disabled):hover {
  background: #5a6fe0;  /* 深一点的蓝色 */
}

.nav-buttons .nav-btn:disabled {
  background: #a0b0cc;  /* 蓝灰色背景 */
  opacity: 0.6;
  cursor: not-allowed;
}

.message-banner {
  padding: 12px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
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
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
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
  top: -30px;
  right: -30px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 30px;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 8px;
}

.toast-message {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  color: white;
}
.toast-message.error { background: #ff4d4f; }
.toast-message.success { background: #52c41a; }

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.confirm-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.confirm-dialog {
  background: white;
  padding: 24px;
  border-radius: 12px;
  min-width: 320px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}

.confirm-dialog p {
  margin: 0 0 20px;
  font-size: 16px;
  color: #333;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.confirm-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.confirm-actions button:first-child {
  background: #f0f0f0;
  color: #666;
}

.confirm-actions button:last-child {
  background: #667eea;
  color: white;
}

.confirm-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .detail-layout {
    flex-direction: column;
  }

  .left-col,
  .right-col {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .left-col-header h3 {
    font-size: 16px;
  }
  .size-btn {
    padding: 2px 4px;
    font-size: 12px;
  }
}
</style>