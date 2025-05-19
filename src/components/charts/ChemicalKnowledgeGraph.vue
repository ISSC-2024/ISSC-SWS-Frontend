<script setup lang="ts">
/**
 * @description 工厂监控点知识图谱组件
 */
import { ref, onMounted, onUnmounted, inject, watch } from 'vue'
import * as echarts from 'echarts'
// 引入 algorithmStore
import { useAlgorithmStore, ModuleType } from '@/stores/algorithmStore'
// 引入Pinia状态管理和类型定义
import { useGraphStore, type NodeData, type LinkData } from '@/stores/graphStore'
// 引入Unity通信服务
import unityService from '@/services/UnityService'

// 获取图表容器展开状态
const isChartExpanded = inject('isChartExpanded', ref(false))

// 图表实例引用
const chartRef = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

// 记录原始节点和连接，用于恢复显示
const originalNodes = ref<NodeData[]>([])
const originalLinks = ref<LinkData[]>([])
// 当前聚焦的区域
const focusedArea = ref<string | null>(null)
// Unity全局聚焦状态
const isUnityGlobalFocused = ref(false)
// Unity全局聚焦区域列表
const unityFocusAreas = ['PRO', 'REA', 'RMS', 'SEP', 'UTL']
// 控制标签显示状态
const showAllLabels = ref(false)

// 使用Pinia存储全局状态
const graphStore = useGraphStore()
// 使用算法状态管理
const algorithmStore = useAlgorithmStore()

// 存储加载的图谱数据
const graphData = ref<{
  nodes: NodeData[]
  links: LinkData[]
  categories: { name: string }[]
}>({
  nodes: [],
  links: [],
  categories: [],
})

// 节点类别颜色映射
const categoryColors = [
  '#5470c6', // 区域 - 蓝色
  '#9a60b4', // 传感器 - 紫色
  '#67C23A', // 安全 - 绿色
  '#E6A23C', // 警告 - 黄色
  '#F56C6C', // 危险 - 红色
]

// 连接线颜色映射
const linkColors = {
  areaToArea: '#6782B4', // 区域到区域的连接 - 深蓝色
  areaToSensor: '#7D48A6', // 区域到传感器的连接 - 深紫色
  sensorToSafe: '#4FB553', // 传感器到安全节点的连接 - 深绿色
  sensorToWarning: '#D69D2A', // 传感器到警告节点的连接 - 深黄色
  sensorToDanger: '#D64541', // 传感器到危险节点的连接 - 深红色
}

// 发送高亮信息到Unity
const sendHighlightToUnity = (areaCode: string | null, highlight: boolean): void => {
  if (!areaCode) return // 如果没有区域代码，则直接返回

  // 构建基本消息结构
  const message: { highlight: boolean; area: string; nodes: Record<string, number> } = {
    highlight: highlight,
    area: areaCode || '',
    nodes: {},
  }

  // 查找该区域下的所有传感器
  const areaSensors = originalNodes.value.filter((node: NodeData) => node.category === 1 && node.area_code === areaCode)

  // 为每个传感器添加权重信息
  areaSensors.forEach((sensor: NodeData) => {
    if (sensor.id && sensor.weight !== undefined) {
      message.nodes[sensor.id.replace(`${areaCode}_`, '')] = Math.round(sensor.weight * 1000) / 1000
    }
  })

  // 发送消息到Unity
  const messageJson = JSON.stringify(message)
  console.log('向Unity发送消息:', messageJson)
  unityService.sendMessageToUnity('Sensor', 'KnowledgeHighlight', messageJson)
}

// 切换Unity全局聚焦状态
const toggleUnityGlobalFocus = () => {
  isUnityGlobalFocused.value = !isUnityGlobalFocused.value

  unityFocusAreas.forEach((areaCode) => {
    // 发送高亮或取消高亮消息
    sendHighlightToUnity(areaCode, isUnityGlobalFocused.value)
  })
}

// 加载数据
const loadGraphData = async () => {
  try {
    // 使用 algorithmStore 获取模块2的数据
    const knowledgeGraphModule = await algorithmStore.getModuleDataFile(ModuleType.Module2)

    if (knowledgeGraphModule && knowledgeGraphModule.default) {
      graphData.value = knowledgeGraphModule.default
      const currentAlgorithm = algorithmStore.getModuleSelectedAlgorithm(ModuleType.Module2)
      console.log(`成功加载知识图谱数据(${currentAlgorithm})`)

      // 加载数据后初始化图表
      initChart()
    } else {
      console.warn('知识图谱数据为空')
    }
  } catch (error) {
    console.error('加载知识图谱数据失败:', error)
  }
}

