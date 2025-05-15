<script setup lang="ts">
/**
 * @description 高级图表容器组件
 *
 * 该组件为图表提供统一的容器，实现以下功能：
 * 1. 提供展开/收起功能，允许用户放大查看图表详情
 * 2. 通过provide/inject向子组件提供展开状态
 * 3. 在展开状态下显示覆盖层和关闭按钮
 * 4. 自适应布局，确保图表在各种状态下正确显示
 * 5. 科技感的动画效果和统一的深色风格设计
 */
import { ref, provide, onMounted } from 'vue'

// 图表容器组件
const isExpanded = ref(false)

// 提供给子组件的状态
provide('isChartExpanded', isExpanded)

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

const closeExpand = () => {
  isExpanded.value = false
}

// 容器引用
const chartContainerRef = ref(null)

// 在挂载时添加进入动画
onMounted(() => {
  if (chartContainerRef.value) {
    const container = chartContainerRef.value as HTMLElement
    container.classList.add('chart-container-enter')

    // 错开动画开始时间，实现级联动画效果
    setTimeout(() => {
      container.classList.remove('chart-container-enter')
      container.classList.add('chart-container-active')
    }, Math.random() * 300)
  }
})
</script>

<template>
  <div class="chart-container" ref="chartContainerRef">
    <div class="chart-background-effects">
      <div class="chart-grid"></div>
      <div class="chart-glow"></div>
    </div>

    <div class="chart-header">
      <div class="expand-button" @click="toggleExpand" :title="isExpanded ? '折叠图表' : '展开图表'">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path
            v-if="!isExpanded"
            fill="currentColor"
            d="M10,21V19H6.41L10.91,14.5L9.5,13.09L5,17.59V14H3V21H10M14.5,10.91L19,6.41V10H21V3H14V5H17.59L13.09,9.5L14.5,10.91Z"
          />
          <path
            v-else
            fill="currentColor"
            d="M19.5,3.09L15,7.59V4H13V11H20V9H16.41L20.91,4.5L19.5,3.09M4,13V15H7.59L3.09,19.5L4.5,20.91L9,16.41V20H11V13H4Z"
          />
        </svg>
      </div>
    </div>

    <div class="chart-content">
      <slot></slot>
    </div>

    <div class="chart-border-effect top-left"></div>
    <div class="chart-border-effect top-right"></div>
    <div class="chart-border-effect bottom-left"></div>
    <div class="chart-border-effect bottom-right"></div>
  </div>

  <!-- 展开后的浮层 -->
  <Transition name="overlay-fade">
    <div v-if="isExpanded" class="expanded-overlay" @click="closeExpand">
      <Transition name="container-zoom">
        <div class="expanded-container" @click.stop>
          <div class="expanded-background-effects">
            <div class="expanded-grid"></div>
            <div class="expanded-glow"></div>
          </div>

          <div class="expanded-header">
            <div class="expanded-title">
              <div class="title-icon">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path
                    fill="currentColor"
                    d="M16,18L18.29,15.71L13.41,10.83L9.41,14.83L2,7.41L3.41,6L9.41,12L13.41,8L19.71,14.29L22,12V18H16Z"
                  />
                </svg>
              </div>
              <span>详细视图</span>
            </div>

            <div class="close-button" @click="closeExpand" title="关闭">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path
                  fill="currentColor"
                  d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"
                />
              </svg>
            </div>
          </div>

          <div class="expanded-content">
            <slot name="expanded" v-if="$slots.expanded"></slot>
            <slot v-else></slot>
          </div>

          <div class="expanded-border-effect top-left"></div>
          <div class="expanded-border-effect top-right"></div>
          <div class="expanded-border-effect bottom-left"></div>
          <div class="expanded-border-effect bottom-right"></div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
