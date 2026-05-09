<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAuditRecordDetail, submitAudit as submitAuditApi, updateAuditResult } from '../../api/staff.js'

const route = useRoute()
const router = useRouter()
const listQueryKeys = ['username', 'studentId', 'date', 'status', 'page', 'pageSize', 'sortOrder']

const currentId = ref('')
const recordIds = ref([])
const currentIndex = ref(0)
const recordDetail = ref(null)
const loading = ref(false)

const toastVisible = ref(false)
const toastText = ref('')
const toastType = ref('')
let toastTimer = null

const auditForm = ref({
  result: '',
  reasons: [],
  remark: ''
})

const rejectReasons = [
  '配速过快',
  '配速过慢',
  '里程不足2km',
  '跑步时间不在活动时间内',
  '跑步截图与活动无关',
  '缺少跑步日期',
  '缺少跑步时间',
  '缺少姓名学号',
  '缺少跑步路线',
  '缺少步数证明',
  '跑步截图与步数截图不对应',
  '步数过低',
  '其他原因'
]

const imageSize = ref('small')
const showConfirm = ref(false)
const confirmType = ref('')
const confirmLoading = ref(false)

function zoomIn() {
  if (imageSize.value === 'small') {
    imageSize.value = 'medium'
  } else if (imageSize.value === 'medium') {
    imageSize.value = 'large'
  }
}

function zoomOut() {
  if (imageSize.value === 'large') {
    imageSize.value = 'medium'
  } else if (imageSize.value === 'medium') {
    imageSize.value = 'small'
  }
}

const previewImage = ref('')
const showImagePreview = ref(false)

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
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const seconds = pad(date.getSeconds())
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

function openImagePreview(url) {
  previewImage.value = url
  showImagePreview.value = true
}

function closeImagePreview() {
  showImagePreview.value = false
}

const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < recordIds.value.length - 1)

const canReject = computed(() => {
  if (recordDetail.value && (recordDetail.value.status === 2 || recordDetail.value.status === 3)) {
    return false
  }
  const hasReasons = auditForm.value.reasons.length > 0
  if (!hasReasons) return false
  if (auditForm.value.reasons.includes('其他原因')) {
    return auditForm.value.remark && auditForm.value.remark.trim() !== ''
  }
  return true
})

const canEdit = computed(() => {
  return recordDetail.value && (recordDetail.value.status === 0 || recordDetail.value.status === 1)
})

function buildReturnListQuery() {
  const query = {}
  for (const key of listQueryKeys) {
    if (typeof route.query[key] === 'string') {
      query[key] = route.query[key]
    }
  }

  if (!query.status) query.status = '0'
  if (!query.page) query.page = '1'
  if (!query.pageSize) query.pageSize = '50'
  if (!query.sortOrder || !['asc', 'desc'].includes(query.sortOrder)) {
    query.sortOrder = 'desc'
  }

  return query
}

function parseRouteParams() {
  const id = route.params.id
  const idsQuery = route.query.ids
  const indexQuery = route.query.index

  if (!id) {
    router.push({
      path: '/staff/audit',
      query: buildReturnListQuery()
    })
    return
  }

  currentId.value = id

  if (idsQuery && typeof idsQuery === 'string') {
    recordIds.value = idsQuery.split(',').filter((value) => value.trim() !== '')
  } else {
    recordIds.value = [id]
  }

  if (indexQuery !== undefined) {
    const idx = parseInt(indexQuery, 10)
    if (!Number.isNaN(idx) && idx >= 0 && idx < recordIds.value.length) {
      currentIndex.value = idx
    } else {
      const foundIdx = recordIds.value.findIndex((value) => value === id)
      currentIndex.value = foundIdx !== -1 ? foundIdx : 0
    }
  } else {
    const foundIdx = recordIds.value.findIndex((value) => value === id)
    currentIndex.value = foundIdx !== -1 ? foundIdx : 0
  }
}