// 修改初始化图表方法
const initChart = () => {
  if (!chartRef.value || !graphData.value.nodes || !graphData.value.links) return

  // 销毁已有实例
  if (chart) {
    chart.dispose()
  }

  // 创建新实例
  chart = echarts.init(chartRef.value)

  // 确保在初始化时，判断展开状态并应用对应的图例样式
  const expanded = isChartExpanded.value

  // 深拷贝节点数据和连接数据，确保不修改原始数据
  const processedNodes = JSON.parse(JSON.stringify(graphData.value.nodes)).map((node: NodeData) => {
    // 根据节点类别分配颜色
    switch (node.category) {
      case 0: // 区域节点
        node.itemStyle = { color: categoryColors[0] }
        // 增大区域节点的斥力值，使它们相互远离
        node.value = 800
        break
      case 1: // 传感器节点
        node.itemStyle = { color: categoryColors[1] }
        break
      case 2: // 安全节点
        node.itemStyle = { color: categoryColors[2] }
        break
      case 3: // 警告节点
        node.itemStyle = { color: categoryColors[3] }
        break
      case 4: // 危险节点
        node.itemStyle = { color: categoryColors[4] }
        break
    }
    return node
  })

  // 保存原始数据以便后续恢复
  originalNodes.value = JSON.parse(JSON.stringify(processedNodes))

  // 处理连接线，设置不同类型连接线的颜色和连接强度
  const processedLinks = JSON.parse(JSON.stringify(graphData.value.links)).map((link: LinkData) => {
    const sourceId = link.source
    const targetId = link.target

    // 判断连接类型并设置相应颜色和连接强度
    if (sourceId.length <= 3 && targetId.length <= 3) {
      // 区域到区域的连接 - 统一连接强度为2
      link.value = 2
      link.lineStyle = {
        color: linkColors.areaToArea,
        width: 2,
      }
    } else if (sourceId.length <= 3 && targetId.includes('_')) {
      // 区域到传感器的连接 - 统一连接强度为2
      link.value = 2
      link.lineStyle = {
        color: linkColors.areaToSensor,
        width: 2,
      }
    } else if (
      sourceId.includes('_') &&
      !sourceId.includes('safe') &&
      !sourceId.includes('warning') &&
      !sourceId.includes('danger')
    ) {
      // 传感器到安全状态节点的连接 - 连接强度在1~4之间
      let linkValue = 0

      if (targetId.includes('safe')) {
        // 提取权重并计算连接强度(1-4)
        const sourceNode = processedNodes.find((node: { id: string }) => node.id === sourceId) as NodeData
        const weight = sourceNode?.weight || 0.5
        linkValue = Math.max(1, Math.min(4, Math.round((1 - weight) * 4)))

        link.value = linkValue
        link.lineStyle = {
          color: linkColors.sensorToSafe,
          width: linkValue,
        }
      } else if (targetId.includes('warning')) {
        // 提取权重并计算连接强度(1-4)
        const sourceNode = processedNodes.find((node: { id: string }) => node.id === sourceId) as NodeData
        const weight = sourceNode?.weight || 0.5
        linkValue = Math.max(1, Math.min(4, Math.round(4 * (0.5 - Math.abs(weight - 0.5)) * 2)))

        link.value = linkValue
        link.lineStyle = {
          color: linkColors.sensorToWarning,
          width: linkValue,
        }
      } else if (targetId.includes('danger')) {
        // 提取权重并计算连接强度(1-4)
        const sourceNode = processedNodes.find((node: { id: string }) => node.id === sourceId) as NodeData
        const weight = sourceNode?.weight || 0.5
        linkValue = Math.max(1, Math.min(4, Math.round(weight * 4)))

        link.value = linkValue
        link.lineStyle = {
          color: linkColors.sensorToDanger,
          width: linkValue,
        }
      }
    }

    return link
  })

  // 保存原始连接以便后续恢复
  originalLinks.value = JSON.parse(JSON.stringify(processedLinks))

  // 根据当前状态决定显示内容
  let displayNodes: NodeData[], displayLinks: LinkData[], zoomLevel: number, shouldShowLabels: boolean

  if (graphStore.focusedArea) {
    // 如果已聚焦，使用过滤后的数据
    if (graphStore.filteredNodes.length === 0) {
      // 如果没有过滤数据，重新过滤
      console.log('重新生成过滤数据...')
      const { nodes, links } = getFilteredNodesAndLinks(graphStore.focusedArea)
      graphStore.setFilteredData(nodes, links)
    }

    displayNodes = graphStore.filteredNodes
    displayLinks = graphStore.filteredLinks
    zoomLevel = 0.4
    shouldShowLabels = true // 聚焦时显示标签
  } else {
    // 未聚焦，显示全部数据
    displayNodes = processedNodes
    displayLinks = processedLinks
    zoomLevel = 0.15
    shouldShowLabels = graphStore.showLabels // 根据全局标签设置决定
  }

  // 设置图表选项 - 确保即使在初始化时也应用正确的图例样式
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          const data = params.data as NodeData

          // 传感器节点
          if (data.weight !== undefined && data.category === 1) {
            return `<div style="text-align:left">
              <b>${data.name}</b><br/>
              区域: ${data.area_code}<br/>
              当前状态: ${data.pred_risk}<br/>
              风险值: ${(data.weight * 100).toFixed(2)}%
            </div>`
          }
          // 安全状态节点
          else if (data.category === 2 || data.category === 3 || data.category === 4) {
            if (data.sensor_id && data.weight !== undefined) {
              return `<div style="text-align:left">
                <b>${data.name}</b><br/>
                传感器: ${data.sensor_id}<br/>
                风险值: ${(data.weight * 100).toFixed(2)}%
              </div>`
            }
          }
          // 区域节点
          return `<div style="text-align:left"><b>${data.name}</b></div>`
        } else if (params.dataType === 'edge') {
          return `连接强度: ${params.data.value}`
        }
        return ''
      },
      backgroundColor: 'rgba(50,50,50,0.8)',
      borderWidth: 0,
      textStyle: {
        color: '#fff',
      },
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: expanded ? 10 : 5,
      top: expanded ? 20 : 10,
      textStyle: {
        fontSize: expanded ? 12 : 10,
        color: 'rgba(220, 230, 240, 0.9)',
      },
      itemWidth: expanded ? 25 : 15,
      itemHeight: expanded ? 14 : 8,
      itemGap: expanded ? 10 : 5,
      padding: expanded ? [5, 10] : [2, 5],
      backgroundColor: 'rgba(20, 35, 65, 0.8)',
      borderColor: 'rgba(32, 160, 255, 0.3)',
      borderWidth: expanded ? 1 : 0,
      borderRadius: 4,
      shadowColor: 'rgba(0, 0, 0, 0.3)',
      shadowBlur: expanded ? 10 : 0,
      formatter: function (name: any) {
        // 在非展开状态下截断过长的名称
        if (!expanded && name.length > 6) {
          return name.substring(0, 5) + '...'
        }
        return name
      },
    },
    animationDuration: 1500,
    animationEasingUpdate: 'quinticInOut',
    series: [
      {
        id: 'knowledge-graph',
        name: '工厂监控点知识图谱',
        type: 'graph',
        layout: 'force',
        // 使用当前状态下应显示的节点和连接
        data: displayNodes,
        links: displayLinks,
        categories: graphData.value.categories.map((category: { name: string }, index: number) => ({
          ...category,
          itemStyle: {
            color: categoryColors[index],
          },
        })),
        roam: true, // 允许缩放和平移
        // 根据是否聚焦设置缩放级别
        zoom: zoomLevel,
        // 居中显示
        center: ['50%', '50%'],
        label: {
          show: shouldShowLabels, // 根据当前状态决定是否显示标签
          position: 'right',
          formatter: (params: { data: NodeData }) => {
            // 根据节点类型返回不同格式的标签
            const node = params.data

            if (node.category === 0) {
              // 区域节点
              return node.name
            } else if (node.category === 1) {
              // 传感器节点
              return node.id
            } else if ([2, 3, 4].includes(node.category)) {
              // 安全等级节点
              return node.name
            }
            return params.data.name
          },
          color: '#333',
          backgroundColor: 'rgba(255,255,255,0.7)', // 添加标签背景色，提高可读性
          padding: [3, 5],
          borderRadius: 3,
        },
        // 确保节点样式不会被series级别的itemStyle覆盖
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 1,
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.3)',
        },
        // 禁用系列级别的自动颜色分配
        color: categoryColors,
        force: {
          repulsion: graphStore.focusedArea ? 1500 : [800, 1500], // 根据是否聚焦调整斥力
          edgeLength: graphStore.focusedArea ? 200 : [100, 300], // 根据是否聚焦调整边长
          gravity: 0.05, // 降低重力，让节点分散得更开
          layoutAnimation: true,
          friction: 0.8, // 增加摩擦系数，使布局更稳定
        },
        edgeSymbol: ['none', 'none'],
        edgeLabel: {
          show: false,
        },
        lineStyle: {
          opacity: 0.8,
          curveness: 0.2,
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 6,
          },
          scale: true,
        },
      },
    ],
    backgroundColor: 'transparent',
  }

  // 应用选项
  chart.setOption(option as echarts.EChartsOption)

  // 同步本地组件状态和Pinia状态
  focusedArea.value = graphStore.focusedArea
  showAllLabels.value = graphStore.showLabels

  // 双击事件 - 区域节点聚焦
  chart.on('dblclick', (params: any) => {
    if (params.dataType === 'node') {
      const nodeData = params.data

      if (nodeData.category === 0) {
        // 如果双击的是区域节点
        const areaCode = nodeData.id

        // 判断是否已经聚焦在该区域，如果是则恢复全部显示
        if (graphStore.focusedArea === areaCode) {
          restoreFullGraph()
          return
        }

        // 记录当前聚焦的区域（更新Pinia状态）
        graphStore.setFocusedArea(areaCode)
        focusedArea.value = areaCode

        // 向Unity发送高亮信息
        sendHighlightToUnity(areaCode, true)

        // 过滤出需要显示的节点和连接
        focusOnArea(areaCode)
      } else {
        // 对于非区域节点的双击，高亮关联节点和边
        chart?.dispatchAction({
          type: 'focusNodeAdjacency',
          seriesIndex: 0,
          dataIndex: params.dataIndex,
        })

        // 临时显示标签
        chart?.setOption({
          series: [
            {
              id: 'knowledge-graph',
              label: {
                show: true,
              },
            },
          ],
        })

        // 3秒后隐藏标签，除非全局标签显示已开启或有聚焦区域
        setTimeout(() => {
          if (!graphStore.showLabels && !graphStore.focusedArea) {
            chart?.setOption({
              series: [
                {
                  id: 'knowledge-graph',
                  label: {
                    show: false,
                  },
                },
              ],
            })
          }
        }, 3000)
      }
    }
  })
}