/* 主容器样式  */
.chart-container {
  background: linear-gradient(135deg, rgba(13, 25, 50, 0.95), rgba(16, 30, 60, 0.95));
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(32, 160, 255, 0.2);
  border-radius: 8px;
  margin-bottom: 10px;
  overflow: hidden;
  height: calc(33.33% - 8px);
  display: flex;
  flex-direction: column;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(5px);
  outline: 2px solid rgba(32, 160, 255, 0.4);
  outline-offset: 0px;
}

/* 悬停效果 */
.chart-container:hover {
  outline-color: rgba(64, 169, 255, 0.6);
  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.35),
    0 0 25px rgba(32, 160, 255, 0.3);
}

/* 脉动边框效果 */
@keyframes border-pulse {
  0% {
    outline-color: rgba(32, 160, 255, 0.4);
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.3),
      0 0 20px rgba(32, 160, 255, 0.2);
  }
  50% {
    outline-color: rgba(64, 169, 255, 0.6);
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.3),
      0 0 25px rgba(64, 169, 255, 0.3);
  }
  100% {
    outline-color: rgba(32, 160, 255, 0.4);
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.3),
      0 0 20px rgba(32, 160, 255, 0.2);
  }
}

.chart-container {
  animation: border-pulse 4s ease-in-out infinite;
}

/* 容器进入动画 */
.chart-container-enter {
  opacity: 0;
  transform: translateY(20px);
}

.chart-container-active {
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity 0.5s ease,
    transform 0.5s cubic-bezier(0.19, 1, 0.22, 1);
}

/* 背景特效 */
.chart-background-effects {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 0;
}

