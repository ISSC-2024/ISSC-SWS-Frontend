import { http } from './AxiosClient'

/**
 * AI模型类型
 */
export type AIModelType = 'top-llm' | 'sub-llm1' | 'sub-llm2' | 'sub-llm3' | 'sub-llm4' | 'sub-llm5'

/**
 * AI响应接口
 */
export interface AIResponse {
  response: string
  thinking?: string //! 暂时为空
}

/**
 * AI接口API服务
 */
export default class AIInterfaceAPI {
  /**
   * 向指定的LLM模型发送查询
   * @param model 模型类型
   * @param userQuestion 用户问题
   * @returns 包含AI响应的AIResponse对象
   */
  static async queryLLM(model: AIModelType, userQuestion: string): Promise<AIResponse> {
    try {
      const resp = await http.get(
        `/llm/query/${model}`,
        { user_question: userQuestion },
        {
          // 添加唯一请求ID以支持取消
          requestId: `ai-query-${model}-${Date.now()}`,
          returnRaw: true,
        },
      )
      console.log(`查询模型 ${model} 成功:`, resp)
      //! 包装为AIResponse格式返回，thinking设为空字符串
      return {
        response: resp,
        thinking: '',
      }
    } catch (error) {
      console.error(`查询模型 ${model} 失败:`, error)
      throw error
    }
  }

  /**
   * 取消所有未完成的AI查询请求
   */
  static cancelAllQueries(): void {
    // 取消所有请求
    http.cancelAllRequests()
  }

  /**
   * 取消指定模型的查询请求
   * @param model 模型类型
   */
  static cancelModelQuery(model: AIModelType): void {
    // 取消特定模型请求
    http.cancelRequest(`ai-query-${model}`, true)
  }
}
