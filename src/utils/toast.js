/**
 * 自定义消息提示工具
 * 替代浏览器原生的 alert
 */

let toastContainer = null;

// 初始化容器
function initContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'custom-toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }
}

/**
 * 显示消息提示
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型: 'success' | 'error' | 'warning' | 'info'
 * @param {number} duration - 显示时长（毫秒），默认 3000
 */
export function showToast(message, type = 'info', duration = 3000) {
  initContainer();

  const toast = document.createElement('div');
  toast.className = `custom-toast custom-toast-${type}`;
  
  // 图标映射
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  // 颜色映射
  const colors = {
    success: { bg: '#f0f9ff', border: '#67c23a', text: '#67c23a' },
    error: { bg: '#fef0f0', border: '#f56c6c', text: '#f56c6c' },
    warning: { bg: '#fdf6ec', border: '#e6a23c', text: '#e6a23c' },
    info: { bg: '#f4f4f5', border: '#909399', text: '#606266' }
  };

  const color = colors[type] || colors.info;
  
  toast.style.cssText = `
    min-width: 300px;
    max-width: 500px;
    padding: 16px 20px;
    background: ${color.bg};
    border: 1px solid ${color.border};
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    line-height: 1.5;
    pointer-events: auto;
    animation: slideInRight 0.3s ease-out;
    word-break: break-word;
  `;

  toast.innerHTML = `
    <span style="
      font-size: 20px;
      font-weight: bold;
      color: ${color.text};
      flex-shrink: 0;
    ">${icons[type]}</span>
    <span style="
      flex: 1;
      color: ${color.text};
      white-space: pre-wrap;
    ">${message}</span>
    <button style="
      background: none;
      border: none;
      color: ${color.text};
      font-size: 18px;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.6;
      transition: opacity 0.3s;
      flex-shrink: 0;
    " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'">×</button>
  `;

  // 添加动画样式
  if (!document.getElementById('custom-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'custom-toast-styles';
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
      @media (max-width: 768px) {
        #custom-toast-container {
          left: 10px;
          right: 10px;
          top: 10px;
        }
        .custom-toast {
          min-width: auto !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // 关闭按钮点击事件
  const closeBtn = toast.querySelector('button');
  closeBtn.addEventListener('click', () => {
    removeToast(toast);
  });

  toastContainer.appendChild(toast);

  // 自动关闭
  if (duration > 0) {
    setTimeout(() => {
      removeToast(toast);
    }, duration);
  }
}

// 移除 toast
function removeToast(toast) {
  toast.style.animation = 'slideOutRight 0.3s ease-in';
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

/**
 * 成功提示
 */
export function showSuccess(message, duration = 3000) {
  showToast(message, 'success', duration);
}

/**
 * 错误提示
 */
export function showError(message, duration = 4000) {
  showToast(message, 'error', duration);
}

/**
 * 警告提示
 */
export function showWarning(message, duration = 3000) {
  showToast(message, 'warning', duration);
}

/**
 * 信息提示
 */
export function showInfo(message, duration = 3000) {
  showToast(message, 'info', duration);
}

/**
 * 替代原生 alert
 * 用法： alert('消息内容')
 */
export function alert(message) {
  showInfo(message, 4000);
}

// 导出默认对象
export default {
  show: showToast,
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  alert
};
