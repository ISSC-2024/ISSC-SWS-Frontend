<script setup lang="ts">
/**
 * @description 应用头部组件
 *
 * 该组件显示应用的顶部标题栏，包含以下功能：
 * 1. 可配置的应用标题显示
 * 2. 可配置的Logo图标类型（通用/化工行业专用）
 * 3. 实时显示当前系统时间，每秒更新一次
 * 4. 高科技暗色调界面设计，增强用户体验
 * 5. 响应式布局设计
 * 6. 动态视觉效果
 */
import { ref, onMounted, computed } from 'vue'
import AuthService from '@/services/AuthService'

// 定义组件props
interface Props {
  title?: string
  logoType?: 'generic' | 'chemical'
}

const props = withDefaults(defineProps<Props>(), {
  title: '全域互联的工业智能体协同平台',
  logoType: 'generic',
})

// 计算属性：根据logoType决定显示的标题
const displayTitle = computed(() => {
  if (props.logoType === 'chemical') {
    return '化工行业-全域互联的工业智能体协同平台'
  }
  return props.title
})

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
        <!-- 全域互联的工业智能体协同平台图标 -->
        <svg v-if="props.logoType === 'generic'" viewBox="0 0 24 24" width="28" height="28">
          <!-- 中央智能体核心 -->
          <g fill="currentColor">
            <!-- 中央处理核心 -->
            <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2.2" opacity="0.9" />
            <circle cx="12" cy="12" r="1.2" fill="currentColor" opacity="0.8" />

            <!-- 核心脉冲环 -->
            <circle
              cx="12"
              cy="12"
              r="2"
              fill="none"
              stroke="currentColor"
              stroke-width="0.8"
              opacity="0.4"
              stroke-dasharray="2,1"
            />
          </g>

          <!-- 四个行业智能体节点 -->
          <g fill="currentColor" opacity="0.85">
            <!-- 化工行业节点（左上） - 分子结构 -->
            <g transform="translate(5,5)">
              <circle cx="0" cy="0" r="1.8" fill="currentColor" opacity="0.3" />
              <circle cx="0" cy="0" r="0.6" fill="currentColor" />
              <circle cx="1.2" cy="0.8" r="0.4" fill="currentColor" opacity="0.7" />
              <path d="M0 0 L1.2 0.8" stroke="currentColor" stroke-width="1" />
            </g>

            <!-- 钢铁行业节点（右上） - 齿轮 -->
            <g transform="translate(19,5)">
              <circle cx="0" cy="0" r="1.8" fill="currentColor" opacity="0.3" />
              <path
                d="M-1.2,-1.2 L1.2,-1.2 L1.2,1.2 L-1.2,1.2 Z"
                fill="none"
                stroke="currentColor"
                stroke-width="1.2"
              />
              <circle cx="0" cy="0" r="0.5" fill="currentColor" />
            </g>

            <!-- 新能源行业节点（左下） - 闪电/能源 -->
            <g transform="translate(5,19)">
              <circle cx="0" cy="0" r="1.8" fill="currentColor" opacity="0.3" />
              <path
                d="M-0.8,-1 L0.3,-0.2 L-0.3,0.2 L0.8,1"
                stroke="currentColor"
                stroke-width="1.4"
                stroke-linecap="round"
              />
            </g>

            <!-- 医药行业节点（右下） - 十字 -->
            <g transform="translate(19,19)">
              <circle cx="0" cy="0" r="1.8" fill="currentColor" opacity="0.3" />
              <path d="M0,-1.2 L0,1.2 M-1.2,0 L1.2,0" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
            </g>
          </g>

          <!-- 全域互联网络连接 -->
          <g stroke="currentColor" fill="none" opacity="0.6">
            <!-- 主连接线 - 形成网状结构 -->
            <path d="M6.8 6.8 L10.2 10.2" stroke-width="1.5" stroke-linecap="round" />
            <path d="M17.2 6.8 L13.8 10.2" stroke-width="1.5" stroke-linecap="round" />
            <path d="M6.8 17.2 L10.2 13.8" stroke-width="1.5" stroke-linecap="round" />
            <path d="M17.2 17.2 L13.8 13.8" stroke-width="1.5" stroke-linecap="round" />

            <!-- 横向和纵向连接 -->
            <path d="M5 12 L9 12" stroke-width="1.2" stroke-linecap="round" />
            <path d="M15 12 L19 12" stroke-width="1.2" stroke-linecap="round" />
            <path d="M12 5 L12 9" stroke-width="1.2" stroke-linecap="round" />
            <path d="M12 15 L12 19" stroke-width="1.2" stroke-linecap="round" />
          </g>

          <!-- 数据流动指示器 -->
          <g fill="currentColor" opacity="0.7">
            <!-- 流动箭头 - 顺时针方向 -->
            <path
              d="M8.5 8.5 L9.5 9.5 L8.5 10.5"
              fill="none"
              stroke="currentColor"
              stroke-width="1"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M15.5 8.5 L14.5 9.5 L15.5 10.5"
              fill="none"
              stroke="currentColor"
              stroke-width="1"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M15.5 15.5 L14.5 14.5 L15.5 13.5"
              fill="none"
              stroke="currentColor"
              stroke-width="1"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M8.5 15.5 L9.5 14.5 L8.5 13.5"
              fill="none"
              stroke="currentColor"
              stroke-width="1"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </g>

          <!-- 协同标识 - 外围轨道 -->
          <g fill="none" stroke="currentColor" opacity="0.4">
            <circle cx="12" cy="12" r="10" stroke-width="0.8" stroke-dasharray="3,2" />
          </g>
        </svg>

        <!-- 化工行业特色图标 - 锥形烧瓶 -->
        <svg v-else-if="props.logoType === 'chemical'" viewBox="0 0 24 24" width="28" height="28">
          <!-- 锥形烧瓶主体 -->
          <g fill="currentColor">
            <!-- 烧瓶颈部 -->
            <path
              d="M10.5 4 L10.5 8 L13.5 8 L13.5 4"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
            />

            <!-- 烧瓶口 -->
            <path d="M9.5 4 L14.5 4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />

            <!-- 锥形瓶身 -->
            <path
              d="M10.5 8 L7 18 Q7 19.5 8.5 19.5 L15.5 19.5 Q17 19.5 17 18 L13.5 8"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linejoin="round"
            />

            <!-- 液体 -->
            <path
              d="M10.8 9 L8 17.5 Q8 18.5 9 18.5 L15 18.5 Q16 18.5 16 17.5 L13.2 9"
              fill="currentColor"
              opacity="0.25"
            />

            <!-- 动态气泡 - 将通过CSS动画控制 -->
            <circle class="bubble bubble-1" cx="10" cy="16" r="0.6" fill="currentColor" opacity="0.5" />
            <circle class="bubble bubble-2" cx="12" cy="15" r="0.4" fill="currentColor" opacity="0.6" />
            <circle class="bubble bubble-3" cx="14" cy="17" r="0.5" fill="currentColor" opacity="0.4" />
            <circle class="bubble bubble-4" cx="11" cy="13" r="0.3" fill="currentColor" opacity="0.7" />
            <circle class="bubble bubble-5" cx="13.5" cy="14" r="0.35" fill="currentColor" opacity="0.5" />
          </g>
        </svg>

        <!-- 添加光环效果 -->
        <div class="logo-halo"></div>
      </div>
      <div class="logo-text-container">
        <span class="logo-text">{{ displayTitle }}</span>
        <span class="logo-shine"></span>
        <span class="logo-underline"></span>
        <div class="text-particles">
          <span class="particle" v-for="n in 5" :key="n"></span>
        </div>
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
  border-bottom: 1px solid rgba(64, 169, 255, 0.5);
}

