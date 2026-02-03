<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1>🌟 星轨Runner</h1>
        <p>Web 管理端</p>
      </div>

      <div v-if="!selectedRole" class="role-selection">
        <h2>请选择登录角色</h2>
        <div class="role-buttons">
          <button @click="selectRole('staff')" class="role-btn staff-btn">
            👥 工作人员
          </button>
          <button @click="selectRole('admin')" class="role-btn admin-btn">
            🔧 管理员
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
          <p>💡 提示：这是演示系统，输入任意用户名密码即可登录</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { login } from '../api/login'
import { setAuth } from '../utils/auth.js'

const router = useRouter()
const store = useStore()
const selectedRole = ref(null)
const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

function selectRole(role) {
  selectedRole.value = role
}

async function onLogin() {
  console.log('LOGIN CLICKED', selectedRole.value, username.value, password.value?.length)
  errorMsg.value = ''
  loading.value = true
  try {
    console.log('CALL login', selectedRole.value)
    const res = await login(username.value, password.value, selectedRole.value)
    console.log('login response:', res)

    // 更宽容地取 token/user（支持 res, res.data, res.data.data）
    const token = res?.token ?? res?.data?.token ?? res?.data?.data?.token
    const userInfo = res?.admin ?? res?.staff ?? res?.data?.admin ?? res?.data?.staff ?? res?.data?.data?.admin ?? res?.data?.data?.staff

    if (!token) {
      // 抛出带完整返回的错误，便于在控制台定位后端结构
      throw new Error('登录返回缺少 token：' + JSON.stringify(res))
    }

    setAuth(token, userInfo)
    
    // 更新store状态，确保与localStorage同步
    const storeData = {
      success: true,
      token: token,
      user: {
        id: userInfo?.id || 1,
        username: userInfo?.username || username.value,
        name: userInfo?.name || username.value,
        role: userInfo?.role || selectedRole.value,
        avatar: '👤'
      }
    }
    
    // 提交到store
    store.commit('SET_USER', storeData)
    
    // 跳转到对应角色的首页
    if (selectedRole.value === 'admin') {
      if (router.hasRoute('AdminOverview')) {
        await router.push({ name: 'AdminOverview' })
      } else {
        await router.push('/admin/overview')
      }
    } else if (selectedRole.value === 'staff') {
      if (router.hasRoute('StaffOverview')) {
        await router.push({ name: 'StaffOverview' })
      } else {
        await router.push('/staff/overview')
      }
    }
    console.log('Navigation finished')
  } catch (e) {
    console.error('Login error:', e)
    errorMsg.value = (e && e.message) ? e.message : '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.role-selection {
  padding: 30px;
  text-align: center;
}

.role-selection h2 {
  margin: 0 0 30px 0;
  font-size: 24px;
  color: #333;
}

.role-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.role-btn {
  padding: 20px 30px;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 180px;
}

.staff-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.admin-btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.role-btn:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.back-btn {
  margin-top: 20px;
  text-align: center;
  color: #667eea;
  cursor: pointer;
  font-size: 14px;
  padding: 10px;
  border-radius: 6px;
  transition: background-color 0.3s;
}

.back-btn:hover {
  background-color: rgba(102, 126, 234, 0.1);
}
</style>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.login-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  overflow: hidden;
}

.login-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  text-align: center;
}

.login-header h1 {
  margin: 0 0 10px 0;
  font-size: 32px;
}

.login-header p {
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
}

.login-form {
  padding: 30px;
}

.login-form h2 {
  margin: 0 0 25px 0;
  font-size: 24px;
  color: #333;
  text-align: center;
}

.form-item {
  margin-bottom: 20px;
}

.form-item label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
}

.form-item input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.3s;
}

.form-item input:focus {
  outline: none;
  border-color: #667eea;
}

.error-msg {
  background: #fee;
  color: #c33;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 15px;
  font-size: 14px;
  text-align: center;
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s, opacity 0.2s;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tips {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.tips p {
  margin: 0;
  font-size: 13px;
  color: #888;
  text-align: center;
  line-height: 1.5;
}
</style>
