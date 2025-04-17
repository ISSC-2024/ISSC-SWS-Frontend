<script setup lang="ts">
/**
 * @description 图表容器组件
 *
 * 该组件用于展示StaffDistributionChart组件。
 * 包含以下功能:
 * 1. 支持图表展开/收起状态的响应式调整
 */
import { ref, inject, computed } from 'vue'
import type { Ref } from 'vue'
import StaffDistributionChart from '../charts/StaffDistributionChart.vue'

// 注入展开状态
const isExpanded = inject<Ref<boolean>>('isChartExpanded', ref(false))

// 根据展开状态计算样式
const chartStyle = computed(() => {
  if (isExpanded.value) {
    return {
      height: '100%',
    }
  }
  return {}
})
</script>

<template>
  <div class="chart-carousel" :style="chartStyle">
    <div class="chart-container">
      <StaffDistributionChart />
    </div>
  </div>
</template>

<style scoped>
.chart-carousel {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
}

.chart-container {
  width: 100%;
  flex-grow: 1;
  position: relative;
}

.chart-carousel-indicator {
  width: 100%;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  z-index: 10;
  margin-top: 8px;
  margin-bottom: 4px;
}

.chart-carousel-indicator span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #e0e0e0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.chart-carousel-indicator span.active {
  background-color: #1890ff;
  transform: scale(1.2);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
