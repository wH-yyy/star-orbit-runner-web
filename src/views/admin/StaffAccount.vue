<script setup>
import { ref, onMounted } from 'vue';
import { addStaff, getStaffList, updateStaffStatus } from '@/api/admin.js';
import { showSuccess, showError } from '@/utils/toast.js';

// 工作人员账号数据
const staffAccounts = ref([]);
const listLoading = ref(false);

// 加载工作人员列表
const loadStaffList = async () => {
  listLoading.value = true;
  try {
    const result = await getStaffList();
    staffAccounts.value = result.map(staff => ({
      ...staff,
      status: staff.status === 0 ? '启用' : '禁用',
      completed_count: staff.completed_count || 0,
      assigned_count: staff.assigned_count || 0
    }));
  } catch (error) {
    console.error('加载工作人员列表失败:', error);
    errorMsg.value = '加载工作人员列表失败';
  } finally {
    listLoading.value = false;
  }
};

// 新账号表单数据
const newAccount = ref({
  username: '',
  password: '',
  campus: ''
});

// 校区选项
const campusOptions = [
  { value: '兴庆校区', label: '兴庆校区' },
  { value: '雁塔校区', label: '雁塔校区' },
];

const loading = ref(false);
const errorMsg = ref('');

// 创建新账号
const createAccount = async () => {
  errorMsg.value = '';

  if (!newAccount.value.username) {
    errorMsg.value = '请输入用户名';
    return;
  }
  if (!newAccount.value.password) {
    errorMsg.value = '请输入密码';
    return;
  }
  if (!newAccount.value.campus) {
    errorMsg.value = '请选择校区';
    return;
  }

  const usernameRegex = /^[a-zA-Z0-9]{3,20}$/;
  if (!usernameRegex.test(newAccount.value.username)) {
    errorMsg.value = '用户名应为3-20位字母数字组合';
    return;
  }

  if (newAccount.value.password.length < 6) {
    errorMsg.value = '密码长度至少6位';
    return;
  }

  loading.value = true;
  try {
    const result = await addStaff(
        newAccount.value.username,
        newAccount.value.password,
        newAccount.value.campus
    );

    // 重置表单
    newAccount.value = { username: '', password: '', campus: '' };
    showSuccess('✅ 工作账号创建成功！\n用户名：' + result.username);
    await loadStaffList(); // 重新获取最新列表
  } catch (error) {
    console.error('创建工作账号失败:', error);
    if (error.message.includes('已存在')) {
      errorMsg.value = `用户名 "${newAccount.value.username}" 已被使用，请换一个用户名`;
    } else if (error.message.includes('网络')) {
      errorMsg.value = '网络连接失败，请检查网络设置后重试';
    } else {
      errorMsg.value = error.message || '创建工作账号失败，请检查网络后重试';
    }
  } finally {
    loading.value = false;
  }
};

// 切换账号状态
const toggleStatus = async (staffId) => {
  const account = staffAccounts.value.find(a => a._id === staffId);
  if (!account) return;

  const oldStatus = account.status;
  const newStatus = account.status === '启用' ? '禁用' : '启用';

  try {
    await updateStaffStatus(staffId, newStatus === '启用' ? 0 : 1);
    account.status = newStatus;
  } catch (error) {
    console.error('更新账号状态失败:', error);
    showError('更新状态失败：' + (error.message || '请稍后重试'));
    account.status = oldStatus;
  }
};

onMounted(() => {
  loadStaffList();
});
</script>

<template>
  <div class="staff-account-page">
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
          <label class="form-label">密码</label>
          <input
              type="password"
              v-model="newAccount.password"
              class="form-input"
              placeholder="请输入密码"
          />
        </div>
        <div class="form-item">
          <label class="form-label">校区</label>
          <select v-model="newAccount.campus" class="form-select">
            <option value="">请选择校区</option>
            <option v-for="option in campusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="errorMsg" class="error-msg">
        {{ errorMsg }}
      </div>
      <div class="form-actions">
        <button @click="createAccount" :disabled="loading" class="btn btn-primary">
          {{ loading ? '创建中...' : '创建账号' }}
        </button>
      </div>
    </div>

    <!-- 账号列表 -->
    <div class="account-list-section">
      <h3>现有账号</h3>
      <div v-if="listLoading" class="loading-state">
        <p>加载中...</p>
      </div>
      <div v-else class="account-table-container">
        <table class="account-table">
          <thead>
          <tr>
            <th>序号</th>
            <th>用户名</th>
            <th>校区</th>
            <th>已完成数</th>
            <th>已分配数</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(account, index) in staffAccounts" :key="account._id" class="account-row">
            <td>{{ index + 1 }}</td>
            <td>{{ account.username }}</td>
            <td>{{ account.campus || '-' }}</td>
            <td>{{ account.completed_count || 0 }}</td>
            <td>{{ account.assigned_count || 0 }}</td>
            <td>
                <span :class="['status-badge', `status-${account.status}`]">
                  {{ account.status }}
                </span>
            </td>
            <td>
              <button
                  @click="toggleStatus(account._id)"
                  :class="['btn', account.status === '启用' ? 'btn-warning' : 'btn-success']"
              >
                {{ account.status === '启用' ? '禁用' : '启用' }}
              </button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!listLoading && staffAccounts.length === 0" class="empty-state">
        <p>暂无工作账号，请创建新账号</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.staff-account-page {
  width: 100%;
  padding: 0;
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
  font-size: 18px;
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
  font-size: 16px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
}

.form-input,
.form-select {
  width: 85%;
  padding: 10px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 16px;
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

.error-msg {
  background: #fee;
  color: #c33;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 15px;
  font-size: 16px;
  text-align: center;
}

.form-actions {
  margin-top: 20px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
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
  font-size: 18px;
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
  font-size: 16px;
  color: #303133;
  white-space: nowrap;
}

.account-table td {
  font-size: 16px;
  color: #606266;
}

.account-row:hover {
  background-color: rgba(64, 158, 255, 0.05);
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
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

.loading-state {
  padding: 64px 24px;
  text-align: center;
  color: #409eff;
  font-size: 16px;
}

.empty-state {
  padding: 64px 24px;
  text-align: center;
  color: #909399;
  font-size: 16px;
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