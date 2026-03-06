<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAuditRecordDetail, submitAudit as submitAuditApi, updateAuditResult, getCurrentStaff } from '../../api/staff.js'

const route = useRoute()
const router = useRouter()

// 当前工作人员
const currentStaff = ref(null)

// 记录ID列表和当前索引
const recordIds = ref([])
const currentIndex = ref(0)

// 当前记录详情
const recordDetail = ref(null)
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

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
  // 状态为不通过或申诉中时，按钮禁用
  if (recordDetail.value && (recordDetail.value.status === 2 || recordDetail.value.status === 3)) {
    return false
  }
  return auditForm.value.reasons.length > 0
})

// 计算属性：是否允许修改（状态为待审核或已通过时才允许修改）
const canEdit = computed(() => {
  return recordDetail.value && (recordDetail.value.status === 0 || recordDetail.value.status === 1)
})

// 解析路由参数
function parseRouteQuery() {
  const ids = route.query.ids
  const index = route.query.index
  if (ids) {
    recordIds.value = ids.split(',').filter(id => id.trim() !== '')
  } else {
    recordIds.value = []
  }
  currentIndex.value = index !== undefined ? parseInt(index, 10) : 0
  if (currentIndex.value < 0) currentIndex.value = 0
  if (currentIndex.value >= recordIds.value.length) currentIndex.value = recordIds.value.length - 1
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
    errorMsg.value = err.message || '加载记录详情失败'
    recordDetail.value = null
  } finally {
    loading.value = false
  }
}

// 计算配速是否达标（示例逻辑，根据实际需求调整）
const paceStatus = computed(() => {
  if (!recordDetail.value?.running_pace) return 'unknown'
  // 示例：配速超过 6'00" 为不达标
  const pace = recordDetail.value.running_pace
  const match = pace.match(/(\d+)'(\d+)"/)
  if (match) {
    const minutes = parseInt(match[1])
    const seconds = parseInt(match[2])
    const totalSeconds = minutes * 60 + seconds
    return totalSeconds > 360 ? 'fail' : 'success' // 6分钟 = 360秒
  }
  return 'unknown'
})

// 计算跑步时间是否达标（示例）
const timeStatus = computed(() => {
  if (!recordDetail.value?.running_date) return 'unknown'
  // 示例：时间必须在 20:00-22:00
  const timeStr = recordDetail.value.running_date.split(' ')[1] // 假设格式 "11-20 21:36"
  if (timeStr) {
    const hour = parseInt(timeStr.split(':')[0])
    return (hour >= 20 && hour < 22) ? 'success' : 'fail'
  }
  return 'unknown'
})

// 上下条切换
function goPrev() {
  if (hasPrev.value) {
    currentIndex.value--
    loadCurrentRecord()
    // 更新 URL query 中的 index
    router.replace({
      query: { ...route.query, index: currentIndex.value }
    })
  }
}

function goNext() {
  if (hasNext.value) {
    currentIndex.value++
    loadCurrentRecord()
    router.replace({
      query: { ...route.query, index: currentIndex.value }
    })
  }
}

// 提交通过审核
async function submitApprove() {
  if (!recordDetail.value) return

  // 状态为不通过或申诉中时，不允许操作
  if (recordDetail.value.status === 2 || recordDetail.value.status === 3) {
    errorMsg.value = '不通过或申诉中的记录不支持修改状态'
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

    successMsg.value = '已通过'

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
        successMsg.value = '所有记录审核完成'
      }, 1000)
    }
  } catch (err) {
    console.error('提交通过失败:', err)
    errorMsg.value = err.message || '提交通过失败'
  } finally {
    loading.value = false
  }
}

// 提交不通过审核（带确认弹窗）
async function submitReject() {
  if (!recordDetail.value) return

  // 状态为不通过或申诉中时，不允许操作
  if (recordDetail.value.status === 2 || recordDetail.value.status === 3) {
    errorMsg.value = '不通过或申诉中的记录不支持修改状态'
    return
  }

  if (auditForm.value.reasons.length === 0) {
    errorMsg.value = '请至少选择一个不通过原因'
    return
  }

  // 确认弹窗
  if (!confirm('确定要将此记录判为不通过吗？')) {
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

    successMsg.value = '已拒绝'

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
        successMsg.value = '所有记录审核完成'
      }, 1000)
    }
  } catch (err) {
    console.error('提交不通过失败:', err)
    errorMsg.value = err.message || '提交不通过失败'
  } finally {
    loading.value = false
  }
}

// 返回列表页
function goBack() {
  router.push('/staff/audit')
}

// 监听路由参数变化
watch(() => route.query, () => {
  parseRouteQuery()
  loadCurrentRecord()
}, { immediate: true })

onMounted(() => {
  currentStaff.value = getCurrentStaff()
  if (!currentStaff.value) {
    errorMsg.value = '未获取到工作人员信息，请重新登录'
    // 可跳转到登录页
  }
})
</script>

