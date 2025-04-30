import { defineStore } from 'pinia'
import { reactive } from 'vue'

// 定义算法参数接口
export interface AlgorithmParams {
  [key: string]: number | string
}

// 定义算法配置类型
export interface AlgorithmConfig {
  // 参数配置
  params: AlgorithmParams
}

// 算法类型枚举
export enum AlgorithmType {
  TimeMixer = 'TimeMixer',
  TimesNet = 'TimesNet',
  KnowledgeGraph = 'KnowledgeGraph',
  xgboost = 'xgboost',
  lightGBM = 'lightGBM',
  TabNet = 'TabNet',
  IQL = 'IQL',
  DQN = 'DQN',
  MADDPG = 'MADDPG',
  MAPPO = 'MAPPO',
}

// 定义模块枚举
export enum ModuleType {
  Module1 = 'Module1',
  Module2 = 'Module2',
  Module3 = 'Module3',
  Module4 = 'Module4',
}

// 模块与算法的映射关系
export const MODULE_ALGORITHMS: Record<ModuleType, AlgorithmType[]> = {
  [ModuleType.Module1]: [AlgorithmType.TimeMixer, AlgorithmType.TimesNet],
  [ModuleType.Module2]: [AlgorithmType.KnowledgeGraph],
  [ModuleType.Module3]: [AlgorithmType.xgboost, AlgorithmType.lightGBM, AlgorithmType.TabNet],
  [ModuleType.Module4]: [AlgorithmType.IQL, AlgorithmType.DQN, AlgorithmType.MADDPG, AlgorithmType.MAPPO],
}

