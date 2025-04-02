<script setup lang="ts">
/**
 * @description 资源分配饼图组件
 * 
 * 该组件使用ECharts实现环形饼图，用于展示不同资源类型的分配情况。
 * 包含以下功能：
 * 1. 支持轮播展示人员、物料、电力三种不同资源的分配情况
 * 2. 提供底部指示器，可手动切换不同资源类型
 * 3. 支持图表展开/收起状态的响应式调整
 * 4. 优化的tooltip显示，确保不被容器遮挡
 * 5. 自动每5秒轮播切换资源类型
 * 
 */
import { ref, onMounted, inject, computed, watch, onBeforeUnmount } from 'vue';
import type { Ref } from 'vue';
import * as echarts from 'echarts';
import resourceData from '../../mock/resourceAllocation.json';

// 注入展开状态
const isExpanded = inject<Ref<boolean>>('isChartExpanded', ref(false));

// 图表DOM引用
const chartRef = ref<HTMLElement | null>(null);
// 图表实例
let chartInstance: echarts.ECharts | null = null;

// 当前显示的资源类型索引
const currentResourceIndex = ref(0);
const resourceTypes = ['personnel', 'materials', 'electricity'] as const;
type ResourceType = typeof resourceTypes[number];

// 资源标题
const resourceTitles: Record<ResourceType, string> = {
  personnel: '人员分配',
  materials: '物料分配',
  electricity: '电力分配'
};

// 类型定义
interface ResourceData {
  name: string;
  value: number;
  color: string;
}

interface ResourceAllocationData {
  [key: string]: {
    title: string;
    data: ResourceData[];
  }
}

// 类型断言
const typedResourceData = resourceData as ResourceAllocationData;

// 根据当前索引获取数据
const currentData = computed(() => {
  const type = resourceTypes[currentResourceIndex.value];
  return typedResourceData[type].data;
});

// 根据当前索引获取标题
const currentTitle = computed(() => {
  const type = resourceTypes[currentResourceIndex.value];
  return resourceTitles[type];
});

// 控制标签显示的计算属性
const labelConfig = computed(() => {
  return {
    show: isExpanded.value,
    position: 'outside' as const,
    formatter: '{b}: {c} ({d}%)',
    fontSize: 12
  };
});

// 控制标签连接线显示的计算属性
const labelLineConfig = computed(() => {
  return {
    show: isExpanded.value
  };
});

// 控制强调状态下标签显示的计算属性
const emphasisLabelConfig = computed(() => {
  return {
    show: isExpanded.value,
    fontSize: 14,
    fontWeight: 'bold' as const
  };
});

// 添加全局样式
const addGlobalStyle = () => {
  const styleElement = document.createElement('style');
  styleElement.id = 'resource-chart-tooltip-style';
  styleElement.innerHTML = `
    .resource-chart-tooltip {
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
  const styleElement = document.getElementById('resource-chart-tooltip-style');
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
    title: {
      text: currentTitle.value,
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
      confine: false,
      appendToBody: true,
      className: 'resource-chart-tooltip',
      position: function(point) {
        return [point[0] - 100, point[1] - 100];
      },
      extraCssText: 'z-index: 10000 !important; pointer-events: none;'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'middle',
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 10,
      textStyle: {
        fontSize: 12
      },
      selectedMode: false,
      data: currentData.value.map((item: ResourceData) => item.name)
    },
    series: [
      {
        name: currentTitle.value,
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '55%'], // 将饼图向左移动，避免与图例重叠
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: labelConfig.value,
        emphasis: {
          focus: 'series',
          label: emphasisLabelConfig.value
        },
        labelLine: labelLineConfig.value,
        data: currentData.value
      }
    ]
  };
  
  // 使用类型守卫确保chartInstance不为null
  const chart = chartInstance;
  if (chart) {
    chart.setOption(option);
  }
};

// 自动轮播
const startAutoRotate = () => {
  const timer = setInterval(() => {
    currentResourceIndex.value = (currentResourceIndex.value + 1) % resourceTypes.length;
  }, 5000); // 每5秒切换一次
  
  return timer;
};

// 监听数据变化，更新图表
watch(currentData, () => {
  updateChart();
});

// 监听容器大小变化
watch(isExpanded, () => {
  if (chartInstance) {
    setTimeout(() => {
      const chart = chartInstance;
      if (chart) {
        chart.resize();
        updateChart();
      }
    }, 300);
  }
});

// 组件挂载时初始化图表
onMounted(() => {
  addGlobalStyle();
  initChart();
  const timer = startAutoRotate();
  
  // 组件卸载时清除定时器
  onBeforeUnmount(() => {
    clearInterval(timer);
    if (chartInstance) {
      chartInstance.dispose();
      chartInstance = null;
    }
    removeGlobalStyle();
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
  <div class="resource-allocation-chart" ref="chartRef" :style="chartStyle">
    <div class="resource-type-indicator">
      <span 
        v-for="(type, index) in resourceTypes" 
        :key="type"
        :class="{ active: index === currentResourceIndex }"
        @click="currentResourceIndex = index"
      ></span>
    </div>
  </div>
</template>

<style scoped>
.resource-allocation-chart {
  width: 100%;
  height: 100%;
  position: relative;
}

.resource-type-indicator {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}

.resource-type-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #e0e0e0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.resource-type-indicator span.active {
  background-color: #1890ff;
  transform: scale(1.2);
}
</style> 