import { defineStore } from 'pinia'

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

// 定义存储的状态接口
interface GraphState {
  focusedArea: string | null
  filteredNodes: NodeData[]
  filteredLinks: LinkData[]
  showLabels: boolean
}

export const useGraphStore = defineStore('graphState', {
  state: (): GraphState => ({
    focusedArea: null,
    filteredNodes: [],
    filteredLinks: [],
    showLabels: false,
  }),

  actions: {
    setFocusedArea(areaCode: string | null): void {
      this.focusedArea = areaCode
    },

    setFilteredData(nodes: NodeData[], links: LinkData[]): void {
      this.filteredNodes = JSON.parse(JSON.stringify(nodes))
      this.filteredLinks = JSON.parse(JSON.stringify(links))
    },

    clearFilteredData(): void {
      this.filteredNodes = []
      this.filteredLinks = []
    },

    toggleLabels(): void {
      this.showLabels = !this.showLabels
    },
  },
})
