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
      <slot name="left-column"></slot>
    </div>
    
    <!-- 中间列 -->
    <div class="middle-column">
      <div class="webgl-container">
        <slot name="webgl-content"></slot>
      </div>
      <div class="controls-container">
        <slot name="controls"></slot>
      </div>
      <div class="resources-container">
        <slot name="resources"></slot>
      </div>
    </div>
    
    <!-- 右侧列 -->
    <div class="right-column">
      <slot name="right-column"></slot>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.left-column, .right-column {
  width: 20%;
  height: 100%;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  overflow-y: auto;
}

.middle-column {
  width: 60%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px 0;
}

.webgl-container {
  flex: 1;
  min-height: 65%;
  position: relative;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  overflow: hidden;
  margin: 0 10px;
  margin-bottom: 0;
  background-color: rgba(245, 247, 250, 0.7);
}

.controls-container {
  height: 8%;
  padding: 0 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.resources-container {
  height: 27%;
  padding: 5px 10px 0 10px;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--border-color);
  background-color: rgba(245, 247, 250, 0.5);
  margin-top: 5px;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f4f9;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c0d0e7;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a0b5d8;
}
</style> 