.chart-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(32, 160, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(32, 160, 255, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  z-index: 1;
  opacity: 0.3;
}

.chart-glow {
  position: absolute;
  top: -80px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 160px;
  background: radial-gradient(ellipse at center, rgba(32, 160, 255, 0.15) 0%, rgba(32, 160, 255, 0) 70%);
  z-index: 2;
}

/* 角落边框特效 */
.chart-border-effect {
  position: absolute;
  width: 16px;
  height: 16px;
  z-index: 10;
  pointer-events: none;
}

.top-left {
  top: 0;
  left: 0;
  background:
    linear-gradient(45deg, transparent 50%, rgba(64, 169, 255, 0.7) 50%) no-repeat 0 0 / 8px 8px,
    linear-gradient(to right, rgba(64, 169, 255, 0.7) 2px, transparent 2px) no-repeat 7px 0 / 10px 2px,
    linear-gradient(to bottom, rgba(64, 169, 255, 0.7) 2px, transparent 2px) no-repeat 0 7px / 2px 10px;
  filter: drop-shadow(0 0 3px rgba(64, 169, 255, 0.3));
}

.top-right {
  top: 0;
  right: 0;
  background:
    linear-gradient(135deg, transparent 50%, rgba(64, 169, 255, 0.7) 50%) no-repeat 100% 0 / 8px 8px,
    linear-gradient(to left, rgba(64, 169, 255, 0.7) 2px, transparent 2px) no-repeat 0 0 / 10px 2px,
    linear-gradient(to bottom, rgba(64, 169, 255, 0.7) 2px, transparent 2px) no-repeat 100% 7px / 2px 10px;
  filter: drop-shadow(0 0 3px rgba(64, 169, 255, 0.3));
}

.bottom-left {
  bottom: 0;
  left: 0;
  background:
    linear-gradient(315deg, transparent 50%, rgba(64, 169, 255, 0.7) 50%) no-repeat 0 100% / 8px 8px,
    linear-gradient(to right, rgba(64, 169, 255, 0.7) 2px, transparent 2px) no-repeat 7px 100% / 10px 2px,
    linear-gradient(to top, rgba(64, 169, 255, 0.7) 2px, transparent 2px) no-repeat 0 0 / 2px 10px;
  filter: drop-shadow(0 0 3px rgba(64, 169, 255, 0.3));
}

.bottom-right {
  bottom: 0;
  right: 0;
  background:
    linear-gradient(225deg, transparent 50%, rgba(64, 169, 255, 0.7) 50%) no-repeat 100% 100% / 8px 8px,
    linear-gradient(to left, rgba(64, 169, 255, 0.7) 2px, transparent 2px) no-repeat 0 100% / 10px 2px,
    linear-gradient(to top, rgba(64, 169, 255, 0.7) 2px, transparent 2px) no-repeat 100% 0 / 2px 10px;
  filter: drop-shadow(0 0 3px rgba(64, 169, 255, 0.3));
}

/* 角点发光点 */
.chart-border-effect::after {
  content: '';
  position: absolute;
  width: 3px;
  height: 3px;
  background-color: rgba(100, 200, 255, 0.9);
  border-radius: 50%;
  box-shadow: 0 0 6px 1px rgba(64, 169, 255, 0.6);
}

.top-left::after {
  top: 0;
  left: 0;
}

.top-right::after {
  top: 0;
  right: 0;
}

.bottom-left::after {
  bottom: 0;
  left: 0;
}

.bottom-right::after {
  bottom: 0;
  right: 0;
}

/* 头部样式 */
.chart-header {
  display: flex;
  justify-content: flex-end;
  padding: 10px;
  position: absolute;
  top: 0;
  right: 0;
  z-index: 15;
}

.expand-button {
  cursor: pointer;
  color: rgba(140, 190, 240, 0.9);
  background: rgba(15, 30, 60, 0.7);
  border: 1px solid rgba(32, 160, 255, 0.3);
  border-radius: 4px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.expand-button:hover {
  color: rgba(220, 230, 240, 0.95);
  background-color: rgba(32, 160, 255, 0.2);
  border-color: rgba(32, 160, 255, 0.5);
  box-shadow: 0 2px 8px rgba(32, 160, 255, 0.3);
  transform: translateY(-1px);
}

.expand-button:active {
  transform: translateY(1px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* 内容区域 */
.chart-content {
  padding: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 5;
}

/* 展开浮层样式 */
.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.3s ease;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

.expanded-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(5, 10, 25, 0.8);
  backdrop-filter: blur(6px);
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container-zoom-enter-active {
  animation: container-zoom-in 0.4s cubic-bezier(0.19, 1, 0.22, 1);
}

.container-zoom-leave-active {
  animation: container-zoom-out 0.3s cubic-bezier(0.19, 1, 0.22, 1);
}

@keyframes container-zoom-in {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes container-zoom-out {
  from {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(0.9);
    opacity: 0;
  }
}

/* 浮层容器 */
.expanded-container {
  background: linear-gradient(135deg, rgba(15, 28, 55, 0.95), rgba(20, 35, 70, 0.95));
  outline: 2px solid rgba(64, 169, 255, 0.5);
  outline-offset: 0px;
  border-radius: 10px;
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.4),
    0 0 30px rgba(32, 160, 255, 0.25);
  width: 85%;
  height: 85%;
  max-width: 1300px;
  max-height: 850px;
  display: flex;
  flex-direction: column;
  position: relative;
  pointer-events: auto;
  overflow: hidden;
}

/* 展开容器背景特效 */
.expanded-background-effects {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 0;
}

.expanded-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(32, 160, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(32, 160, 255, 0.05) 1px, transparent 1px);
  background-size: 30px 30px;
  z-index: 1;
  opacity: 0.3;
}

.expanded-glow {
  position: absolute;
  top: -200px;
  left: 50%;
  transform: translateX(-50%);
  width: 500px;
  height: 300px;
  background: radial-gradient(ellipse at center, rgba(32, 160, 255, 0.15) 0%, rgba(32, 160, 255, 0) 70%);
  z-index: 2;
}

/* 展开容器边框特效 */
.expanded-border-effect {
  position: absolute;
  width: 30px;
  height: 30px;
  z-index: 3;
  pointer-events: none;
}

.expanded-border-effect.top-left {
  top: 0;
  left: 0;
  background:
    linear-gradient(45deg, transparent 50%, rgba(64, 169, 255, 0.7) 50%) no-repeat 0 0 / 12px 12px,
    linear-gradient(to right, rgba(64, 169, 255, 0.7) 2px, transparent 2px) no-repeat 10px 0 / 22px 2px,
    linear-gradient(to bottom, rgba(64, 169, 255, 0.7) 2px, transparent 2px) no-repeat 0 10px / 2px 22px;
  filter: drop-shadow(0 0 4px rgba(64, 169, 255, 0.3));
}

.expanded-border-effect.top-right {
  top: 0;
  right: 0;
  background:
    linear-gradient(135deg, transparent 50%, rgba(64, 169, 255, 0.7) 50%) no-repeat 100% 0 / 12px 12px,
    linear-gradient(to left, rgba(64, 169, 255, 0.7) 2px, transparent 2px) no-repeat 0 0 / 22px 2px,
    linear-gradient(to bottom, rgba(64, 169, 255, 0.7) 2px, transparent 2px) no-repeat 100% 10px / 2px 22px;
  filter: drop-shadow(0 0 4px rgba(64, 169, 255, 0.3));
}

.expanded-border-effect.bottom-left {
  bottom: 0;
  left: 0;
  background:
    linear-gradient(315deg, transparent 50%, rgba(64, 169, 255, 0.7) 50%) no-repeat 0 100% / 12px 12px,
    linear-gradient(to right, rgba(64, 169, 255, 0.7) 2px, transparent 2px) no-repeat 10px 100% / 22px 2px,
    linear-gradient(to top, rgba(64, 169, 255, 0.7) 2px, transparent 2px) no-repeat 0 0 / 2px 22px;
  filter: drop-shadow(0 0 4px rgba(64, 169, 255, 0.3));
}

.expanded-border-effect.bottom-right {
  bottom: 0;
  right: 0;
  background:
    linear-gradient(225deg, transparent 50%, rgba(64, 169, 255, 0.7) 50%) no-repeat 100% 100% / 12px 12px,
    linear-gradient(to left, rgba(64, 169, 255, 0.7) 2px, transparent 2px) no-repeat 0 100% / 22px 2px,
    linear-gradient(to top, rgba(64, 169, 255, 0.7) 2px, transparent 2px) no-repeat 100% 0 / 2px 22px;
  filter: drop-shadow(0 0 4px rgba(64, 169, 255, 0.3));
}

/* 角点发光点-展开容器 */
.expanded-border-effect::after {
  content: '';
  position: absolute;
  width: 4px;
  height: 4px;
  background-color: rgba(100, 200, 255, 0.9);
  border-radius: 50%;
  box-shadow: 0 0 8px 1px rgba(64, 169, 255, 0.6);
}

.expanded-border-effect.top-left::after {
  top: 0;
  left: 0;
}

.expanded-border-effect.top-right::after {
  top: 0;
  right: 0;
}

.expanded-border-effect.bottom-left::after {
  bottom: 0;
  left: 0;
}

.expanded-border-effect.bottom-right::after {
  bottom: 0;
  right: 0;
}

/* 头部样式 */
.expanded-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid rgba(32, 160, 255, 0.15);
  position: relative;
  z-index: 5;
}

.expanded-title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(220, 230, 240, 0.9);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.title-icon {
  color: #20a0ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button {
  cursor: pointer;
  color: rgba(140, 190, 240, 0.9);
  background: rgba(15, 30, 60, 0.7);
  border: 1px solid rgba(32, 160, 255, 0.3);
  border-radius: 4px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.close-button:hover {
  color: rgba(255, 120, 120, 0.95);
  background-color: rgba(180, 30, 30, 0.15);
  border-color: rgba(255, 120, 120, 0.5);
  box-shadow: 0 2px 8px rgba(255, 100, 100, 0.2);
  transform: translateY(-1px);
}

.close-button:active {
  transform: translateY(1px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.expanded-content {
  flex: 1;
  padding: 5px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 5;
}
</style>
