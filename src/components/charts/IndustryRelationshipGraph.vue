<script setup lang="ts">
/**
 * @description 工业行业关系图谱组件
 *
 * 该组件使用ECharts实现工业行业关系图谱可视化
 * 展示行业、厂区节点及其关联关系
 * 支持多种链接类型：价值链、物流链、业务链
 * 实现节点和链接的交互效果
 */
import { ref, onMounted, onUnmounted, inject, watch, defineEmits } from 'vue'
import * as echarts from 'echarts'

// 定义组件事件
const emit = defineEmits(['selectIndustry', 'selectPlant', 'linkClicked'])

// 获取图表容器展开状态
const isChartExpanded = inject('isChartExpanded', ref(false))

// 图表实例引用
const chartRef = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

// 当前高亮的节点和链接
const hoveredNodeId = ref<string | null>(null)
const hoveredLinkId = ref<string | null>(null)

// 组件属性 - 从父组件接收数据
const props = defineProps({
  industries: {
    type: Array,
    required: true,
  },
  industryPlants: {
    type: Object,
    required: true,
  },
  linkTypes: {
    type: Array,
    required: true,
  },
  interIndustryLinks: {
    type: Array,
    required: true,
  },
  intraIndustryLinks: {
    type: Object,
    required: true,
  },
})

// 节点类别颜色映射
const categoryColors = {
  industry: {
    chemical: '#d84315',
    steel: '#1a5889',
    newEnergy: '#00695c',
    pharmaceutical: '#4527a0',
  },
  plant: {
    chemical: '#e57373',
    steel: '#64b5f6',
    newEnergy: '#4db6ac',
    pharmaceutical: '#9575cd',
  },
}

// 链接颜色映射
const linkColors = {
  value: '#F56C6C',
  logistics: '#409EFF',
  business: '#67C23A',
}

