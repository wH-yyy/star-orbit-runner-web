<script setup>
import { ref, onMounted } from 'vue'

// 用户列表数据
const users = ref([])
const loading = ref(false)
const searchKeyword = ref('')

// 模拟加载用户数据
const loadUsers = () => {
  loading.value = true
  console.log('加载用户列表...')
  
  // 模拟异步请求
  setTimeout(() => {
    users.value = [
      { id: 1, username: '张三', email: 'zhangsan@example.com', status: '正常', registerTime: '2024-01-15' },
      { id: 2, username: '李四', email: 'lisi@example.com', status: '正常', registerTime: '2024-02-20' },
      { id: 3, username: '王五', email: 'wangwu@example.com', status: '禁用', registerTime: '2024-03-10' },
      { id: 4, username: '赵六', email: 'zhaoliu@example.com', status: '正常', registerTime: '2024-04-05' },
      { id: 5, username: '孙七', email: 'sunqi@example.com', status: '正常', registerTime: '2024-05-12' }
    ]
    loading.value = false
  }, 800)
}

// 搜索用户
const handleSearch = () => {
  console.log('搜索关键词:', searchKeyword.value)
  // 实际项目中这里会调用后端 API
}

// 查看用户详情
const viewUser = (user) => {
  console.log('查看用户:', user)
  alert(`用户详情：\n姓名：${user.username}\n邮箱：${user.email}\n状态：${user.status}`)
}

// 删除用户
const deleteUser = (user) => {
  if (confirm(`确定要删除用户"${user.username}"吗？`)) {
    console.log('删除用户:', user)
    users.value = users.value.filter(u => u.id !== user.id)
  }
}

// 页面加载时获取数据
onMounted(() => {
  loadUsers()
})
</script>

<template>
  <div class="user-list">
    <h2 class="page-title">👥 用户管理</h2>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <input 
        v-model="searchKeyword" 
        type="text" 
        placeholder="搜索用户名或邮箱..."
        @keyup.enter="handleSearch"
      />
      <button @click="handleSearch" class="search-btn">🔍 搜索</button>
      <button @click="loadUsers" class="refresh-btn">🔄 刷新</button>
    </div>

    <!-- 用户表格 -->
    <div class="table-container">
      <div v-if="loading" class="loading">加载中...</div>
      
      <table v-else class="user-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>用户名</th>
            <th>邮箱</th>
            <th>状态</th>
            <th>注册时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.username }}</td>
            <td>{{ user.email }}</td>
            <td>
              <span 
                class="status-badge" 
                :class="user.status === '正常' ? 'status-active' : 'status-disabled'"
              >
                {{ user.status }}
              </span>
            </td>
            <td>{{ user.registerTime }}</td>
            <td>
              <div class="action-buttons">
                <button @click="viewUser(user)" class="btn-view">查看</button>
                <button @click="deleteUser(user)" class="btn-delete">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!loading && users.length === 0" class="empty-state">
        暂无用户数据
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-info">
      <p>共 <strong>{{ users.length }}</strong> 个用户</p>
    </div>
  </div>
</template>

<style scoped>
.user-list {
  max-width: 1200px;
}

.page-title {
  margin: 0 0 24px 0;
  font-size: 24px;
  color: #333;
}

/* 搜索栏 */
.search-bar {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.search-bar input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
}

.search-bar input:focus {
  outline: none;
  border-color: #1890ff;
}

.search-btn,
.refresh-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.search-btn {
  background: #1890ff;
  color: white;
}

.search-btn:hover {
  background: #40a9ff;
}

.refresh-btn {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #d9d9d9;
}

.refresh-btn:hover {
  background: white;
  border-color: #1890ff;
  color: #1890ff;
}

/* 表格容器 */
.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
}

.loading {
  text-align: center;
  padding: 60px;
  color: #999;
  font-size: 16px;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #999;
}

/* 用户表格 */
.user-table {
  width: 100%;
  border-collapse: collapse;
}

.user-table th {
  background: #fafafa;
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e8e8e8;
}

.user-table td {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.user-table tr:hover {
  background: #fafafa;
}

/* 状态标签 */
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-active {
  background: #e6f7e6;
  color: #52c41a;
}

.status-disabled {
  background: #fff1f0;
  color: #ff4d4f;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-view,
.btn-delete {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-view {
  background: #e6f7ff;
  color: #1890ff;
}

.btn-view:hover {
  background: #1890ff;
  color: white;
}

.btn-delete {
  background: #fff1f0;
  color: #ff4d4f;
}

.btn-delete:hover {
  background: #ff4d4f;
  color: white;
}

/* 统计信息 */
.stats-info {
  background: white;
  padding: 16px 20px;
  border-radius: 8px;
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
}
</style>
