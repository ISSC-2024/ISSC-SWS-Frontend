import { defineStore } from 'pinia'

// 定义算法选择状态接口
interface AlgorithmState {
  selectedAlgorithm: string | null
  convergenceThreshold: string | null
  isDataLoaded: boolean
}

// 创建算法选择状态管理
export const useAlgorithmStore = defineStore('algorithm', {
  state: (): AlgorithmState => ({
    selectedAlgorithm: null,
    convergenceThreshold: null,
    isDataLoaded: false,
  }),

  actions: {
    // 设置选择的算法和收敛阈值
    setAlgorithmSelection(algorithm: string, threshold: string): void {
      this.selectedAlgorithm = algorithm
      this.convergenceThreshold = threshold
      this.isDataLoaded = true
    },

    // 重置选择状态
    resetSelection(): void {
      this.selectedAlgorithm = null
      this.convergenceThreshold = null
      this.isDataLoaded = false
    },

    // 获取数据文件名
    getDataFileName(): string {
      if (!this.selectedAlgorithm || !this.convergenceThreshold) {
        return 'report.json' // 默认数据文件
      }

      return `${this.selectedAlgorithm}__${this.convergenceThreshold}_allocate_result.json`
    },
  },
})
