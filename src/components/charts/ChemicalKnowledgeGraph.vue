<script setup lang="ts">
/**
 * @description 化工安全监测3D知识图谱组件 - 层内力导向修复版
 */
import { ref, onMounted, onUnmounted, inject, watch } from 'vue'
import * as echarts from 'echarts'
import 'echarts-gl'
import jsonData from '../../mock/monitoring_points_weights.csv?raw'

// 获取图表容器展开状态
const isChartExpanded = inject('isChartExpanded', ref(false))

// 图表实例引用
const chartRef = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

// 摄像机控制状态
const isAutoRotate = ref(true)
const currentView = ref<string>('正视图')

// 解析CSV数据
const parseCSV = (csvString: string) => {
  const lines = csvString.split('\n')
  const headers = lines[0]
    .split(',')
    .map((h) => h.trim().replace('// filepath: d:\\Work\\Code\\module2\\monitoring_points_weights.csv', ''))
  const result = []

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue

    const values = lines[i].split(',')
    const entry: Record<string, any> = {}

    headers.forEach((header, index) => {
      if (header === 'weight') {
        entry[header] = parseFloat(values[index])
      } else {
        entry[header] = values[index]
      }
    })

    result.push(entry)
  }

  return result
}

// 处理数据为图谱格式 - 分层颜色优化版
const processData = (data: any[]) => {
  // 提取唯一区域
  const areas = Array.from(new Set(data.map((item) => item.area_code))).map((code) => {
    const areaItem = data.find((item) => item.area_code === code)
    return {
      code,
      name: areaItem?.area_name || code,
    }
  })

  // 创建节点列表和链接
  const nodes: any[] = []
  const links: any[] = []

  // 颜色设置 - 使用更鲜明的颜色
  const AREA_COLOR = '#9C27B0' // 紫色 (区域层)
  const SENSOR_COLOR = '#1976D2' // 蓝色 (传感器层)
  const SAFE_COLOR = '#4CAF50' // 绿色 (安全节点)
  const WARNING_COLOR = '#FF9800' // 橙色 (警告节点)
  const DANGER_COLOR = '#F44336' // 红色 (危险节点)

  // 层高设置 - 激进增大层间距
  const LAYER_HEIGHT = 2000 // 非常大的层间距，避免层间力的相互影响
  const AREA_Y = LAYER_HEIGHT
  const SENSOR_Y = 0
  const STATE_Y = -LAYER_HEIGHT

  // 设置布局参数 - 增大分布半径
  const CIRCLE_RADIUS = 1500

  // 设置分类
  const categories = [
    { name: '区域', itemStyle: { color: AREA_COLOR } },
    { name: '传感器', itemStyle: { color: SENSOR_COLOR } },
    { name: '安全节点', itemStyle: { color: SAFE_COLOR } },
    { name: '警告节点', itemStyle: { color: WARNING_COLOR } },
    { name: '危险节点', itemStyle: { color: DANGER_COLOR } },
  ]

  // 添加区域节点（顶层）
  const areaAngleStep = (2 * Math.PI) / areas.length
  areas.forEach((area, idx) => {
    const angle = idx * areaAngleStep
    const areaRadius = CIRCLE_RADIUS * 0.6

    // 增大随机化位置范围
    const jitter = 80 * Math.random() - 40

    nodes.push({
      id: `area_${area.code}`,
      name: area.name,
      symbolSize: 75,
      category: 0,
      x: Math.cos(angle) * (areaRadius + jitter),
      y: AREA_Y,
      z: Math.sin(angle) * (areaRadius + jitter),
      // 关键：添加层标识，用于层内力导向分组
      layerIndex: 0,
      fixedY: AREA_Y, // 固定Y坐标
      itemStyle: {
        color: AREA_COLOR,
        borderWidth: 3,
        borderColor: '#fff',
        shadowBlur: 20,
        shadowColor: 'rgba(156, 39, 176, 0.6)',
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 30,
          borderWidth: 4,
        },
      },
    })
  })

  // 区域传感器映射
  const sensorsByArea: Record<string, string[]> = {}
  data.forEach((sensor) => {
    if (!sensorsByArea[sensor.area_code]) {
      sensorsByArea[sensor.area_code] = []
    }
    sensorsByArea[sensor.area_code].push(sensor.point_id)
  })

  // 添加传感器和安全状态节点
  data.forEach((sensor, idx) => {
    const areaCode = sensor.area_code
    const sensorId = sensor.point_id
    const weight = sensor.weight

    // 找到对应的区域节点索引
    const areaIdx = areas.findIndex((a) => a.code === areaCode)

    // 在区域节点附近散布传感器 - 增大分散程度
    const sensorsInArea = sensorsByArea[areaCode].length
    const sensorAngleOffset = ((idx % sensorsInArea) / sensorsInArea) * Math.PI * 2
    const angle = areaIdx * areaAngleStep + sensorAngleOffset

    // 确定传感器位置 - 增大分散半径和随机性
    const sensorRadius = CIRCLE_RADIUS * 0.7
    const sensorX = Math.cos(angle) * sensorRadius * (0.8 + Math.random() * 0.4)
    const sensorZ = Math.sin(angle) * sensorRadius * (0.8 + Math.random() * 0.4)

    // 添加传感器节点 - 所有传感器使用统一蓝色
    nodes.push({
      id: `sensor_${sensorId}`,
      name: sensorId,
      symbolSize: 40 + weight * 25,
      category: 1,
      x: sensorX,
      y: SENSOR_Y,
      z: sensorZ,
      // 关键：添加层标识，用于层内力导向分组
      layerIndex: 1,
      fixedY: SENSOR_Y, // 固定Y坐标
      itemStyle: {
        color: SENSOR_COLOR,
        borderWidth: 2,
        borderColor: '#fff',
        shadowBlur: 12,
        shadowColor: 'rgba(25, 118, 210, 0.6)',
      },
      emphasis: {
        scale: 1.2,
      },
    })

    // 添加区域到传感器的连线
    links.push({
      source: `area_${areaCode}`,
      target: `sensor_${sensorId}`,
      // 关键：标记跨层连接，这些连接不会产生力
      isInterLayer: true,
      lineStyle: {
        width: 3,
        color: AREA_COLOR,
        opacity: 0.6,
        curveness: 0.4,
      },
    })

    // 为每个传感器创建三个安全状态节点
    const safetyStates = [
      { id: 'safe', name: '安全', category: 2, color: SAFE_COLOR, angle: 0 },
      { id: 'warning', name: '警告', category: 3, color: WARNING_COLOR, angle: (2 * Math.PI) / 3 },
      { id: 'danger', name: '危险', category: 4, color: DANGER_COLOR, angle: (4 * Math.PI) / 3 },
    ]

    // 安全节点分布在传感器周围形成三角形 - 增大分布半径
    const stateRadius = 250

    safetyStates.forEach((state) => {
      // 计算节点大小 - 基于权重
      let nodeSize
      if (state.id === 'safe') {
        // 安全节点: 权重越低(越安全)节点越大
        nodeSize = 25 + (1 - weight) * 35
      } else if (state.id === 'warning') {
        // 警告节点: 权重越接近0.5节点越大
        nodeSize = 25 + (1 - Math.abs(weight - 0.5) * 2) * 35
      } else {
        // 危险节点: 权重越高(越危险)节点越大
        nodeSize = 25 + weight * 35
      }

      // 计算安全节点位置 - 增加随机性
      const stateAngle = angle + state.angle + (Math.random() * 0.5 - 0.25)
      const stateX = sensorX + Math.cos(stateAngle) * stateRadius * (0.8 + Math.random() * 0.4)
      const stateZ = sensorZ + Math.sin(stateAngle) * stateRadius * (0.8 + Math.random() * 0.4)

      // 添加安全状态节点
      nodes.push({
        id: `${sensorId}_${state.id}`,
        name: state.name,
        symbolSize: nodeSize,
        category: state.id === 'safe' ? 2 : state.id === 'warning' ? 3 : 4,
        x: stateX,
        y: STATE_Y,
        z: stateZ,
        // 关键：添加层标识，用于层内力导向分组
        layerIndex: 2,
        fixedY: STATE_Y, // 固定Y坐标
        itemStyle: {
          color: state.color,
          borderWidth: 2,
          borderColor: '#fff',
          shadowBlur: 12,
          shadowColor: state.color,
        },
        emphasis: {
          scale: 1.15,
          itemStyle: {
            shadowBlur: 20,
          },
        },
      })

      // 添加传感器到安全状态的连线
      const linkWidth = (() => {
        if (state.id === 'safe') return Math.max(1.5, (1 - weight) * 5)
        if (state.id === 'warning') return Math.max(1.5, (1 - Math.abs(weight - 0.5) * 2) * 5)
        return Math.max(1.5, weight * 5) // danger
      })()

      const linkOpacity = (() => {
        if (state.id === 'safe') return 0.3 + (1 - weight) * 0.7
        if (state.id === 'warning') return 0.3 + (1 - Math.abs(weight - 0.5) * 2) * 0.7
        return 0.3 + weight * 0.7 // danger
      })()

      links.push({
        source: `sensor_${sensorId}`,
        target: `${sensorId}_${state.id}`,
        // 关键：标记跨层连接，这些连接不会产生力
        isInterLayer: true,
        lineStyle: {
          width: linkWidth,
          color: state.color,
          opacity: linkOpacity,
          curveness: 0.3 + Math.random() * 0.2,
        },
      })
    })
  })

  return {
    nodes,
    links,
    categories,
  }
}

