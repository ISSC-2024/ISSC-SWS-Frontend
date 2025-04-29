import { defineStore } from 'pinia'
import { ref } from 'vue'

// 定义节点和连接的类型
export interface NodeData {
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

export interface LinkData {
  source: string
  target: string
  value: number
  lineStyle?: {
    color: string
    width?: number
  }
}

// 创建图谱状态管理
export const useGraphStore = defineStore('graphState', () => {
  // 状态定义
  const focusedArea = ref<string | null>(null)
  const filteredNodes = ref<NodeData[]>([])
  const filteredLinks = ref<LinkData[]>([])
  const showLabels = ref<boolean>(false)

  // 设置关注区域
  function setFocusedArea(areaCode: string | null): void {
    focusedArea.value = areaCode
  }

  // 设置过滤后的数据
  function setFilteredData(nodes: NodeData[], links: LinkData[]): void {
    filteredNodes.value = JSON.parse(JSON.stringify(nodes))
    filteredLinks.value = JSON.parse(JSON.stringify(links))
  }

  // 清除过滤后的数据
  function clearFilteredData(): void {
    filteredNodes.value = []
    filteredLinks.value = []
  }

  // 切换标签显示状态
  function toggleLabels(): void {
    showLabels.value = !showLabels.value
  }

  return {
    focusedArea,
    filteredNodes,
    filteredLinks,
    showLabels,
    setFocusedArea,
    setFilteredData,
    clearFilteredData,
    toggleLabels,
  }
})
