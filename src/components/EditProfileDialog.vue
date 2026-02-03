<script setup>
import { ref, watch } from 'vue'

// 定义 props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  userInfo: {
    type: Object,
    default: () => ({
      name: '',
      email: ''
    })
  }
})

// 定义事件
const emit = defineEmits(['update:visible', 'save'])

// 表单数据
const formData = ref({ ...props.userInfo })

// 监听 userInfo 变化，更新表单数据
watch(() => props.userInfo, (newVal) => {
  formData.value = { ...newVal }
}, { deep: true })

// 关闭弹窗
const closeDialog = () => {
  emit('update:visible', false)
}

// 保存数据
const saveData = () => {
  emit('save', formData.value)
  closeDialog()
}

// 点击遮罩层关闭弹窗
const handleOverlayClick = (event) => {
  if (event.target === event.currentTarget) {
    closeDialog()
  }
}
</script>

<template>
  <div v-if="visible" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog-container">
      <!-- 弹窗标题 -->
      <div class="dialog-header">
        <h3>编辑个人信息</h3>
        <button class="dialog-close" @click="closeDialog">×</button>
      </div>

      <!-- 表单内容 -->
      <div class="dialog-body">
        <form>
          <div class="form-item">
            <label for="name">姓名</label>
            <input 
              type="text" 
              id="name" 
              v-model="formData.name" 
              placeholder="请输入姓名"
            >
          </div>
          <div class="form-item">
            <label for="email">邮箱</label>
            <input 
              type="email" 
              id="email" 
              v-model="formData.email" 
              placeholder="请输入邮箱"
            >
          </div>
          <div class="form-item">
            <label for="password">密码</label>
            <input 
              type="password" 
              id="password" 
              v-model="formData.password" 
              placeholder="请输入新密码（可选）"
            >
          </div>
        </form>
      </div>

      <!-- 弹窗底部按钮 -->
      <div class="dialog-footer">
        <button class="btn-cancel" @click="closeDialog">取消</button>
        <button class="btn-save" @click="saveData">保存</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 遮罩层样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

/* 弹窗容器样式 */
.dialog-container {
  width: 90%;
  max-width: 480px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: dialogFadeIn 0.3s ease;
}

/* 弹窗淡入动画 */
@keyframes dialogFadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 弹窗头部样式 */
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a365d;
}

.dialog-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #a0aec0;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.dialog-close:hover {
  background-color: #f7fafc;
  color: #1a365d;
}

/* 弹窗内容样式 */
.dialog-body {
  padding: 24px;
}

/* 表单项样式 */
.form-item {
  margin-bottom: 20px;
}

.form-item label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 8px;
}

.form-item input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-item input:focus {
  outline: none;
  border-color: #63b3ed;
  box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.1);
}

/* 弹窗底部样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  background-color: #f7fafc;
}

/* 按钮样式 */
.btn-cancel {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background-color: #ffffff;
  color: #4a5568;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background-color: #f7fafc;
  border-color: #cbd5e0;
}

.btn-save {
  padding: 8px 16px;
  border: 1px solid #3182ce;
  border-radius: 4px;
  background-color: #3182ce;
  color: #ffffff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-save:hover {
  background-color: #2c5282;
  border-color: #2c5282;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dialog-container {
    width: 95%;
    margin: 0 10px;
  }

  .dialog-header,
  .dialog-body,
  .dialog-footer {
    padding: 16px;
  }
}
</style>