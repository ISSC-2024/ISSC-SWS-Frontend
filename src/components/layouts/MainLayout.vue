<script setup lang="ts">
/**
 * @description 主布局组件
 *
 * 该组件实现应用的三列式主布局结构，包含以下功能：
 * 1. 左侧列：用于显示多个图表组件
 * 2. 中间列：主要包含WebGL内容区、控制按钮区和资源展示区
 * 3. 右侧列：用于显示多个图表组件
 * 4. 通过插槽机制实现灵活的内容嵌套
 * 5. 响应式设计，提供合理的空间分配和美观的滚动条样式
 */
// 主布局组件，实现三列式布局
</script>

<template>
  <div class="dashboard-container">
    <!-- 左侧列 -->
    <div class="left-column">
      <div class="column-content">
        <slot name="left-column"></slot>
      </div>
    </div>

    <!-- 中间列 -->
    <div class="middle-column">
      <div class="webgl-container tech-container">
        <!-- 添加四角装饰 -->
        <div class="webgl-corner webgl-corner-top-left"></div>
        <div class="webgl-corner webgl-corner-top-right"></div>
        <div class="webgl-corner webgl-corner-bottom-left"></div>
        <div class="webgl-corner webgl-corner-bottom-right"></div>

        <!-- 旋转光环特效 -->
        <div class="orbit-container">
          <div class="orbit orbit-1">
            <div class="orbital-dot"></div>
          </div>
          <div class="orbit orbit-2">
            <div class="orbital-dot"></div>
          </div>
          <div class="orbit orbit-3">
            <div class="orbital-dot"></div>
          </div>
        </div>

        <!-- 扫描线效果 -->
        <div class="scan-line-horizontal"></div>
        <div class="scan-line-vertical"></div>

        <!-- 数据线装饰 -->
        <div class="data-line data-line-1"></div>
        <div class="data-line data-line-2"></div>
        <div class="data-line data-line-3"></div>
        <div class="data-line data-line-4"></div>

        <!-- 脉冲波纹 -->
        <div class="pulse-ring"></div>

        <slot name="webgl-content"></slot>
      </div>

      <div class="controls-container tech-container">
        <div class="corner corner-top-left"></div>
        <div class="corner corner-top-right"></div>
        <div class="corner corner-bottom-left"></div>
        <div class="corner corner-bottom-right"></div>
        <slot name="controls"></slot>
      </div>

      <div class="resources-container tech-container">
        <div class="corner corner-top-left"></div>
        <div class="corner corner-top-right"></div>
        <div class="corner corner-bottom-left"></div>
        <div class="corner corner-bottom-right"></div>
        <slot name="resources"></slot>
      </div>
    </div>

    <!-- 右侧列 -->
    <div class="right-column">
      <div class="column-content">
        <slot name="right-column"></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(8, 16, 35, 0.97), rgba(12, 24, 48, 0.97));
  position: relative;
}

/* 全局网格背景效果 */
.dashboard-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(to bottom, transparent 49.75%, rgba(32, 160, 255, 0.05) 50%, transparent 50.25%),
    linear-gradient(90deg, rgba(32, 160, 255, 0.03) 1px, transparent 1px),
    linear-gradient(rgba(32, 160, 255, 0.03) 1px, transparent 1px);
  background-size:
    100% 10px,
    20px 20px,
    20px 20px;
  opacity: 0.5;
  pointer-events: none;
  z-index: 0;
}

.left-column,
.right-column {
  width: 20%;
  height: 100%;
  padding: 10px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  position: relative;
}

.column-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.middle-column {
  width: 60%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px 0;
  gap: 12px;
  position: relative;
  z-index: 1;
}

/* 主要容器通用样式 */
.tech-container {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background-color: rgba(15, 25, 50, 0.7);
  transition: all 0.3s ease;
  box-sizing: border-box;
}

/* WebGL 容器样式  */
.webgl-container {
  flex: 1;
  min-height: 65%;
  position: relative;
  margin: 0 10px;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  border: 3px solid rgba(180, 220, 255, 0.8);
  box-shadow:
    0 0 0 1px rgba(200, 240, 255, 0.4),
    0 0 25px rgba(100, 200, 255, 0.5),
    inset 0 0 20px rgba(100, 200, 255, 0.15);
  animation: pulse-border-enhanced 5s ease-in-out infinite;
  backdrop-filter: blur(1px);
}

