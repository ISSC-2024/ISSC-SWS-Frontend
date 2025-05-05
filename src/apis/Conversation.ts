import { http } from './AxiosClient'

/**
 * 对话数据接口
 */
export interface Conversation {
  id: number
  title: string
  model: string
  createdAt: string
  updatedAt: string
  messageCount: number
}

/**
 * 消息数据接口
 */
export interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  thinking?: string | null
  isThinkingExpanded?: boolean
  model?: string | null
  timestamp: string
  conversation_id: number
}

/**
 * 新建对话请求接口
 */
export interface CreateConversationRequest {
  title: string
  model: string
}

/**
 * 更新对话标题请求接口
 */
export interface UpdateConversationRequest {
  title: string
}

/**
 * 创建消息请求接口
 */
export interface CreateMessageRequest {
  role: 'user' | 'assistant'
  content: string
  thinking?: string
  model?: string
}

/**
 * 对话系统API服务
 */
export default class ConversationAPI {
  private static readonly BASE_PATH = '/conversations'

  /**
   * 创建新对话
   * @param title 对话标题
   * @returns 创建的对话信息
   */
  static async createConversation(title: string, model: string): Promise<Conversation> {
    try {
      const data: CreateConversationRequest = { title, model }
      return await http.post<Conversation>(this.BASE_PATH, data, {
        requestId: `create-conversation-${Date.now()}`,
      })
    } catch (error) {
      console.error('创建对话失败:', error)
      throw error
    }
  }

  /**
   * 获取所有对话列表
   * @returns 对话列表
   */
  static async getConversations(): Promise<Conversation[]> {
    try {
      return await http.get<Conversation[]>(this.BASE_PATH, undefined, {
        requestId: `get-conversations-${Date.now()}`,
        returnRaw: true,
      })
    } catch (error) {
      console.error('获取对话列表失败:', error)
      throw error
    }
  }

  /**
   * 重命名对话
   * @param conversationId 对话ID
   * @param title 新的对话标题
   * @returns 更新后的对话信息
   */
  static async renameConversation(conversationId: number, title: string): Promise<Conversation> {
    try {
      const data: UpdateConversationRequest = { title }
      return await http.put<Conversation>(`${this.BASE_PATH}/${conversationId}`, data, {
        requestId: `rename-conversation-${conversationId}-${Date.now()}`,
      })
    } catch (error) {
      console.error(`重命名对话(ID: ${conversationId})失败:`, error)
      throw error
    }
  }

  /**
   * 删除对话
   * @param conversationId 对话ID
   * @returns void
   */
  static async deleteConversation(conversationId: number): Promise<void> {
    try {
      await http.delete(`${this.BASE_PATH}/${conversationId}`, undefined, {
        requestId: `delete-conversation-${conversationId}-${Date.now()}`,
      })
    } catch (error) {
      console.error(`删除对话(ID: ${conversationId})失败:`, error)
      throw error
    }
  }

  /**
   * 获取特定对话的所有消息
   * @param conversationId 对话ID
   * @returns 消息列表
   */
  static async getConversationMessages(conversationId: number): Promise<Message[]> {
    try {
      return await http.get<Message[]>(`${this.BASE_PATH}/${conversationId}/messages`, undefined, {
        requestId: `get-conversation-messages-${conversationId}-${Date.now()}`,
        returnRaw: true,
      })
    } catch (error) {
      console.error(`获取对话消息(ID: ${conversationId})失败:`, error)
      throw error
    }
  }

  /**
   * 添加新消息
   * @param conversationId 对话ID
   * @param message 新消息内容
   * @returns 创建的消息信息
   */
  static async createMessage(conversationId: number, message: CreateMessageRequest): Promise<Message> {
    try {
      return await http.post<Message>(`${this.BASE_PATH}/${conversationId}/messages`, message, {
        requestId: `create-message-${conversationId}-${Date.now()}`,
        returnRaw: true,
      })
    } catch (error) {
      console.error(`添加消息到对话(ID: ${conversationId})失败:`, error)
      throw error
    }
  }

  /**
   * 取消所有与对话相关的请求
   */
  static cancelAllRequests(): void {
    http.cancelRequestsByUrl(this.BASE_PATH)
  }

  /**
   * 取消特定对话的请求
   * @param conversationId 对话ID
   */
  static cancelConversationRequests(conversationId: number): void {
    http.cancelRequest(`${this.BASE_PATH}/${conversationId}`, true)
  }
}