// 格式化工具函数
const formatIndustryData = () => {
  // 创建节点数据数组
  const nodes: any[] = []
  const edges: any[] = []
  const categories: any[] = []

  // 添加行业分类
  categories.push({
    name: '行业',
    itemStyle: {
      borderWidth: 2,
    },
  })

  // 添加厂区分类
  categories.push({
    name: '厂区',
    itemStyle: {
      borderWidth: 1,
    },
  })

  // 添加行业节点
  props.industries.forEach((industry: any) => {
    nodes.push({
      id: industry.id,
      name: industry.name,
      value: 60, // 增大节点大小增加斥力
      category: 0, // 行业类别
      industry: industry.id,
      symbolSize: 60, // 增大行业节点尺寸，使其更加突出
      fixed: true, // 固定主要行业节点位置，避免布局混乱
      x: industry.x * 0.75, // 调整位置系数，避免节点过度集中
      y: industry.y * 0.75,
      itemStyle: {
        color: categoryColors.industry[industry.id as keyof typeof categoryColors.industry],
      },
      label: {
        show: true,
        position: 'inside',
        formatter: '{b}',
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
      },
    })
  })

  // 添加厂区节点 - 优化厂区节点布局，避免重叠
  Object.entries(props.industryPlants).forEach(([industryId, plants]) => {
    ;(plants as any[]).forEach((plant: any, index: number) => {
      const industry = props.industries.find((ind: any) => ind.id === industryId) as {
        id: string
        name: string
        x: number
        y: number
      }
      if (!industry) return

      // 计算厂区节点的初始位置，根据行业类型进行差异化分布
      const angleStep = (2 * Math.PI) / (plants as any[]).length
      // 不同行业使用不同的起始角度和半径，避免节点在相似位置
      const offsetAngles = {
        chemical: 0,
        steel: Math.PI / 4,
        newEnergy: Math.PI / 2,
        pharmaceutical: (3 * Math.PI) / 4,
      }
      const baseRadiuses = {
        chemical: 150,
        steel: 160,
        newEnergy: 170,
        pharmaceutical: 180,
      }

      // 计算每个厂区的位置角度和半径
      const angleOffset = offsetAngles[industryId as keyof typeof offsetAngles] || 0
      const baseRadius = baseRadiuses[industryId as keyof typeof baseRadiuses] || 150
      // 变化的半径使厂区分布更加自然
      const radius = baseRadius + (index % 2) * 30
      const angle = angleOffset + index * angleStep

      nodes.push({
        id: `${industryId}_${plant.id}`,
        name: plant.name,
        description: plant.description,
        value: 30, // 增加节点值，影响力导向图的布局计算
        category: 1, // 厂区类别
        industry: industryId,
        plantId: plant.id,
        index: index,
        symbolSize: 45, // 增大厂区节点尺寸
        // 根据特定角度和半径初始化位置，确保不同行业的厂区分布在不同区域
        x: industry.x * 0.75 + Math.cos(angle) * radius,
        y: industry.y * 0.75 + Math.sin(angle) * radius,
        itemStyle: {
          color: categoryColors.plant[industryId as keyof typeof categoryColors.plant],
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{b}',
          fontSize: 13,
          color: '#e0e0e0',
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: [3, 5],
          borderRadius: 3,
        },
      })

      // 添加厂区与行业的关联边
      edges.push({
        source: industryId,
        target: `${industryId}_${plant.id}`,
        value: 3,
        lineStyle: {
          width: 2.5,
          color: categoryColors.industry[industryId as keyof typeof categoryColors.industry],
          opacity: 0.6,
          curveness: 0.05 + (index % 3) * 0.03, // 添加轻微曲度，避免多条线重叠
        },
      })
    })
  })

  // 构建多重连接映射，记录行业间已有连接
  const interIndustryConnectionMap = new Map<string, number>()

  // 添加行业间的连接 - 使用更细致的曲线控制避免重叠
  props.interIndustryLinks.forEach((link: any, index: number) => {
    // 构建双向键以检测两个行业之间的连接总数
    const sourceTarget = `${link.source}-${link.target}`
    const targetSource = `${link.target}-${link.source}`

    let connectionCount = 0
    let isReversed = false

    if (interIndustryConnectionMap.has(sourceTarget)) {
      connectionCount = interIndustryConnectionMap.get(sourceTarget)! + 1
      interIndustryConnectionMap.set(sourceTarget, connectionCount)
    } else if (interIndustryConnectionMap.has(targetSource)) {
      connectionCount = interIndustryConnectionMap.get(targetSource)! + 1
      interIndustryConnectionMap.set(targetSource, connectionCount)
      isReversed = true // 标记为反向连接，将使用相反的曲线方向
    } else {
      connectionCount = 1
      interIndustryConnectionMap.set(sourceTarget, connectionCount)
    }

    // 计算不同类型连接的基础曲线度
    let baseCurveness = 0.2 // 默认曲线度

    // 为不同类型的连接设置不同的基础曲线度
    if (link.type === 'value') baseCurveness = 0.2
    else if (link.type === 'logistics') baseCurveness = 0.35
    else baseCurveness = 0.5 // business链接

    // 为重复连接路径施加偏移
    const curveOffset = (connectionCount - 1) * 0.1

    // 根据连接是否是反向的，调整曲线方向
    const finalCurveness = isReversed ? -(baseCurveness + curveOffset) : baseCurveness + curveOffset

    // 为不同类型的连接设置不同线型
    const lineType = link.type === 'value' ? 'solid' : link.type === 'logistics' ? 'dashed' : 'dotted'

    // 为不同类型的连接设置不同宽度
    const lineWidth = link.type === 'value' ? 4 : link.type === 'logistics' ? 3 : 2.5

    edges.push({
      source: link.source,
      target: link.target,
      linkType: link.type,
      description: link.description,
      value: 5,
      id: `inter_${index}`,
      lineStyle: {
        color: linkColors[link.type as keyof typeof linkColors],
        width: lineWidth,
        opacity: 0.7,
        curveness: finalCurveness,
        type: lineType,
        shadowColor: 'rgba(0, 0, 0, 0.3)',
        shadowBlur: 3,
      },
      emphasis: {
        lineStyle: {
          width: lineWidth * 1.8,
          opacity: 0.9,
          shadowBlur: 8,
        },
      },
    })
  })

  // 构建连接路径映射，记录每个节点对之间的连接
  const intraConnectionMap = new Map<string, Array<{ type: string; index: number }>>()

  // 添加厂区间的连接 - 为相同起点和终点的不同类型连接设置不同曲线度
  Object.entries(props.intraIndustryLinks).forEach(([industryId, links]) => {
    // 重置计数器供每个行业内部独立使用
    ;(links as any[]).forEach((link: any, index: number) => {
      // 构建源端节点ID和目标节点ID
      const sourceId = `${industryId}_${link.source}`
      const targetId = `${industryId}_${link.target}`

      // 生成连接的唯一键 (源+目标)
      const connectionKey = sourceId < targetId ? `${sourceId}:${targetId}` : `${targetId}:${sourceId}`

      // 检查该路径是否已经有连接，并记录当前连接的类型
      if (!intraConnectionMap.has(connectionKey)) {
        intraConnectionMap.set(connectionKey, [])
      }

      // 添加当前连接的类型和索引到记录
      const connections = intraConnectionMap.get(connectionKey)!
      connections.push({ type: link.type, index: connections.length })

      // 根据当前连接是该路径的第几条连接计算曲线度
      const connectionCount = connections.length
      const isReversed = sourceId > targetId // 判断是否为反向连接

      // 为不同类型的连接设置基础曲线度
      let baseCurveness = link.type === 'value' ? 0.2 : link.type === 'logistics' ? 0.3 : 0.4

      // 根据连接数量调整曲线度，确保每条连接的曲线度不同
      const curveOffset = (connectionCount - 1) * 0.15

      // 如果是反向连接，使用负的曲线度，使曲线反向
      const finalCurveness = isReversed ? -(baseCurveness + curveOffset) : baseCurveness + curveOffset

      // 为不同类型的连接设置不同线型
      const lineType = link.type === 'value' ? 'solid' : link.type === 'logistics' ? 'dashed' : 'dotted'

      // 为不同类型的连接设置不同宽度
      const lineWidth = link.type === 'value' ? 3 : link.type === 'logistics' ? 2.5 : 2

      // 创建边数据对象
      edges.push({
        source: sourceId,
        target: targetId,
        linkType: link.type,
        industry: industryId,
        description: link.description,
        value: 3,
        id: `${industryId}_${index}`,
        lineStyle: {
          color: linkColors[link.type as keyof typeof linkColors],
          width: lineWidth,
          opacity: 0.7,
          curveness: finalCurveness,
          type: lineType,
          shadowColor: 'rgba(0, 0, 0, 0.2)',
          shadowBlur: 2,
        },
        emphasis: {
          lineStyle: {
            width: lineWidth * 1.8,
            opacity: 0.9,
            shadowBlur: 5,
          },
        },
      })
    })
  })

  return {
    nodes,
    edges,
    categories,
  }
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return

  // 销毁已有实例
  if (chart) {
    chart.dispose()
  }

  // 创建新实例
  chart = echarts.init(chartRef.value)

  // 格式化数据
  const { nodes, edges, categories } = formatIndustryData()

  // 设置图表选项
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          // 节点提示
          const data = params.data
          if (data.category === 0) {
            // 行业节点
            return `<div style="font-weight: bold; padding: 3px 0">${data.name}行业</div>`
          } else {
            // 厂区节点
            return `<div>
              <div style="font-weight: bold; padding: 3px 0">${data.name}</div>
              <div>${data.description || ''}</div>
              <div style="font-size: 12px; padding-top: 5px">点击查看详情</div>
            </div>`
          }
        } else if (params.dataType === 'edge') {
          // 边提示
          const data = params.data
          if (data.linkType) {
            const linkTypeName =
              data.linkType === 'value' ? '价值链' : data.linkType === 'logistics' ? '物流链' : '业务链'
            return `<div>
              <div style="font-weight: bold; padding: 3px 0">${linkTypeName}</div>
              <div style="font-size: 12px; padding-top: 5px">点击查看详情</div>
            </div>`
          }
          return ''
        }
        return ''
      },
      backgroundColor: 'rgba(50,50,50,0.8)',
      borderWidth: 0,
      textStyle: {
        color: '#fff',
      },
    },
    legend: [
      {
        // 节点类型图例
        data: ['行业', '厂区'],
        orient: 'horizontal',
        top: 10,
        right: 10,
        textStyle: {
          color: '#e0e0e0',
        },
        icon: 'circle',
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 15,
        formatter: (name: string) => {
          return name
        },
      },
      {
        // 连接类型图例
        data: [
          {
            name: '价值链',
            icon: 'line',
            itemStyle: {
              color: linkColors.value,
            },
          },
          {
            name: '物流链',
            icon: 'line',
            itemStyle: {
              color: linkColors.logistics,
            },
          },
          {
            name: '业务链',
            icon: 'line',
            itemStyle: {
              color: linkColors.business,
            },
          },
        ],
        orient: 'horizontal',
        top: 10,
        left: 10,
        textStyle: {
          color: '#e0e0e0',
        },
        itemWidth: 25,
        itemHeight: 10,
        itemGap: 20,
        selectedMode: false,
        lineStyle: {
          width: 2,
        },
      },
    ],
    graphic: [
      // 价值链示例线 - 实线
      {
        type: 'group',
        left: 20,
        top: 30,
        invisible: false,
        z: 100,
        children: [
          {
            type: 'line',
            shape: {
              x1: 0,
              y1: 0,
              x2: 20,
              y2: 0,
            },
            style: {
              stroke: linkColors.value,
              lineWidth: 3,
            },
          },
          {
            type: 'text',
            left: 25,
            top: -5,
            style: {
              text: '价值链',
              fill: '#fff',
              font: '12px sans-serif',
            },
          },
        ],
      },
      // 物流链示例线 - 虚线
      {
        type: 'group',
        left: 95,
        top: 30,
        invisible: false,
        z: 100,
        children: [
          {
            type: 'line',
            shape: {
              x1: 0,
              y1: 0,
              x2: 20,
              y2: 0,
            },
            style: {
              stroke: linkColors.logistics,
              lineWidth: 3,
              lineDash: [4, 2],
            },
          },
          {
            type: 'text',
            left: 25,
            top: -5,
            style: {
              text: '物流链',
              fill: '#fff',
              font: '12px sans-serif',
            },
          },
        ],
      },
      // 业务链示例线 - 点线
      {
        type: 'group',
        left: 170,
        top: 30,
        invisible: false,
        z: 100,
        children: [
          {
            type: 'line',
            shape: {
              x1: 0,
              y1: 0,
              x2: 20,
              y2: 0,
            },
            style: {
              stroke: linkColors.business,
              lineWidth: 3,
              lineDash: [2, 2],
            },
          },
          {
            type: 'text',
            left: 25,
            top: -5,
            style: {
              text: '业务链',
              fill: '#fff',
              font: '12px sans-serif',
            },
          },
        ],
      },
    ],
    animationDurationUpdate: 1500,
    animationEasingUpdate: 'quinticInOut',
    series: [
      {
        name: '工业行业关系图谱',
        type: 'graph',
        layout: 'force',
        data: nodes,
        links: edges,
        categories: categories,
        roam: true,
        zoom: 0.9,
        draggable: true,
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 8],
        focusNodeAdjacency: true,
        force: {
          repulsion: 1200,
          edgeLength: [200, 250],
          gravity: 0.1,
          layoutAnimation: true,
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 5,
            opacity: 1,
          },
          itemStyle: {
            shadowColor: 'rgba(0, 0, 0, 0.8)',
            shadowBlur: 10,
          },
        },
        label: {
          show: true,
          fontWeight: 'normal',
        },
        lineStyle: {
          curveness: 0.2,
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 1,
          shadowColor: 'rgba(0, 0, 0, 0.3)',
          shadowBlur: 5,
        },
      },
    ],
    backgroundColor: 'transparent',
  }

  // 应用选项
  chart.setOption(option as echarts.EChartsOption)

  // 监听事件
  chart.on('click', (params: any) => {
    if (params.dataType === 'node') {
      const nodeData = params.data

      // 行业节点点击
      if (nodeData.category === 0) {
        emit('selectIndustry', nodeData.id)
      }
      // 厂区节点点击
      else if (nodeData.category === 1) {
        emit('selectPlant', nodeData.industry, nodeData.plantId)
      }
    } else if (params.dataType === 'edge') {
      const linkData = params.data
      if (linkData.linkType) {
        // 行业间连接
        if (linkData.id && linkData.id.startsWith('inter_')) {
          emit('linkClicked', linkData, true)
        }
        // 厂区间连接
        else {
          emit('linkClicked', linkData, false)
        }
      }
    }
  })

  // 鼠标悬停事件
  chart.on('mouseover', (params: any) => {
    if (params.dataType === 'node') {
      hoveredNodeId.value = params.data.id
    } else if (params.dataType === 'edge') {
      hoveredLinkId.value = params.data.id
    }
  })

  // 鼠标离开事件
  chart.on('mouseout', () => {
    hoveredNodeId.value = null
    hoveredLinkId.value = null
  })
}