// 力导向布局配置 - 定义在外部，确保始终可用
const forceAtlasConfig = {
  steps: 5,
  stopThreshold: 0.01,
  jitterTolerence: 0.1,
  edgeWeight: [0.1, 1],
  gravity: 0.15,
  repulsion: 120,
  repulsionByDegree: true,
  barnesHutOptimize: true,
  preventOverlap: true,
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

  // 处理CSV数据
  const monitoringData = parseCSV(jsonData)
  const graphData = processData(monitoringData)

  // 设置图表选项
  const option = {
    tooltip: {
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          const data = params.data
          if (data.id.startsWith('sensor_')) {
            const sensorId = data.name
            const sensorInfo = monitoringData.find((item) => item.point_id === sensorId)
            if (sensorInfo) {
              return `<div style="padding:8px;line-height:1.5">
                <p style="font-weight:bold;font-size:14px;margin-bottom:6px">${sensorId}</p>
                <p><strong>区域:</strong> ${sensorInfo.area_name}</p>
                <p><strong>风险状态:</strong> ${sensorInfo.pred_risk}</p>
                <p><strong>权重指数:</strong> ${sensorInfo.weight.toFixed(3)}</p>
              </div>`
            }
          } else if (data.id.includes('_safe') || data.id.includes('_warning') || data.id.includes('_danger')) {
            const sensorId = data.id.split('_')[0]
            const stateType = data.id.split('_')[1]
            const sensorInfo = monitoringData.find((item) => item.point_id === sensorId)

            if (sensorInfo) {
              let stateText = ''
              if (stateType === 'safe') {
                const safeScore = (1 - sensorInfo.weight) * 100
                stateText = `安全系数: ${safeScore.toFixed(1)}%`
              } else if (stateType === 'warning') {
                const warningScore = (1 - Math.abs(sensorInfo.weight - 0.5) * 2) * 100
                stateText = `警告系数: ${warningScore.toFixed(1)}%`
              } else if (stateType === 'danger') {
                const dangerScore = sensorInfo.weight * 100
                stateText = `危险系数: ${dangerScore.toFixed(1)}%`
              }

              return `<div style="padding:8px">
                <p style="font-weight:bold">${sensorId}</p>
                <p>${stateText}</p>
              </div>`
            }
          }
          return `${data.name}`
        }
        return ''
      },
    },
    legend: {
      data: graphData.categories.map((category) => category.name),
      textStyle: {
        color: '#fff',
      },
      selected: {
        区域: true,
        传感器: true,
        安全节点: true,
        警告节点: true,
        危险节点: true,
      },
    },
    animationDuration: 1500,
    animationEasingUpdate: 'quinticInOut',
    series: [
      {
        name: '化工监测点安全状态',
        type: 'graphGL',
        nodes: graphData.nodes,
        edges: graphData.links,
        categories: graphData.categories,

        // 使用自定义布局
        layout: 'none',

        itemStyle: {
          opacity: 0.95,
        },

        emphasis: {
          scale: 1.2,
          label: {
            show: true,
            formatter: '{b}',
            position: 'right',
            fontSize: 14,
            fontWeight: 'bold',
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: [4, 8],
            borderRadius: 4,
          },
        },

        label: {
          show: false,
          position: 'right',
          formatter: '{b}',
          textStyle: {
            fontSize: 12,
            color: '#fff',
            backgroundColor: 'rgba(0,0,0,0.3)',
            padding: [3, 5],
          },
        },

        // 视角控制 - 优化摄像机交互控制
        viewControl: {
          // 默认自动旋转
          autoRotate: true,
          autoRotateAfterStill: 2, // 停止交互2秒后恢复自动旋转
          autoRotateSpeed: 1.2,

          // 提高摄像机交互灵敏度
          rotateSensitivity: 2.2, // 增加旋转灵敏度
          zoomSensitivity: 1.8, // 增加缩放灵敏度
          panSensitivity: 1.5, // 增加平移灵敏度
          damping: 0.85,

          // 调整视距和角度以适应更大的层间距
          distance: 5000,
          minDistance: 1000,
          maxDistance: 10000,

          // 设置初始角度，更好展示分层结构
          alpha: 40, // 垂直角度
          beta: 30, // 水平角度

          center: [0, 0, 0],
          animation: true,
          animationDurationUpdate: 500,
          animationEasingUpdate: 'cubicInOut',
        },

        // 交互效果
        focusNodeAdjacency: true,
        focusNodeAdjacencyOn: 'click',

        // 光照和环境效果
        light: {
          main: {
            intensity: 1.2,
            shadow: true,
            shadowQuality: 'medium',
          },
          ambient: {
            intensity: 0.4,
          },
        },

        // 后期处理效果
        postEffect: {
          enable: true,
          bloom: {
            intensity: 0.15,
          },
          SSAO: {
            enable: true,
            radius: 8,
            intensity: 1.3,
          },
        },

        // 边缘箭头
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 8],
      },
    ],
    backgroundColor: 'transparent',
  }

  // 应用选项
  chart.setOption(option as echarts.EChartsOption)

  // 图表初始化完成后，进行自定义力导向布局
  // 为每个层级单独应用力导向，传入正确的配置参数
  applyLayeredForceAtlas(chart, graphData, forceAtlasConfig)
}

