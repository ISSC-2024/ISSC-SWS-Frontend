import { http } from './AxiosClient'
import type { PaginationInfo } from '@/types/common'

/**
 * 单条算法结果数据接口
 */
export interface AlgorithmResult {
  timestamp: string
  region: string
  risk_level: string
  message: string
  config_id: number
}

/**
 * 带分页信息的算法结果响应接口
 */
export interface AlgorithmResultResponse {
  pagination: PaginationInfo
  data: AlgorithmResult[]
}

/**
 * 获取算法结果的请求参数接口
 */
export interface GetResultsParams {
  /** 算法类型 */
  algorithm: string
  /** 学习率 */
  learning_rate: number
  /** 最大深度 */
  max_depth?: number | null
  /** 最大训练轮数 */
  max_epochs?: number | null
  /** 可选的区域过滤 */
  region?: string
  /** 分页偏移量，默认0 */
  skip?: number
  /** 每页记录数，默认100，最大500 */
  limit?: number
  /** 是否获取所有结果，不分页 */
  get_all?: boolean
}

/**
 * CSV下载参数接口
 */
export interface DownloadCsvParams {
  /** 算法类型 */
  algorithm: string
  /** 学习率 */
  learning_rate: number
  /** 最大深度 */
  max_depth?: number | null
  /** 最大训练轮数 */
  max_epochs?: number | null
  /** 可选的区域过滤 */
  region?: string
  /** 下载文件名前缀 */
  filename?: string
  /** 是否本地化列名（中文显示） */
  localize?: boolean
}

/**
 * 滚动日志列表API服务
 */
export default class Algorithm3Api {
  private static readonly BASE_PATH = '/algorithm3'

  /**
   * 获取算法结果 - 根据算法参数组合查询
   * @param params 查询参数
   * @returns 算法结果列表（仅数据部分）（包含所有结果）
   */
  static async getResultsByParams(params: Omit<GetResultsParams, 'get_all'>): Promise<AlgorithmResult[]> {
    try {
      const requestParams: GetResultsParams = {
        ...params,
        get_all: true,
      }

      const response = await this.getResultsWithPagination(requestParams)
      return response.data
    } catch (error) {
      console.error('获取算法3结果失败:', error)
      throw error
    }
  }

  /**
   * 获取带分页信息的算法结果 - 根据算法参数组合查询
   * @param params 查询参数
   * @returns 带分页信息的算法结果
   */
  static async getResultsWithPagination(params: GetResultsParams): Promise<AlgorithmResultResponse> {
    try {
      // 默认值
      const requestParams: GetResultsParams = {
        ...params,
        skip: params.get_all ? undefined : (params.skip ?? 0),
        limit: params.get_all ? undefined : (params.limit ?? 100),
      }

      return await http.get<AlgorithmResultResponse>(`${this.BASE_PATH}/results`, requestParams, {
        requestId: `get-algorithm-results-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        returnRaw: true,
      })
    } catch (error) {
      console.error('获取算法3结果失败:', error)
      throw error
    }
  }

  /**
   * 下载算法结果为CSV格式
   * @param params 下载参数
   * @returns Blob对象，代表CSV文件内容
   */
  static async downloadResultsCsv(params: DownloadCsvParams): Promise<Blob> {
    try {
      const requestParams: DownloadCsvParams = {
        ...params,
        // 添加默认参数
        localize: params.localize ?? true,
      }

      const blobData = await http.downloadFile(`${this.BASE_PATH}/results/download-csv`, requestParams, {
        requestId: `download-csv-results-${Date.now()}`,
      })

      return blobData
    } catch (error) {
      console.error('下载算法3结果CSV失败:', error)
      throw error
    }
  }
}
