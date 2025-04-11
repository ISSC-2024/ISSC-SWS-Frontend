<script setup lang="ts">
/**
 * @description 图表轮播容器组件
 *
 * 该组件实现StaffDistributionChart和ResourceAllocationChart两个组件的轮播展示。
 * 包含以下功能:
 * 1. 自动轮播切换两个图表（仅在非展开状态下）
 * 2. 提供底部指示器，可手动切换不同图表
 * 3. 支持图表展开/收起状态的响应式调整
 */
import { ref, onMounted, inject, computed, watch, onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'
import StaffDistributionChart from '../charts/StaffDistributionChart.vue'
import ResourceAllocationChart from '../charts/ResourceAllocationChart.vue'

// 注入展开状态
const isExpanded = inject<Ref<boolean>>('isChartExpanded', ref(false))

// 当前显示的图表索引: 0=StaffDistributionChart, 1=ResourceAllocationChart
const currentChartIndex = ref(0)

// 切换图表
const switchChart = (index: number) => {
  currentChartIndex.value = index
}

// 自动轮播
let autoRotateTimer: number | null = null

const startAutoRotate = () => {
  // 如果已经在展开状态，不启动轮播
  if (isExpanded.value) return

  // 先清除可能存在的定时器
  if (autoRotateTimer !== null) {
    clearInterval(autoRotateTimer)
    autoRotateTimer = null
  }

  // 创建新的定时器
  autoRotateTimer = window.setInterval(() => {
    currentChartIndex.value = currentChartIndex.value === 0 ? 1 : 0
  }, 10000) // 每10秒切换一次
}

const stopAutoRotate = () => {
  if (autoRotateTimer !== null) {
    clearInterval(autoRotateTimer)
    autoRotateTimer = null
  }
}

// 监听展开状态变化，控制自动轮播
watch(isExpanded, (newValue) => {
  if (newValue) {
    // 展开状态停止轮播
    stopAutoRotate()
  } else {
    // 收起状态启动轮播
    startAutoRotate()
  }
})

// 组件挂载时启动自动轮播(如果不是展开状态)
onMounted(() => {
  startAutoRotate()
})

// 组件卸载时清除定时器
onBeforeUnmount(() => {
  stopAutoRotate()
})

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
      <transition name="fade" mode="out-in">
        <StaffDistributionChart v-if="currentChartIndex === 0" key="staff" />
        <ResourceAllocationChart v-else key="resource" />
      </transition>
    </div>

    <div class="chart-carousel-indicator">
      <span :class="{ active: currentChartIndex === 0 }" @click="switchChart(0)"></span>
      <span :class="{ active: currentChartIndex === 1 }" @click="switchChart(1)"></span>
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
