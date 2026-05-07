<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAppealDetail, processAppeal } from '@/api/staff'
import { showSuccess, showError, showWarning } from '@/utils/toast'

const route = useRoute()
const router = useRouter()

// 状态
const appealDetail = ref(null)
const loading = ref(false)
const processing = ref(false)

// 弹窗状态
const showPassConfirmDialog = ref(false)
const rejectReason = ref('')
const selectedReasons = ref([])

// 图片预览
const previewImage = ref('')
const showImagePreview = ref(false)

// 常见驳回理由选项
const commonRejectReasons = [
  { id: 1, text: '未上传截图' },
  { id: 2, text: '截图不完整' },
  { id: 3, text: '截图有误' },
  { id: 4, text: '截图疑似经过处理或P图' },
  { id: 5, text: '截图信息不清晰，无法识别' },
  { id: 6, text: '其他理由' }   // 新增
]

// 新增状态
const remark = ref('')
const showRejectConfirmDialog = ref(false)

// 记录ID列表和当前索引（用于上下条导航）
const recordIds = ref([])
const currentIndex = ref(0)

// 解析路由参数，从 query 中获取 ids 和 index
function parseRouteParams() {
  const id = route.params.id
  const idsQuery = route.query.ids
  const indexQuery = route.query.index

  if (!id) {
    router.push('/staff/appeal')
    return
  }

  // 解析 ID 列表
  if (idsQuery && typeof idsQuery === 'string') {
    recordIds.value = idsQuery.split(',').filter(id => id.trim() !== '')
  } else {
    recordIds.value = [id]
  }

  // 确定当前索引
  if (indexQuery !== undefined) {
    const idx = parseInt(indexQuery, 10)
    if (!isNaN(idx) && idx >= 0 && idx < recordIds.value.length) {
      currentIndex.value = idx
    } else {
      const foundIdx = recordIds.value.findIndex(i => i === id)
      currentIndex.value = foundIdx !== -1 ? foundIdx : 0
    }
  } else {
    const foundIdx = recordIds.value.findIndex(i => i === id)
    currentIndex.value = foundIdx !== -1 ? foundIdx : 0
  }
}

// 计算属性：是否有上一条/下一条
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < recordIds.value.length - 1)


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

// 选择常见驳回理由
const selectCommonReason = (reason) => {
  const index = selectedReasons.value.indexOf(reason.id)
  if (index === -1) {
    selectedReasons.value.push(reason.id)
    const reasonText = reason.text
    if (!rejectReason.value.includes(reasonText)) {
      rejectReason.value = (rejectReason.value + (rejectReason.value ? '；' : '') + reasonText).trim()
    }
  } else {
    selectedReasons.value.splice(index, 1)
    const reasonText = reason.text
    rejectReason.value = rejectReason.value.replace(reasonText, '').replace(/\s+/g, ' ').trim()
  }
}

const isReasonSelected = (reasonId) => {
  return selectedReasons.value.includes(reasonId)
}

// 图片预览
const openImagePreview = (imageUrl) => {
  previewImage.value = imageUrl
  showImagePreview.value = true
}

const closeImagePreview = () => {
  showImagePreview.value = false
}

// 返回列表
const goBackToList = () => {
  router.push('/staff/appeal')
}

