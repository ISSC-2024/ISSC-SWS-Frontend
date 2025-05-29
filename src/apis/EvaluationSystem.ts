/**
 * 专家评估系统API服务
 */
export default class EvaluationSystemAPI {
  private static readonly BASE_PATH = '/eval-llm'
  private static readonly API_BASE_URL = import.meta.env.VITE_LLM_API_URL

  /**
   * 评估LLM接口，流式获取专家评估结果
   * 先请求/eval接口，自动跟随重定向到/eval-llm
   * @param userConfig 用户配置对象
   * @param onMessage 每条评估结果的回调
   * @param config 可选请求配置
   * @returns Promise<void>
   */
  static async evalLLMStream(userConfig: any, onMessage: (msg: any) => void, config?: any): Promise<void> {
    // 获取token
    const token = localStorage.getItem('token')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/x-ndjson',
    }
    if (token) headers['Authorization'] = `Bearer ${token}`

    // 请求/eval接口，并自动跟随重定向
    const resp = await fetch(`${this.API_BASE_URL}${this.BASE_PATH}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(userConfig),
      redirect: 'follow', // 自动跟随重定向
      signal: (config as any)?.signal,
    })

    if (!resp.body) throw new Error('流式响应不支持')

    // 读取流式数据
    const reader = resp.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      let idx

      while ((idx = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, idx).trim()
        buffer = buffer.slice(idx + 1)

        if (line) {
          try {
            const obj = JSON.parse(line)
            onMessage(obj)
          } catch (e) {
            console.warn('解析NDJSON行失败:', line, e)
          }
        }
      }
    }

    // 处理最后一行
    if (buffer.trim()) {
      try {
        const obj = JSON.parse(buffer.trim())
        onMessage(obj)
      } catch (e) {
        console.warn('解析NDJSON行失败:', buffer, e)
      }
    }
  }
}
