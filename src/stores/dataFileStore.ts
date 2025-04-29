import { defineStore } from 'pinia'
import { reactive } from 'vue'

// 定义数据文件类型
export interface DataFileConfig {
  // 文件名
  filename: string
  // 存放文件夹名
  parDir?: string
}

// 数据文件类型枚举，方便管理不同类型的数据文件
export enum DataFileType {
  LOG = 'log', // 日志数据
  SENSOR = 'sensor', // 传感器数据
  REGION = 'region', // 区域数据
}

export const useDataFileStore = defineStore('dataFile', () => {
  // 使用 reactive 存储各类数据文件的配置
  const dataFiles = reactive<Record<string, DataFileConfig>>({
    // 默认配置
    [DataFileType.LOG]: {
      filename: 'riskRegionSummary.json',
      parDir: 'mock',
    },
    [DataFileType.SENSOR]: {
      filename: 'sensorData.json',
      parDir: 'mock',
    },
  })

  // 获取特定类型数据文件的完整路径
  const getFilePath = (type: string): string => {
    const config = dataFiles[type]
    if (!config) {
      console.warn(`未找到类型 ${type} 的数据文件配置，将使用默认路径`)
      return 'mock/default.json'
    }

    return `${config.parDir || 'mock'}/${config.filename}`
  }

  // 更新数据文件配置
  const updateDataFile = (type: string, config: Partial<DataFileConfig>) => {
    if (!dataFiles[type]) {
      dataFiles[type] = {
        filename: 'default.json',
        parDir: 'mock',
        ...config,
      }
    } else {
      // 只更新提供的字段
      Object.assign(dataFiles[type], config)
    }
  }

  // 获取数据文件配置
  const getDataFileConfig = (type: string): DataFileConfig | undefined => {
    return dataFiles[type]
  }

  // 简化方法：直接更新文件名
  const updateFileName = (type: string, filename: string) => {
    if (dataFiles[type]) {
      dataFiles[type].filename = filename
    } else {
      updateDataFile(type, { filename })
    }
  }

  // 便捷方法，用于动态导入特定类型的数据文件
  const importDataFile = async (type: string) => {
    const path = getFilePath(type)
    try {
      //! 注意路径
      return await import(`../${path}`)
    } catch (error) {
      console.error(`导入数据文件失败: ${path}`, error)
      return { default: null }
    }
  }

  return {
    dataFiles,
    getFilePath,
    updateDataFile,
    getDataFileConfig,
    updateFileName,
    importDataFile,
  }
})