// 获取过滤后的节点和连接数据
const getFilteredNodesAndLinks = (areaCode: string): { nodes: NodeData[]; links: LinkData[] } => {
  if (!originalNodes.value.length || !originalLinks.value.length) {
    return { nodes: [], links: [] }
  }

  // 找出该区域下的所有传感器节点ID
  const areaSensors = originalNodes.value
    .filter((node: NodeData) => node.category === 1 && node.area_code === areaCode)
    .map((node: NodeData) => node.id)

  // 添加需要显示的节点ID集合
  const showNodeIds = new Set<string>()
  showNodeIds.add(areaCode) // 添加区域节点

  // 添加该区域的传感器节点
  areaSensors.forEach((sensorId) => showNodeIds.add(sensorId))

  // 添加传感器连接的安全等级节点
  originalLinks.value.forEach((link: LinkData) => {
    // 确保源节点是我们感兴趣的传感器
    if (areaSensors.includes(link.source as string)) {
      const targetId = link.target as string
      // 确保目标节点是安全等级节点
      if (targetId.includes('_safe') || targetId.includes('_warning') || targetId.includes('_danger')) {
        showNodeIds.add(targetId)
      }
    }
  })

  // 过滤需要显示的节点
  const filteredNodes = originalNodes.value.filter((node: NodeData) => showNodeIds.has(node.id))

  // 过滤需要显示的连接
  const filteredLinks = originalLinks.value.filter(
    (link: LinkData) => showNodeIds.has(link.source as string) && showNodeIds.has(link.target as string),
  )

  return { nodes: filteredNodes, links: filteredLinks }
}

