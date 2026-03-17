<template>
  <div class="rest-day-manager">
    <!-- 本地消息提示 -->
    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>

    <!-- 添加表单 -->
    <div class="add-form">
      <h3>新增停跑日</h3>
      <form @submit.prevent="handleAdd">
        <div class="form-item">
          <label for="restDate">日期：</label>
          <input type="date" id="restDate" v-model="newDate" required />
        </div>
        <div class="form-item">
          <label for="reason">原因（可选）：</label>
          <input
              type="text"
              id="reason"
              v-model="newReason"
              placeholder="例如：天气不好、场地被占用等"
          />
        </div>
        <button type="submit" :disabled="adding">
          {{ adding ? '提交中...' : '添加' }}
        </button>
      </form>
    </div>

    <!-- 停跑日列表 -->
    <div class="rest-list">
      <h3>当前停跑日</h3>
      <div v-if="loading" class="loading">加载中...</div>
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
                @click="handleDelete(day._id)"
                :disabled="deletingId === day._id"
                class="delete-btn"
            >
              {{ deletingId === day._id ? '删除中...' : '删除' }}
            </button>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getRestDays, addRestDay, deleteRestDay } from '@/api/admin'

// 获取今天的日期
const getTodayDate = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 响应式数据
const restDays = ref([])
const newDate = ref(getTodayDate())
const newReason = ref('')
const loading = ref(false)
const adding = ref(false)
const deletingId = ref(null)

// 本地消息提示
const message = ref('')
const messageType = ref('success')
let messageTimer = null

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

// 按日期倒序排列
const sortedRestDays = computed(() => {
  return [...restDays.value].sort((a, b) => (a.date > b.date ? -1 : 1))
})

// 获取停跑日列表
const fetchRestDays = async () => {
  loading.value = true
  try {
    const data = await getRestDays()
    restDays.value = data || []
  } catch (err) {
    showMessage(err.message || '获取列表失败', 'error')
  } finally {
    loading.value = false
  }
}

// 添加停跑日
const handleAdd = async () => {
  if (!newDate.value) return
  adding.value = true
  try {
    await addRestDay(newDate.value, newReason.value)
    showMessage('添加成功', 'success')
    await fetchRestDays()
    newDate.value = ''
    newReason.value = ''
  } catch (err) {
    showMessage(err.message || '添加失败', 'error')
  } finally {
    adding.value = false
  }
}

// 删除停跑日
const handleDelete = async (id) => {
  const day = restDays.value.find(d => d._id === id)
  if (!day) return
  if (!confirm(`确定要删除 ${day.date} 的停跑设置吗？`)) return

  deletingId.value = id
  try {
    await deleteRestDay(id)
    showMessage('删除成功', 'success')
    await fetchRestDays()
  } catch (err) {
    showMessage(err.message || '删除失败', 'error')
  } finally {
    deletingId.value = null
  }
}

onMounted(() => {
  fetchRestDays()
})
</script>

<style scoped>
.rest-day-manager {
  max-width: 1000px;
  margin: 0 auto;
  padding: 30px;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  font-size: 16px;
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

.add-form {
  background-color: #f8f8f8;
  border-radius: 10px;
  padding: 24px 28px;
  margin-bottom: 36px;
  box-shadow: 0 3px 8px rgba(0,0,0,0.08);
}

.form-item {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: nowrap;        /* 确保标签和输入框不换行 */
}

.form-item label {
  width: 120px;
  color: #666;
  font-weight: 500;
  font-size: 16px;
  flex-shrink: 0;
}

.form-item input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-item input:focus {
  border-color: #42b983;
  outline: none;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.1);
}

/* 日期选择器保持默认样式，无额外美化 */
.form-item input[type="date"] {
  font-family: inherit;
}

button {
  background-color: #42b983;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background-color 0.2s, transform 0.1s;
}

button:hover:not(:disabled) {
  background-color: #3aa876;
}

button:active:not(:disabled) {
  transform: scale(0.98);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delete-btn {
  background-color: #f56c6c;
  padding: 8px 16px;
  font-size: 14px;
}

.delete-btn:hover:not(:disabled) {
  background-color: #e64242;
}

table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  border-radius: 8px;
  overflow: hidden;
}

th, td {
  padding: 16px 20px;
  text-align: left;
  border-bottom: 1px solid #eee;
  font-size: 16px;
}

th {
  background-color: #f2f2f2;
  font-weight: 600;
  color: #444;
}

td {
  color: #333;
}

.loading, .empty {
  text-align: center;
  padding: 40px;
  background: #fafafa;
  border-radius: 8px;
  color: #999;
  font-size: 16px;
}
</style>