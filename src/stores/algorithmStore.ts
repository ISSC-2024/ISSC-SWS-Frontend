import { defineStore } from 'pinia'
import { ref } from 'vue'

// 创建算法选择状态管理
export const useAlgorithmStore = defineStore('algorithm', () => {
  // 状态定义
  const selectedAlgorithm = ref<string | null>(null)
  const convergenceThreshold = ref<string | null>(null)
  const isDataLoaded = ref(false)

  // 设置选择的算法和收敛阈值
  function setAlgorithmSelection(algorithm: string, threshold: string): void {
    selectedAlgorithm.value = algorithm
    convergenceThreshold.value = threshold
    isDataLoaded.value = true
  }

  // 重置选择状态
  function resetSelection(): void {
    selectedAlgorithm.value = null
    convergenceThreshold.value = null
    isDataLoaded.value = false
  }

  // 获取数据文件名
  function getDataFileName(): string {
    if (!selectedAlgorithm.value || !convergenceThreshold.value) {
      return 'report.json' // 默认数据文件
    }

    return `${selectedAlgorithm.value}__${convergenceThreshold.value}_allocate_result.json`
  }

  return {
    selectedAlgorithm,
    convergenceThreshold,
    isDataLoaded,
    setAlgorithmSelection,
    resetSelection,
    getDataFileName,
  }
})