// 切换标签显示状态
const toggleLabels = (): void => {
  // 如果当前有聚焦区域，不执行任何操作
  if (graphStore.focusedArea) {
    return
  }

  // 更新Pinia状态
  graphStore.toggleLabels()

  // 同步本地状态
  showAllLabels.value = graphStore.showLabels

  if (chart) {
    chart.setOption({
      series: [
        {
          id: 'knowledge-graph',
          label: {
            show: graphStore.showLabels,
          },
        },
      ],
    })
  }
}

// 聚焦到特定区域，并显示标签
const focusOnArea = (areaCode: string): void => {
  if (!chart || !originalNodes.value.length || !originalLinks.value.length) return

  // 获取过滤后的节点和连接
  const { nodes, links } = getFilteredNodesAndLinks(areaCode)

  // 保存过滤后的数据到Pinia状态
  graphStore.setFilteredData(nodes, links)

  // 更新图表数据，始终显示所有保留节点的标签
  chart.setOption({
    series: [
      {
        id: 'knowledge-graph',
        data: nodes,
        links: links,
        zoom: 0.3,
        center: ['50%', '50%'],
        // 聚焦模式下始终显示标签
        label: {
          show: true,
          position: 'right',
          formatter: (params: { data: NodeData }) => {
            // 根据节点类型返回不同格式的标签
            const node = params.data

            if (node.category === 0) {
              // 区域节点
              return node.name
            } else if (node.category === 1) {
              // 传感器节点
              return node.id
            } else if ([2, 3, 4].includes(node.category)) {
              // 安全等级节点
              return node.name
            }
            return params.data.name
          },
          color: '#333',
          backgroundColor: 'rgba(255,255,255,0.7)',
          padding: [3, 5],
          borderRadius: 3,
        },
      },
    ],
  })

  // 调整力布局参数，减少节点聚集
  chart.setOption({
    series: [
      {
        id: 'knowledge-graph',
        force: {
          repulsion: 1500,
          edgeLength: 200,
        },
      },
    ],
  })
}

// 恢复显示完整图表，同时隐藏标签（除非全局标签显示已开启）
const restoreFullGraph = (): void => {
  if (!chart || !originalNodes.value.length || !originalLinks.value.length) return

  // 向Unity发送取消高亮信息
  sendHighlightToUnity(graphStore.focusedArea, false)

  // 清除聚焦状态（更新Pinia状态）
  graphStore.setFocusedArea(null)
  focusedArea.value = null

  // 清除过滤数据
  graphStore.clearFilteredData()

  chart.setOption({
    series: [
      {
        id: 'knowledge-graph',
        data: originalNodes.value,
        links: originalLinks.value,
        zoom: 0.15, // 恢复原始缩放
        center: ['50%', '50%'],
        label: {
          // 根据全局标签状态决定是否显示标签
          show: graphStore.showLabels,
        },
        force: {
          repulsion: [800, 1500],
          edgeLength: [100, 300],
        },
      },
    ],
  })
}

// 应用当前状态 - 恢复当前聚焦状态或全部显示
const applyCurrentState = (): void => {
  if (!chart) return

  // 如果有聚焦区域但没有过滤后的数据，重新获取
  if (graphStore.focusedArea && (!graphStore.filteredNodes.length || !graphStore.filteredLinks.length)) {
    const { nodes, links } = getFilteredNodesAndLinks(graphStore.focusedArea)
    graphStore.setFilteredData(nodes, links)
  }

  // 根据当前状态决定显示内容
  const displayNodes = graphStore.focusedArea ? graphStore.filteredNodes : originalNodes.value
  const displayLinks = graphStore.focusedArea ? graphStore.filteredLinks : originalLinks.value

  chart.setOption({
    series: [
      {
        id: 'knowledge-graph',
        // 使用当前状态下应显示的节点和连接
        data: displayNodes,
        links: displayLinks,
        // 根据聚焦状态设置缩放级别
        zoom: graphStore.focusedArea ? 0.4 : 0.15,
        // 根据聚焦状态决定是否显示标签 - 聚焦时始终显示
        label: {
          show: graphStore.focusedArea ? true : graphStore.showLabels,
          position: 'right',
          formatter: (params: { data: NodeData }) => {
            const node = params.data
            if (!node) return ''

            if (node.category === 0) {
              // 区域节点
              return node.name
            } else if (node.category === 1) {
              // 传感器节点
              return node.id
            } else if ([2, 3, 4].includes(node.category)) {
              // 安全等级节点
              return node.name
            }
            return params.data.name
          },
          color: '#333',
          backgroundColor: 'rgba(255,255,255,0.7)',
          padding: [3, 5],
          borderRadius: 3,
        },
        // 根据聚焦状态设置力导向参数
        force: {
          repulsion: graphStore.focusedArea ? 1500 : [800, 1500],
          edgeLength: graphStore.focusedArea ? 200 : [100, 300],
        },
      },
    ],
  })
}