// 加载详情
const loadDetail = async () => {
  const appealId = route.params.id
  if (!appealId) {
    showError('申诉ID不存在')
    goBackToList()
    return
  }

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


// 翻页函数
function goPrev() {
  if (hasPrev.value) {
    currentIndex.value--
    const newId = recordIds.value[currentIndex.value]
    router.push({
      path: `/staff/appeal/${newId}`,
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
      path: `/staff/appeal/${newId}`,
      query: {
        ids: recordIds.value.join(','),
        index: currentIndex.value
      }
    })
  }
}

// 监听路由参数变化
watch(
  () => [route.params.id, route.query.ids, route.query.index],
  () => {
    parseRouteParams()
    loadDetail()
  },
  { immediate: true }
)

// 清空选择
const clearRejectDialog = () => {
  selectedReasons.value = []
  remark.value = ''
}

// 打开驳回确认
const openRejectConfirm = () => {
  if (selectedReasons.value.length === 0) {
    showWarning('请至少选择一个驳回理由')
    return
  }
  const hasOther = selectedReasons.value.includes(6)
  if (hasOther && !remark.value.trim()) {
    showWarning('请填写其他理由的详细内容')
    return
  }
  showRejectConfirmDialog.value = true
}

// 确认驳回
const confirmReject = async () => {
  showRejectConfirmDialog.value = false
  // 合并理由：选中的理由文本 + 备注
  const selectedReasonTexts = selectedReasons.value
    .map(id => commonRejectReasons.find(r => r.id === id)?.text)
    .filter(t => t)
    .join('；')
  const finalReason = selectedReasonTexts + (remark.value ? `；${remark.value}` : '')

  processing.value = true
  try {
    await processAppeal(appealDetail.value._id, 2, finalReason)

    // 更新本地数据
    appealDetail.value.status = 2
    appealDetail.value.auditResult = finalReason
    appealDetail.value.auditTime = new Date()
    if (appealDetail.value.runningRecord) {
      appealDetail.value.runningRecord.status = 2
      appealDetail.value.runningRecord.audit_reason = finalReason
    }

    showSuccess('申诉处理成功！')
    clearRejectDialog()
  } catch (error) {
    console.error('处理申诉失败:', error)
    showError('处理申诉失败: ' + error.message)
  } finally {
    processing.value = false
  }
}

// 接受申诉
const handleAppealPass = () => {
  showPassConfirmDialog.value = true
}

const confirmAppealPass = async () => {
  showPassConfirmDialog.value = false
  if (!appealDetail.value || !appealDetail.value._id) {
    showWarning('申诉信息不完整')
    return
  }

  processing.value = true
  try {
    await processAppeal(appealDetail.value._id, 1, '申诉已被接受')

    // 更新本地数据
    appealDetail.value.status = 1
    appealDetail.value.auditResult = '申诉已被接受'
    appealDetail.value.auditTime = new Date()
    if (appealDetail.value.runningRecord) {
      appealDetail.value.runningRecord.status = 1
      appealDetail.value.runningRecord.audit_reason = '申诉已被接受'
    }

    showSuccess('申诉处理成功！')
  } catch (error) {
    console.error('处理申诉失败:', error)
    showError('处理申诉失败: ' + error.message)
  } finally {
    processing.value = false
  }
}

const cancelAppealPass = () => {
  showPassConfirmDialog.value = false
}

const isRejectConfirmDisabled = computed(() => {
  return !rejectReason.value.trim()
})

const isRejectDisabled = computed(() => {
  if (processing.value) return true
  const hasOther = selectedReasons.value.includes(6) // id 6 是“其他理由”
  if (hasOther && !remark.value.trim()) {
    return true
  }
  return false
})

const submitAppealReject = async () => {
  if (isRejectConfirmDisabled.value) {
    showWarning('请输入驳回理由')
    return
  }

  if (!confirm('确定驳回该申诉吗？驳回后对应的跑步记录将保持"不通过"状态。')) {
    return
  }

  processing.value = true
  try {
    await processAppeal(appealDetail.value._id, 2, rejectReason.value.trim())

    appealDetail.value.status = 2
    appealDetail.value.auditResult = rejectReason.value.trim()
    appealDetail.value.auditTime = new Date()
    if (appealDetail.value.runningRecord) {
      appealDetail.value.runningRecord.status = 2
      appealDetail.value.runningRecord.audit_reason = rejectReason.value.trim()
    }

    showSuccess('申诉处理成功！')
    clearRejectDialog()
  } catch (error) {
    console.error('处理申诉失败:', error)
    showError('处理申诉失败: ' + error.message)
  } finally {
    processing.value = false
  }
}

onMounted(() => {

})
</script>

<template>
  <div class="appeal-detail">
    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="appealDetail" class="detail-layout">
      <!-- 左列：申诉信息 + 跑步记录信息 -->
      <div class="col-left">
        <!-- 申诉信息卡片 -->
        <div class="info-card">
          <div class="card-header">
            <button @click="goBackToList" class="back-btn">
              < 返回</button>
                <h3>{{ appealDetail.name }} {{ appealDetail.stu_id }}</h3>
          </div>
          <div class="info-grid">
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
            <div v-if="appealDetail.auditTime" class="info-item">
              <label>审核时间：</label>
              <span>{{ formatTime(appealDetail.auditTime) }}</span>
            </div>
            <div v-if="appealDetail.auditor" class="info-item">
              <label>审核人：</label>
              <span>{{ appealDetail.auditor }}</span>
            </div>
          </div>

          <!-- 申诉理由卡片 -->
          <div class="content-card">
            <h3>申诉理由</h3>
            <div class="description-box">
              {{ appealDetail.appealReason || '无' }}
            </div>
          </div>

          <!-- 申诉图片卡片 -->
          <div v-if="appealDetail.appealImageUrls && appealDetail.appealImageUrls.length > 0" class="content-card">
            <div class="card-header">
              <h3>申诉材料 ({{ appealDetail.appealImageUrls.length }}张)</h3>
            </div>
            <div class="thumbnail-list">
              <img v-for="(imageUrl, index) in appealDetail.appealImageUrls" :key="index" :src="imageUrl"
                :alt="'申诉图片' + (index + 1)" class="thumbnail" @click="openImagePreview(imageUrl)">
            </div>
          </div>
        </div>

        <!-- 跑步记录卡片 -->
        <div v-if="appealDetail.runningRecord" class="info-card">
          <h3>对应的跑步记录</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>打卡时间：</label>
              <span>{{ formatTime(appealDetail.runningRecord.assignTime) }}</span>
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

          <div v-if="appealDetail.runningRecordImageUrl" class="content-card">
            <div class="card-header">
              <h3>跑步记录截图</h3>
            </div>
            <div class="thumbnail-list">
              <img :src="appealDetail.runningRecordImageUrl" alt="跑步记录截图" class="thumbnail"
                @click="openImagePreview(appealDetail.runningRecordImageUrl)">
            </div>
          </div>
        </div>
      </div>

      <!-- 右列：操作 -->
      <div class="col-right">
        <div v-if="appealDetail.status === 0" class="action-card">
          <h3>处理申诉</h3>
          <!-- 驳回理由多选 -->
          <div class="reasons-section">
            <h4>驳回理由（可多选）</h4>
            <div class="reasons-list">
              <label v-for="reason in commonRejectReasons" :key="reason.id"
                :class="['option-btn', { active: selectedReasons.includes(reason.id) }]">
                <input type="checkbox" :value="reason.id" v-model="selectedReasons" hidden />
                <span>{{ reason.text }}</span>
              </label>
            </div>
          </div>
          <!-- 备注输入框 -->
          <div class="remark-section">
            <h4>
              备注
              <span v-if="selectedReasons.includes(6) && !remark.trim()" class="required-tip">
                请输入驳回理由
              </span>
            </h4>
            <textarea v-model="remark" placeholder="请输入备注信息..." rows="3" class="remark-input"></textarea>
          </div>
          <!-- 操作按钮 -->
          <div class="action-buttons">
            <button @click="handleAppealPass" class="btn-resolved" :disabled="processing">
              {{ processing ? '处理中...' : '接受申诉' }}
            </button>
            <button @click="openRejectConfirm" class="btn-rejected" :disabled="isRejectDisabled">
              {{ processing ? '处理中...' : '驳回申诉' }}
            </button>
          </div>

        </div>
        <div v-else class="info-card">
          <h3>处理结果</h3>
          <div class="info-item">
            <label>最终状态：</label>
            <span :class="'status-badge ' + getStatusClass(appealDetail.status)">
              {{ getStatusText(appealDetail.status) }}
            </span>
          </div>
          <div v-if="appealDetail.auditResult" class="info-item">
            <label>审核意见：</label>
            <span>{{ appealDetail.auditResult }}</span>
          </div>
        </div>

        <!-- 导航按钮 -->
        <div class="nav-buttons">
          <button @click="goPrev" :disabled="!hasPrev || loading" class="nav-btn prev-btn">
            < 上一条</button>
              <p>{{ currentIndex + 1 }} / {{ recordIds.length }}</p>
              <button @click="goNext" :disabled="!hasNext || loading" class="nav-btn next-btn">下一条 ></button>
        </div>

      </div>
    </div>

    <!-- 接受申诉确认弹窗（保持不变） -->
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

    <!-- 驳回申诉确认弹窗 -->
    <div v-if="showRejectConfirmDialog" class="modal-overlay" @click.self="showRejectConfirmDialog = false">
      <div class="modal-dialog pass-confirm-dialog">
        <div class="modal-header">
          <h3>确认驳回申诉</h3>
          <button class="modal-close" @click="showRejectConfirmDialog = false">×</button>
        </div>
        <div class="modal-content">
          <p class="confirm-message">
            确定驳回该申诉吗？驳回后对应的跑步记录将保持"不通过"状态。
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showRejectConfirmDialog = false">取消</button>
          <button class="btn-confirm" @click="confirmReject">
            确定驳回
          </button>
        </div>
      </div>
    </div>

    <!-- 图片预览弹窗（保持不变） -->
    <div v-if="showImagePreview" class="image-preview-overlay" @click="closeImagePreview">
      <div class="image-preview-container" @click.stop>
        <button class="image-preview-close" @click="closeImagePreview">×</button>
        <img :src="previewImage" alt="预览图片" class="preview-image">
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 整体布局 */
.appeal-detail {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.page-title {
  font-size: 20px;
  margin: 0;
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

.loading {
  text-align: center;
  padding: 60px;
  color: #999;
  font-size: 16px;
}

/* 两列布局 */
.detail-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.col-left {
  flex: 2.4;
  /* 1.2 + 1.2，合并后左列宽度 */
  min-width: 0;
}

.col-right {
  flex: 0.8;
  min-width: 0;
}

/* 卡片通用样式 */
.info-card,
.action-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 10px;
}

.content-card {
  background: white;
  padding: 0;
  border-radius: 0;
  margin-top: 10px;
}

.info-card:last-child,
.content-card:last-child,
.action-card:last-child {
  margin-bottom: 0;
}

h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
  padding-bottom: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-height: 32px;
  font-size: 16px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-item label {
  color: #666;
  min-width: 70px;
  flex-shrink: 0;
}

.info-item span {
  color: #333;
  word-break: break-word;
}

.description-box {
  color: #555;
  line-height: 1.6;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
  border-left: 3px solid #1890ff;
}

/* 状态徽章 */
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 14px;
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
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.action-buttons button {
  padding: 12px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-resolved {
  background: #52c41a;
  color: white;
}

.btn-resolved:hover:not(:disabled) {
  background: #73d13d;
}

.btn-resolved:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #a8d5ba;
}

.btn-rejected {
  background: #ff4d4f;
  color: white;
}

.btn-rejected:hover:not(:disabled) {
  background: #ff7875;
}

.btn-rejected:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f4b0b0;
}

.action-hint {
  text-align: center;
  color: #1890ff;
  margin-top: 8px;
  font-size: 16px;
}

/* 弹窗样式（从原文件复制，未改动） */
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
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  padding-bottom: 0;
}

