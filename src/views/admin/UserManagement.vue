<script setup>
import { ref, computed } from 'vue';

// 模拟用户数据
const users = ref([
  { id: 1, username: '张三', studentId: '20210001', department: '计算机科学与技术', runs: 15, status: '正常' },
  { id: 2, username: '李四', studentId: '20210002', department: '电子工程', runs: 8, status: '正常' },
  { id: 3, username: '王五', studentId: '20210003', department: '机械工程', runs: 22, status: '正常' },
  { id: 4, username: '赵六', studentId: '20210004', department: '土木工程', runs: 5, status: '停跑' },
  { id: 5, username: '钱七', studentId: '20210005', department: '化学工程', runs: 12, status: '正常' },
]);

const searchQuery = ref('');
const statusFilter = ref('');

// 筛选用户
const filteredUsers = computed(() => {
  return users.value.filter(user => {
    const matchesSearch = user.username.includes(searchQuery.value) ||
        user.studentId.includes(searchQuery.value) ||
        user.department.includes(searchQuery.value);
    const matchesStatus = !statusFilter.value || user.status === statusFilter.value;
    return matchesSearch && matchesStatus;
  });
});

// 更改用户状态
const changeStatus = (userId, newStatus) => {
  const user = users.value.find(u => u.id === userId);
  if (user) {
    user.status = newStatus;
    // 这里可以添加API调用逻辑
    console.log(`用户 ${userId} 状态已更改为 ${newStatus}`);
  }
};
</script>

<template>
  <div class="user-management-page">
    <h2 class="page-title">用户管理</h2>

    <!-- 搜索和筛选区域 -->
    <div class="search-filter-section">
      <div class="search-box">
        <input
            type="text"
            v-model="searchQuery"
            placeholder="搜索用户姓名、学号或院系"
            class="search-input"
        />
      </div>
      <div class="filter-box">
        <select v-model="statusFilter" class="filter-select">
          <option value="">全部状态</option>
          <option value="正常">正常</option>
          <option value="停跑">停跑</option>
          <option value="封号">封号</option>
        </select>
      </div>
    </div>

    <!-- 用户列表 -->
    <div class="user-list-section">
      <div class="user-table-container">
        <table class="user-table">
          <thead>
          <tr>
            <th>序号</th>
            <th>姓名</th>
            <th>学号</th>
            <th>院系</th>
            <th>打卡次数</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(user, index) in filteredUsers" :key="user.id" class="user-row">
            <td>{{ index + 1 }}</td>
            <td>{{ user.username }}</td>
            <td>{{ user.studentId }}</td>
            <td>{{ user.department }}</td>
            <td>{{ user.runs }}</td>
            <td>
                <span :class="['status-badge', `status-${user.status}`]">
                  {{ user.status }}
                </span>
            </td>
            <td>
              <div class="action-buttons">
                <button
                    v-if="user.status !== '正常'"
                    @click="changeStatus(user.id, '正常')"
                    class="btn btn-primary"
                >
                  恢复正常
                </button>
                <button
                    v-if="user.status === '正常'"
                    @click="changeStatus(user.id, '停跑')"
                    class="btn btn-warning"
                >
                  停跑
                </button>
                <button
                    v-if="user.status !== '封号'"
                    @click="changeStatus(user.id, '封号')"
                    class="btn btn-danger"
                >
                  封号
                </button>
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredUsers.length === 0" class="empty-state">
        <p>未找到匹配的用户</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-management-page {
  width: 100%;
  padding: 0;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  color: #303133;
}

/* 搜索和筛选区域样式 */
.search-filter-section {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 300px;
}

.search-input {
  width: 100%;
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

.search-input::placeholder {
  color: #c0c4cc;
}

.filter-box {
  display: flex;
  align-items: center;
}

.filter-select {
  padding: 10px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  background-color: #ffffff;
  cursor: pointer;
  transition: border-color 0.3s ease;
  color: #606266;
}

.filter-select:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

/* 用户列表样式 */
.user-list-section {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.user-table-container {
  overflow-x: auto;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
}

.user-table th,
.user-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #dcdfe6;
}

.user-table th {
  background-color: #f5f7fa;
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  white-space: nowrap;
}

.user-table td {
  font-size: 14px;
  color: #606266;
}

.user-row:hover {
  background-color: rgba(64, 158, 255, 0.05);
}

/* 状态标签样式 */
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-正常 {
  background-color: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.status-停跑 {
  background-color: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
}

.status-封号 {
  background-color: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

/* 操作按钮样式 */
.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.btn-primary {
  background-color: #409eff;
  color: #fff;
  border-color: #409eff;
}

.btn-primary:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

.btn-primary:active {
  background-color: #3a8ee6;
  border-color: #3a8ee6;
}

.btn-warning {
  background-color: #e6a23c;
  color: #fff;
  border-color: #e6a23c;
}

.btn-warning:hover {
  background-color: #ebb563;
  border-color: #ebb563;
}

.btn-warning:active {
  background-color: #cf9236;
  border-color: #cf9236;
}

.btn-danger {
  background-color: #f56c6c;
  color: #fff;
  border-color: #f56c6c;
}

.btn-danger:hover {
  background-color: #f78989;
  border-color: #f78989;
}

.btn-danger:active {
  background-color: #dd6161;
  border-color: #dd6161;
}

/* 空状态样式 */
.empty-state {
  padding: 64px 24px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-filter-section {
    flex-direction: column;
  }

  .search-box {
    min-width: 100%;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    margin-bottom: 4px;
  }

  .user-table th,
  .user-table td {
    padding: 12px 8px;
  }

  .user-management-page {
    padding: 12px;
  }
}
</style>