// 监听窗口大小变化
const handleResize = (): void => {
  if (chart) {
    const expanded = isChartExpanded.value

    // 调整图例样式
    chart.setOption({
      legend: {
        right: expanded ? 10 : 5,
        top: expanded ? 20 : 10,
        textStyle: {
          fontSize: expanded ? 12 : 10,
        },
        itemWidth: expanded ? 25 : 15,
        itemHeight: expanded ? 14 : 8,
        itemGap: expanded ? 10 : 5,
        padding: expanded ? [5, 10] : [2, 5],
        borderWidth: expanded ? 1 : 0,
        shadowBlur: expanded ? 10 : 0,
      },
    })

    chart.resize()

    // 调整大小后重新应用当前状态
    setTimeout(() => {
      applyCurrentState()
    }, 100)
  }
}

// 监听展开状态变化，同时调整图例大小
watch(isChartExpanded, (expanded) => {
  // 延迟执行以等待DOM更新
  setTimeout(() => {
    // 如果图表实例不存在，初始化图表
    if (!chart) {
      initChart()
      return
    }

    // 调整图例样式
    chart.setOption({
      legend: {
        right: expanded ? 10 : 5,
        top: expanded ? 20 : 10,
        textStyle: {
          fontSize: expanded ? 12 : 10, // 非展开时使用更小的字体
          color: 'rgba(220, 230, 240, 0.9)',
        },
        itemWidth: expanded ? 25 : 15, // 非展开时使用更小的图例标记
        itemHeight: expanded ? 14 : 8,
        itemGap: expanded ? 10 : 5, // 减小项目间距
        padding: expanded ? [5, 10] : [2, 5], // 减小内边距
        borderWidth: expanded ? 1 : 0, // 非展开时移除边框
        shadowBlur: expanded ? 10 : 0, // 非展开时移除阴影
      },
    })

    // 调整图表大小
    chart.resize()

    // 应用当前状态
    applyCurrentState()
  }, 300)
})

// 添加对算法变化的监听
watch(
  () => [
    algorithmStore.selectedAlgorithms[ModuleType.Module2],
    algorithmStore.algorithms[algorithmStore.selectedAlgorithms[ModuleType.Module2]]?.params,
  ],
  () => {
    console.log('模块2配置已更新，重新加载知识图谱数据')
    loadGraphData()
  },
  { deep: true },
)