// 为每个层级单独应用力导向布局 - 修改传参方式
const applyLayeredForceAtlas = (chart: any, graphData: any, forceConfig: any) => {
  // 按layerIndex分组节点
  const layerNodes: Record<number, any[]> = {}
  graphData.nodes.forEach((node: any) => {
    const layerIndex = node.layerIndex || 0
    if (!layerNodes[layerIndex]) {
      layerNodes[layerIndex] = []
    }
    layerNodes[layerIndex].push(node)
  })

  // 按layerIndex分组连接
  const layerLinks: Record<number, any[]> = {}
  graphData.links.forEach((link: any) => {
    if (link.isInterLayer) return // 跳过跨层连接

    // 查找源节点和目标节点
    const sourceNode = graphData.nodes.find((n: any) => n.id === link.source)
    const targetNode = graphData.nodes.find((n: any) => n.id === link.target)

    if (!sourceNode || !targetNode) return

    // 确保源节点和目标节点在同一层
    if (sourceNode.layerIndex !== targetNode.layerIndex) return

    const layerIndex = sourceNode.layerIndex
    if (!layerLinks[layerIndex]) {
      layerLinks[layerIndex] = []
    }
    layerLinks[layerIndex].push(link)
  })

  // 启动动画循环，为每层应用力导向
  let frameCount = 0
  const maxFrames = 100 // 最大循环次数，防止无限循环

  function animate() {
    if (frameCount >= maxFrames) return

    // 每一帧，为每层应用力导向算法
    Object.keys(layerNodes).forEach((layerIndexStr) => {
      const layerIndex = parseInt(layerIndexStr)
      const nodes = layerNodes[layerIndex]
      const links = layerLinks[layerIndex] || []

      // 使用简化的力导向算法，只在XZ平面内运动
      // 正确传入力导向配置
      applyForceStep(nodes, links, forceConfig)
    })

    // 更新节点位置，但保持Y坐标不变
    const newNodes = graphData.nodes.map((node: any) => {
      return {
        ...node,
        y: node.fixedY, // 确保Y坐标不变
      }
    })

    // 更新图表
    chart.setOption({
      series: [
        {
          data: newNodes,
        },
      ],
    })

    frameCount++
    requestAnimationFrame(animate)
  }

  // 开始动画
  animate()
}

