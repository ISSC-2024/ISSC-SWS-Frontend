<script setup lang="ts">
/**
 * @description 应用头部组件
 *
 * 该组件显示应用的顶部标题栏，包含以下功能：
 * 1. 显示应用名称"全域互联的工业智能体协同平台"
 * 2. 实时显示当前系统时间，每秒更新一次
 * 3. 高科技暗色调界面设计，增强用户体验
 * 4. 响应式布局设计
 * 5. 动态视觉效果
 */
import { ref, onMounted } from 'vue'
import AuthService from '../../services/AuthService'

// 时间显示逻辑
const currentTime = ref(new Date().toLocaleTimeString())
const currentDate = ref(formatDate(new Date()))

// 格式化日期为 YYYY-MM-DD 星期X
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const weekDay = weekDays[date.getDay()]

  return `${year}-${month}-${day} 星期${weekDay}`
}

// 登出函数
const handleLogout = async () => {
  try {
    // 等待登出操作完成
    await AuthService.logout()
    // 登出完成后跳转
    window.location.href = '/login'
  } catch (error) {
    console.error('登出失败:', error)
  }
}

onMounted(() => {
  // 设置时间更新
  setInterval(() => {
    const now = new Date()
    currentTime.value = now.toLocaleTimeString()
    currentDate.value = formatDate(now)
  }, 1000)
})
</script>

<template>
  <header class="app-header">
    <div class="header-bg-effects">
      <div class="header-glow"></div>
      <div class="header-grid"></div>
    </div>

    <div class="logo">
      <div class="logo-icon">
        <svg viewBox="0 0 24 24" width="28" height="28">
          <path
            fill="currentColor"
            d="M12,3C7.58,3 4,4.79 4,7C4,9.21 7.58,11 12,11C16.42,11 20,9.21 20,7C20,4.79 16.42,3 12,3M4,9V12C4,14.21 7.58,16 12,16C16.42,16 20,14.21 20,12V9C20,11.21 16.42,13 12,13C7.58,13 4,11.21 4,9M4,14V17C4,19.21 7.58,21 12,21C16.42,21 20,19.21 20,17V14C20,16.21 16.42,18 12,18C7.58,18 4,16.21 4,14Z"
          />
        </svg>
      </div>
      <div class="logo-text-container">
        <span class="logo-text">全域互联的工业智能体协同平台</span>
        <span class="logo-underline"></span>
      </div>
    </div>

    <div class="header-right">
      <div class="time-display">
        <div class="date">{{ currentDate }}</div>
        <div class="time">{{ currentTime }}</div>
      </div>

      <button @click="handleLogout" class="logout-btn" title="退出登录">
        <span class="btn-icon">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path
              fill="currentColor"
              d="M16,17V14H9V10H16V7L21,12L16,17M14,2A2,2 0 0,1 16,4V6H14V4H5V20H14V18H16V20A2,2 0 0,1 14,22H5A2,2 0 0,1 3,20V4A2,2 0 0,1 5,2H14Z"
            />
          </svg>
        </span>
        <span>退出</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  height: var(--header-height, 60px);
  background-color: rgba(11, 19, 43, 0.95);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  position: relative;
  z-index: 100;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

/* 背景效果 */
.header-bg-effects {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: -1;
}

.header-glow {
  position: absolute;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 200px;
  background: radial-gradient(ellipse at center, rgba(32, 160, 255, 0.15) 0%, rgba(32, 160, 255, 0) 70%);
  z-index: 1;
}

.header-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(32, 160, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(32, 160, 255, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  z-index: 0;
  opacity: 0.4;
}

/* Logo样式 */
.logo {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(32, 160, 255, 0.8), rgba(64, 112, 255, 0.8));
  box-shadow:
    0 0 15px rgba(32, 160, 255, 0.5),
    inset 0 0 4px rgba(255, 255, 255, 0.6);
  color: rgba(255, 255, 255, 0.95);
  animation: pulseGlow 4s infinite alternate;
}

@keyframes pulseGlow {
  0% {
    box-shadow: 0 0 15px rgba(32, 160, 255, 0.5);
  }
  100% {
    box-shadow: 0 0 25px rgba(32, 160, 255, 0.8);
  }
}

.logo-text-container {
  position: relative;
  padding-bottom: 4px;
}

.logo-text {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 1px;
  background: linear-gradient(90deg, #4a90e2, #20a0ff, #7cb3f5);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradientText 6s linear infinite;
}

.logo-underline {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: 100%;
  background: linear-gradient(to right, rgba(74, 144, 226, 0), rgba(74, 144, 226, 0.8) 50%, rgba(74, 144, 226, 0));
}

@keyframes gradientText {
  0% {
    background-position: 0% center;
  }
  100% {
    background-position: 200% center;
  }
}

/* 右侧内容 */
.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.time-display {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.2;
}

.date {
  font-size: 12px;
  color: rgba(220, 230, 240, 0.7);
  font-weight: 400;
}

.time {
  font-size: 22px;
  font-family: 'Consolas', monospace;
  color: rgba(220, 230, 240, 0.9);
  font-weight: 600;
  text-shadow: 0 0 5px rgba(32, 160, 255, 0.5);
  letter-spacing: 0.5px;
}

/* 按钮样式 */
.logout-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(220, 50, 50, 0.15);
  color: rgba(255, 160, 160, 0.9);
  border: 1px solid rgba(255, 100, 100, 0.3);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.logout-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0));
  border-radius: 4px 4px 0 0;
}

.logout-btn:hover {
  background-color: rgba(220, 50, 50, 0.25);
  border-color: rgba(255, 100, 100, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(220, 50, 50, 0.2);
}

.logout-btn:active {
  transform: translateY(1px);
  box-shadow: 0 2px 4px rgba(220, 50, 50, 0.1);
}

.btn-icon {
  display: flex;
  align-items: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-header {
    padding: 0 15px;
  }

  .logo-text {
    font-size: 18px;
  }

  .time {
    font-size: 18px;
  }

  .date {
    font-size: 10px;
  }
}

@media (max-width: 576px) {
  .logo-icon {
    width: 32px;
    height: 32px;
  }

  .logo-text {
    font-size: 16px;
  }

  .time {
    font-size: 16px;
  }

  .logout-btn {
    padding: 6px 12px;
    font-size: 12px;
  }
}
</style>