.app-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    to right,
    rgba(32, 160, 255, 0.2),
    rgba(32, 160, 255, 0.7) 20%,
    rgba(64, 169, 255, 0.8) 50%,
    rgba(32, 160, 255, 0.7) 80%,
    rgba(32, 160, 255, 0.2)
  );
  box-shadow: 0 0 6px rgba(32, 160, 255, 0.6);
  z-index: 10;
}

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

.logo {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logo-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(32, 160, 255, 0.8), rgba(64, 128, 255, 0.8));
  box-shadow:
    0 0 15px rgba(32, 160, 255, 0.5),
    0 0 30px rgba(32, 160, 255, 0.2),
    inset 0 0 8px rgba(255, 255, 255, 0.6);
  color: rgba(255, 255, 255, 0.95);
  animation: iconPulse 4s infinite alternate;
  z-index: 2;
}

/* 光环效果 */
.logo-halo {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: transparent;
  border: 2px solid rgba(32, 160, 255, 0.4);
  box-shadow: 0 0 20px rgba(32, 160, 255, 0.4);
  animation: haloGlow 3s infinite alternate;
  z-index: -1;
}

/* Logo动画 */
@keyframes iconPulse {
  0% {
    box-shadow:
      0 0 15px rgba(32, 160, 255, 0.5),
      0 0 30px rgba(32, 160, 255, 0.2),
      inset 0 0 8px rgba(255, 255, 255, 0.6);
    transform: scale(1);
  }
  100% {
    box-shadow:
      0 0 25px rgba(32, 160, 255, 0.7),
      0 0 40px rgba(32, 160, 255, 0.3),
      inset 0 0 12px rgba(255, 255, 255, 0.8);
    transform: scale(1.05);
  }
}

@keyframes haloGlow {
  0% {
    opacity: 0.5;
    transform: scale(1);
  }
  100% {
    opacity: 0.8;
    transform: scale(1.15);
  }
}

/* 标题容器样式 */
.logo-text-container {
  position: relative;
  padding-bottom: 4px;
  z-index: 1;
  overflow: hidden;
}