// 生命周期钩子
onMounted(() => {
  // 修改为先加载数据，再由loadGraphData中调用initChart
  loadGraphData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (chart) {
    chart.dispose()
    chart = null
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="knowledge-graph-container">
    <div class="graph-header">
      <div class="graph-title">
        <div class="title-icon">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="currentColor"
              d="M12,2C17.5,2 22,6.5 22,12C22,17.5 17.5,22 12,22C6.5,22 2,17.5 2,12C2,6.5 6.5,2 12,2M12,4C7.58,4 4,7.58 4,12C4,16.42 7.58,20 12,20C16.42,20 20,16.42 20,12C20,7.58 16.42,4 12,4M12,6C15.31,6 18,8.69 18,12C18,15.31 15.31,18 12,18C8.69,18 6,15.31 6,12C6,8.69 8.69,6 12,6M12,8C9.79,8 8,9.79 8,12C8,14.21 9.79,16 12,16C14.21,16 16,14.21 16,12C16,9.79 14.21,8 12,8Z"
            />
          </svg>
        </div>
        <span>工厂监控点知识图谱</span>
      </div>
      <div v-if="graphStore.focusedArea" class="focus-indicator" :class="{ compact: !isChartExpanded }">
        <div class="pulse-dot"></div>
        <span>已聚焦: {{ graphStore.focusedArea }}</span>
        <button class="clear-focus-btn" @click="restoreFullGraph" title="清除聚焦">
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path
              fill="currentColor"
              d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"
            />
          </svg>
        </button>
      </div>
    </div>

    <div ref="chartRef" class="chart"></div>

    <!-- 仅在展开状态下显示控制面板 -->
    <div v-if="isChartExpanded" class="graph-controls">
      <button
        class="control-btn toggle-labels-btn"
        @click="toggleLabels"
        :disabled="!!graphStore.focusedArea"
        :class="{ disabled: !!graphStore.focusedArea }"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" class="btn-icon">
          <path
            fill="currentColor"
            d="M9.5,7A1.5,1.5 0 0,1 11,8.5A1.5,1.5 0 0,1 9.5,10A1.5,1.5 0 0,1 8,8.5A1.5,1.5 0 0,1 9.5,7M14,4.5A1.5,1.5 0 0,1 15.5,6A1.5,1.5 0 0,1 14,7.5A1.5,1.5 0 0,1 12.5,6A1.5,1.5 0 0,1 14,4.5M17,2A2,2 0 0,1 19,4A2,2 0 0,1 17,6A2,2 0 0,1 15,4A2,2 0 0,1 17,2M19.5,9A1.5,1.5 0 0,1 21,10.5A1.5,1.5 0 0,1 19.5,12A1.5,1.5 0 0,1 18,10.5A1.5,1.5 0 0,1 19.5,9M17,20A2,2 0 0,1 15,18A2,2 0 0,1 17,16A2,2 0 0,1 19,18A2,2 0 0,1 17,20M7,18A2,2 0 0,1 5,16A2,2 0 0,1 7,14A2,2 0 0,1 9,16A2,2 0 0,1 7,18M7,4A2,2 0 0,1 9,6A2,2 0 0,1 7,8A2,2 0 0,1 5,6A2,2 0 0,1 7,4M9.5,17A1.5,1.5 0 0,1 8,15.5A1.5,1.5 0 0,1 9.5,14A1.5,1.5 0 0,1 11,15.5A1.5,1.5 0 0,1 9.5,17M14,12.5A1.5,1.5 0 0,1 15.5,14A1.5,1.5 0 0,1 14,15.5A1.5,1.5 0 0,1 12.5,14A1.5,1.5 0 0,1 14,12.5M9.5,20.5A0.5,0.5 0 0,1 9,20A0.5,0.5 0 0,1 9.5,19.5A0.5,0.5 0 0,1 10,20A0.5,0.5 0 0,1 9.5,20.5M4.5,19.5A0.5,0.5 0 0,1 4,19A0.5,0.5 0 0,1 4.5,18.5A0.5,0.5 0 0,1 5,19A0.5,0.5 0 0,1 4.5,19.5M19.5,19.5A0.5,0.5 0 0,1 19,19A0.5,0.5 0 0,1 19.5,18.5A0.5,0.5 0 0,1 20,19A0.5,0.5 0 0,1 19.5,19.5M14.5,19.5A0.5,0.5 0 0,1 14,19A0.5,0.5 0 0,1 14.5,18.5A0.5,0.5 0 0,1 15,19A0.5,0.5 0 0,1 14.5,19.5M4.5,14.5A0.5,0.5 0 0,1 4,14A0.5,0.5 0 0,1 4.5,13.5A0.5,0.5 0 0,1 5,14A0.5,0.5 0 0,1 4.5,14.5M19.5,14.5A0.5,0.5 0 0,1 19,14A0.5,0.5 0 0,1 19.5,13.5A0.5,0.5 0 0,1 20,14A0.5,0.5 0 0,1 19.5,14.5M4.5,9.5A0.5,0.5 0 0,1 4,9A0.5,0.5 0 0,1 4.5,8.5A0.5,0.5 0 0,1 5,9A0.5,0.5 0 0,1 4.5,9.5M19.5,9.5A0.5,0.5 0 0,1 19,9A0.5,0.5 0 0,1 19.5,8.5A0.5,0.5 0 0,1 20,9A0.5,0.5 0 0,1 19.5,9.5M4.5,4.5A0.5,0.5 0 0,1 4,4A0.5,0.5 0 0,1 4.5,3.5A0.5,0.5 0 0,1 5,4A0.5,0.5 0 0,1 4.5,4.5M14.5,4.5A0.5,0.5 0 0,1 14,4A0.5,0.5 0 0,1 14.5,3.5A0.5,0.5 0 0,1 15,4A0.5,0.5 0 0,1 14.5,4.5M19.5,4.5A0.5,0.5 0 0,1 19,4A0.5,0.5 0 0,1 19.5,3.5A0.5,0.5 0 0,1 20,4A0.5,0.5 0 0,1 19.5,4.5M9.5,4.5A0.5,0.5 0 0,1 9,4A0.5,0.5 0 0,1 9.5,3.5A0.5,0.5 0 0,1 10,4A0.5,0.5 0 0,1 9.5,4.5Z"
          />
        </svg>
        <span>{{ graphStore.focusedArea ? '标签已显示' : graphStore.showLabels ? '隐藏标签' : '显示标签' }}</span>
      </button>

      <div class="graph-legend">
        <div class="legend-item" v-for="(category, index) in graphData.categories" :key="category.name">
          <div class="legend-color" :style="{ backgroundColor: categoryColors[index] }"></div>
          <div class="legend-label">{{ category.name }}</div>
        </div>
      </div>
    </div>

    <!-- 仅在展开状态下显示操作指南 -->
    <div v-if="isChartExpanded" class="graph-info-panel">
      <div class="info-title">操作指南</div>
      <div class="info-content">
        <div class="info-item">
          <div class="info-icon">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M9,5H15V9H9V5M7,3V11H17V3H7M11,13H13V17H11V13M7,21H17V11H7V21Z" />
            </svg>
          </div>
          <span>双击区域节点以聚焦该区域</span>
        </div>
        <div class="info-item">
          <div class="info-icon">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path
                fill="currentColor"
                d="M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M13,7H11V13H17V11H13V7Z"
              />
            </svg>
          </div>
          <span>双击已聚焦的区域可恢复全图</span>
        </div>
        <div class="info-item">
          <div class="info-icon">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path
                fill="currentColor"
                d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"
              />
            </svg>
          </div>
          <span>悬停在节点上查看详细信息</span>
        </div>
        <div class="info-item">
          <div class="info-icon">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path
                fill="currentColor"
                d="M16.56,5.44L15.11,6.89C16.84,7.94 18,9.83 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12C6,9.83 7.16,7.94 8.88,6.88L7.44,5.44C5.36,6.88 4,9.28 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12C20,9.28 18.64,6.88 16.56,5.44M13,3H11V13H13"
              />
            </svg>
          </div>
          <span>点击右上角图例可显示/隐藏不同类型节点</span>
        </div>
      </div>
    </div>

    <!-- 非展开状态下的提示  -->
    <div v-if="!isChartExpanded" class="mini-tip">
      <div class="mini-tip-icon">
        <svg viewBox="0 0 24 24" width="14" height="14">
          <path
            fill="currentColor"
            d="M13,9H11V7H13M13,17H11V11H13V17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"
          />
        </svg>
      </div>
      <span>展开查看更多</span>
    </div>

    <!-- 非展开状态下的Unity聚焦按钮 -->
    <button
      v-if="!isChartExpanded"
      class="unity-focus-btn"
      :class="{ focused: isUnityGlobalFocused }"
      @click.stop="toggleUnityGlobalFocus"
    >
      <div class="unity-focus-icon">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <!-- 根据状态显示不同的图标 -->
          <path
            fill="currentColor"
            v-if="!isUnityGlobalFocused"
            d="M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9M12,4.5C17,4.5 21.27,7.61 23,12C21.27,16.39 17,19.5 12,19.5C7,19.5 2.73,16.39 1,12C2.73,7.61 7,4.5 12,4.5Z"
          />
          <!-- 已聚焦状态图标 -->
          <path
            fill="currentColor"
            v-else
            d="M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M13.5,7V5.5C17.33,6.23 20,8.83 20,12C20,15.17 17.33,17.77 13.5,18.5V17C16.25,16.3 18.3,14.25 18.3,12C18.3,9.75 16.25,7.7 13.5,7M6.5,12C6.5,9.75 8.17,7.8 10.5,7.08V5.55C7.11,6.33 5,8.92 5,12C5,15.08 7.11,17.67 10.5,18.45V16.93C8.17,16.2 6.5,14.25 6.5,12Z"
          />
        </svg>
      </div>
      <span class="unity-focus-text">{{ isUnityGlobalFocused ? '取消在Unity聚焦' : '在Unity中聚焦' }}</span>
    </button>
  </div>
</template>

<style scoped>
.knowledge-graph-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  background: linear-gradient(135deg, rgba(11, 19, 43, 0.95), rgba(12, 25, 55, 0.95));
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

/* 标题栏 */
.graph-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(
    90deg,
    rgba(12, 24, 48, 0.95) 0%,
    rgba(20, 40, 80, 0.95) 50%,
    rgba(12, 24, 48, 0.95) 100%
  );
  border-bottom: 1px solid rgba(74, 144, 226, 0.2);
  position: relative;
  z-index: 5;
}

.graph-header::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: linear-gradient(90deg, rgba(32, 160, 255, 0), rgba(32, 160, 255, 0.5), rgba(32, 160, 255, 0));
}

.graph-title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(220, 230, 240, 0.95);
  font-weight: 600;
  font-size: 16px;
  text-shadow: 0 0 10px rgba(32, 160, 255, 0.3);
  letter-spacing: 0.5px;
}