export const useAlgorithmStore = defineStore('algorithm', () => {
  // 各类算法的配置
  const algorithms = reactive<Record<string, AlgorithmConfig>>({
    // 模块1
    [AlgorithmType.TimeMixer]: {
      params: {
        task_name: 'short_term_forecast',
        model_id: 'RMS001',
      },
    },
    [AlgorithmType.TimesNet]: {
      params: {
        task_name: 'short_term_forecast',
        model_id: 'RMS001',
      },
    },
    // 模块2
    [AlgorithmType.KnowledgeGraph]: {
      params: {
        tree_count: 150,
        max_depth: 6,
        sensitivity: 1.0,
      },
    },
    // 模块3
    [AlgorithmType.xgboost]: {
      params: {
        learning_rate: 0.1,
        max_depth: 6,
      },
    },
    [AlgorithmType.lightGBM]: {
      params: {
        learning_rate: 0.1,
        max_depth: 4,
      },
    },
    [AlgorithmType.TabNet]: {
      params: {
        learning_rate: 0.01,
        max_epochs: 100,
      },
    },
    // 模块4
    [AlgorithmType.IQL]: {
      params: {
        convergence_threshold: 0.001,
        max_epochs: 2000,
      },
    },
    [AlgorithmType.DQN]: {
      params: {
        convergence_threshold: 0.001,
        max_epochs: 1000,
      },
    },
    [AlgorithmType.MADDPG]: {
      params: {
        convergence_threshold: 0.001,
        max_epochs: 1000,
      },
    },
    [AlgorithmType.MAPPO]: {
      params: {
        convergence_threshold: 0.001,
        max_epochs: 1000,
      },
    },
  })

  // 每个模块的当前选中算法（带默认）
  const selectedAlgorithms = reactive<Record<ModuleType, AlgorithmType>>({
    [ModuleType.Module1]: AlgorithmType.TimeMixer,
    [ModuleType.Module2]: AlgorithmType.KnowledgeGraph,
    [ModuleType.Module3]: AlgorithmType.xgboost,
    [ModuleType.Module4]: AlgorithmType.IQL,
  })

  // 构建参数文件名，按参数字母顺序
  const buildParamFileName = (params: AlgorithmParams): string => {
    return (
      Object.entries(params)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([key, value]) => {
          // 特殊处理某些已知的浮点数参数键
          if (key === 'sensitivity' && typeof value === 'number') {
            // 强制格式化为一位小数
            return value.toFixed(1)
          }
          // 其他情况正常转换
          return `${value}`
        })
        .join('_') + '.json'
    )
  }

  // 获取特定算法的数据文件路径
  const getAlgorithmFilePath = (type: AlgorithmType): string => {
    const config = algorithms[type]
    if (!config) {
      console.warn(`未找到算法 ${type} 的配置，将使用默认路径`)
      return 'mock/default.json'
    }

    const fileName = buildParamFileName(config.params)
    return `mock/${type}/${fileName}`
  }

  // 更新算法参数
  const updateAlgorithmParams = (type: AlgorithmType, params: Partial<AlgorithmParams>) => {
    // 过滤undefined
    const cleanParams: AlgorithmParams = {}
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanParams[key] = value
      }
    })

    if (!algorithms[type]) {
      algorithms[type] = {
        params: cleanParams,
      }
    } else {
      // 只更新提供的参数
      Object.assign(algorithms[type].params, cleanParams)
    }
  }

  // 获取算法参数
  const getAlgorithmParams = (type: AlgorithmType): AlgorithmParams => {
    return algorithms[type]?.params || {}
  }

  // 重置算法参数为默认值
  const resetAlgorithmParams = (type: AlgorithmType) => {
    switch (type) {
      case AlgorithmType.TimeMixer:
      case AlgorithmType.TimesNet:
        updateAlgorithmParams(type, {
          task_name: 'short_term_forecast',
          model_id: 'RMS001',
        })
        break
      case AlgorithmType.KnowledgeGraph:
        updateAlgorithmParams(type, {
          tree_count: 150,
          max_depth: 6,
          sensitivity: 1.0,
        })
        break
      case AlgorithmType.xgboost:
        updateAlgorithmParams(type, {
          learning_rate: 0.1,
          max_depth: 6,
        })
        break
      case AlgorithmType.lightGBM:
        updateAlgorithmParams(type, {
          learning_rate: 0.1,
          max_depth: 4,
        })
        break
      case AlgorithmType.TabNet:
        updateAlgorithmParams(type, {
          learning_rate: 0.01,
          max_epochs: 100,
        })
        break
      case AlgorithmType.IQL:
      case AlgorithmType.DQN:
      case AlgorithmType.MADDPG:
      case AlgorithmType.MAPPO:
        updateAlgorithmParams(type, {
          convergence_threshold: 0.001,
          max_epochs: 1000,
        })
        break
      default:
        updateAlgorithmParams(type, {})
        break
    }
  }

  // 动态导入特定算法的数据文件
  const importAlgorithmData = async (type: AlgorithmType) => {
    const path = getAlgorithmFilePath(type)
    try {
      // 尝试使用当前参数导入
      return await import(`../${path}`)
    } catch (error) {
      console.warn(`找不到指定参数的算法数据文件: ${path}，尝试使用默认参数，error:`, error)

      // 如果找不到，重置为默认参数
      resetAlgorithmParams(type)

      // 使用默认参数重新尝试
      const defaultPath = getAlgorithmFilePath(type)
      try {
        return await import(`../${defaultPath}`)
      } catch (defaultError) {
        console.error(`导入算法数据文件失败: ${defaultPath}`, defaultError)
        return { default: null }
      }
    }
  }

  // 设置模块的当前选中算法
  const setModuleSelectedAlgorithm = (moduleType: ModuleType, algorithmType: AlgorithmType) => {
    // 验证该算法是否属于指定模块
    if (!MODULE_ALGORITHMS[moduleType].includes(algorithmType)) {
      console.error(`算法 ${algorithmType} 不属于模块 ${moduleType}`)
      return false
    }

    selectedAlgorithms[moduleType] = algorithmType
    return true
  }

  // 获取模块的当前选中算法
  const getModuleSelectedAlgorithm = (moduleType: ModuleType): AlgorithmType => {
    return selectedAlgorithms[moduleType]
  }

  // 获取模块对应的算法列表
  const getModuleAlgorithms = (moduleType: ModuleType): AlgorithmType[] => {
    return MODULE_ALGORITHMS[moduleType] || []
  }

  // 获取模块当前选中算法的数据文件
  const getModuleDataFile = async (moduleType: ModuleType) => {
    const algorithmType = selectedAlgorithms[moduleType]
    return await importAlgorithmData(algorithmType)
  }

  return {
    algorithms,
    getAlgorithmFilePath,
    updateAlgorithmParams,
    getAlgorithmParams,
    resetAlgorithmParams,
    importAlgorithmData,

    // 模块层面的操作
    selectedAlgorithms,
    setModuleSelectedAlgorithm,
    getModuleSelectedAlgorithm,
    getModuleAlgorithms,
    getModuleDataFile,
  }
})