/* 标题文本样式 */
.logo-text {
  position: relative;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 1px;
  background: linear-gradient(90deg, #4a90e2, #20a0ff, #75d0ff, #20a0ff, #4a90e2);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: enhancedGradientText 8s linear infinite;
  text-shadow: 0 0 5px rgba(32, 160, 255, 0.3);
  z-index: 2;
}

/* 滑动光泽效果 */
.logo-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: skewX(-25deg);
  animation: shineSweep 5s infinite;
  z-index: 3;
}

.logo-underline {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: 100%;
  background: linear-gradient(
    to right,
    rgba(74, 144, 226, 0),
    rgba(74, 144, 226, 0.6) 20%,
    rgba(100, 180, 255, 0.8) 50%,
    rgba(74, 144, 226, 0.6) 80%,
    rgba(74, 144, 226, 0)
  );
  animation: underlinePulse 3s infinite alternate;
}

/* 粒子效果装饰 */
.text-particles {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 2px;
  height: 2px;
  background-color: rgba(100, 200, 255, 0.8);
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(100, 200, 255, 0.6);
  animation: particleFloat 10s infinite linear;
}

.particle:nth-child(1) {
  top: 20%;
  left: 10%;
  animation-duration: 7s;
  animation-delay: 0s;
}

.particle:nth-child(2) {
  top: 30%;
  left: 30%;
  animation-duration: 9s;
  animation-delay: 0.5s;
}

.particle:nth-child(3) {
  top: 60%;
  left: 50%;
  animation-duration: 8s;
  animation-delay: 1s;
}

.particle:nth-child(4) {
  top: 40%;
  left: 70%;
  animation-duration: 10s;
  animation-delay: 1.5s;
}

.particle:nth-child(5) {
  top: 20%;
  left: 90%;
  animation-duration: 6s;
  animation-delay: 2s;
}

/* 渐变文本动画 */
@keyframes enhancedGradientText {
  0% {
    background-position: 0% center;
    filter: brightness(1) drop-shadow(0 0 1px rgba(32, 160, 255, 0.3));
  }
  50% {
    background-position: 100% center;
    filter: brightness(1.1) drop-shadow(0 0 2px rgba(32, 160, 255, 0.5));
  }
  100% {
    background-position: 0% center;
    filter: brightness(1) drop-shadow(0 0 1px rgba(32, 160, 255, 0.3));
  }
}

/* 滑动光泽动画 */
@keyframes shineSweep {
  0% {
    left: -100%;
  }
  20% {
    left: 100%;
  }
  100% {
    left: 100%;
  }
}

/* 粒子浮动动画 */
@keyframes particleFloat {
  0% {
    transform: translate(0, 0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translate(20px, -15px);
    opacity: 0;
  }
}

/* 底部下划线动画 */
@keyframes underlinePulse {
  0% {
    width: 90%;
    left: 5%;
    opacity: 0.7;
    box-shadow: 0 0 5px rgba(100, 180, 255, 0.3);
  }
  100% {
    width: 100%;
    left: 0;
    opacity: 1;
    box-shadow: 0 0 8px rgba(100, 180, 255, 0.5);
  }
}

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
    width: 36px;
    height: 36px;
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

/* 化工烧瓶气泡动画 */
.bubble {
  animation: bubbleFloat 3s infinite ease-in-out;
  transform-origin: center center;
}

.bubble-1 {
  animation-delay: 0s;
  animation-duration: 2.8s;
}

.bubble-2 {
  animation-delay: 0.6s;
  animation-duration: 3.2s;
}

.bubble-3 {
  animation-delay: 1.2s;
  animation-duration: 2.5s;
}

.bubble-4 {
  animation-delay: 1.8s;
  animation-duration: 3.5s;
}

.bubble-5 {
  animation-delay: 2.4s;
  animation-duration: 2.9s;
}

/* 气泡浮动动画 */
@keyframes bubbleFloat {
  0% {
    transform: translateY(0) scale(1);
    opacity: 0.4;
  }
  25% {
    transform: translateY(-1px) scale(1.1);
    opacity: 0.7;
  }
  50% {
    transform: translateY(-2px) scale(0.9);
    opacity: 0.8;
  }
  75% {
    transform: translateY(-3px) scale(1.05);
    opacity: 0.6;
  }
  100% {
    transform: translateY(-4px) scale(0.8);
    opacity: 0.3;
  }
}

/* 为化工Logo添加整体的微妙脉冲效果 */
.logo-icon svg[v-if*='chemical'] {
  animation: chemicalPulse 4s infinite ease-in-out;
}

@keyframes chemicalPulse {
  0%,
  100% {
    filter: brightness(1) drop-shadow(0 0 2px rgba(255, 255, 255, 0.2));
  }
  50% {
    filter: brightness(1.1) drop-shadow(0 0 4px rgba(255, 255, 255, 0.3));
  }
}
</style>