/* 多层边框效果  */
.webgl-container::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 5px;
  padding: 2px;
  background: linear-gradient(
    45deg,
    rgba(180, 220, 255, 0.9),
    rgba(220, 240, 255, 1),
    rgba(150, 210, 255, 0.8),
    rgba(200, 240, 255, 1),
    rgba(180, 220, 255, 0.9)
  );
  background-size: 400% 400%;
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  z-index: 2;
  filter: drop-shadow(0 0 3px rgba(100, 200, 255, 0.5));
  animation: border-gradient 8s infinite linear;
}

/* 内侧阴影发光效果 */
.webgl-container::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 5px;
  box-shadow:
    inset 0 0 15px rgba(100, 200, 255, 0.6),
    inset 0 0 7px rgba(220, 240, 255, 0.4);
  pointer-events: none;
  z-index: 1;
  animation: inner-glow-pulse 4s infinite ease-in-out;
}

/* WebGL容器角落装饰 */
.webgl-corner {
  position: absolute;
  width: 28px;
  height: 28px;
  z-index: 6;
  pointer-events: none;
}

.webgl-corner-top-left {
  top: 0;
  left: 0;
  background:
    linear-gradient(45deg, transparent 50%, rgba(180, 220, 255, 0.9) 50%) no-repeat 0 0 / 14px 14px,
    linear-gradient(to right, rgba(180, 220, 255, 0.9) 2.5px, transparent 2.5px) no-repeat 12px 0 / 18px 2.5px,
    linear-gradient(to bottom, rgba(180, 220, 255, 0.9) 2.5px, transparent 2.5px) no-repeat 0 12px / 2.5px 18px;
  filter: drop-shadow(0 0 6px rgba(100, 200, 255, 0.7));
}

.webgl-corner-top-right {
  top: 0;
  right: 0;
  background:
    linear-gradient(135deg, transparent 50%, rgba(180, 220, 255, 0.9) 50%) no-repeat 100% 0 / 14px 14px,
    linear-gradient(to left, rgba(180, 220, 255, 0.9) 2.5px, transparent 2.5px) no-repeat 0 0 / 18px 2.5px,
    linear-gradient(to bottom, rgba(180, 220, 255, 0.9) 2.5px, transparent 2.5px) no-repeat 100% 12px / 2.5px 18px;
  filter: drop-shadow(0 0 6px rgba(100, 200, 255, 0.7));
}

.webgl-corner-bottom-left {
  bottom: 0;
  left: 0;
  background:
    linear-gradient(315deg, transparent 50%, rgba(180, 220, 255, 0.9) 50%) no-repeat 0 100% / 14px 14px,
    linear-gradient(to right, rgba(180, 220, 255, 0.9) 2.5px, transparent 2.5px) no-repeat 12px 100% / 18px 2.5px,
    linear-gradient(to top, rgba(180, 220, 255, 0.9) 2.5px, transparent 2.5px) no-repeat 0 0 / 2.5px 18px;
  filter: drop-shadow(0 0 6px rgba(100, 200, 255, 0.7));
}

.webgl-corner-bottom-right {
  bottom: 0;
  right: 0;
  background:
    linear-gradient(225deg, transparent 50%, rgba(180, 220, 255, 0.9) 50%) no-repeat 100% 100% / 14px 14px,
    linear-gradient(to left, rgba(180, 220, 255, 0.9) 2.5px, transparent 2.5px) no-repeat 0 100% / 18px 2.5px,
    linear-gradient(to top, rgba(180, 220, 255, 0.9) 2.5px, transparent 2.5px) no-repeat 100% 0 / 2.5px 18px;
  filter: drop-shadow(0 0 6px rgba(100, 200, 255, 0.7));
}

/* 角点发光效果 */
.webgl-corner::after {
  content: '';
  position: absolute;
  width: 5px;
  height: 5px;
  background-color: rgba(220, 240, 255, 1);
  border-radius: 50%;
  box-shadow: 0 0 8px 2px rgba(100, 200, 255, 0.9);
  animation: corner-pulse 3s infinite alternate;
}

.webgl-corner-top-left::after {
  top: 0;
  left: 0;
}

.webgl-corner-top-right::after {
  top: 0;
  right: 0;
}

.webgl-corner-bottom-left::after {
  bottom: 0;
  left: 0;
}

.webgl-corner-bottom-right::after {
  bottom: 0;
  right: 0;
}

/* 旋转光环特效 */
.orbit-container {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1px;
  height: 1px;
  transform: translate(-50%, -50%);
  z-index: 4;
  pointer-events: none;
}

