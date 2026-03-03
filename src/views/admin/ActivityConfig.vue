<template>
  <div class="rest-day-manager">
    <h2>停跑日期管理</h2>

    <!-- 添加表单 -->
    <div class="add-form">
      <h3>新增停跑日</h3>
      <form @submit.prevent="handleAdd">
        <div class="form-item">
          <label for="restDate">日期：</label>
          <input
              type="date"
              id="restDate"
              v-model="newDate"
              required
          />
        </div>
        <div class="form-item">
          <label for="reason">原因（可选）：</label>
          <input
              type="text"
              id="reason"
              v-model="newReason"
              placeholder="例如：节假日、活动等"
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
                @click="handleDelete(day._id, day.date)"
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

// 响应式数据
const restDays = ref([])
const newDate = ref('')
const newReason = ref('')
const loading = ref(false)
const adding = ref(false)
const deletingId = ref(null)
const error = ref('')

// 按日期倒序排列
const sortedRestDays = computed(() => {
  return [...restDays.value].sort((a, b) => (a.date > b.date ? -1 : 1))
})

// 获取停跑日列表
const fetchRestDays = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await callFunction({
      name: 'manageRestDays',
      data: { action: 'list' }
    })
    if (res.code === 200) {
      restDays.value = res.data || []
    } else {
      throw new Error(res.message || '获取列表失败')
    }
  } catch (err) {
    error.value = err.message
    console.error('获取停跑日失败', err)
  } finally {
    loading.value = false
  }
}

// 添加停跑日
const handleAdd = async () => {
  if (!newDate.value) return
  adding.value = true
  error.value = ''
  try {
    const res = await callFunction({
      name: 'manageRestDays',
      data: {
        action: 'add',
        date: newDate.value,
        reason: newReason.value || ''
      }
    })
    if (res.code === 200) {
      // 添加成功，刷新列表
      await fetchRestDays()
      newDate.value = ''
      newReason.value = ''
    } else {
      throw new Error(res.message || '添加失败')
    }
  } catch (err) {
    error.value = err.message
    console.error('添加停跑日失败', err)
  } finally {
    adding.value = false
  }
}

// 删除停跑日
const handleDelete = async (id, date) => {
  if (!confirm(`确定要删除 ${date} 的停跑设置吗？`)) return
  deletingId.value = id
  error.value = ''
  try {
    const res = await callFunction({
      name: 'manageRestDays',
      data: {
        action: 'remove',
        date // 根据云函数实现，可能需要 date 或 id
      }
    })
    if (res.code === 200) {
      // 删除成功，刷新列表
      await fetchRestDays()
    } else {
      throw new Error(res.message || '删除失败')
    }
  } catch (err) {
    error.value = err.message
    console.error('删除停跑日失败', err)
  } finally {
    deletingId.value = null
  }
}

// 模拟调用云函数（实际项目中替换为真实SDK调用）
async function callFunction({ name, data }) {
  // 示例：使用微信云开发 Web SDK
  // const res = await cloud.callFunction({ name, data })
  // return res.result

  // 模拟返回（开发时可删除）
  console.log('调用云函数', name, data)
  return new Promise((resolve) => {
    setTimeout(() => {
      if (name === 'manageRestDays') {
        if (data.action === 'list') {
          resolve({ code: 200, data: [] }) // 初始空列表
        } else if (data.action === 'add') {
          resolve({ code: 200 })
        } else if (data.action === 'remove') {
          resolve({ code: 200 })
        }
      } else {
        resolve({ code: 404, message: '未知函数' })
      }
    }, 500)
  })
}

onMounted(() => {
  fetchRestDays()
})
</script>

<style scoped>
.rest-day-manager {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}

h2 {
  margin-top: 0;
  color: #333;
  border-bottom: 2px solid #42b983;
  padding-bottom: 10px;
}

h3 {
  margin: 20px 0 10px;
  color: #555;
}

.add-form {
  background-color: #f8f8f8;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.form-item {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.form-item label {
  width: 80px;
  color: #666;
}

.form-item input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-item input[type="date"] {
  font-family: inherit;
}

button {
  background-color: #42b983;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

button:hover:not(:disabled) {
  background-color: #3aa876;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delete-btn {
  background-color: #f56c6c;
  padding: 5px 10px;
  font-size: 12px;
}

.delete-btn:hover:not(:disabled) {
  background-color: #e64242;
}

table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

th, td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
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
  padding: 30px;
  background: #fafafa;
  border-radius: 4px;
  color: #999;
}

.error {
  color: #f56c6c;
  background-color: #fef0f0;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
}
</style>