<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1>星轨Runner</h1>
        <p>Web 管理端</p>
      </div>

      <div v-if="!selectedRole" class="role-selection">
        <h2>请选择登录角色</h2>
        <div class="role-buttons">
          <button @click="selectRole('staff')" class="role-btn staff-btn">
            工作人员
          </button>
          <button @click="selectRole('admin')" class="role-btn admin-btn">
            管理员
          </button>
        </div>
      </div>

      <div v-else class="login-form">
        <h2>{{ selectedRole === 'staff' ? '工作人员登录' : '管理员登录' }}</h2>

        <div class="form-item">
          <label>用户名</label>
          <input
              v-model="username"
              type="text"
              placeholder="请输入用户名"
              @keyup.enter="onLogin"
          />
        </div>

        <div class="form-item">
          <label>密码</label>
          <input
              v-model="password"
              type="password"
              placeholder="请输入密码"
              @keyup.enter="onLogin"
          />
        </div>

        <div v-if="errorMsg" class="error-msg">
          {{ errorMsg }}
        </div>

        <button
            @click="onLogin"
            :disabled="loading"
            class="login-btn"
        >
          {{ loading ? '登录中...' : '登录' }}
        </button>

        <div class="back-btn" @click="selectedRole = null">
          ← 返回角色选择
        </div>

        <div class="tips">
          <p>💡 请使用分配的账号密码登录系统</p>
          <p v-if="selectedRole === 'staff'">工作人员请联系管理员获取账号</p>
          <p v-if="selectedRole === 'admin'">管理员请使用管理员账号登录</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { setAuth } from '../utils/auth.js'
// 导入登录函数
import { loginStaff } from '../api/staff'
import { loginAdmin } from '../api/admin'

const router = useRouter()
const store = useStore()
const selectedRole = ref(null)
const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

function selectRole(role) {
  selectedRole.value = role
  username.value = ''
  password.value = ''
  errorMsg.value = ''
}

async function onLogin() {
  // 表单验证
  if (!username.value || !password.value) {
    errorMsg.value = '请输入用户名和密码'
    return
  }

  errorMsg.value = ''
  loading.value = true

  try {
    if (selectedRole.value === 'staff') {
      // 工作人员登录：调用 loginStaff 函数
      const staffInfo = await loginStaff(username.value, password.value)
      handleStaffLoginSuccess(staffInfo)
    } else {
      // 管理员登录：调用 loginAdmin 函数
      const adminInfo = await loginAdmin(username.value, password.value)
      handleAdminLoginSuccess(adminInfo)
    }
  } catch (e) {
    // 根据错误类型显示不同的错误信息
    if (e.message.includes('密码错误') || e.message.includes('用户名或密码错误')) {
      errorMsg.value = '用户名或密码错误'
      password.value = '' // 清空密码输入框
    } else if (e.message.includes('用户不存在')) {
      errorMsg.value = '用户不存在或账号已停用'
      username.value = ''
      password.value = ''
    } else if (e.message.includes('网络连接失败')) {
      errorMsg.value = '网络连接失败，请检查网络后重试'
    } else if (e.message.includes('云函数')) {
      errorMsg.value = '系统功能未就绪，请稍后重试'
    } else {
      errorMsg.value = e.message || '登录失败，请稍后重试'
    }
  } finally {
    loading.value = false
  }
}

// 工作人员登录成功处理
function handleStaffLoginSuccess(staffInfo) {
  // 创建模拟的token和用户信息
  const token = `staff_token_${Date.now()}`
  const userData = {
    id: staffInfo._id,
    username: staffInfo.username,
    role: 'staff',
    campus: staffInfo.campus,
  }

  // 保存认证信息
  setAuth(token, userData)

  // 更新store状态
  const storeData = {
    success: true,
    token: token,
    user: userData
  }

  store.commit('SET_USER', storeData)

  // 跳转到工作人员管理页面
  if (router.hasRoute('StaffAudit')) {
    router.push({ name: 'StaffAudit' })
  } else {
    router.push('/staff/audit')
  }
}

// 管理员登录成功处理
function handleAdminLoginSuccess(adminInfo) {
  // 创建模拟的token和用户信息
  const token = `admin_token_${Date.now()}`
  const userData = {
    id: adminInfo._id,
    username: adminInfo.username,
    name: adminInfo.real_name || adminInfo.username,
    role: 'admin',
    last_login_at: adminInfo.last_login_at
  }

  // 保存认证信息
  setAuth(token, userData)

  // 更新store状态
  const storeData = {
    success: true,
    token: token,
    user: userData
  }

  store.commit('SET_USER', storeData)

  // 跳转到管理员管理页面
  if (router.hasRoute('AdminOverview')) {
    router.push({ name: 'AdminOverview' })
  } else {
    router.push('/admin/overview')
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background-color: #f8f9fa;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.login-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 400px;
  overflow: hidden;
}

.login-header {
  background-color: #2c3e50;
  color: white;
  padding: 24px;
  text-align: center;
  border-bottom: 1px solid #eee;
}

.login-header h1 {
  margin: 0 0 8px 0;
  font-size: 30px;
  font-weight: 600;
}

.login-header p {
  margin: 0;
  font-size: 16px;
  color: #ecf0f1;
}

.role-selection {
  padding: 32px 24px;
  text-align: center;
}

.role-selection h2 {
  margin: 0 0 24px 0;
  font-size: 22px;
  color: #333;
  font-weight: 500;
}

.role-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.role-btn {
  padding: 16px 24px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 150px;
  background-color: white;
}

.staff-btn {
  border-color: #3498db;
  color: #3498db;
}

.admin-btn {
  border-color: #e74c3c;
  color: #e74c3c;
}

.staff-btn:hover {
  background-color: #ebf5fb;
  border-color: #2980b9;
}

.admin-btn:hover {
  background-color: #fdedec;
  border-color: #c0392b;
}

.login-form {
  padding: 24px;
}

.login-form h2 {
  margin: 0 0 24px 0;
  font-size: 22px;
  color: #333;
  text-align: center;
  font-weight: 500;
}

.form-item {
  margin-bottom: 20px;
}

.form-item label {
  display: block;
  margin-bottom: 6px;
  color: #555;
  font-size: 16px;
  font-weight: 500;
}

.form-item input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  box-sizing: border-box;
  transition: border-color 0.2s;
  color: #333;
}

.form-item input:focus {
  outline: none;
  border-color: #3498db;
}

.error-msg {
  background-color: #fdedec;
  color: #e74c3c;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 16px;
  text-align: center;
  border: 1px solid #fadbd8;
}

.login-btn {
  width: 100%;
  padding: 12px;
  background-color: #2c3e50;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 8px;
}

.login-btn:hover:not(:disabled) {
  background-color: #34495e;
}

.login-btn:active:not(:disabled) {
  background-color: #1a252f;
}

.login-btn:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.back-btn {
  margin-top: 20px;
  text-align: center;
  color: #3498db;
  cursor: pointer;
  font-size: 16px;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background-color: #ebf5fb;
}

.tips {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.tips p {
  margin: 0 0 8px 0;
  font-size: 15px;
  color: #7f8c8d;
  text-align: center;
  line-height: 1.5;
}

.tips p:last-child {
  margin-bottom: 0;
}
</style>