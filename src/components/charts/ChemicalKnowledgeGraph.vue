<script setup lang="ts">
/**
 * @description 工厂监控点知识图谱组件
 *
 * 该组件使用ECharts实现工厂监控点的知识图谱可视化
 * 展示区域、传感器和安全状态的关联关系
 * 每个传感器连接到3个安全等级节点，节点大小基于传感器权重
 * 各区域之间相互连接形成网络结构
 */
import { ref, onMounted, onUnmounted, inject, watch } from 'vue'
import * as echarts from 'echarts'
// 注意：需要将Python脚本生成的JSON文件放在正确的位置
import graphData from '../../mock/monitoringKnowledgeGraph.json'

// 获取图表容器展开状态
const isChartExpanded = inject('isChartExpanded', ref(false))

// 图表实例引用
const chartRef = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

// 记录原始节点和连接，用于恢复显示
const originalNodes = ref<any[]>([])
const originalLinks = ref<any[]>([])
// 当前聚焦的区域
const focusedArea = ref<string | null>(null)
// 控制标签显示状态
const showAllLabels = ref(false)

// 自定义节点数据类型
interface NodeData {
  id: string
  name: string
  symbolSize: number
  category: number
  weight?: number
  area_code?: string
  value?: number
  pred_risk?: string
  sensor_id?: string
  itemStyle?: {
    color: string
  }
}

// 接口类型
interface LinkData {
  source: string
  target: string
  value: number
  lineStyle?: {
    color: string
    width?: number
  }
}

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

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return

  // 销毁已有实例
  if (chart) {
    chart.dispose()
  }

  // 创建新实例
  chart = echarts.init(chartRef.value)

  // 深拷贝节点数据和连接数据，确保不修改原始数据
  const processedNodes = JSON.parse(JSON.stringify(graphData.nodes)).map((node: NodeData) => {
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
  const processedLinks = JSON.parse(JSON.stringify(graphData.links)).map((link: LinkData) => {
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

  // 设置图表选项
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
      data: graphData.categories.map((a) => a.name),
      orient: 'vertical',
      right: 10,
      top: 20,
      textStyle: {
        color: '#333',
      },
      itemWidth: 25,
      itemHeight: 14,
      itemStyle: {
        borderWidth: 0,
      },
      textGap: 8,
      selected: {
        安全: true,
        警告: true,
        危险: true,
        传感器: true,
        区域: true,
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
        // 使用处理后的节点数据和连接数据
        data: processedNodes,
        links: processedLinks,
        categories: graphData.categories.map((category, index) => ({
          ...category,
          itemStyle: {
            color: categoryColors[index],
          },
        })),
        roam: true, // 允许缩放和平移
        // 固定初始缩放级别为15%
        zoom: 0.15,
        // 居中显示
        center: ['50%', '50%'],
        label: {
          show: showAllLabels.value, // 根据标签显示状态初始化
          position: 'right',
          formatter: '{b}',
          fontSize: 12,
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
          repulsion: [800, 1500], // 增加节点间的斥力，尤其是区域节点
          edgeLength: [100, 300], // 增加边的长度
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

  // 添加双击事件 - 实现区域节点聚焦功能
  chart.on('dblclick', (params) => {
    if (params.dataType === 'node') {
      const nodeData = params.data as NodeData

      if (nodeData.category === 0) {
        // 如果双击的是区域节点
        const areaCode = nodeData.id

        // 判断是否已经聚焦在该区域，如果是则恢复全部显示
        if (focusedArea.value === areaCode) {
          restoreFullGraph()
          focusedArea.value = null
          return
        }

        // 记录当前聚焦的区域
        focusedArea.value = areaCode

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

        // 3秒后隐藏标签，除非全局标签显示已开启
        setTimeout(() => {
          if (!showAllLabels.value) {
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

  // 添加图例点击事件处理
  chart.on('legendselectchanged', (params: any) => {
    console.log('图例选择变化:', params.name, params.selected)
  })
}

// 切换标签显示状态
const toggleLabels = () => {
  showAllLabels.value = !showAllLabels.value

  if (chart) {
    chart.setOption({
      series: [
        {
          id: 'knowledge-graph',
          label: {
            show: showAllLabels.value,
          },
        },
      ],
    })
  }
}

// 聚焦到特定区域，并显示标签
const focusOnArea = (areaCode: string) => {
  if (!chart || !originalNodes.value.length || !originalLinks.value.length) return

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

  // 更新图表数据，同时显示所有保留节点的标签
  chart.setOption({
    series: [
      {
        id: 'knowledge-graph',
        data: filteredNodes,
        links: filteredLinks,
        zoom: 0.4,
        center: ['50%', '50%'],
        // 显示保留节点的标签，忽略全局标签设置
        label: {
          show: true,
          position: 'right',
          formatter: (params: any) => {
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
            return params.name
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
const restoreFullGraph = () => {
  if (!chart || !originalNodes.value.length || !originalLinks.value.length) return

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
          show: showAllLabels.value,
        },
      },
    ],
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
  // 延迟执行以等待DOM更新
  setTimeout(() => {
    handleResize()
  }, 300)
})

// 生命周期钩子
onMounted(() => {
  // 初始化图表
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
</script>

<template>
  <div class="knowledge-graph-container">
    <div class="controls bottom-right">
      <button class="toggle-labels-btn" @click="toggleLabels">
        {{ showAllLabels ? '隐藏标签' : '显示标签' }}
      </button>
    </div>
    <div ref="chartRef" class="chart"></div>
  </div>
</template>

<style scoped>
.knowledge-graph-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.chart {
  flex: 1;
  min-height: 600px;
}

.controls {
  position: absolute;
  z-index: 10;
}

.bottom-right {
  right: 20px;
  bottom: 20px;
}

.toggle-labels-btn {
  padding: 6px 12px;
  font-size: 14px;
  background-color: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transition: background-color 0.3s;
}

.toggle-labels-btn:hover {
  background-color: #66b1ff;
}
</style>
