import { http } from './AxiosClient'
import type { PaginationInfo } from '@/types/common'

/**
 * 预测结果数据接口
 */
export interface Result {
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
 * 带分页信息的结果响应接口
 */
export interface ResultResponse {
  pagination: PaginationInfo
  data: Result[]
}

/**
 * 获取预测结果的请求参数接口
 */
export interface GetParams {
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
export interface ChartParams {
  point_id: string
  timestamp: string
}

export default class Algorithm1Api {
  private static readonly BASE_PATH = '/algorithm1'

  /**
   * 获取TimeMixer预测结果 - 按区域过滤，返回所有结果
   * @param params 查询参数
   * @returns TimeMixer预测结果列表（仅数据部分）（包含所有结果）
   */
  static async getTimeMixerResults(params: Omit<GetParams, 'get_all'>): Promise<Result[]> {
    try {
      const requestParams: GetParams = {
        ...params,
        get_all: true,
      }

      const response = await this.getTimeMixerResultsWithPagination(requestParams)
      return response.data
    } catch (error) {
      console.error('获取TimeMixer预测结果失败:', error)
      throw error
    }
  }

  /**
   * 获取带分页信息的TimeMixer预测结果
   * @param params 查询参数
   * @returns 带分页信息的TimeMixer预测结果
   */
  static async getTimeMixerResultsWithPagination(params: GetParams): Promise<ResultResponse> {
    try {
      // 默认值处理
      const requestParams: GetParams = {
        ...params,
        skip: params.get_all ? undefined : (params.skip ?? 0),
        limit: params.get_all ? undefined : (params.limit ?? 100),
      }

      return await http.get<ResultResponse>(`${this.BASE_PATH}/TimeMixer`, requestParams, {
        returnRaw: true,
        requestId: `get-TimeMixer-results-${Date.now()} - ${Math.random().toString(36).slice(2)}`,
      })
    } catch (error) {
      console.error('获取TimeMixer预测结果失败:', error)
      throw error
    }
  }

  /**
   * 下载TimeMixer预测结果为CSV格式
   * @param params 下载参数
   * @returns Blob对象，代表CSV文件内容
   */
  static async downloadTimeMixerCsv(params: GetParams & { filename?: string; localize?: boolean }): Promise<Blob> {
    try {
      const requestParams = {
        ...params,
        // 添加默认参数
        localize: params.localize ?? true,
      }

      const blobData = await http.downloadFile(`${this.BASE_PATH}/TimeMixer/results/download-csv`, requestParams, {
        requestId: `download-TimeMixer-csv-${Date.now()}`,
      })

      return blobData
    } catch (error) {
      console.error('下载TimeMixer预测结果CSV失败:', error)
      throw error
    }
  }

  /**
   * 按监测点ID获取TimeMixer预测结果
   * @param pointId 监测点ID
   * @returns TimeMixer预测结果列表
   */
  static async getTimeMixerResultsByPointId(pointId: string): Promise<Result[]> {
    return this.getTimeMixerResults({ point_id: pointId })
  }

  /**
   * 按区域获取TimeMixer预测结果
   * @param region 区域代码
   * @returns TimeMixer预测结果列表
   */
  static async getTimeMixerResultsByRegion(region: string): Promise<Result[]> {
    return this.getTimeMixerResults({ region })
  }

  /**
   * 获取传感器预测图表
   * @param params 图表参数，包含监测点ID和时间戳
   * @returns Blob对象，代表图表图片内容
   */
  static async getPredictionChart(params: ChartParams): Promise<Blob> {
    try {
      const blobData = await http.downloadFile(`${this.BASE_PATH}/TimeMixer/prediction-chart`, params, {
        requestId: `get-prediction-chart-${Date.now()}`,
      })

      return blobData
    } catch (error) {
      console.error('获取预测图表失败:', error)
      throw error
    }
  }
}