<template>
  <div class="audit-detail-page">
    <!-- 顶部导航 -->
    <div class="detail-header">
      <button @click="goBack" class="back-btn">← 返回列表</button>
      <h2>审核详情 ({{ currentIndex + 1 }} / {{ recordIds.length }})</h2>
    </div>

    <!-- 消息提示 -->
    <div v-if="errorMsg" class="message-banner error">
      ❌ {{ errorMsg }}
      <button @click="errorMsg = ''" class="close-msg">×</button>
    </div>
    <div v-if="successMsg" class="message-banner success">
      ✅ {{ successMsg }}
      <button @click="successMsg = ''" class="close-msg">×</button>
    </div>

    <!-- 状态提示：当记录为不通过或申诉中时 -->
    <div v-if="recordDetail && (recordDetail.status === 2 || recordDetail.status === 3)" class="status-warning">
      ⚠️ 当前记录状态为 {{ getStatusText(recordDetail.status) }}，不支持修改
    </div>

    <!-- 三栏内容 -->
    <div v-if="loading && !recordDetail" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="recordDetail" class="detail-layout">
      <!-- 左侧：截图 -->
      <div class="left-col">
        <h3>跑步截图</h3>
        <div class="screenshot-container">
          <img :src="recordDetail.screenshot" alt="跑步截图" @click="openImagePreview(recordDetail.screenshot)" />
        </div>
      </div>

      <!-- 中间：用户信息（分为三块） -->
      <div class="middle-col">
        <!-- 1. 绑定学生信息 -->
        <div class="info-block">
          <h3>绑定学生信息</h3>
          <div class="info-item">
            <span class="label">姓名：</span>
            <span class="value">{{ recordDetail.username }}</span>
          </div>
          <div class="info-item">
            <span class="label">学号：</span>
            <span class="value">{{ recordDetail.studentId }}</span>
          </div>
          <div class="info-item">
            <span class="label">学院班级：</span>
            <span class="value">{{ recordDetail.college || '—' }} | {{ recordDetail.class || '—' }}</span>
          </div>
        </div>

        <!-- 2. 截图识别数据（OCR 已提取） -->
        <div class="info-block">
          <div class="block-header">
            <h3>截图识别数据</h3>
            <span class="ocr-badge">OCR 已提取</span>
          </div>

          <!-- 运动里程 -->
          <div class="info-item">
            <span class="label">运动里程：</span>
            <div class="value-with-status">
              <span class="value">{{ recordDetail.distance }} km</span>
              <span v-if="recordDetail.distance < 2.0" class="status-badge fail">
                ❌ 未达标（需≥2.0km）
              </span>
              <span v-else class="status-badge success">
                ✅ 达标
              </span>
            </div>
          </div>

          <!-- 运动配速 -->
          <div class="info-item">
            <span class="label">运动配速：</span>
            <div class="value-with-status">
              <span class="value">{{ recordDetail.running_pace || '—' }}</span>
              <span v-if="paceStatus === 'fail'" class="status-badge fail">
                ❌ 配速异常
              </span>
              <span v-else-if="paceStatus === 'success'" class="status-badge success">
                ✅ 达标
              </span>
            </div>
          </div>

          <!-- 跑步时间 -->
          <div class="info-item">
            <span class="label">跑步时间：</span>
            <div class="value-with-status">
              <span class="value">{{ formatDateTime(recordDetail.running_date || recordDetail.date) }}</span>
              <span v-if="timeStatus === 'fail'" class="status-badge fail">
                ❌ 不在规定时段
              </span>
              <span v-else-if="timeStatus === 'success'" class="status-badge success">
                ✅ 达标
              </span>
            </div>
          </div>

          <!-- 运动时长（可选） -->
          <div class="info-item">
            <span class="label">运动时长：</span>
            <span class="value">{{ recordDetail.duration }}</span>
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
      </div>

      <!-- 右侧：审核裁决 -->
      <div class="right-col">
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
          <h4>备注（可选）</h4>
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
          <button @click="submitApprove" class="approve-btn"
                  :disabled="loading || !canEdit || (recordDetail.status === 1)">
            {{ loading ? '处理中...' : '✅ 通过' }}
          </button>
          <button @click="submitReject" class="reject-btn"
                  :disabled="loading || !canEdit || !canReject">
            {{ loading ? '处理中...' : '❌ 不通过' }}
          </button>
        </div>

        <!-- 下排导航按钮 -->
        <div class="nav-buttons">
          <button @click="goPrev" :disabled="!hasPrev || loading" class="nav-btn prev-btn">← 上一条</button>
          <button @click="goNext" :disabled="!hasNext || loading" class="nav-btn next-btn">下一条 →</button>
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
</template>

<style scoped>
.audit-detail-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
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
  cursor: pointer;
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
.middle-col,
.right-col {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.left-col {
  flex: 1.2;
  display: flex;
  flex-direction: column;
}

.middle-col {
  flex: 0.8;
}

.right-col {
  flex: 1;
}

.left-col h3,
.middle-col h3,
.right-col h3 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.screenshot-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  background: #fafafa;
  border-radius: 8px;
  padding: 4px;
}

.screenshot-container img {
  max-width: 100%;
  max-height: 1500px;
  object-fit: contain;
  cursor: pointer;
  border-radius: 4px;
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
  margin-bottom: 24px;
  padding-bottom: 16px;
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

/* 调整原有样式 */
.middle-col h3 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
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

/* 状态警告提示 */
.status-warning {
  background: #fff3cd;
  border: 1px solid #ffeeba;
  color: #856404;
  padding: 12px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
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
  padding: 8px 16px;
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

.remark-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
  margin-bottom: 20px;
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

.approve-btn:disabled,
.reject-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #ccc;
}

/* 下排导航按钮 */
.nav-buttons {
  display: flex;
  gap: 12px;
  width: 100%;
}

.nav-buttons .nav-btn {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.nav-buttons .nav-btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.nav-buttons .nav-btn:disabled {
  opacity: 0.5;
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

/* 响应式调整 */
@media (max-width: 1200px) {
  .detail-layout {
    flex-direction: column;
  }

  .left-col,
  .middle-col,
  .right-col {
    width: 100%;
  }
}
</style>