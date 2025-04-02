<script setup lang="ts">
/**
 * @description 图表容器组件
 * 
 * 该组件为图表提供统一的容器，实现以下功能：
 * 1. 提供展开/收起功能，允许用户放大查看图表详情
 * 2. 通过provide/inject向子组件提供展开状态
 * 3. 在展开状态下显示覆盖层和关闭按钮
 * 4. 自适应布局，确保图表在各种状态下正确显示
 * 5. 美观的动画效果和统一的视觉风格
 */
import { ref, provide } from 'vue';
import { ExpandOutlined, CloseOutlined } from '@ant-design/icons-vue';

// 图表容器组件
const isExpanded = ref(false);

// 提供给子组件的状态
provide('isChartExpanded', isExpanded);

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

const closeExpand = () => {
  isExpanded.value = false;
};
</script>

<template>
  <div class="chart-container">
    <div class="chart-header">
      <div class="expand-icon" @click="toggleExpand">
        <ExpandOutlined />
      </div>
    </div>
    <div class="chart-content">
      <slot></slot>
    </div>
  </div>

  <!-- 展开后的浮层 -->
  <div v-if="isExpanded" class="expanded-overlay" @click="closeExpand">
    <div class="expanded-container" @click.stop>
      <div class="expanded-header">
        <div class="close-icon" @click="closeExpand">
          <CloseOutlined />
        </div>
      </div>
      <div class="expanded-content">
        <slot name="expanded" v-if="$slots.expanded"></slot>
        <slot v-else></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  background-color: var(--panel-background);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  margin-bottom: 5px;
  overflow: hidden;
  box-shadow: var(--panel-shadow);
  height: calc(33.33% - 11px);
  display: flex;
  flex-direction: column;
  position: relative;
}

.chart-header {
  display: flex;
  justify-content: flex-end;
  padding: 8px;
  position: absolute;
  top: 0;
  right: 0;
  z-index: 10;
}

.expand-icon {
  cursor: pointer;
  color: var(--text-color-secondary);
  transition: color 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
}

.expand-icon:hover {
  color: var(--primary-color);
  background-color: rgba(0, 0, 0, 0.05);
}

.chart-content {
  padding: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 展开浮层样式 */
.expanded-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.expanded-container {
  background-color: var(--panel-background);
  border-radius: 8px;
  box-shadow: var(--panel-shadow);
  width: 80%;
  height: 80%;
  max-width: 1200px;
  max-height: 800px;
  display: flex;
  flex-direction: column;
  position: relative;
  animation: zoom-in 0.3s ease;
  pointer-events: auto;
}

@keyframes zoom-in {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.expanded-header {
  display: flex;
  justify-content: flex-end;
  padding: 12px;
}

.close-icon {
  cursor: pointer;
  color: var(--text-color-secondary);
  transition: color 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
}

.close-icon:hover {
  color: var(--error-color);
  background-color: rgba(0, 0, 0, 0.05);
}

.expanded-content {
  flex: 1;
  padding: 0 24px 24px;
  overflow: auto;
  display: flex;
  flex-direction: column;
}
</style> 