.modal-close {
  background: none;
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
  font-size: 16px;
  font-weight: 500;
}

.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 16px;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
}

.form-group textarea:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.form-hint {
  margin: 8px 0 0 0;
  color: #999;
  font-size: 16px;
}

.common-reasons {
  margin-top: 24px;
}

.common-reasons h4 {
  margin-bottom: 12px;
  color: #666;
  font-size: 16px;
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
  font-size: 16px;
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
  font-size: 16px;
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

.pass-confirm-dialog {
  max-width: 450px;
}

.pass-confirm-dialog .btn-confirm {
  background: #52c41a;
  border: 1px solid #52c41a;
}

.pass-confirm-dialog .btn-confirm:hover:not(.disabled) {
  background: #73d13d;
  border-color: #73d13d;
}

.confirm-message {
  text-align: center;
  color: #333;
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 20px;
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
  color: white;
  font-size: 24px;
  cursor: pointer;
  width: 30px;
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

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
}

.card-header h3 {
  margin: 0;
  padding-bottom: 0;
}

.col-left .card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  margin-bottom: 20px;
}

/* 申诉理由突出样式 */
.appeal-reason .reason-text {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  line-height: 1.4;
  background-color: #fafafa;
  padding: 10px;
  border-radius: 10px;
  border-left: #1890ff;
}

/* 缩略图列表 */
.thumbnail-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
  /* 与标题的间距 */
}

.thumbnail {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #f0f0f0;
  transition: transform 0.2s;
}

.thumbnail:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.reasons-section h4,
.remark-section h4 {
  font-weight: 500;
  margin: 10px auto;
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

.option-btn input {
  display: none;
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

.nav-buttons {
  display: flex;
  gap: 12px;
  width: 100%;
  margin-top: 16px;
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

.required-tip {
  color: red;
  font-size: 14px;
  margin-left: 8px;
  font-weight: normal;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .detail-layout {
    flex-direction: column;
  }

  .col-left,
  .col-right {
    width: 100%;
  }
}
</style>