// 简单的力导向布局步骤 - 只在XZ平面应用
const applyForceStep = (nodes: any[], links: any[], config: any) => {
  // 确保config存在，使用默认值作为备选
  const repulsion = config?.repulsion || 100
  const gravity = config?.gravity || 0.1

  // 计算节点间斥力 (仅同层节点)
  nodes.forEach((node1) => {
    node1.fx = 0
    node1.fz = 0

    nodes.forEach((node2) => {
      if (node1.id === node2.id) return

      // 只计算同层节点间的力
      if (node1.layerIndex !== node2.layerIndex) return

      const dx = node1.x - node2.x
      const dz = node1.z - node2.z
      const distance = Math.sqrt(dx * dx + dz * dz) || 0.1

      // 斥力与距离平方成反比
      const force = repulsion / (distance * distance)

      // 只在XZ平面应用力
      node1.fx += (dx / distance) * force
      node1.fz += (dz / distance) * force
    })

    // 添加向中心的引力
    node1.fx -= node1.x * gravity
    node1.fz -= node1.z * gravity
  })

  // 计算连接的拉力 (仅同层连接)
  links.forEach((link) => {
    const source = nodes.find((n) => n.id === link.source) || link.source
    const target = nodes.find((n) => n.id === link.target) || link.target

    if (typeof source === 'object' && typeof target === 'object') {
      // 只计算同层节点间的连接力
      if (source.layerIndex !== target.layerIndex) return

      const dx = source.x - target.x
      const dz = source.z - target.z

      source.fx -= dx * 0.05
      source.fz -= dz * 0.05
      target.fx += dx * 0.05
      target.fz += dz * 0.05
    }
  })

  // 更新位置 (仅更新XZ坐标)
  nodes.forEach((node) => {
    node.x += Math.min(5, Math.max(-5, node.fx)) // 限制最大移动幅度
    node.z += Math.min(5, Math.max(-5, node.fz))
  })
}

