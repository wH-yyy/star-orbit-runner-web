<script setup>
import { ref } from 'vue';

// 模拟工作人员账号数据
const staffAccounts = ref([
  { id: 1, username: 'staff1', name: '张老师', role: '审核员', status: '启用' },
  { id: 2, username: 'staff2', name: '李老师', role: '审核员', status: '启用' },
  { id: 3, username: 'staff3', name: '王老师', role: '管理员', status: '启用' },
]);

// 新账号表单数据
const newAccount = ref({
  username: '',
  name: '',
  role: '审核员'
});

// 创建新账号
const createAccount = () => {
  if (!newAccount.value.username || !newAccount.value.name) {
    alert('请填写完整的账号信息');
    return;
  }

  const account = {
    id: staffAccounts.value.length + 1,
    username: newAccount.value.username,
    name: newAccount.value.name,
    role: newAccount.value.role,
    status: '启用'
  };

  staffAccounts.value.push(account);
  console.log('创建新工作账号:', account);

  // 重置表单
  newAccount.value = {
    username: '',
    name: '',
    role: '审核员'
  };

  // 这里可以添加API调用逻辑
  alert('工作账号已创建，实际项目中会调用后端API创建账号');
};

// 切换账号状态
const toggleStatus = (userId) => {
  const account = staffAccounts.value.find(a => a.id === userId);
  if (account) {
    account.status = account.status === '启用' ? '禁用' : '启用';
    console.log(`账号 ${userId} 状态已更改为 ${account.status}`);
    // 这里可以添加API调用逻辑
  }
};
</script>

<template>
  <div class="staff-account-page">
    <h2 class="page-title">工作账号分派</h2>

    <!-- 创建新账号表单 -->
    <div class="create-account-section">
      <h3>创建新账号</h3>
      <div class="form-grid">
        <div class="form-item">
          <label class="form-label">用户名</label>
          <input
              type="text"
              v-model="newAccount.username"
              class="form-input"
              placeholder="请输入用户名"
          />
        </div>
        <div class="form-item">
          <label class="form-label">姓名</label>
          <input
              type="text"
              v-model="newAccount.name"
              class="form-input"
              placeholder="请输入姓名"
          />
        </div>
        <div class="form-item">
          <label class="form-label">角色</label>
          <select v-model="newAccount.role" class="form-select">
            <option value="审核员">审核员</option>
            <option value="管理员">管理员</option>
          </select>
        </div>
      </div>
      <div class="form-actions">
        <button @click="createAccount" class="btn btn-primary">
          创建账号
        </button>
      </div>
    </div>

    <!-- 账号列表 -->
    <div class="account-list-section">
      <h3>现有账号</h3>
      <div class="account-table-container">
        <table class="account-table">
          <thead>
          <tr>
            <th>序号</th>
            <th>用户名</th>
            <th>姓名</th>
            <th>角色</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(account, index) in staffAccounts" :key="account.id" class="account-row">
            <td>{{ index + 1 }}</td>
            <td>{{ account.username }}</td>
            <td>{{ account.name }}</td>
            <td>{{ account.role }}</td>
            <td>
                <span :class="['status-badge', `status-${account.status}`]">
                  {{ account.status }}
                </span>
            </td>
            <td>
              <button
                  @click="toggleStatus(account.id)"
                  :class="['btn', account.status === '启用' ? 'btn-warning' : 'btn-success']"
              >
                {{ account.status === '启用' ? '禁用' : '启用' }}
              </button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <!-- 空状态 -->
      <div v-if="staffAccounts.length === 0" class="empty-state">
        <p>暂无工作账号，请创建新账号</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.staff-account-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  color: #303133;
}

/* 创建新账号区域样式 */
.create-account-section {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 32px;
}

.create-account-section h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
  border-bottom: 1px solid #dcdfe6;
  padding-bottom: 8px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.form-item {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
}

.form-input,
.form-select {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s ease;
  color: #606266;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.form-input::placeholder {
  color: #c0c4cc;
}

/* 表单操作按钮样式 */
.form-actions {
  margin-top: 20px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.btn-primary {
  background-color: #409eff;
  color: #ffffff;
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
  color: #ffffff;
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

.btn-success {
  background-color: #67c23a;
  color: #ffffff;
  border-color: #67c23a;
}

.btn-success:hover {
  background-color: #85ce61;
  border-color: #85ce61;
}

.btn-success:active {
  background-color: #5daf34;
  border-color: #5daf34;
}

/* 账号列表区域样式 */
.account-list-section {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.account-list-section h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
  border-bottom: 1px solid #dcdfe6;
  padding-bottom: 8px;
}

.account-table-container {
  overflow-x: auto;
}

.account-table {
  width: 100%;
  border-collapse: collapse;
}

.account-table th,
.account-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #dcdfe6;
}

.account-table th {
  background-color: #f5f7fa;
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  white-space: nowrap;
}

.account-table td {
  font-size: 14px;
  color: #606266;
}

.account-row:hover {
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

.status-启用 {
  background-color: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.status-禁用 {
  background-color: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
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
  .form-grid {
    grid-template-columns: 1fr;
  }

  .btn {
    width: 100%;
    margin-bottom: 8px;
  }

  .account-table th,
  .account-table td {
    padding: 12px 8px;
  }

  .staff-account-page {
    padding: 12px;
  }
}
</style>