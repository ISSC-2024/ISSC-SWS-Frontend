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
        <slot name="webgl-content"></slot>
      </div>

      <div class="controls-container tech-container">
        <!-- 四角元素 -->
        <div class="corner corner-top-left"></div>
        <div class="corner corner-top-right"></div>
        <div class="corner corner-bottom-left"></div>
        <div class="corner corner-bottom-right"></div>
        <slot name="controls"></slot>
      </div>

      <div class="resources-container tech-container">
        <!-- 四角元素 -->
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

/* WebGL 容器样式 - 边框最亮 */
.webgl-container {
  flex: 1;
  min-height: 65%;
  position: relative;
  margin: 0 10px;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  border: 3px solid rgba(64, 169, 255, 0.8);
  box-shadow:
    0 0 0 1px rgba(100, 200, 255, 0.3),
    0 0 20px rgba(64, 169, 255, 0.4),
    inset 0 0 15px rgba(64, 169, 255, 0.1);
  animation: pulse-border-primary 4s ease-in-out infinite;
}

.webgl-container::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 5px;
  padding: 1px;
  background: linear-gradient(45deg, rgba(64, 169, 255, 0.8), rgba(100, 200, 255, 0.9), rgba(64, 169, 255, 0.8));
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  z-index: 2;
}

.webgl-container::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 5px;
  box-shadow:
    inset 0 0 10px rgba(64, 169, 255, 0.5),
    inset 0 0 5px rgba(100, 200, 255, 0.3);
  pointer-events: none;
  z-index: 1;
}

.webgl-container:hover {
  border-color: rgba(100, 200, 255, 0.9);
  box-shadow:
    0 0 0 1px rgba(100, 200, 255, 0.4),
    0 0 25px rgba(64, 169, 255, 0.5),
    inset 0 0 20px rgba(64, 169, 255, 0.15);
}

/* 控制按钮和资源面板容器样式 - 次要边框 */
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

/* 为控制按钮和资源面板添加四角元素 */
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

/* 添加角点效果 */
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

/* 控制按钮和资源面板的四角装饰发光效果增强 */
.controls-container:hover .corner,
.resources-container:hover .corner {
  filter: drop-shadow(0 0 5px rgba(64, 169, 255, 0.6));
}

.controls-container:hover .corner::after,
.resources-container:hover .corner::after {
  background-color: rgba(128, 220, 255, 1);
  box-shadow: 0 0 6px 2px rgba(64, 169, 255, 0.8);
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(11, 19, 43, 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background-color: rgba(64, 169, 255, 0.7);
  border-radius: 3px;
  border: 1px solid rgba(15, 25, 50, 0.2);
  box-shadow: inset 0 0 5px rgba(32, 160, 255, 0.3);
}

::-webkit-scrollbar-thumb:hover {
  background-color: rgba(100, 200, 255, 0.9);
}

/* 主要容器边框脉冲动画 */
@keyframes pulse-border-primary {
  0% {
    border-color: rgba(64, 169, 255, 0.8);
    box-shadow:
      0 0 0 1px rgba(100, 200, 255, 0.3),
      0 0 20px rgba(64, 169, 255, 0.4),
      inset 0 0 15px rgba(64, 169, 255, 0.1);
  }
  50% {
    border-color: rgba(100, 200, 255, 0.9);
    box-shadow:
      0 0 0 1px rgba(100, 200, 255, 0.5),
      0 0 25px rgba(100, 200, 255, 0.5),
      inset 0 0 20px rgba(100, 200, 255, 0.2);
  }
  100% {
    border-color: rgba(64, 169, 255, 0.8);
    box-shadow:
      0 0 0 1px rgba(100, 200, 255, 0.3),
      0 0 20px rgba(64, 169, 255, 0.4),
      inset 0 0 15px rgba(64, 169, 255, 0.1);
  }
}

/* 次要容器边框脉冲动画 - 更加柔和 */
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

/* 响应式调整 */
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
}
</style>