.title-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #20a0ff;
  filter: drop-shadow(0 0 5px rgba(32, 160, 255, 0.5));
}

.focus-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(32, 160, 255, 0.15);
  padding: 5px 12px;
  border-radius: 16px;
  border: 1px solid rgba(32, 160, 255, 0.3);
  color: rgba(220, 230, 240, 0.9);
  font-size: 13px;
  margin-left: 15px; /* 与左侧保持一定距离 */
}

/* 非展开状态下的聚焦提示更紧凑 */
.focus-indicator.compact {
  gap: 5px;
  padding: 3px 8px;
  font-size: 11px;
  max-width: 140px; /* 限制最大宽度 */
  border-radius: 12px;
}

.focus-indicator.compact .pulse-dot {
  width: 6px;
  height: 6px;
}

/* 在紧凑模式下使区域名称可能会出现省略号 */
.focus-indicator.compact span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #20a0ff;
  position: relative;
}

.pulse-dot::after {
  content: '';
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 50%;
  background-color: rgba(32, 160, 255, 0.5);
  animation: pulse 1.5s infinite;
  z-index: -1;
}

@keyframes pulse {
  0% {
    transform: scale(0.9);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.3;
  }
  100% {
    transform: scale(0.9);
    opacity: 0.7;
  }
}

.clear-focus-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(220, 230, 240, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3px;
  margin-left: 4px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.clear-focus-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(220, 230, 240, 0.9);
}

.chart {
  flex: 1;
  position: relative;
  min-height: 0;
}

.graph-controls {
  position: absolute;
  right: 16px;
  bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 10;
}

.control-btn {
  padding: 8px 14px;
  border-radius: 6px;
  background: rgba(20, 35, 65, 0.85);
  border: 1px solid rgba(74, 144, 226, 0.3);
  color: rgba(220, 230, 240, 0.9);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.control-btn:hover:not(.disabled) {
  background: rgba(32, 50, 90, 0.9);
  border-color: rgba(74, 144, 226, 0.5);
  transform: translateY(-1px);
}

.control-btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  color: #20a0ff;
  opacity: 0.9;
}

