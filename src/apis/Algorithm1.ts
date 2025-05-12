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
 * ARIMA预测结果数据接口
 */
export interface ArimaResult {
  timestamp: string
  point_id: string
  region: string
  temperature: number
  pressure: number
  flow_rate: number
  level: number
  gas_type: string
  gas_concentration: number
}

/**
 * 带分页信息的ARIMA结果响应接口
 */
export interface ArimaResultResponse {
  pagination: PaginationInfo
  data: ArimaResult[]
}

/**
 * 获取ARIMA预测结果的请求参数接口
 */
export interface GetArimaParams {
  /** 区域代码，不提供则返回所有区域结果 */
  region?: string | null
  /** 可选的监测点ID */
  point_id?: string | null
  /** 分页偏移量，默认0 */
  skip?: number
  /** 每页记录数，默认100，最大500 */
  limit?: number
  /** 是否获取所有结果，不分页 */
  get_all?: boolean
}

/**
 * 算法1 API服务
 */
export default class Algorithm1Api {
  private static readonly BASE_PATH = '/algorithm1'

  /**
   * 获取ARIMA预测结果 - 按区域过滤，返回所有结果
   * @param params 查询参数
   * @returns ARIMA预测结果列表（仅数据部分）（包含所有结果）
   */
  static async getArimaResults(params: Omit<GetArimaParams, 'get_all'>): Promise<ArimaResult[]> {
    try {
      const requestParams: GetArimaParams = {
        ...params,
        get_all: true,
      }

      const response = await this.getArimaResultsWithPagination(requestParams)
      return response.data
    } catch (error) {
      console.error('获取ARIMA预测结果失败:', error)
      throw error
    }
  }

  /**
   * 获取带分页信息的ARIMA预测结果
   * @param params 查询参数
   * @returns 带分页信息的ARIMA预测结果
   */
  static async getArimaResultsWithPagination(params: GetArimaParams): Promise<ArimaResultResponse> {
    try {
      // 默认值处理
      const requestParams: GetArimaParams = {
        ...params,
        skip: params.get_all ? undefined : (params.skip ?? 0),
        limit: params.get_all ? undefined : (params.limit ?? 100),
      }

      return await http.get<ArimaResultResponse>(`${this.BASE_PATH}/arima`, requestParams, {
        returnRaw: true,
        requestId: `get-arima-results-${Date.now()} - ${Math.random().toString(36).slice(2)}`,
      })
    } catch (error) {
      console.error('获取ARIMA预测结果失败:', error)
      throw error
    }
  }

  /**
   * 下载ARIMA预测结果为CSV格式
   * @param params 下载参数
   * @returns Blob对象，代表CSV文件内容
   */
  static async downloadArimaCsv(params: GetArimaParams & { filename?: string; localize?: boolean }): Promise<Blob> {
    try {
      const requestParams = {
        ...params,
        // 添加默认参数
        localize: params.localize ?? true,
      }

      const blobData = await http.downloadFile(`${this.BASE_PATH}/arima/results/download-csv`, requestParams, {
        requestId: `download-arima-csv-${Date.now()}`,
      })

      return blobData
    } catch (error) {
      console.error('下载ARIMA预测结果CSV失败:', error)
      throw error
    }
  }

  /**
   * 按监测点ID获取ARIMA预测结果
   * @param pointId 监测点ID
   * @returns ARIMA预测结果列表
   */
  static async getArimaResultsByPointId(pointId: string): Promise<ArimaResult[]> {
    return this.getArimaResults({ point_id: pointId })
  }

  /**
   * 按区域获取ARIMA预测结果
   * @param region 区域代码
   * @returns ARIMA预测结果列表
   */
  static async getArimaResultsByRegion(region: string): Promise<ArimaResult[]> {
    return this.getArimaResults({ region })
  }
}
