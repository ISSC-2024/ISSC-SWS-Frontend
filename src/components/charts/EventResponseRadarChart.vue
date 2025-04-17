<script setup lang="ts">
/**
 * @description 事件响应情况雷达图组件
 *
 * 该组件使用ECharts实现雷达图，用于展示不同化工车间的事件响应情况。
 * 包含以下数据维度：
 * 1. 响应时效
 * 2. 响应耗时
 * 3. 事件完成率
 * 4. 响应质量
 * 5. 资源利用率
 * 6. 文档完整度
 *
 * 支持图表展开/收起状态的响应式调整
 */
import { ref, onMounted, inject, computed, watch, onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'
import * as echarts from 'echarts'

// 导入所有算法结果文件
import mappo005 from '../../mock/MAPPO__0.005_allocate_result.json'
import mappo001 from '../../mock/MAPPO__0.001_allocate_result.json'
import maddpg005 from '../../mock/MADDPG__0.005_allocate_result.json'
import maddpg001 from '../../mock/MADDPG__0.001_allocate_result.json'
import iqlearning005 from '../../mock/Independent Q-Learning__0.005_allocate_result.json'
import iqlearning001 from '../../mock/Independent Q-Learning__0.001_allocate_result.json'
import dqn005 from '../../mock/DQN__0.005_allocate_result.json'
import dqn001 from '../../mock/DQN__0.001_allocate_result.json'

// 为每个算法分配不同颜色
const algorithmColors = {
  'MAPPO (0.005)': '#4CAF50', // 绿色
  'MAPPO (0.001)': '#2196F3', // 蓝色
  'MADDPG (0.005)': '#FF5722', // 橙色
  'MADDPG (0.001)': '#9C27B0', // 紫色
  'IQL (0.005)': '#FFC107', // 黄色
  'IQL (0.001)': '#607D8B', // 蓝灰色
  'DQN (0.005)': '#E91E63', // 粉色
  'DQN (0.001)': '#795548', // 棕色
}

// 准备算法性能指标数据
const responseData = {
  indicators: [
    { name: '响应时间', max: 25000 },
    { name: '响应及时性', max: 1 },
    { name: '响应质量', max: 1 },
    { name: '资源利用率', max: 1 },
    { name: '事件完成率', max: 1 },
  ],
  data: [
    {
      name: 'MAPPO (0.005)',
      values: [
        mappo005.performance.response_time,
        Math.abs(mappo005.performance.response_timeliness),
        mappo005.performance.response_quality,
        mappo005.performance.resource_utilization,
        mappo005.performance.event_completion_rate,
      ],
      color: algorithmColors['MAPPO (0.005)'],
    },
    {
      name: 'MAPPO (0.001)',
      values: [
        mappo001.performance.response_time,
        Math.abs(mappo001.performance.response_timeliness),
        mappo001.performance.response_quality,
        mappo001.performance.resource_utilization,
        mappo001.performance.event_completion_rate,
      ],
      color: algorithmColors['MAPPO (0.001)'],
    },
    {
      name: 'MADDPG (0.005)',
      values: [
        maddpg005.performance.response_time,
        Math.abs(maddpg005.performance.response_timeliness),
        maddpg005.performance.response_quality,
        maddpg005.performance.resource_utilization,
        maddpg005.performance.event_completion_rate,
      ],
      color: algorithmColors['MADDPG (0.005)'],
    },
    {
      name: 'MADDPG (0.001)',
      values: [
        maddpg001.performance.response_time,
        Math.abs(maddpg001.performance.response_timeliness),
        maddpg001.performance.response_quality,
        maddpg001.performance.resource_utilization,
        maddpg001.performance.event_completion_rate,
      ],
      color: algorithmColors['MADDPG (0.001)'],
    },
    {
      name: 'IQL (0.005)',
      values: [
        iqlearning005.performance.response_time,
        Math.abs(iqlearning005.performance.response_timeliness),
        iqlearning005.performance.response_quality,
        iqlearning005.performance.resource_utilization,
        iqlearning005.performance.event_completion_rate,
      ],
      color: algorithmColors['IQL (0.005)'],
    },
    {
      name: 'IQL (0.001)',
      values: [
        iqlearning001.performance.response_time,
        Math.abs(iqlearning001.performance.response_timeliness),
        iqlearning001.performance.response_quality,
        iqlearning001.performance.resource_utilization,
        iqlearning001.performance.event_completion_rate,
      ],
      color: algorithmColors['IQL (0.001)'],
    },
    {
      name: 'DQN (0.005)',
      values: [
        dqn005.performance.response_time,
        Math.abs(dqn005.performance.response_timeliness),
        dqn005.performance.response_quality,
        dqn005.performance.resource_utilization,
        dqn005.performance.event_completion_rate,
      ],
      color: algorithmColors['DQN (0.005)'],
    },
    {
      name: 'DQN (0.001)',
      values: [
        dqn001.performance.response_time,
        Math.abs(dqn001.performance.response_timeliness),
        dqn001.performance.response_quality,
        dqn001.performance.resource_utilization,
        dqn001.performance.event_completion_rate,
      ],
      color: algorithmColors['DQN (0.001)'],
    },
  ],
}

// 注入展开状态
const isExpanded = inject<Ref<boolean>>('isChartExpanded', ref(false))

// 图表DOM引用
const chartRef = ref<HTMLElement | null>(null)
// 图表实例
let chartInstance: echarts.ECharts | null = null

// 添加全局样式
const addGlobalStyle = () => {
  const styleElement = document.createElement('style')
  styleElement.id = 'event-radar-tooltip-style'
  styleElement.innerHTML = `
    .event-radar-tooltip {
      z-index: 10000 !important;
      position: fixed !important;
      pointer-events: none !important;
      box-shadow: 0 3px 14px rgba(0,0,0,0.2) !important;
      max-width: none !important;
      overflow: visible !important;
    }
  `
  document.head.appendChild(styleElement)
}

// 移除全局样式
const removeGlobalStyle = () => {
  const styleElement = document.getElementById('event-radar-tooltip-style')
  if (styleElement) {
    document.head.removeChild(styleElement)
  }
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return

  // 创建图表实例
  chartInstance = echarts.init(chartRef.value)

  // 更新图表
  updateChart()
}

// 更新图表
const updateChart = () => {
  if (!chartInstance) return

  const option: echarts.EChartsOption = {
    color: responseData.data.map((item) => item.color),
    tooltip: {
      trigger: 'item',
      confine: false,
      appendToBody: true,
      className: 'event-radar-tooltip',
      formatter: (params: any) => {
        const { name, value } = params
        const indicators = responseData.indicators
        let result = `<div style="font-weight:bold;margin-bottom:5px;">${name}</div>`
        value.forEach((val: number, index: number) => {
          // 直接使用index作为indicators的索引，不跳过任何值
          result += `${indicators[index].name}: ${val}<br/>`
        })
        return result
      },
    },
    legend: {
      data: responseData.data.map((item) => item.name),
      bottom: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        fontSize: 10,
      },
    },
    radar: {
      indicator: responseData.indicators.map((indicator) => ({
        name: indicator.name,
        max: indicator.max,
      })),
      center: ['50%', '50%'],
      radius: '55%',
      splitNumber: 5,
      splitArea: {
        areaStyle: {
          color: ['rgba(255, 255, 255, 0.05)', 'rgba(0, 0, 0, 0.02)'],
        },
      },
      axisName: {
        fontSize: 12,
        padding: [1, 3],
      },
    },
    series: [
      {
        type: 'radar',
        symbolSize: 4,
        data: responseData.data.map((item) => ({
          value: item.values,
          name: item.name,
          areaStyle: {
            opacity: 0.1,
          },
          lineStyle: {
            width: 2,
          },
        })),
      },
    ],
  }

  // 设置选项
  chartInstance.setOption(option)
}

// 监听容器大小变化
watch(isExpanded, () => {
  if (chartInstance) {
    // 延迟一点时间等待容器尺寸变化完成
    setTimeout(() => {
      chartInstance?.resize()
    }, 300)
  }
})

// 组件挂载时初始化图表
onMounted(() => {
  addGlobalStyle()
  initChart()

  // 添加窗口大小变化监听
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
})

// 组件销毁前清理
onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  removeGlobalStyle()
  window.removeEventListener('resize', () => {
    chartInstance?.resize()
  })
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
  <div class="event-response-radar-chart" ref="chartRef" :style="chartStyle"></div>
</template>

<style scoped>
.event-response-radar-chart {
  width: 100%;
  height: 100%;
}
</style>