// 监听窗口大小变化
const handleResize = () => {
  if (chart) {
    chart.resize()
  }
}

// 监听展开状态变化
watch(isChartExpanded, () => {
  setTimeout(() => {
    if (chart) {
      chart.resize()
    } else {
      initChart()
    }
  }, 300)
})

// 生命周期钩子
onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (chart) {
    chart.dispose()
    chart = null
  }
  window.removeEventListener('resize', handleResize)
})

// 公开方法：刷新图表
const refreshChart = () => {
  if (chart) {
    const { nodes, edges, categories } = formatIndustryData()
    chart.setOption({
      series: [
        {
          data: nodes,
          links: edges,
          categories: categories,
        },
      ],
    })
  }
}

// 公开方法：高亮特定节点
const highlightNode = (nodeId: string) => {
  if (chart) {
    // 找到节点对应的索引
    const { nodes } = formatIndustryData()
    const nodeIndex = nodes.findIndex((node) => node.id === nodeId)

    if (nodeIndex !== -1) {
      chart.dispatchAction({
        type: 'highlight',
        seriesIndex: 0,
        dataIndex: nodeIndex,
      })
    }
  }
}

// 向父组件暴露方法
defineExpose({
  refreshChart,
  highlightNode,
})
</script>

<template>
  <div class="industry-graph-container">
    <div ref="chartRef" class="chart"></div>
  </div>
</template>

<style scoped>
.industry-graph-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.chart {
  width: 100%;
  height: 100%;
}
</style>