async function loadCurrentRecord() {
  if (recordIds.value.length === 0 || currentIndex.value < 0 || currentIndex.value >= recordIds.value.length) {
    recordDetail.value = null
    return
  }

  const recordId = recordIds.value[currentIndex.value]
  loading.value = true

  try {
    const detail = await getAuditRecordDetail(recordId)
    recordDetail.value = detail
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

function goPrev() {
  if (hasPrev.value) {
    currentIndex.value--
    const newId = recordIds.value[currentIndex.value]
    router.push({
      path: `/staff/audit/${newId}`,
      query: {
        ...buildReturnListQuery(),
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
        ...buildReturnListQuery(),
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
  } finally {
    confirmLoading.value = false
  }
}

async function submitApprove() {
  if (!recordDetail.value) return

  if (recordDetail.value.status === 2 || recordDetail.value.status === 3) {
    showToast('不通过或申诉中的记录不支持修改状态', 'error')
    return
  }

  loading.value = true

  try {
    const auditData = {
      recordId: recordDetail.value._id,
      result: 'approved',
      reasons: [],
      remark: auditForm.value.remark || ''
    }

    if (recordDetail.value.status === 0) {
      await submitAuditApi(auditData)
    } else {
      await updateAuditResult(auditData)
    }

    showToast('已通过', 'success')

    if (recordDetail.value) {
      recordDetail.value.status = 1
      recordDetail.value.reasons = []
      recordDetail.value.remark = auditForm.value.remark || ''
    }

    if (hasNext.value) {
      setTimeout(() => {
        goNext()
      }, 1000)
    } else {
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

async function submitReject() {
  if (!recordDetail.value) return

  if (recordDetail.value.status === 2 || recordDetail.value.status === 3) {
    showToast('不通过或申诉中的记录不支持修改状态', 'error')
    return
  }

  if (auditForm.value.reasons.length === 0) {
    showToast('请至少选择一个不通过原因', 'error')
    return
  }

  loading.value = true

  try {
    const auditData = {
      recordId: recordDetail.value._id,
      result: 'rejected',
      reasons: auditForm.value.reasons,
      remark: auditForm.value.remark || ''
    }

    if (recordDetail.value.status === 0) {
      await submitAuditApi(auditData)
    } else {
      await updateAuditResult(auditData)
    }

    showToast('已拒绝', 'success')

    if (recordDetail.value) {
      recordDetail.value.status = 2
      recordDetail.value.reasons = auditForm.value.reasons
      recordDetail.value.remark = auditForm.value.remark || ''
    }

    if (hasNext.value) {
      setTimeout(() => {
        goNext()
      }, 1000)
    } else {
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

function showToast(message, type = 'success') {
  if (toastTimer) clearTimeout(toastTimer)
  toastText.value = message
  toastType.value = type
  toastVisible.value = true
  toastTimer = setTimeout(() => {
    toastVisible.value = false
  }, 3000)
}

function goBack() {
  router.push({
    path: '/staff/audit',
    query: buildReturnListQuery()
  })
}

watch(
  () => [route.params.id, route.query.ids, route.query.index],
  () => {
    parseRouteParams()
    loadCurrentRecord()
  },
  { immediate: true }
)
</script>

<template>
  <div class="audit-detail-page">
    <div v-if="loading && !recordDetail" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="recordDetail" class="detail-layout">
      <div class="left-col">
        <div class="left-col-header">
          <button @click="goBack" class="back-btn">< 返回</button>
          <h3>跑步截图</h3>
          <div class="image-size-controls">
            <button @click="zoomOut" :disabled="imageSize === 'small'" class="size-btn">缩小</button>
            <button @click="zoomIn" :disabled="imageSize === 'large'" class="size-btn">放大</button>
          </div>
        </div>

        <div class="mode-info">{{ recordDetail.mode }}</div>

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

      <div class="right-col">
        <div class="student-info">
          <div class="student-name">{{ recordDetail.username }}</div>
          <div class="student-meta">
            {{ recordDetail.studentId || '-' }}
          </div>
        </div>

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

        <div class="reasons-section">
          <h4>不通过原因（可多选）</h4>
          <div class="reasons-list">
            <label
              v-for="reason in rejectReasons"
              :key="reason"
              :class="['option-btn', { active: auditForm.reasons.includes(reason), disabled: !canEdit }]"
            >
              <input
                type="checkbox"
                :value="reason"
                v-model="auditForm.reasons"
                :disabled="!canEdit"
                hidden
              />
              <span>{{ reason }}</span>
            </label>
          </div>
        </div>

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

        <div class="action-buttons">
          <button @click="openConfirm('reject')" class="reject-btn" :disabled="loading || !canEdit || !canReject">
            {{ loading ? '处理中...' : '不通过' }}
          </button>
          <button
            @click="openConfirm('approve')"
            class="approve-btn"
            :disabled="loading || !canEdit || (recordDetail.status === 1)"
          >
            {{ loading ? '处理中...' : '通过' }}
          </button>
        </div>

        <div class="nav-buttons">
          <button @click="goPrev" :disabled="!hasPrev || loading" class="nav-btn prev-btn">< 上一条</button>
          <p>{{ currentIndex + 1 }} / {{ recordIds.length }}</p>
          <button @click="goNext" :disabled="!hasNext || loading" class="nav-btn next-btn">下一条></button>
        </div>

        <div v-if="recordDetail && (recordDetail.status === 2 || recordDetail.status === 3)" class="status-warning">
          当前记录状态为{{ getStatusText(recordDetail.status) }}，不支持修改
        </div>
      </div>
    </div>

    <div v-else-if="!loading && !recordDetail" class="empty-state">
      未找到记录
    </div>

    <div v-if="showImagePreview" class="image-preview-overlay" @click="closeImagePreview">
      <div class="image-preview-container" @click.stop>
        <button class="image-preview-close" @click="closeImagePreview">×</button>
        <img :src="previewImage" alt="预览图片" class="preview-image" />
      </div>
    </div>
  </div>

  <transition name="fade">
    <div v-if="toastVisible" class="toast-message" :class="toastType">
      {{ toastText }}
    </div>
  </transition>

  <div v-if="showConfirm" class="confirm-dialog-overlay" @click.self="showConfirm = false">
    <div class="confirm-dialog">
      <p>确定要将此记录判为{{ confirmType === 'approve' ? '通过' : '不通过' }}吗？</p>
      <div class="confirm-actions">
        <button @click="showConfirm = false" :disabled="confirmLoading">取消</button>
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

.back-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.back-btn:hover {
  background: #f5f5f5;
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
  justify-content: space-between;
  margin-bottom: 0;
  position: relative;
}

.left-col-header h3 {
  margin: 0;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
}

.left-col h3 {
  margin-top: 0;
  margin-bottom: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.mode-info {
  font-size: 16px;
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
  font-size: 16px;
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
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  background: #fafafa;
  border-radius: 8px;
  padding: 4px;
  transition: all 0.3s ease;
  width: 100%;
}

.screenshot-container img {
  max-width: 100%;
  height: auto;
  object-fit: contain;
  cursor: pointer;
  border-radius: 4px;
  transition: max-height 0.3s ease;
}

.screenshot-container.size-small img {
  max-height: 75vh;
}

.screenshot-container.size-medium img {
  max-height: 100vh;
}

.screenshot-container.size-large img {
  max-height: 120vh;
}

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

.single-image-layout .screenshot-container {
  width: 100%;
}

.info-item {
  display: flex;
  margin-bottom: 12px;
  font-size: 16px;
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

.student-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  margin-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
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
  padding: 2px 4px;
  border-radius: 12px;
  font-size: 14px;
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

.reasons-section h4,
.remark-section h4 {
  font-weight: 500;
  margin: 10px auto;
}

.status-warning {
  background: #fff3cd;
  border: 1px solid #ffeeba;
  color: #856404;
  padding: 12px 20px;
  border-radius: 8px;
  margin: 14px 0;
  font-size: 16px;
}

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
  font-size: 16px;
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
  font-size: 16px;
  margin-left: 8px;
  font-weight: normal;
}

.remark-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
  margin-bottom: 10px;
}

.remark-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

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

.approve-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #a8d5ba;
}

.reject-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f4b0b0;
}

.nav-buttons {
  display: flex;
  gap: 12px;
  width: 100%;
}

.nav-buttons p {
  margin: 0;
  line-height: 1;
  display: flex;
  align-items: center;
  color: #666;
  font-size: 16px;
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

.nav-buttons .nav-btn:not(:disabled) {
  background: #667eea;
}

.nav-buttons .nav-btn:not(:disabled):hover {
  background: #5a6fe0;
}

.nav-buttons .nav-btn:disabled {
  background: #a0b0cc;
  opacity: 0.6;
  cursor: not-allowed;
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

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

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
  font-size: 16px;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  color: white;
}

.toast-message.error {
  background: #ff4d4f;
}

.toast-message.success {
  background: #52c41a;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
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
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
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
  font-size: 16px;
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
    font-size: 16px;
  }
}
</style>
