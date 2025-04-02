<script setup lang="ts">
/**
 * @description 化工车间人力资源分布图表组件
 * 
 * 该组件使用ECharts实现堆叠水平条形图，展示不同化工车间的人力资源分布情况。
 * 包含以下功能：
 * 1. 显示技术人员、管理人员、维修人员、安全人员、操作人员五类人力资源分布
 * 2. 支持图表展开/收起状态的响应式调整
 * 3. 展开状态下在柱状图上显示具体数值
 * 4. 缩略图状态下使用简化的图例（去除"人员"二字）和更紧凑的布局
 * 5. 优化的tooltip显示，确保不被容器遮挡
 * 
 */
import { ref, onMounted, inject, computed, watch, onBeforeUnmount } from 'vue';
import type { Ref } from 'vue';
import * as echarts from 'echarts';
import staffData from '../../mock/staffDistribution.json';

// 注入展开状态
const isExpanded = inject<Ref<boolean>>('isChartExpanded', ref(false));

// 图表DOM引用
const chartRef = ref<HTMLElement | null>(null);
// 图表实例
let chartInstance: echarts.ECharts | null = null;

// 类型定义
interface StaffData {
  staff: {
    [key: string]: {
      [key: string]: number;
    };
  };
  colors: {
    [key: string]: string;
  };
}

// 类型断言
const typedStaffData = staffData as StaffData;

// 准备数据
const staffTypes = ['技术人员', '管理人员', '维修人员', '安全人员', '操作人员'];
// 简化的图例名称（去除"人员"二字）
const simplifiedLegendNames = ['技术', '管理', '维修', '安全', '操作'];
const workshops = Object.keys(typedStaffData.staff);

// 获取根据展开状态决定的图例名称
const getLegendNames = () => {
  return isExpanded.value ? staffTypes : simplifiedLegendNames;
};

// 将数据转换为echarts所需格式
const getSeriesData = () => {
  return staffTypes.map((type, index) => {
    return {
      name: isExpanded.value ? type : simplifiedLegendNames[index],
      type: 'bar' as const,
      stack: '总量',
      emphasis: {
        focus: 'series' as const
      },
      itemStyle: {
        color: typedStaffData.colors[type]
      },
      // 根据展开状态决定是否显示标签
      label: {
        show: isExpanded.value,
        position: 'inside' as const,
        formatter: '{c}',
        fontSize: 12,
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowBlur: 3,
        textShadowOffsetX: 1,
        textShadowOffsetY: 1
      },
      data: workshops.map(workshop => typedStaffData.staff[workshop][type])
    };
  });
};

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return;
  
  // 创建图表实例
  chartInstance = echarts.init(chartRef.value);
  
  // 更新图表
  updateChart();
};

// 添加全局样式
const addGlobalStyle = () => {
  const styleElement = document.createElement('style');
  styleElement.id = 'staff-chart-tooltip-style';
  styleElement.innerHTML = `
    .staff-chart-tooltip {
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
  const styleElement = document.getElementById('staff-chart-tooltip-style');
  if (styleElement) {
    document.head.removeChild(styleElement);
  }
};

// 更新图表
const updateChart = () => {
  if (!chartInstance) return;
  
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      confine: false,
      appendToBody: true,
      className: 'staff-chart-tooltip',
      position: function(point) {
        // 确保tooltip不会太靠边缘
        return [point[0], point[1]];
      },
      extraCssText: 'z-index: 10000 !important; pointer-events: none;'
    },
    legend: {
      data: getLegendNames(),
      orient: 'horizontal',
      bottom: 0,
      itemWidth: isExpanded.value ? 15 : 10,
      itemHeight: isExpanded.value ? 15 : 10,
      textStyle: {
        fontSize: isExpanded.value ? 12 : 10
      },
      icon: isExpanded.value ? 'roundRect' : 'circle'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: isExpanded.value ? '50px' : '25px',
      top: '10px',
      containLabel: true
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: workshops
    },
    series: getSeriesData()
  };
  
  // 使用类型守卫确保chartInstance不为null
  const chart = chartInstance;
  if (chart) {
    chart.setOption(option);
  }
};

// 监听容器大小变化
watch(isExpanded, () => {
  if (chartInstance) {
    // 展开状态变化时更新图表以显示或隐藏标签
    updateChart();
    setTimeout(() => {
      const chart = chartInstance;
      if (chart) {
        chart.resize();
      }
    }, 300);
  }
});

// 组件挂载时初始化图表
onMounted(() => {
  addGlobalStyle();
  initChart();
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', () => {
    if (chartInstance) {
      chartInstance.resize();
    }
  });
});

// 组件销毁前清理
onBeforeUnmount(() => {
  // 移除窗口大小变化监听
  window.removeEventListener('resize', () => {
    if (chartInstance) {
      chartInstance.resize();
    }
  });
  
  // 销毁图表实例
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
  
  removeGlobalStyle();
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
  <div class="staff-distribution-chart" ref="chartRef" :style="chartStyle"></div>
</template>

<style scoped>
.staff-distribution-chart {
  width: 100%;
  height: 100%;
}
</style> 