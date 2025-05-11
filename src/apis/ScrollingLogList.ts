import { http } from './AxiosClient'

/**
 * 分页信息接口
 */
export interface PaginationInfo {
  total: number
  skip: number
  limit: number
  has_more: boolean
}

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
  /** 最大深度（特定算法需要） */
  max_depth?: number | null
  /** 最大训练轮数（特定算法需要） */
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
 * 滚动日志列表API服务
 */
export default class ScrollingLogListApi {
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
        requestId: `get-algorithm-results-${Date.now()}`,
        returnRaw: true,
      })
    } catch (error) {
      console.error('获取算法3结果失败:', error)
      throw error
    }
  }
}
