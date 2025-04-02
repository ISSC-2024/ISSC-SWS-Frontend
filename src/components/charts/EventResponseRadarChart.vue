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
import { ref, onMounted, inject, computed, watch, onBeforeUnmount } from 'vue';
import type { Ref } from 'vue';
import * as echarts from 'echarts';
import responseData from '../../mock/eventResponse.json';

// 注入展开状态
const isExpanded = inject<Ref<boolean>>('isChartExpanded', ref(false));

// 图表DOM引用
const chartRef = ref<HTMLElement | null>(null);
// 图表实例
let chartInstance: echarts.ECharts | null = null;

// 添加全局样式
const addGlobalStyle = () => {
  const styleElement = document.createElement('style');
  styleElement.id = 'event-radar-tooltip-style';
  styleElement.innerHTML = `
    .event-radar-tooltip {
      z-index: 10000 !important;
      position: fixed !important;
      pointer-events: none !important;
      box-shadow: 0 3px 14px rgba(0,0,0,0.2) !important;
      max-width: none !important;
      overflow: visible !important;
    }
  `;
  document.head.appendChild(styleElement);
};

// 移除全局样式
const removeGlobalStyle = () => {
  const styleElement = document.getElementById('event-radar-tooltip-style');
  if (styleElement) {
    document.head.removeChild(styleElement);
  }
};

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return;
  
  // 创建图表实例
  chartInstance = echarts.init(chartRef.value);
  
  // 更新图表
  updateChart();
};

// 更新图表
const updateChart = () => {
  if (!chartInstance) return;
  
  const option: echarts.EChartsOption = {
    color: responseData.data.map(item => item.color),
    tooltip: {
      trigger: 'item',
      confine: false,
      appendToBody: true,
      className: 'event-radar-tooltip',
      formatter: (params: any) => {
        const { name, value } = params;
        const indicators = responseData.indicators;
        let result = `<div style="font-weight:bold;margin-bottom:5px;">${name}</div>`;
        value.forEach((val: number, index: number) => {
          if (index > 0) { // 跳过第一个值，因为radar数据的第一个是name
            result += `${indicators[index-1].name}: ${val}<br/>`;
          }
        });
        return result;
      }
    },
    legend: {
      data: responseData.data.map(item => item.name),
      bottom: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        fontSize: 10
      }
    },
    radar: {
      indicator: responseData.indicators,
      center: ['50%', '50%'],
      radius: '55%', 
      splitNumber: 5,
      splitArea: {
        areaStyle: {
          color: ['rgba(255, 255, 255, 0.05)', 'rgba(0, 0, 0, 0.02)']
        }
      },
      axisName: {
        fontSize: 12,
        padding: [1, 3]
      }
    },
    series: [
      {
        type: 'radar',
        symbolSize: 4,
        data: responseData.data.map(item => ({
          value: item.values,
          name: item.name,
          areaStyle: {
            opacity: 0.1
          },
          lineStyle: {
            width: 2
          }
        }))
      }
    ]
  };
  
  // 设置选项
  chartInstance.setOption(option);
};

// 监听容器大小变化
watch(isExpanded, () => {
  if (chartInstance) {
    // 延迟一点时间等待容器尺寸变化完成
    setTimeout(() => {
      chartInstance?.resize();
    }, 300);
  }
});

// 组件挂载时初始化图表
onMounted(() => {
  addGlobalStyle();
  initChart();
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', () => {
    chartInstance?.resize();
  });
});

// 组件销毁前清理
onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
  removeGlobalStyle();
  window.removeEventListener('resize', () => {
    chartInstance?.resize();
  });
});

// 根据展开状态计算样式
const chartStyle = computed(() => {
  if (isExpanded.value) {
    return {
      height: '100%'
    };
  }
  return {};
});
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