.orbit {
  position: absolute;
  border: 1px dashed rgba(100, 200, 255, 0.3);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.orbit-1 {
  width: 150px;
  height: 150px;
  animation: orbit-rotation 12s linear infinite;
}

.orbit-2 {
  width: 250px;
  height: 250px;
  animation: orbit-rotation 18s linear infinite reverse;
}

.orbit-3 {
  width: 350px;
  height: 350px;
  animation: orbit-rotation 24s linear infinite;
}

.orbital-dot {
  position: absolute;
  width: 6px;
  height: 6px;
  background-color: rgba(220, 240, 255, 1);
  border-radius: 50%;
  top: -3px;
  left: 50%;
  transform: translateX(-50%);
  box-shadow:
    0 0 8px 2px rgba(100, 200, 255, 0.7),
    0 0 12px 6px rgba(100, 200, 255, 0.3);
  filter: blur(0.5px);
}

/* 扫描线效果 */
.scan-line-horizontal,
.scan-line-vertical {
  position: absolute;
  background: linear-gradient(
    90deg,
    rgba(100, 200, 255, 0),
    rgba(200, 240, 255, 0.8),
    rgba(220, 250, 255, 1),
    rgba(200, 240, 255, 0.8),
    rgba(100, 200, 255, 0)
  );
  pointer-events: none;
  z-index: 3;
  filter: blur(1px);
}

.scan-line-horizontal {
  height: 2px;
  width: 100%;
  top: 0;
  left: 0;
  animation: scan-horizontal 8s infinite;
}

.scan-line-vertical {
  height: 100%;
  width: 2px;
  top: 0;
  left: 0;
  background: linear-gradient(
    0deg,
    rgba(100, 200, 255, 0),
    rgba(200, 240, 255, 0.8),
    rgba(220, 250, 255, 1),
    rgba(200, 240, 255, 0.8),
    rgba(100, 200, 255, 0)
  );
  animation: scan-vertical 10s infinite;
}

/* 数据线装饰 */
.data-line {
  position: absolute;
  z-index: 3;
  pointer-events: none;
  opacity: 0.8;
}

.data-line-1 {
  top: 20px;
  right: 20px;
  width: 80px;
  height: 2px;
  background: linear-gradient(90deg, rgba(100, 200, 255, 0) 0%, rgba(180, 220, 255, 0.9) 100%);
  animation: data-line-flash 3s infinite alternate;
}

.data-line-2 {
  top: 30px;
  right: 20px;
  width: 30px;
  height: 2px;
  background: linear-gradient(90deg, rgba(100, 200, 255, 0) 0%, rgba(180, 220, 255, 0.9) 100%);
  animation: data-line-flash 2s infinite alternate 0.5s;
}

.data-line-3 {
  bottom: 20px;
  left: 20px;
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, rgba(180, 220, 255, 0.9) 0%, rgba(100, 200, 255, 0) 100%);
  animation: data-line-flash 2.5s infinite alternate;
}

.data-line-4 {
  left: 20px;
  bottom: 30px;
  width: 30px;
  height: 2px;
  background: linear-gradient(90deg, rgba(180, 220, 255, 0.9) 0%, rgba(100, 200, 255, 0) 100%);
  animation: data-line-flash 3.5s infinite alternate 0.5s;
}

/* 脉冲波纹 */
.pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
  border-radius: 50%;
  box-sizing: border-box;
  animation: pulse-ring 6s infinite;
  z-index: 2;
  pointer-events: none;
}

.controls-container,
.resources-container {
  position: relative;
  margin: 0 10px;
  border: 2px solid rgba(64, 169, 255, 0.4);
  box-shadow:
    0 0 0 1px rgba(100, 200, 255, 0.15),
    0 0 15px rgba(64, 169, 255, 0.2),
    inset 0 0 10px rgba(64, 169, 255, 0.05);
}

