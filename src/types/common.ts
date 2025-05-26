/**
 * 通用类型定义文件
 * 用于统一管理项目中的通用接口和类型
 */

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
 * API 响应基础接口
 */
export interface BaseResponse<T = any> {
  success: boolean
  message?: string
  data?: T
}

/**
 * 带分页的响应接口
 */
export interface PaginatedResponse<T = any> {
  pagination: PaginationInfo
  data: T[]
}

/**
 * 聊天消息接口
 */
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  isThinking?: boolean
  thinking?: string
  isThinkingExpanded?: boolean
}
