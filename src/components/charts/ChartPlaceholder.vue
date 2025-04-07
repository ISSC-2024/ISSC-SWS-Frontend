<script setup lang="ts">
/**
 * @description 图表占位组件
 *
 * 该组件用于在图表开发过程中提供占位功能，显示"图表占位区域"文字。
 * 包含以下功能：
 * 1. 支持自定义CSS类名，方便样式定制
 * 2. 支持图表展开/收起状态的响应式调整
 * 3. 在展开状态下自动调整字体大小
 * 4. 简洁的渐变背景和虚线边框样式
 *
 */
import { inject, computed, ref } from 'vue'
import type { Ref } from 'vue'

defineProps<{
  chartClass?: string
}>()

// 注入展开状态，默认为false
const isExpanded = inject<Ref<boolean>>('isChartExpanded', ref(false))

// 根据展开状态计算样式
const chartStyle = computed(() => {
  if (isExpanded.value) {
    return {
      height: '100%',
      fontSize: '24px',
    }
  }
  return {}
})
</script>

<template>
  <div class="placeholder-chart" :class="chartClass" :style="chartStyle"></div>
</template>

<style scoped>
.placeholder-chart {
  width: 100%;
  height: 100%;
  background-color: #f9fafc;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a0aec0;
  font-style: italic;
  border: 1px dashed #e0e6ed;
  background: linear-gradient(to bottom right, #f8f9fb, #f1f4f9);
  position: relative;
  transition: all 0.3s ease;
}

.placeholder-chart::after {
  content: '图表占位区域';
  position: absolute;
  font-size: 16px;
  font-weight: bold;
  color: #a0aec0;
  transition: font-size 0.3s ease;
}
</style>
