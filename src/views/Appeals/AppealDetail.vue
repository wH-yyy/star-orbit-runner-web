<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 申诉详情
const appeal = ref(null)
const loading = ref(false)

// 回复内容
const replyContent = ref('')

// 加载申诉详情
const loadDetail = () => {
  loading.value = true
  const appealId = route.params.id
  console.log('加载申诉详情，ID:', appealId)
  
  setTimeout(() => {
    // 模拟数据
    appeal.value = {
      id: appealId,
      title: '账号被误封',
      user: '张三',
      userId: 1001,
      status: 'pending',
      priority: 'high',
      createTime: '2024-05-20 10:30:00',
      description: '我的账号昨天突然被封禁了，但我并没有违反任何规定。请帮忙核查，谢谢！',
      replies: [
        { user: '客服小王', time: '2024-05-20 11:00', content: '您好，我们正在核查您的情况...' }
      ]
    }
    loading.value = false
  }, 800)
}

// 返回列表
const goBack = () => {
  router.push('/appeals')
}

// 提交回复
const submitReply = () => {
  if (!replyContent.value.trim()) {
    alert('请输入回复内容')
    return
  }
  
  console.log('提交回复:', replyContent.value)
  
  // 添加到回复列表
  appeal.value.replies.push({
    user: '管理员',
    time: new Date().toLocaleString('zh-CN'),
    content: replyContent.value
  })
  
  replyContent.value = ''
  alert('回复成功！')
}

// 更新状态
const updateStatus = (newStatus) => {
  if (confirm('确定要更新申诉状态吗？')) {
    console.log('更新状态为:', newStatus)
    appeal.value.status = newStatus
    alert('状态更新成功！')
  }
}

onMounted(() => {
  loadDetail()
})
</script>

<template>
  <div class="appeal-detail">
    <div class="header-actions">
      <button @click="goBack" class="back-btn">← 返回列表</button>
      <h2 class="page-title">📝 申诉详情</h2>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="appeal" class="detail-content">
      <!-- 基本信息 -->
      <div class="info-card">
        <h3>基本信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>申诉编号：</label>
            <span>{{ appeal.id }}</span>
          </div>
          <div class="info-item">
            <label>申诉标题：</label>
            <span class="title">{{ appeal.title }}</span>
          </div>
          <div class="info-item">
            <label>申诉人：</label>
            <span>{{ appeal.user }} (ID: {{ appeal.userId }})</span>
          </div>
          <div class="info-item">
            <label>创建时间：</label>
            <span>{{ appeal.createTime }}</span>
          </div>
          <div class="info-item">
            <label>优先级：</label>
            <span :class="'priority-' + appeal.priority">{{ appeal.priority }}</span>
          </div>
          <div class="info-item">
            <label>状态：</label>
            <span :class="'status-' + appeal.status">{{ appeal.status }}</span>
          </div>
        </div>
      </div>

      <!-- 申诉内容 -->
      <div class="content-card">
        <h3>申诉内容</h3>
        <p class="description">{{ appeal.description }}</p>
      </div>

      <!-- 回复记录 -->
      <div class="reply-card">
        <h3>回复记录 ({{ appeal.replies.length }})</h3>
        <div class="reply-list">
          <div v-for="(reply, index) in appeal.replies" :key="index" class="reply-item">
            <div class="reply-header">
              <strong>{{ reply.user }}</strong>
              <span class="time">{{ reply.time }}</span>
            </div>
            <div class="reply-content">{{ reply.content }}</div>
          </div>
        </div>

        <!-- 添加回复 -->
        <div class="add-reply">
          <h4>添加回复</h4>
          <textarea 
            v-model="replyContent" 
            placeholder="请输入回复内容..."
            rows="4"
          ></textarea>
          <button @click="submitReply" class="submit-btn">提交回复</button>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-card">
        <h3>处理操作</h3>
        <div class="action-buttons">
          <button @click="updateStatus('processing')" class="btn-processing">
            标记为处理中
          </button>
          <button @click="updateStatus('resolved')" class="btn-resolved">
            标记为已解决
          </button>
          <button @click="updateStatus('rejected')" class="btn-rejected">
            驳回申诉
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.appeal-detail {
  max-width: 900px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.back-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.back-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.page-title {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.loading {
  background: white;
  padding: 60px;
  text-align: center;
  border-radius: 8px;
  color: #999;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 卡片样式 */
.info-card,
.content-card,
.reply-card,
.action-card {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #333;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 12px;
}

h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #555;
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  gap: 8px;
}

.info-item label {
  color: #999;
  font-size: 14px;
  min-width: 80px;
}

.info-item span {
  color: #333;
  font-size: 14px;
}

.info-item .title {
  font-weight: 600;
  color: #1890ff;
}

/* 内容 */
.description {
  color: #555;
  line-height: 1.8;
  margin: 0;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
}

/* 回复列表 */
.reply-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.reply-item {
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  border-left: 3px solid #1890ff;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.reply-header strong {
  color: #333;
  font-size: 14px;
}

.time {
  color: #999;
  font-size: 12px;
}

.reply-content {
  color: #555;
  font-size: 14px;
  line-height: 1.6;
}

/* 添加回复 */
.add-reply textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
}

.add-reply textarea:focus {
  outline: none;
  border-color: #1890ff;
}

.submit-btn {
  margin-top: 12px;
  padding: 10px 24px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.submit-btn:hover {
  background: #40a9ff;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-buttons button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-processing {
  background: #e6f7ff;
  color: #1890ff;
}

.btn-processing:hover {
  background: #1890ff;
  color: white;
}

.btn-resolved {
  background: #f6ffed;
  color: #52c41a;
}

.btn-resolved:hover {
  background: #52c41a;
  color: white;
}

.btn-rejected {
  background: #fff1f0;
  color: #ff4d4f;
}

.btn-rejected:hover {
  background: #ff4d4f;
  color: white;
}
</style>
