<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'

const router = useRouter()
const store = useStore()

// 表单数据
const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

// 处理登录
const handleLogin = async () => {
  // 简单验证
  if (!username.value || !password.value) {
    errorMsg.value = '请输入用户名和密码'
    return
  }

  loading.value = true
  errorMsg.value = ''

  try {
    // 调用store的login action
    const result = await store.dispatch('login', {
      username: username.value,
      password: password.value
    })

    if (result.success) {
      // 登录成功，跳转到对应角色的首页
      if (result.role === 'admin') {
        router.push('/admin/overview')
      } else if (result.role === 'staff') {
        router.push('/staff/overview')
      } else {
        router.push('/login')
      }
    } else {
      // 登录失败，显示错误信息
      errorMsg.value = result.error || '登录失败'
    }
  } catch (error) {
    // 捕获异常
    errorMsg.value = error.message || '登录过程中发生错误'
    console.error('登录失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1>🌟 星轨Runner</h1>
        <p>Web 管理端</p>
      </div>

      <div class="login-form">
        <h2>用户登录</h2>

        <div class="form-item">
          <label>用户名</label>
          <input 
            v-model="username" 
            type="text" 
            placeholder="请输入用户名"
            @keyup.enter="handleLogin"
          />
        </div>

        <div class="form-item">
          <label>密码</label>
          <input 
            v-model="password" 
            type="password" 
            placeholder="请输入密码"
            @keyup.enter="handleLogin"
          />
        </div>

        <div v-if="errorMsg" class="error-msg">
          {{ errorMsg }}
        </div>

        <button 
          @click="handleLogin" 
          :disabled="loading"
          class="login-btn"
        >
          {{ loading ? '登录中...' : '登录' }}
        </button>

        <div class="tips">
          <p>💡 提示：这是演示系统，输入任意用户名密码即可登录</p>
        </div>
      </div>
    </div>
  </div>
</template>

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
