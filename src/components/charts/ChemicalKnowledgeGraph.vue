<script setup lang="ts">
/**
 * @description 化工行业知识图谱组件
 * 
 * 该组件使用ECharts实现化工行业知识图谱的可视化
 * 展示化工行业的核心概念、分支和关联关系
 */
import { ref, onMounted, onUnmounted, inject, watch } from 'vue';
import * as echarts from 'echarts';
import graphData from '../../mock/chemicalKnowledgeGraph.json';

// 获取图表容器展开状态
const isChartExpanded = inject('isChartExpanded', ref(false));

// 图表实例引用
const chartRef = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return;
  
  // 销毁已有实例
  if (chart) {
    chart.dispose();
  }
  
  // 创建新实例
  chart = echarts.init(chartRef.value);
  
  // 设置图表选项
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}'
    },
    animationDuration: 1500,
    animationEasingUpdate: 'quinticInOut',
    series: [
      {
        name: '化工行业知识图谱',
        type: 'graph',
        layout: 'force',
        data: graphData.nodes,
        links: graphData.links,
        categories: graphData.categories,
        roam: true,
        label: {
          show: true,
          position: 'inside',
          color: '#fff',
          fontSize: 12
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 1,
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.3)'
        },
        force: {
          repulsion: 300,
          edgeLength: [50, 100]
        },
        lineStyle: {
          color: 'source',
          curveness: 0.3,
          width: 2
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 5
          }
        }
      }
    ],
    backgroundColor: 'transparent'
  };
  
  // 应用选项
  chart.setOption(option as echarts.EChartsOption);
};

// 监听窗口大小变化
const handleResize = () => {
  if (chart) {
    chart.resize();
  }
};

// 监听展开状态变化
watch(isChartExpanded, () => {
  // 延迟执行以等待DOM更新
  setTimeout(() => {
    handleResize();
  }, 300);
});

// 生命周期钩子
onMounted(() => {
  initChart();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  if (chart) {
    chart.dispose();
    chart = null;
  }
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <div class="knowledge-graph-container">
    <div ref="chartRef" class="chart"></div>
  </div>
</template>

<style scoped>
.knowledge-graph-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart {
  flex: 1;
  min-height: 200px;
}
</style> 