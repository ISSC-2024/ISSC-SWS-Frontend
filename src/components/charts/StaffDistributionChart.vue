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
 * 9. 支持图表悬停时显示Unity中的管道流动效果
 *
 */
import { ref, onMounted, inject, computed, watch, onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'
import * as echarts from 'echarts'
import { useAlgorithmStore } from '../../stores/algorithmStore'
import unityService from '../../services/UnityService' // 引入Unity服务
import { useMessageStore } from '../../stores/message'
import TextMessageDisplayBox from '../controls/windows/TextMessageDisplayBox.vue' // 根据实际路径调整

// 默认数据
import defaultReport from '../../mock/report.json'

// 获取算法状态管理
const algorithmStore = useAlgorithmStore()

// 当前使用的报告数据
const reportData = ref(defaultReport)

// 获取消息store
const messageStore = useMessageStore()

// 动态加载报告数据
const loadReportData = async () => {
  if (algorithmStore.isDataLoaded) {
    try {
      const fileName = algorithmStore.getDataFileName()
      console.log('加载数据文件:', fileName)
      // 动态导入JSON文件
      const module = await import(`../../mock/${fileName}`)
      reportData.value = module.default
      console.log('成功加载算法数据')
      // 更新图表数据
      updateChartData()
      // 重新渲染图表
      updateChart()
    } catch (error) {
      console.error('加载数据文件失败:', error)
      reportData.value = defaultReport
    }
  } else {
    reportData.value = defaultReport
  }
}

// 更新图表数据
const updateChartData = () => {
  // 更新人力资源数据
  staffData.staff = {
    原料储存区: {
      技术人员: reportData.value.resources.personnel.subtypes.technician.data[0].value,
      管理人员: reportData.value.resources.personnel.subtypes.manager.data[0].value,
      维修人员: reportData.value.resources.personnel.subtypes.maintenance.data[0].value,
      安全人员: reportData.value.resources.personnel.subtypes.safety.data[0].value,
      操作人员: reportData.value.resources.personnel.subtypes.operator.data[0].value,
    },
    反应器区: {
      技术人员: reportData.value.resources.personnel.subtypes.technician.data[1].value,
      管理人员: reportData.value.resources.personnel.subtypes.manager.data[1].value,
      维修人员: reportData.value.resources.personnel.subtypes.maintenance.data[1].value,
      安全人员: reportData.value.resources.personnel.subtypes.safety.data[1].value,
      操作人员: reportData.value.resources.personnel.subtypes.operator.data[1].value,
    },
    分离提纯区: {
      技术人员: reportData.value.resources.personnel.subtypes.technician.data[2].value,
      管理人员: reportData.value.resources.personnel.subtypes.manager.data[2].value,
      维修人员: reportData.value.resources.personnel.subtypes.maintenance.data[2].value,
      安全人员: reportData.value.resources.personnel.subtypes.safety.data[2].value,
      操作人员: reportData.value.resources.personnel.subtypes.operator.data[2].value,
    },
    成品储存区: {
      技术人员: reportData.value.resources.personnel.subtypes.technician.data[3].value,
      管理人员: reportData.value.resources.personnel.subtypes.manager.data[3].value,
      维修人员: reportData.value.resources.personnel.subtypes.maintenance.data[3].value,
      安全人员: reportData.value.resources.personnel.subtypes.safety.data[3].value,
      操作人员: reportData.value.resources.personnel.subtypes.operator.data[3].value,
    },
    公用工程区: {
      技术人员: reportData.value.resources.personnel.subtypes.technician.data[4].value,
      管理人员: reportData.value.resources.personnel.subtypes.manager.data[4].value,
      维修人员: reportData.value.resources.personnel.subtypes.maintenance.data[4].value,
      安全人员: reportData.value.resources.personnel.subtypes.safety.data[4].value,
      操作人员: reportData.value.resources.personnel.subtypes.operator.data[4].value,
    },
  }

  // 更新物料资源数据
  materialsData.materials = {
    原料储存区: {
      原料: reportData.value.resources.materials.subtypes.raw_material.data[0].value,
      催化剂: reportData.value.resources.materials.subtypes.catalyst.data[0].value,
      存储容量: reportData.value.resources.materials.subtypes.storage.data[0].value,
    },
    反应器区: {
      原料: reportData.value.resources.materials.subtypes.raw_material.data[1].value,
      催化剂: reportData.value.resources.materials.subtypes.catalyst.data[1].value,
      存储容量: reportData.value.resources.materials.subtypes.storage.data[1].value,
    },
    分离提纯区: {
      原料: reportData.value.resources.materials.subtypes.raw_material.data[2].value,
      催化剂: reportData.value.resources.materials.subtypes.catalyst.data[2].value,
      存储容量: reportData.value.resources.materials.subtypes.storage.data[2].value,
    },
    成品储存区: {
      原料: reportData.value.resources.materials.subtypes.raw_material.data[3].value,
      催化剂: reportData.value.resources.materials.subtypes.catalyst.data[3].value,
      存储容量: reportData.value.resources.materials.subtypes.storage.data[3].value,
    },
    公用工程区: {
      原料: reportData.value.resources.materials.subtypes.raw_material.data[4].value,
      催化剂: reportData.value.resources.materials.subtypes.catalyst.data[4].value,
      存储容量: reportData.value.resources.materials.subtypes.storage.data[4].value,
    },
  }

  // 更新电力资源数据
  electricityData.electricity = {
    原料储存区: reportData.value.resources.electricity.data[0].value,
    反应器区: reportData.value.resources.electricity.data[1].value,
    分离提纯区: reportData.value.resources.electricity.data[2].value,
    成品储存区: reportData.value.resources.electricity.data[3].value,
    公用工程区: reportData.value.resources.electricity.data[4].value,
  }
}

// 准备人力资源分配数据
const staffData = {
  staff: {
    原料储存区: {
      技术人员: defaultReport.resources.personnel.subtypes.technician.data[0].value,
      管理人员: defaultReport.resources.personnel.subtypes.manager.data[0].value,
      维修人员: defaultReport.resources.personnel.subtypes.maintenance.data[0].value,
      安全人员: defaultReport.resources.personnel.subtypes.safety.data[0].value,
      操作人员: defaultReport.resources.personnel.subtypes.operator.data[0].value,
    },
    反应器区: {
      技术人员: defaultReport.resources.personnel.subtypes.technician.data[1].value,
      管理人员: defaultReport.resources.personnel.subtypes.manager.data[1].value,
      维修人员: defaultReport.resources.personnel.subtypes.maintenance.data[1].value,
      安全人员: defaultReport.resources.personnel.subtypes.safety.data[1].value,
      操作人员: defaultReport.resources.personnel.subtypes.operator.data[1].value,
    },
    分离提纯区: {
      技术人员: defaultReport.resources.personnel.subtypes.technician.data[2].value,
      管理人员: defaultReport.resources.personnel.subtypes.manager.data[2].value,
      维修人员: defaultReport.resources.personnel.subtypes.maintenance.data[2].value,
      安全人员: defaultReport.resources.personnel.subtypes.safety.data[2].value,
      操作人员: defaultReport.resources.personnel.subtypes.operator.data[2].value,
    },
    成品储存区: {
      技术人员: defaultReport.resources.personnel.subtypes.technician.data[3].value,
      管理人员: defaultReport.resources.personnel.subtypes.manager.data[3].value,
      维修人员: defaultReport.resources.personnel.subtypes.maintenance.data[3].value,
      安全人员: defaultReport.resources.personnel.subtypes.safety.data[3].value,
      操作人员: defaultReport.resources.personnel.subtypes.operator.data[3].value,
    },
    公用工程区: {
      技术人员: defaultReport.resources.personnel.subtypes.technician.data[4].value,
      管理人员: defaultReport.resources.personnel.subtypes.manager.data[4].value,
      维修人员: defaultReport.resources.personnel.subtypes.maintenance.data[4].value,
      安全人员: defaultReport.resources.personnel.subtypes.safety.data[4].value,
      操作人员: defaultReport.resources.personnel.subtypes.operator.data[4].value,
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
      原料: defaultReport.resources.materials.subtypes.raw_material.data[0].value,
      催化剂: defaultReport.resources.materials.subtypes.catalyst.data[0].value,
      存储容量: defaultReport.resources.materials.subtypes.storage.data[0].value,
    },
    反应器区: {
      原料: defaultReport.resources.materials.subtypes.raw_material.data[1].value,
      催化剂: defaultReport.resources.materials.subtypes.catalyst.data[1].value,
      存储容量: defaultReport.resources.materials.subtypes.storage.data[1].value,
    },
    分离提纯区: {
      原料: defaultReport.resources.materials.subtypes.raw_material.data[2].value,
      催化剂: defaultReport.resources.materials.subtypes.catalyst.data[2].value,
      存储容量: defaultReport.resources.materials.subtypes.storage.data[2].value,
    },
    成品储存区: {
      原料: defaultReport.resources.materials.subtypes.raw_material.data[3].value,
      催化剂: defaultReport.resources.materials.subtypes.catalyst.data[3].value,
      存储容量: defaultReport.resources.materials.subtypes.storage.data[3].value,
    },
    公用工程区: {
      原料: defaultReport.resources.materials.subtypes.raw_material.data[4].value,
      催化剂: defaultReport.resources.materials.subtypes.catalyst.data[4].value,
      存储容量: defaultReport.resources.materials.subtypes.storage.data[4].value,
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
    原料储存区: defaultReport.resources.electricity.data[0].value,
    反应器区: defaultReport.resources.electricity.data[1].value,
    分离提纯区: defaultReport.resources.electricity.data[2].value,
    成品储存区: defaultReport.resources.electricity.data[3].value,
    公用工程区: defaultReport.resources.electricity.data[4].value,
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

// 添加组件常量标识
const COMPONENT_SOURCE = 'chemical-resource-chart'

// 管道流动处理功能
// 显示管道流动
const showPipeFlow = (params: any) => {
  if (!params || !params.seriesName || !params.name) return

  // 确定资源类型和车间
  const workshop = params.name // 车间名称
  let resourceType = params.seriesName
  let value = params.value
  let fromWorkshop = ''
  let toWorkshop = ''

  // 根据当前图表类型和资源类型定义流动路径
  switch (currentChartType.value) {
    case 0: // 人力资源
      // 人力资源从原料储存区流向展示的车间
      resourceType = params.seriesName
      fromWorkshop = '原料储存区'
      toWorkshop = workshop !== '原料储存区' ? workshop : '反应器区'
      break
    case 1: // 物料资源
      if (resourceType === '原料') {
        fromWorkshop = '原料储存区'
        toWorkshop = workshop !== '原料储存区' ? workshop : '反应器区'
      } else if (resourceType === '催化剂') {
        fromWorkshop = '公用工程区'
        toWorkshop = workshop !== '公用工程区' ? workshop : '反应器区'
      } else {
        fromWorkshop = workshop
        toWorkshop =
          workshop === '反应器区'
            ? '分离提纯区'
            : workshop === '分离提纯区'
              ? '成品储存区'
              : workshop === '成品储存区'
                ? '原料储存区'
                : '反应器区'
      }
      break
    case 2: // 电力资源
      fromWorkshop = '公用工程区'
      toWorkshop = workshop !== '公用工程区' ? workshop : '反应器区'
      break
  }

  // 构建发送给Unity的数据
  const pipeData = {
    from_workshop: fromWorkshop,
    to_workshop: toWorkshop,
    resource_type: resourceType,
    amount: value || 0,
    iteration: 1,
    timestamp: Date.now(),
  }

  // 发送消息到Unity显示管道
  console.log('显示管道流动:', pipeData)
  unityService.sendMessageToUnity('Pipe', 'PipeHighlightOn', JSON.stringify(pipeData))

  // 构建文本框显示数据
  const displayData = {
    timestamp: new Date().toISOString(),
    resource_type: resourceType,
    from_workshop: fromWorkshop,
    to_workshop: toWorkshop,
    amount: value || 0,
    unit: getUnitByResourceType(),
    status: getResourceStatus(value),
  }

  // 显示消息框
  messageStore.showMessage(
    displayData,
    {
      labelMap: {
        timestamp: '时间戳',
        resource_type: '资源类型',
        from_workshop: '来源区域',
        to_workshop: '目标区域',
        amount: '数值',
        unit: '单位',
        status: '状态',
      },
      valueFormatters: {
        amount: (v: number) => `${v.toFixed(2)}`,
        timestamp: (v: string) => new Date(v).toLocaleString(),
      },
      statusCheckers: {
        status: (v: string) => v.toLowerCase(),
      },
    },
    {
      source: COMPONENT_SOURCE, // 可选的消息来源标识
      title: `${resourceTitles[currentChartType.value]}`, // 设置特定标题
    },
  )
}

// 获取资源单位
const getUnitByResourceType = () => {
  switch (currentChartType.value) {
    case 0:
      return '人'
    case 1:
      return '吨'
    case 2:
      return 'kW'
    default:
      return ''
  }
}

// 获取资源状态
const getResourceStatus = (value: number) => {
  const ranges = getNormalRanges()
  if (!ranges) return '正常'
  return value < ranges[0] || value > ranges[1] ? '警告' : '正常'
}

// 获取正常范围（示例逻辑，根据实际情况调整）
const getNormalRanges = (): [number, number] | null => {
  switch (currentChartType.value) {
    case 0: // 人力资源
      return [3, 10] // 示例范围
    case 1: // 物料资源
      return [100, 500] // 示例范围
    case 2: // 电力资源
      return [200, 1000] // 示例范围
    default:
      return null
  }
}

// 隐藏管道流动
const hidePipeFlow = () => {
  // 隐藏文本框
  messageStore.hideMessage(COMPONENT_SOURCE)
  // 发送消息到Unity隐藏管道
  unityService.sendMessageToUnity('Pipe', 'PipeHighlightOff', '')
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

  // 添加事件监听
  chartInstance.on('mouseover', (params) => {
    showPipeFlow(params)
  })

  chartInstance.on('mouseout', () => {
    hidePipeFlow()
  })
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
  // 文本框
  chartRef.value?.addEventListener('mouseleave', hidePipeFlow)

  addGlobalStyle()

  // 加载报告数据
  loadReportData()

  // 初始化图表
  initChart()

  // 添加窗口大小变化监听
  window.addEventListener('resize', () => {
    if (chartInstance) {
      chartInstance.resize()
    }
  })

  // 监听算法选择变化
  watch(
    // 同时监听算法名称和阈值参数的变化
    () => [algorithmStore.selectedAlgorithm, algorithmStore.convergenceThreshold],
    () => {
      if (algorithmStore.isDataLoaded) {
        loadReportData()
      }
    },
  )
})

// 组件销毁前清理
onBeforeUnmount(() => {
  // 文本框
  chartRef.value?.removeEventListener('mouseleave', hidePipeFlow)

  // 先移除事件监听
  if (chartInstance) {
    chartInstance.off('mouseover')
    chartInstance.off('mouseout')
  }

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

// 在图表容器添加鼠标离开监听
onMounted(() => {
  chartRef.value?.addEventListener('mouseleave', hidePipeFlow)
})

// onBeforeUnmount(() => {
//   chartRef.value?.removeEventListener('mouseleave', hidePipeFlow)
// })
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
  <TextMessageDisplayBox />
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