.controls-container {
  height: 8%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.resources-container {
  height: 27%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 四角元素样式 */
.corner {
  position: absolute;
  pointer-events: none;
  width: 16px;
  height: 16px;
}

/* L形角装饰 */
.corner-top-left {
  top: 3px;
  left: 3px;
  background:
    linear-gradient(to right, rgba(64, 169, 255, 0.7) 2px, transparent 2px) no-repeat 0 0 / 10px 2px,
    linear-gradient(to bottom, rgba(64, 169, 255, 0.7) 2px, transparent 2px) no-repeat 0 0 / 2px 10px;
  filter: drop-shadow(0 0 3px rgba(64, 169, 255, 0.4));
}

.corner-top-right {
  top: 3px;
  right: 3px;
  background:
    linear-gradient(to left, rgba(64, 169, 255, 0.7) 2px, transparent 2px) no-repeat 100% 0 / 10px 2px,
    linear-gradient(to bottom, rgba(64, 169, 255, 0.7) 2px, transparent 2px) no-repeat 100% 0 / 2px 10px;
  filter: drop-shadow(0 0 3px rgba(64, 169, 255, 0.4));
}

.corner-bottom-left {
  bottom: 3px;
  left: 3px;
  background:
    linear-gradient(to right, rgba(64, 169, 255, 0.7) 2px, transparent 2px) no-repeat 0 100% / 10px 2px,
    linear-gradient(to top, rgba(64, 169, 255, 0.7) 2px, transparent 2px) no-repeat 0 100% / 2px 10px;
  filter: drop-shadow(0 0 3px rgba(64, 169, 255, 0.4));
}

.corner-bottom-right {
  bottom: 3px;
  right: 3px;
  background:
    linear-gradient(to left, rgba(64, 169, 255, 0.7) 2px, transparent 2px) no-repeat 100% 100% / 10px 2px,
    linear-gradient(to top, rgba(64, 169, 255, 0.7) 2px, transparent 2px) no-repeat 100% 100% / 2px 10px;
  filter: drop-shadow(0 0 3px rgba(64, 169, 255, 0.4));
}

/* 角点效果 */
.corner::after {
  content: '';
  position: absolute;
  width: 3px;
  height: 3px;
  background-color: rgba(100, 200, 255, 0.9);
  border-radius: 50%;
  box-shadow: 0 0 4px 1px rgba(64, 169, 255, 0.7);
}

.corner-top-left::after {
  top: -1px;
  left: -1px;
}

.corner-top-right::after {
  top: -1px;
  right: -1px;
}

.corner-bottom-left::after {
  bottom: -1px;
  left: -1px;
}

.corner-bottom-right::after {
  bottom: -1px;
  right: -1px;
}

.controls-container:hover .corner,
.resources-container:hover .corner {
  filter: drop-shadow(0 0 5px rgba(64, 169, 255, 0.6));
}

.controls-container:hover .corner::after,
.resources-container:hover .corner::after {
  background-color: rgba(128, 220, 255, 1);
  box-shadow: 0 0 6px 2px rgba(64, 169, 255, 0.8);
}

.controls-container::before,
.resources-container::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 6px;
  padding: 1px;
  background: linear-gradient(45deg, rgba(64, 169, 255, 0.5), rgba(100, 200, 255, 0.6), rgba(64, 169, 255, 0.5));
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  z-index: 2;
  opacity: 0.7;
}

/* 次要容器边框脉冲动画 */
@keyframes pulse-border-secondary {
  0% {
    border-color: rgba(64, 169, 255, 0.4);
    box-shadow:
      0 0 0 1px rgba(100, 200, 255, 0.15),
      0 0 15px rgba(64, 169, 255, 0.2),
      inset 0 0 10px rgba(64, 169, 255, 0.05);
  }
  50% {
    border-color: rgba(64, 169, 255, 0.6);
    box-shadow:
      0 0 0 1px rgba(100, 200, 255, 0.2),
      0 0 20px rgba(64, 169, 255, 0.3),
      inset 0 0 15px rgba(64, 169, 255, 0.1);
  }
  100% {
    border-color: rgba(64, 169, 255, 0.4);
    box-shadow:
      0 0 0 1px rgba(100, 200, 255, 0.15),
      0 0 15px rgba(64, 169, 255, 0.2),
      inset 0 0 10px rgba(64, 169, 255, 0.05);
  }
}

.controls-container,
.resources-container {
  animation: pulse-border-secondary 4s ease-in-out infinite;
}

/* WebGL边框增强脉冲动画 */
@keyframes pulse-border-enhanced {
  0% {
    border-color: rgba(180, 220, 255, 0.8);
    box-shadow:
      0 0 0 1px rgba(200, 240, 255, 0.4),
      0 0 25px rgba(100, 200, 255, 0.5),
      inset 0 0 20px rgba(100, 200, 255, 0.15);
  }
  50% {
    border-color: rgba(230, 245, 255, 0.9);
    box-shadow:
      0 0 0 1px rgba(230, 250, 255, 0.6),
      0 0 35px rgba(120, 210, 255, 0.7),
      inset 0 0 30px rgba(120, 210, 255, 0.25);
  }
  100% {
    border-color: rgba(180, 220, 255, 0.8);
    box-shadow:
      0 0 0 1px rgba(200, 240, 255, 0.4),
      0 0 25px rgba(100, 200, 255, 0.5),
      inset 0 0 20px rgba(100, 200, 255, 0.15);
  }
}

/* 内部发光效果动画 */
@keyframes inner-glow-pulse {
  0% {
    box-shadow:
      inset 0 0 15px rgba(100, 200, 255, 0.6),
      inset 0 0 7px rgba(220, 240, 255, 0.4);
  }
  50% {
    box-shadow:
      inset 0 0 22px rgba(120, 210, 255, 0.7),
      inset 0 0 10px rgba(230, 250, 255, 0.5);
  }
  100% {
    box-shadow:
      inset 0 0 15px rgba(100, 200, 255, 0.6),
      inset 0 0 7px rgba(220, 240, 255, 0.4);
  }
}

/* 角点发光动画 */
@keyframes corner-pulse {
  0% {
    opacity: 0.85;
    transform: scale(1);
    box-shadow: 0 0 8px 2px rgba(100, 200, 255, 0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1.15);
    box-shadow: 0 0 12px 3px rgba(150, 220, 255, 1);
  }
}

/* 旋转轨道动画 */
@keyframes orbit-rotation {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

/* 水平扫描线动画 */
@keyframes scan-horizontal {
  0%,
  100% {
    top: 0;
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  45% {
    opacity: 1;
  }
  55% {
    opacity: 0;
  }
  90% {
    top: 100%;
    opacity: 0;
  }
}

/* 垂直扫描线动画 */
@keyframes scan-vertical {
  0%,
  100% {
    left: 0;
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  40% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  85% {
    left: 100%;
    opacity: 0;
  }
}

/* 数据线闪烁动画 */
@keyframes data-line-flash {
  0% {
    opacity: 0.4;
    width: 0;
  }
  100% {
    opacity: 0.9;
    width: 100%;
  }
}

/* 边框渐变动画 */
@keyframes border-gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 脉冲波纹动画 */
@keyframes pulse-ring {
  0% {
    box-shadow: 0 0 0 0 rgba(100, 200, 255, 0.3);
    opacity: 0.7;
  }
  30% {
    box-shadow: 0 0 0 100px rgba(100, 200, 255, 0);
    opacity: 0;
  }
  60% {
    box-shadow: 0 0 0 0 rgba(100, 200, 255, 0);
    opacity: 0;
  }
  61% {
    box-shadow: 0 0 0 0 rgba(100, 200, 255, 0.3);
    opacity: 0.7;
  }
  100% {
    box-shadow: 0 0 0 150px rgba(100, 200, 255, 0);
    opacity: 0;
  }
}

/* WebGL容器悬停效果 */
.webgl-container:hover {
  border-color: rgba(220, 240, 255, 0.9);
  box-shadow:
    0 0 0 1px rgba(220, 250, 255, 0.6),
    0 0 35px rgba(120, 210, 255, 0.6),
    inset 0 0 25px rgba(120, 210, 255, 0.2);
}

.webgl-container:hover .webgl-corner {
  filter: drop-shadow(0 0 8px rgba(150, 220, 255, 0.8));
}

.webgl-container:hover .webgl-corner::after {
  background-color: rgba(240, 250, 255, 1);
  box-shadow: 0 0 12px 3px rgba(150, 220, 255, 1);
}

.webgl-container:hover .orbit {
  border-color: rgba(120, 210, 255, 0.5);
}

.webgl-container:hover .orbital-dot {
  background-color: rgba(255, 255, 255, 1);
  box-shadow:
    0 0 12px 3px rgba(150, 220, 255, 0.9),
    0 0 20px 10px rgba(150, 220, 255, 0.4);
}

@media (max-width: 1200px) {
  .left-column,
  .right-column {
    padding: 8px;
  }

  .column-content {
    gap: 10px;
  }

  .middle-column {
    gap: 8px;
  }

  .webgl-container,
  .controls-container,
  .resources-container {
    margin: 0 8px;
  }

  .corner {
    width: 12px;
    height: 12px;
  }

  .corner-top-left,
  .corner-top-right,
  .corner-bottom-left,
  .corner-bottom-right {
    background-size:
      8px 2px,
      2px 8px;
  }

  .webgl-corner {
    width: 20px;
    height: 20px;
  }

  .orbit-1 {
    width: 100px;
    height: 100px;
  }

  .orbit-2 {
    width: 180px;
    height: 180px;
  }

  .orbit-3 {
    width: 260px;
    height: 260px;
  }
}
</style>