.graph-legend {
  background: rgba(20, 35, 65, 0.85);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 6px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(220, 230, 240, 0.8);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.2);
}

.graph-info-panel {
  position: absolute;
  left: 16px;
  bottom: 16px;
  background: rgba(20, 35, 65, 0.85);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 6px;
  padding: 12px;
  width: 220px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.info-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(220, 230, 240, 0.9);
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(74, 144, 226, 0.2);
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(220, 230, 240, 0.8);
}

.info-icon {
  color: #20a0ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 为图表添加网格背景 */
.knowledge-graph-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(32, 160, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(32, 160, 255, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  opacity: 0.5;
  pointer-events: none;
  z-index: 1;
}

/* 添加光晕效果 */
.knowledge-graph-container::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 50% 10%, rgba(32, 160, 255, 0.1) 0%, rgba(32, 160, 255, 0) 70%);
  pointer-events: none;
  z-index: 2;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .graph-info-panel {
    display: none;
  }

  .graph-title {
    font-size: 14px;
  }

  .control-btn {
    padding: 6px 10px;
    font-size: 12px;
  }
}

/* 添加非展开状态下的迷你提示样式 */
.mini-tip {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(20, 35, 65, 0.85);
  border: 1px solid rgba(74, 144, 226, 0.2);
  border-radius: 4px;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: rgba(220, 230, 240, 0.7);
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.mini-tip:hover {
  opacity: 1;
}

.mini-tip-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #20a0ff;
}

/* Unity聚焦按钮样式 */
.unity-focus-btn {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: linear-gradient(135deg, rgba(20, 35, 65, 0.9), rgba(28, 50, 90, 0.9));
  border: 1px solid rgba(74, 144, 226, 0.5);
  border-radius: 6px;
  padding: 6px;
  padding-right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(220, 230, 240, 0.95);
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow:
    0 3px 10px rgba(0, 0, 0, 0.25),
    0 0 5px rgba(32, 160, 255, 0.3);
  z-index: 11;
  backdrop-filter: blur(2px);
  width: 32px;
  overflow: hidden;
}

.unity-focus-btn:hover {
  background: linear-gradient(135deg, rgba(32, 50, 90, 0.95), rgba(42, 70, 120, 0.95));
  border-color: rgba(74, 144, 226, 0.7);
  transform: translateY(-1px);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    0 0 8px rgba(32, 160, 255, 0.4);
  padding: 6px 12px;
  width: auto;
  justify-content: flex-start;
}

.unity-focus-btn.focused {
  background: linear-gradient(135deg, rgba(32, 120, 215, 0.25), rgba(32, 160, 255, 0.35));
  border-color: rgba(32, 160, 255, 0.65);
  color: rgba(255, 255, 255, 0.98);
  box-shadow:
    0 3px 12px rgba(0, 0, 0, 0.3),
    0 0 15px rgba(32, 160, 255, 0.4),
    inset 0 0 8px rgba(32, 160, 255, 0.2);
  text-shadow: 0 0 3px rgba(255, 255, 255, 0.5);
}

.unity-focus-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(74, 144, 226, 0.95);
  filter: drop-shadow(0 0 3px rgba(32, 160, 255, 0.4));
  width: 20px;
  height: 20px;
}

.unity-focus-btn.focused .unity-focus-icon {
  color: rgba(135, 206, 255, 1);
  filter: drop-shadow(0 0 5px rgba(135, 206, 255, 0.8));
  animation: pulse-light 1.5s infinite;
}

.unity-focus-text {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.2px;
  white-space: nowrap;
  opacity: 0;
  width: 0;
  overflow: hidden;
  transition: all 0.3s ease;
}

/* 悬停时显示文本 */
.unity-focus-btn:hover .unity-focus-text {
  opacity: 1;
  width: auto;
  margin-right: 4px;
}

/* 在聚焦状态下永久显示文本 */
.unity-focus-btn.focused:hover {
  padding: 6px 12px;
}

@keyframes pulse-light {
  0% {
    opacity: 0.8;
    transform: scale(0.92);
  }
  50% {
    opacity: 1;
    transform: scale(1.08);
    filter: drop-shadow(0 0 8px rgba(135, 206, 255, 0.9));
  }
  100% {
    opacity: 0.8;
    transform: scale(0.92);
  }
}

/* 右上角图例文字样式 */
:deep(.echarts-tooltip) {
  background: rgba(20, 35, 65, 0.9) !important;
  border: 1px solid rgba(32, 160, 255, 0.3) !important;
  border-radius: 4px !important;
  padding: 8px !important;
  color: rgba(220, 230, 240, 0.9) !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2) !important;
}

:deep(.echarts-legend) {
  color: rgba(220, 230, 240, 0.9) !important;
}

:deep(.echarts-legend-item) {
  color: rgba(220, 230, 240, 0.9) !important;
}

:deep(.echarts-legend-text) {
  color: rgba(220, 230, 240, 0.9) !important;
}

/* 对ECharts生成的图例进行样式覆盖 */
:deep(g.echarts-legend text) {
  fill: rgba(220, 230, 240, 0.9) !important;
}

/* 对ECharts tooltip内容样式覆盖 */
:deep(.echarts-tooltip-content) {
  color: rgba(220, 230, 240, 0.9) !important;
}
</style>
