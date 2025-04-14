<script setup lang="ts">
/**
 * @description 化工车间资源分布图表组件
 *
 * 该组件使用ECharts实现堆叠水平条形图，展示不同化工车间的资源分布情况。
 * 包含以下功能：
 * 1. 显示人力资源分布（技术人员、管理人员、维修人员、安全人员、操作人员）
 * 2. 显示物料资源分布（原料、催化剂、存储容量）
 * 3. 显示电力资源分布
 * 4. 支持图表展开/收起状态的响应式调整
 * 5. 展开状态下在柱状图上显示具体数值
 * 6. 缩略图状态下使用简化的图例和更紧凑的布局
 * 7. 优化的tooltip显示，确保不被容器遮挡
 * 8. 人力资源、物料资源和电力资源图表轮播展示
 *
 */
import { ref, onMounted, inject, computed, watch, onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'
import * as echarts from 'echarts'
import report from '../../mock/report.json'

// 准备人力资源分配数据
const staffData = {
  staff: {
    原料储存区: {
      技术人员: report.resources.personnel.subtypes.technician.data[0].value,
      管理人员: report.resources.personnel.subtypes.manager.data[0].value,
      维修人员: report.resources.personnel.subtypes.maintenance.data[0].value,
      安全人员: report.resources.personnel.subtypes.safety.data[0].value,
      操作人员: report.resources.personnel.subtypes.operator.data[0].value,
    },
    反应器区: {
      技术人员: report.resources.personnel.subtypes.technician.data[1].value,
      管理人员: report.resources.personnel.subtypes.manager.data[1].value,
      维修人员: report.resources.personnel.subtypes.maintenance.data[1].value,
      安全人员: report.resources.personnel.subtypes.safety.data[1].value,
      操作人员: report.resources.personnel.subtypes.operator.data[1].value,
    },
    分离提纯区: {
      技术人员: report.resources.personnel.subtypes.technician.data[2].value,
      管理人员: report.resources.personnel.subtypes.manager.data[2].value,
      维修人员: report.resources.personnel.subtypes.maintenance.data[2].value,
      安全人员: report.resources.personnel.subtypes.safety.data[2].value,
      操作人员: report.resources.personnel.subtypes.operator.data[2].value,
    },
    成品储存区: {
      技术人员: report.resources.personnel.subtypes.technician.data[3].value,
      管理人员: report.resources.personnel.subtypes.manager.data[3].value,
      维修人员: report.resources.personnel.subtypes.maintenance.data[3].value,
      安全人员: report.resources.personnel.subtypes.safety.data[3].value,
      操作人员: report.resources.personnel.subtypes.operator.data[3].value,
    },
    公用工程区: {
      技术人员: report.resources.personnel.subtypes.technician.data[4].value,
      管理人员: report.resources.personnel.subtypes.manager.data[4].value,
      维修人员: report.resources.personnel.subtypes.maintenance.data[4].value,
      安全人员: report.resources.personnel.subtypes.safety.data[4].value,
      操作人员: report.resources.personnel.subtypes.operator.data[4].value,
    },
  },
  colors: {
    技术人员: '#5470C6',
    管理人员: '#91CC75',
    维修人员: '#FAC858',
    安全人员: '#EE6666',
    操作人员: '#73C0DE',
  },
}

// 注入展开状态
const isExpanded = inject<Ref<boolean>>('isChartExpanded', ref(false))

// 图表DOM引用
const chartRef = ref<HTMLElement | null>(null)
// 图表实例
let chartInstance: echarts.ECharts | null = null

// 资源类型控制
const currentChartType = ref(0) // 0:人力资源 1:物料资源 2:电力资源

// 资源类型标题
const resourceTitles = ['人力资源分布', '物料资源分布', '电力资源分布']

// 资源类型按钮数据
const resourceButtons = [
  { type: 0, label: '人力资源', icon: '👥' },
  { type: 1, label: '物料资源', icon: '🧪' },
  { type: 2, label: '电力资源', icon: '⚡' },
]

// 切换到指定图表类型
const switchChartType = (type: number) => {
  currentChartType.value = type
  // 确保完全清除前一个图表的数据
  updateChart()
}

// 类型定义
interface StaffData {
  staff: {
    [key: string]: {
      [key: string]: number
    }
  }
  colors: {
    [key: string]: string
  }
}

// 物料资源数据类型
interface MaterialsData {
  materials: {
    [key: string]: {
      [key: string]: number
    }
  }
  colors: {
    [key: string]: string
  }
}

// 电力资源数据类型
interface ElectricityData {
  electricity: {
    [key: string]: number
  }
  colors: {
    [key: string]: string
  }
}

// 准备物料资源分配数据
const materialsData = {
  materials: {
    原料储存区: {
      原料: report.resources.materials.subtypes.raw_material.data[0].value,
      催化剂: report.resources.materials.subtypes.catalyst.data[0].value,
      存储容量: report.resources.materials.subtypes.storage.data[0].value,
    },
    反应器区: {
      原料: report.resources.materials.subtypes.raw_material.data[1].value,
      催化剂: report.resources.materials.subtypes.catalyst.data[1].value,
      存储容量: report.resources.materials.subtypes.storage.data[1].value,
    },
    分离提纯区: {
      原料: report.resources.materials.subtypes.raw_material.data[2].value,
      催化剂: report.resources.materials.subtypes.catalyst.data[2].value,
      存储容量: report.resources.materials.subtypes.storage.data[2].value,
    },
    成品储存区: {
      原料: report.resources.materials.subtypes.raw_material.data[3].value,
      催化剂: report.resources.materials.subtypes.catalyst.data[3].value,
      存储容量: report.resources.materials.subtypes.storage.data[3].value,
    },
    公用工程区: {
      原料: report.resources.materials.subtypes.raw_material.data[4].value,
      催化剂: report.resources.materials.subtypes.catalyst.data[4].value,
      存储容量: report.resources.materials.subtypes.storage.data[4].value,
    },
  },
  colors: {
    原料: '#4CAF50',
    催化剂: '#2196F3',
    存储容量: '#FFC107',
  },
}

// 准备电力资源分配数据
const electricityData = {
  electricity: {
    原料储存区: report.resources.electricity.data[0].value,
    反应器区: report.resources.electricity.data[1].value,
    分离提纯区: report.resources.electricity.data[2].value,
    成品储存区: report.resources.electricity.data[3].value,
    公用工程区: report.resources.electricity.data[4].value,
  },
  colors: {
    电力: '#9C27B0',
  },
}

// 类型断言
const typedStaffData = staffData as StaffData
const typedMaterialsData = materialsData as MaterialsData
const typedElectricityData = electricityData as ElectricityData

// 准备数据
const staffTypes = ['技术人员', '管理人员', '维修人员', '安全人员', '操作人员']
// 简化的图例名称（去除"人员"二字）
const simplifiedLegendNames = ['技术', '管理', '维修', '安全', '操作']
const workshops = Object.keys(typedStaffData.staff)

// 物料类型
const materialTypes = ['原料', '催化剂', '存储容量']

// 电力类型
const electricityTypes = ['电力']

// 获取根据展开状态决定的图例名称
const getLegendNames = () => {
  switch (currentChartType.value) {
    case 0: // 人力资源
      return isExpanded.value ? staffTypes : simplifiedLegendNames
    case 1: // 物料资源
      return materialTypes
    case 2: // 电力资源
      return electricityTypes
    default:
      return []
  }
}

// 将数据转换为echarts所需格式
const getSeriesData = () => {
  switch (currentChartType.value) {
    case 0: // 人力资源
      return staffTypes.map((type, index) => {
        return {
          name: isExpanded.value ? type : simplifiedLegendNames[index],
          type: 'bar' as const,
          stack: '总量',
          emphasis: {
            focus: 'series' as const,
          },
          itemStyle: {
            color: typedStaffData.colors[type],
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
            textShadowOffsetY: 1,
          },
          data: workshops.map((workshop) => typedStaffData.staff[workshop][type]),
        }
      })
    case 1: // 物料资源
      return materialTypes.map((type) => {
        return {
          name: type,
          type: 'bar' as const,
          stack: '总量',
          emphasis: {
            focus: 'series' as const,
          },
          itemStyle: {
            color: typedMaterialsData.colors[type],
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
            textShadowOffsetY: 1,
          },
          data: workshops.map((workshop) => typedMaterialsData.materials[workshop][type]),
        }
      })
    case 2: // 电力资源
      return electricityTypes.map((type) => {
        return {
          name: type,
          type: 'bar' as const,
          stack: '总量',
          emphasis: {
            focus: 'series' as const,
          },
          itemStyle: {
            color: typedElectricityData.colors[type],
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
            textShadowOffsetY: 1,
          },
          data: workshops.map((workshop) => typedElectricityData.electricity[workshop]),
        }
      })
    default:
      return []
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

// 添加全局样式
const addGlobalStyle = () => {
  const styleElement = document.createElement('style')
  styleElement.id = 'staff-chart-tooltip-style'
  styleElement.innerHTML = `
    .staff-chart-tooltip {
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
  const styleElement = document.getElementById('staff-chart-tooltip-style')
  if (styleElement) {
    document.head.removeChild(styleElement)
  }
}

// 更新图表
const updateChart = () => {
  if (!chartInstance) return

  // 完全清除图表，避免数据残留问题
  chartInstance.clear()

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      confine: false,
      appendToBody: true,
      className: 'staff-chart-tooltip',
      position: function (point) {
        // 确保tooltip不会太靠边缘
        return [point[0], point[1]]
      },
      extraCssText: 'z-index: 10000 !important; pointer-events: none;',
    },
    legend: {
      data: getLegendNames(),
      orient: 'horizontal',
      bottom: 0,
      itemWidth: isExpanded.value ? 15 : 10,
      itemHeight: isExpanded.value ? 15 : 10,
      textStyle: {
        fontSize: isExpanded.value ? 12 : 10,
      },
      icon: isExpanded.value ? 'roundRect' : 'circle',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: isExpanded.value ? '50px' : '25px',
      top: '10px',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
    },
    yAxis: {
      type: 'category',
      data: workshops,
    },
    series: getSeriesData(),
    title: {
      text: resourceTitles[currentChartType.value],
      left: 'center',
      top: 0,
      textStyle: {
        fontSize: isExpanded.value ? 14 : 12,
      },
    },
  }

  // 使用类型守卫确保chartInstance不为null
  const chart = chartInstance
  if (chart) {
    chart.setOption(option, true) // 添加第二个参数true，完全替换之前的配置
  }
}

// 获取按钮样式
const getButtonStyle = (type: number) => {
  return {
    backgroundColor: currentChartType.value === type ? '#1976D2' : '#f0f0f0',
    color: currentChartType.value === type ? '#ffffff' : '#333333',
  }
}

// 监听容器大小变化
watch(isExpanded, () => {
  if (chartInstance) {
    // 展开状态变化时更新图表以显示或隐藏标签
    updateChart()
    setTimeout(() => {
      const chart = chartInstance
      if (chart) {
        chart.resize()
      }
    }, 300)
  }
})

// 组件挂载时初始化图表
onMounted(() => {
  addGlobalStyle()
  initChart()

  // 添加窗口大小变化监听
  window.addEventListener('resize', () => {
    if (chartInstance) {
      chartInstance.resize()
    }
  })
})

// 组件销毁前清理
onBeforeUnmount(() => {
  // 移除窗口大小变化监听
  window.removeEventListener('resize', () => {
    if (chartInstance) {
      chartInstance.resize()
    }
  })

  // 销毁图表实例
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }

  removeGlobalStyle()
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
  <div class="resource-distribution-chart-container">
    <transition name="fade" mode="out-in">
      <div class="resource-distribution-chart" ref="chartRef" :style="chartStyle"></div>
    </transition>

    <!-- 资源类型切换按钮 -->
    <div class="chart-type-buttons">
      <button
        v-for="button in resourceButtons"
        :key="button.type"
        class="chart-type-button"
        :style="getButtonStyle(button.type)"
        @click="switchChartType(button.type)"
      >
        <span class="button-icon">{{ button.icon }}</span>
        <span class="button-label">{{ button.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.resource-distribution-chart-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.resource-distribution-chart {
  width: 100%;
  height: calc(100% - 40px);
}

.chart-type-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 5px;
  position: absolute;
  bottom: 5px;
  left: 0;
  right: 0;
}

.chart-type-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chart-type-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.button-icon {
  margin-right: 5px;
  font-size: 14px;
}

.button-label {
  font-weight: 500;
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