// 切换自动旋转
const toggleAutoRotate = () => {
  if (!chart) return

  isAutoRotate.value = !isAutoRotate.value
  chart.setOption({
    series: [
      {
        viewControl: {
          autoRotate: isAutoRotate.value,
        },
      },
    ],
  })
}

// 重置视角
const resetView = () => {
  if (!chart) return

  chart.setOption({
    series: [
      {
        viewControl: {
          alpha: 40,
          beta: 30,
          distance: 5000,
          center: [0, 0, 0],
          animation: true,
        },
      },
    ],
  })
}

// 切换到预设视角
const changeViewAngle = (viewName: string) => {
  if (!chart) return

  currentView.value = viewName

  let alpha = 40
  let beta = 30

  switch (viewName) {
    case '顶视图':
      alpha = 90
      beta = 0
      break
    case '底视图':
      alpha = -90
      beta = 0
      break
    case '侧视图':
      alpha = 0
      beta = 90
      break
    case '正视图':
      alpha = 40
      beta = 30
      break
  }

  chart.setOption({
    series: [
      {
        viewControl: {
          alpha: alpha,
          beta: beta,
          animation: true,
        },
      },
    ],
  })
}

// 监听窗口大小变化和展开状态
const handleResize = () => {
  if (chart) {
    chart.resize()
  }
}

watch(isChartExpanded, () => {
  setTimeout(() => {
    handleResize()
  }, 300)
})

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
</script>

<template>
  <!-- 其余模板代码保持不变 -->
  <div class="knowledge-graph-container">
    <div ref="chartRef" class="chart"></div>

    <!-- 摄像机控制面板 -->
    <div class="camera-controls">
      <div class="control-panel">
        <button class="control-btn" :class="{ active: isAutoRotate }" @click="toggleAutoRotate">
          {{ isAutoRotate ? '停止旋转' : '开始旋转' }}
        </button>

        <button class="control-btn" @click="resetView">重置视角</button>

        <div class="view-buttons">
          <button
            v-for="view in ['正视图', '顶视图', '底视图', '侧视图']"
            :key="view"
            class="view-btn"
            :class="{ active: currentView === view }"
            @click="changeViewAngle(view)"
          >
            {{ view }}
          </button>
        </div>
      </div>

      <div class="control-tips">
        <div class="tip"><span class="action">拖动</span>: 旋转视角</div>
        <div class="tip"><span class="action">滚轮</span>: 缩放视图</div>
        <div class="tip"><span class="action">Shift+拖动</span>: 平移视图</div>
        <div class="tip"><span class="action">点击节点</span>: 查看关联</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 样式保持不变 */
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
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

/* 摄像机控制面板样式 */
.camera-controls {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.control-panel {
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-btn,
.view-btn {
  padding: 6px 12px;
  background-color: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.control-btn:hover,
.view-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.control-btn.active,
.view-btn.active {
  background-color: rgba(25, 118, 210, 0.6);
}

.view-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.control-tips {
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
}

.tip {
  margin: 4px 0;
}

.action {
  display: inline-block;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 1px 6px;
  border-radius: 3px;
  margin-right: 5px;
}
</style>
