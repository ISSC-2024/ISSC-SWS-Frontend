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
        <div class="container-border"></div>
        <div class="container-border-corner top-left"></div>
        <div class="container-border-corner top-right"></div>
        <div class="container-border-corner bottom-left"></div>
        <div class="container-border-corner bottom-right"></div>
        <slot name="webgl-content"></slot>
      </div>
      <div class="controls-container tech-container">
        <div class="container-border"></div>
        <div class="container-border-corner top-left"></div>
        <div class="container-border-corner top-right"></div>
        <div class="container-border-corner bottom-left"></div>
        <div class="container-border-corner bottom-right"></div>
        <slot name="controls"></slot>
      </div>
      <div class="resources-container tech-container">
        <div class="container-border"></div>
        <div class="container-border-corner top-left"></div>
        <div class="container-border-corner top-right"></div>
        <div class="container-border-corner bottom-left"></div>
        <div class="container-border-corner bottom-right"></div>
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
  background: linear-gradient(135deg, rgba(11, 19, 43, 0.97), rgba(15, 30, 60, 0.97));
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
  padding: 8px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  position: relative;
  z-index: 1;
}

.column-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
}

.middle-column {
  width: 60%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  gap: 8px;
  position: relative;
  z-index: 1;
}

/* 技术感容器通用样式 */
.tech-container {
  position: relative;
  border: 1px solid rgba(64, 169, 255, 0.3);
  border-radius: 8px;
  overflow: hidden;
  background-color: rgba(15, 25, 50, 0.6);
  box-shadow:
    0 5px 15px rgba(0, 0, 0, 0.2),
    0 0 20px rgba(32, 160, 255, 0.05);
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
}

.tech-container:hover {
  border-color: rgba(64, 169, 255, 0.5);
  box-shadow:
    0 8px 25px rgba(0, 0, 0, 0.25),
    0 0 30px rgba(32, 160, 255, 0.1);
}

/* 科技感边框 */
.container-border {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10;
  border: 1px solid rgba(64, 169, 255, 0.3);
  border-radius: 8px;
  box-shadow: inset 0 0 15px rgba(32, 160, 255, 0.05);
}

/* 科技感角落装饰 */
.container-border-corner {
  position: absolute;
  width: 12px;
  height: 12px;
  z-index: 11;
  pointer-events: none;
}

.top-left {
  top: 0;
  left: 0;
  border-top: 2px solid rgba(64, 169, 255, 0.8);
  border-left: 2px solid rgba(64, 169, 255, 0.8);
  border-top-left-radius: 4px;
}

.top-right {
  top: 0;
  right: 0;
  border-top: 2px solid rgba(64, 169, 255, 0.8);
  border-right: 2px solid rgba(64, 169, 255, 0.8);
  border-top-right-radius: 4px;
}

.bottom-left {
  bottom: 0;
  left: 0;
  border-bottom: 2px solid rgba(64, 169, 255, 0.8);
  border-left: 2px solid rgba(64, 169, 255, 0.8);
  border-bottom-left-radius: 4px;
}

.bottom-right {
  bottom: 0;
  right: 0;
  border-bottom: 2px solid rgba(64, 169, 255, 0.8);
  border-right: 2px solid rgba(64, 169, 255, 0.8);
  border-bottom-right-radius: 4px;
}

.webgl-container {
  flex: 1;
  min-height: 65%;
  position: relative;
  margin: 0 8px;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}

.webgl-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, rgba(32, 160, 255, 0), rgba(64, 169, 255, 0.8), rgba(32, 160, 255, 0));
  z-index: 12;
}

.controls-container {
  height: 8%;
  margin: 0 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.resources-container {
  height: 27%;
  margin: 0 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  background-color: rgba(32, 160, 255, 0.6);
  border-radius: 3px;
  border: 1px solid rgba(15, 25, 50, 0.2);
}

::-webkit-scrollbar-thumb:hover {
  background-color: rgba(64, 169, 255, 0.8);
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .container-border-corner {
    width: 8px;
    height: 8px;
  }

  .left-column,
  .right-column {
    padding: 5px;
  }

  .column-content {
    gap: 5px;
  }

  .middle-column {
    gap: 5px;
  }

  .webgl-container,
  .controls-container,
  .resources-container {
    margin: 0 5px;
  }
}
</style>
