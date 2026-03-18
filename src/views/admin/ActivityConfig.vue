<template>
  <div class="activity-config">
    <!-- 本地消息提示 -->
    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>

    <!-- 活动配置管理 -->
    <div class="activity-section">
      <h2>活动配置管理</h2>
      
      <!-- 添加活动表单 -->
      <div class="add-form">
        <h3>新增活动配置</h3>
        <form @submit.prevent="handleAddActivity">
          <div class="form-row">
            <div class="form-item">
              <label for="semester">学期名称：</label>
              <input 
                type="text" 
                id="semester" 
                v-model="newActivity.semester" 
                placeholder="例如：2025-2026学年第二学期" 
                required 
              />
            </div>
            <div class="form-item">
              <label for="startDate">开始日期：</label>
              <input 
                type="date" 
                id="startDate" 
                v-model="newActivity.start_date" 
                required 
              />
            </div>
            <div class="form-item">
              <label for="endDate">结束日期：</label>
              <input 
                type="date" 
                id="endDate" 
                v-model="newActivity.end_date" 
                required 
              />
            </div>
          </div>
          <button type="submit" :disabled="addingActivity">
            {{ addingActivity ? '提交中...' : '添加活动' }}
          </button>
        </form>
      </div>

      <!-- 活动列表 -->
      <div class="activity-list">
        <h3>活动配置列表</h3>
        <div v-if="loadingActivities" class="loading">加载中...</div>
        <div v-else-if="activities.length === 0" class="empty">暂无活动配置</div>
        <table v-else>
          <thead>
            <tr>
              <th>学期名称</th>
              <th>开始日期</th>
              <th>结束日期</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="activity in sortedActivities" :key="activity._id">
              <td>{{ activity.semester }}</td>
              <td>{{ activity.start_date }}</td>
              <td>{{ activity.end_date }}</td>
              <td>
                <span :class="['status', activity.status === 1 ? 'active' : 'inactive']">
                  {{ activity.status === 1 ? '激活' : '非激活' }}
                </span>
              </td>
              <td>{{ formatDate(activity.created_at) }}</td>
              <td>
                <button 
                  v-if="activity.status === 0"
                  @click="handleSetActive(activity._id)"
                  :disabled="settingActiveId === activity._id"
                  class="active-btn"
                >
                  {{ settingActiveId === activity._id ? '激活中...' : '设为激活' }}
                </button>
                <button 
                  @click="handleEditActivity(activity)"
                  class="edit-btn"
                >
                  编辑
                </button>
                <button 
                  @click="handleDeleteActivity(activity._id)"
                  :disabled="deletingActivityId === activity._id"
                  class="delete-btn"
                >
                  {{ deletingActivityId === activity._id ? '删除中...' : '删除' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 编辑活动模态框 -->
    <div v-if="editingActivity" class="modal-overlay">
      <div class="modal">
        <h3>编辑活动配置</h3>
        <form @submit.prevent="handleUpdateActivity">
          <div class="form-item">
            <label for="editSemester">学期名称：</label>
            <input 
              type="text" 
              id="editSemester" 
              v-model="editingActivity.semester" 
              required 
            />
          </div>
          <div class="form-item">
            <label for="editStartDate">开始日期：</label>
            <input 
              type="date" 
              id="editStartDate" 
              v-model="editingActivity.start_date" 
              required 
            />
          </div>
          <div class="form-item">
            <label for="editEndDate">结束日期：</label>
            <input 
              type="date" 
              id="editEndDate" 
              v-model="editingActivity.end_date" 
              required 
            />
          </div>
          <div class="modal-actions">
            <button type="submit" :disabled="updatingActivity">
              {{ updatingActivity ? '更新中...' : '更新' }}
            </button>
            <button type="button" @click="editingActivity = null">取消</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 停跑日管理（保留原有功能） -->
    <div class="rest-day-section">
      <h2>停跑日管理</h2>
      
      <!-- 添加停跑日表单 -->
      <div class="add-form">
        <h3>新增停跑日</h3>
        <form @submit.prevent="handleAddRestDay">
          <div class="form-row">
            <div class="form-item">
              <label for="restDate">日期：</label>
              <input type="date" id="restDate" v-model="newRestDay.date" required />
            </div>
            <div class="form-item">
              <label for="reason">原因（可选）：</label>
              <input
                type="text"
                id="reason"
                v-model="newRestDay.reason"
                placeholder="例如：天气不好、场地被占用等"
              />
            </div>
          </div>
          <button type="submit" :disabled="addingRestDay">
            {{ addingRestDay ? '提交中...' : '添加' }}
          </button>
        </form>
      </div>

      <!-- 停跑日列表 -->
      <div class="rest-list">
        <h3>当前停跑日</h3>
        <div v-if="loadingRestDays" class="loading">加载中...</div>
        <div v-else-if="restDays.length === 0" class="empty">暂无停跑日</div>
        <table v-else>
          <thead>
            <tr>
              <th>日期</th>
              <th>原因</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="day in sortedRestDays" :key="day._id">
              <td>{{ day.date }}</td>
              <td>{{ day.reason || '—' }}</td>
              <td>
                <button
                  @click="handleDeleteRestDay(day._id)"
                  :disabled="deletingRestDayId === day._id"
                  class="delete-btn"
                >
                  {{ deletingRestDayId === day._id ? '删除中...' : '删除' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  getActivityConfigList, 
  createActivityConfig, 
  updateActivityConfig, 
  deleteActivityConfig, 
  setActivityActive,
  getRestDays, 
  addRestDay, 
  deleteRestDay 
} from '@/api/admin'

// 活动配置相关数据
const activities = ref([])
const newActivity = ref({
  semester: '',
  start_date: '',
  end_date: ''
})
const editingActivity = ref(null)
const loadingActivities = ref(false)
const addingActivity = ref(false)
const updatingActivity = ref(false)
const deletingActivityId = ref(null)
const settingActiveId = ref(null)

// 停跑日相关数据
const restDays = ref([])
const newRestDay = ref({
  date: getTodayDate(),
  reason: ''
})
const loadingRestDays = ref(false)
const addingRestDay = ref(false)
const deletingRestDayId = ref(null)

// 消息提示
const message = ref('')
const messageType = ref('success')
let messageTimer = null

// 获取今天的日期
function getTodayDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 显示消息并自动消失
const showMessage = (msg, type = 'success', duration = 3000) => {
  if (messageTimer) clearTimeout(messageTimer)
  message.value = msg
  messageType.value = type
  messageTimer = setTimeout(() => {
    message.value = ''
    messageTimer = null
  }, duration)
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

// 计算属性：按创建时间倒序排列活动
const sortedActivities = computed(() => {
  return [...activities.value].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
})

// 计算属性：按日期倒序排列停跑日
const sortedRestDays = computed(() => {
  return [...restDays.value].sort((a, b) => (a.date > b.date ? -1 : 1))
})

// 获取活动配置列表
const fetchActivities = async () => {
  loadingActivities.value = true
  try {
    const data = await getActivityConfigList()
    activities.value = data || []
  } catch (err) {
    showMessage(err.message || '获取活动配置列表失败', 'error')
  } finally {
    loadingActivities.value = false
  }
}

// 添加活动配置
const handleAddActivity = async () => {
  if (!newActivity.value.semester || !newActivity.value.start_date || !newActivity.value.end_date) {
    showMessage('请填写完整的活动信息', 'error')
    return
  }

  if (newActivity.value.start_date >= newActivity.value.end_date) {
    showMessage('结束日期必须晚于开始日期', 'error')
    return
  }

  addingActivity.value = true
  try {
    await createActivityConfig(newActivity.value)
    showMessage('活动配置创建成功', 'success')
    await fetchActivities()
    newActivity.value = { semester: '', start_date: '', end_date: '' }
  } catch (err) {
    showMessage(err.message || '创建活动配置失败', 'error')
  } finally {
    addingActivity.value = false
  }
}

// 编辑活动配置
const handleEditActivity = (activity) => {
  editingActivity.value = { ...activity }
}

// 更新活动配置
const handleUpdateActivity = async () => {
  if (!editingActivity.value) return

  if (editingActivity.value.start_date >= editingActivity.value.end_date) {
    showMessage('结束日期必须晚于开始日期', 'error')
    return
  }

  updatingActivity.value = true
  try {
    await updateActivityConfig(editingActivity.value._id, {
      semester: editingActivity.value.semester,
      start_date: editingActivity.value.start_date,
      end_date: editingActivity.value.end_date
    })
    showMessage('活动配置更新成功', 'success')
    await fetchActivities()
    editingActivity.value = null
  } catch (err) {
    showMessage(err.message || '更新活动配置失败', 'error')
  } finally {
    updatingActivity.value = false
  }
}

// 删除活动配置
const handleDeleteActivity = async (id) => {
  const activity = activities.value.find(a => a._id === id)
  if (!activity) return

  if (!confirm(`确定要删除活动 "${activity.semester}" 吗？此操作不可撤销。`)) return

  deletingActivityId.value = id
  try {
    await deleteActivityConfig(id)
    showMessage('活动配置删除成功', 'success')
    await fetchActivities()
  } catch (err) {
    showMessage(err.message || '删除活动配置失败', 'error')
  } finally {
    deletingActivityId.value = null
  }
}

// 设置活动为激活状态
const handleSetActive = async (id) => {
  settingActiveId.value = id
  try {
    await setActivityActive(id)
    showMessage('活动已设置为激活状态', 'success')
    await fetchActivities()
  } catch (err) {
    showMessage(err.message || '设置活动激活失败', 'error')
  } finally {
    settingActiveId.value = null
  }
}

// 停跑日相关函数（保留原有功能）
const fetchRestDays = async () => {
  loadingRestDays.value = true
  try {
    const data = await getRestDays()
    restDays.value = data || []
  } catch (err) {
    showMessage(err.message || '获取停跑日列表失败', 'error')
  } finally {
    loadingRestDays.value = false
  }
}

const handleAddRestDay = async () => {
  if (!newRestDay.value.date) return
  addingRestDay.value = true
  try {
    await addRestDay(newRestDay.value.date, newRestDay.value.reason)
    showMessage('停跑日添加成功', 'success')
    await fetchRestDays()
    newRestDay.value = { date: getTodayDate(), reason: '' }
  } catch (err) {
    showMessage(err.message || '添加停跑日失败', 'error')
  } finally {
    addingRestDay.value = false
  }
}

const handleDeleteRestDay = async (id) => {
  const day = restDays.value.find(d => d._id === id)
  if (!day) return
  if (!confirm(`确定要删除 ${day.date} 的停跑设置吗？`)) return

  deletingRestDayId.value = id
  try {
    await deleteRestDay(id)
    showMessage('停跑日删除成功', 'success')
    await fetchRestDays()
  } catch (err) {
    showMessage(err.message || '删除停跑日失败', 'error')
  } finally {
    deletingRestDayId.value = null
  }
}

onMounted(() => {
  fetchActivities()
  fetchRestDays()
})
</script>

<style scoped>
.activity-config {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  font-size: 16px;
}

h2 {
  margin: 40px 0 20px;
  color: #333;
  font-size: 24px;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 10px;
}

h3 {
  margin: 24px 0 12px;
  color: #555;
  font-size: 20px;
}

/* 消息提示样式 */
.message {
  padding: 14px 20px;
  border-radius: 6px;
  margin-bottom: 24px;
  text-align: center;
  font-weight: 500;
  font-size: 16px;
}
.message.success {
  background-color: #e1f7e1;
  color: #2e7d32;
  border: 1px solid #a5d6a5;
}
.message.error {
  background-color: #ffebee;
  color: #c62828;
  border: 1px solid #ef9a9a;
}

/* 表单样式 */
.add-form {
  background-color: #f8f8f8;
  border-radius: 10px;
  padding: 24px 28px;
  margin-bottom: 36px;
  box-shadow: 0 3px 8px rgba(0,0,0,0.08);
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.form-item {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-item label {
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

.form-item input {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.form-item input:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.1);
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

button:not(:disabled):hover {
  opacity: 0.9;
}

button[type="submit"] {
  background-color: #4a90e2;
  color: white;
}

button[type="button"] {
  background-color: #f0f0f0;
  color: #333;
  margin-left: 10px;
}

/* 表格样式 */
table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

thead {
  background-color: #f5f5f5;
}

th, td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

th {
  font-weight: 600;
  color: #555;
}

/* 状态样式 */
.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
}

.status.active {
  background-color: #e1f7e1;
  color: #2e7d32;
}

.status.inactive {
  background-color: #f5f5f5;
  color: #666;
}

/* 按钮样式 */
.active-btn {
  background-color: #4caf50;
  color: white;
  margin-right: 8px;
}

.edit-btn {
  background-color: #ff9800;
  color: white;
  margin-right: 8px;
}

.delete-btn {
  background-color: #f44336;
  color: white;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background-color: white;
  border-radius: 10px;
  padding: 30px;
  width: 500px;
  max-width: 90vw;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal h3 {
  margin-top: 0;
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

/* 加载和空状态样式 */
.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 16px;
}

/* 分区样式 */
.activity-section, .rest-day-section {
  margin-bottom: 60px;
}

.activity-section {
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 40px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .activity-config {
    padding: 15px;
  }
  
  .form-row {
    flex-direction: column;
    gap: 15px;
  }
  
  table {
    font-size: 14px;
  }
  
  th, td {
    padding: 8px 12px;
  }
}
</style>