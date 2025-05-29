import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type CancelTokenSource,
  AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios'

/**
 * 请求配置的扩展接口
 */
export interface RequestConfig extends AxiosRequestConfig {
  // 是否显示loading
  showLoading?: boolean
  // 是否显示错误提示
  showError?: boolean
  // 自定义请求标识
  requestId?: string
  // 是否直接返回原始响应，不进行封装处理
  returnRaw?: boolean
}

/**
 * HTTP 响应结构接口
 */
export interface HttpResponse<T = any> {
  code: number
  data: T
  message: string
  success: boolean
}

/**
 * Axios 客户端封装类
 */
export default class AxiosClient {
  // axios实例
  private instance: AxiosInstance
  // 取消请求的token集合
  private cancelTokenMap: Map<string, CancelTokenSource>
  // 基础URL
  private baseURL: string
  // 请求超时时间
  private timeout: number

  /**
   * 构造函数
   * @param baseURL 基础URL
   * @param timeout 超时时间(毫秒)
   */
  constructor(baseURL: string = '', timeout: number = 10000) {
    this.baseURL = baseURL
    this.timeout = timeout
    this.cancelTokenMap = new Map()

    // 创建axios实例
    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })

    // 初始化拦截器
    this.initInterceptors()
  }

  /**
   * 初始化请求和响应拦截器
   */
  private initInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // 创建取消令牌
        const source = axios.CancelToken.source()
        config.cancelToken = source.token

        // 存储取消令牌
        const requestId = (config as any).requestId || config.url || ''
        if (requestId) {
          // 如果已存在相同请求，则取消之前的请求
          this.cancelRequest(requestId)
          this.cancelTokenMap.set(requestId, source)
        }

        // 这里可以添加token等认证信息
        const token = localStorage.getItem('token')
        if (token) {
          config.headers = config.headers || {}
          config.headers.Authorization = `Bearer ${token}`
        }

        // 添加loading处理
        if ((config as any).showLoading !== false) {
          // 实现全局loading效果
        }

        return config
      },
      (error: AxiosError) => {
        return Promise.reject(error)
      },
    )

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // 获取请求ID并清理取消Token
        const config = response.config as any
        const requestId = config.requestId || config.url || ''
        this.cancelTokenMap.delete(requestId)

        // 隐藏loading效果
        if (config.showLoading !== false) {
          // 隐藏全局loading效果
        }

        // 如果配置了直接返回原始后端响应，则不进行封装处理
        if (config.returnRaw) {
          return response.data
        }

        // 处理不同格式的响应
        const data = response.data

        // 检查是否是标准格式的响应
        if (data && typeof data === 'object' && 'code' in data) {
          // 标准格式响应处理
          if (data.code !== 200 && data.success !== true) {
            // 处理业务错误
            if (config.showError !== false) {
              this.handleError(data)
            }

            // 根据状态码处理特定情况
            if (data.code === 401) {
              // 处理未授权情况
              return Promise.reject(new Error('未授权，请重新登录'))
            }

            return Promise.reject(new Error(data.message || '请求失败'))
          }

          return data.data
        }

        // 非标准格式，直接返回
        return response.data
      },
      (error: AxiosError) => {
        // 处理请求和网络错误
        const config = error.config as any

        // 隐藏loading效果
        if (config && config.showLoading !== false) {
          // 隐藏全局loading效果
        }

        // 请求已被取消
        if (axios.isCancel(error)) {
          console.log('请求被取消', error.message)
          return Promise.reject(error)
        }

        // 显示错误提示
        if (config && config.showError !== false) {
          this.handleNetworkError(error)
        }

        return Promise.reject(error)
      },
    )
  }

  /**
   * 处理业务错误
   * @param res 响应数据
   */
  private handleError(res: HttpResponse): void {
    // 可扩展调用全局错误提示
    console.error('业务错误:', res.message || '请求失败')
  }

  /**
   * 处理网络错误
   * @param error 错误信息
   */
  private handleNetworkError(error: AxiosError): void {
    let message = '网络错误，请稍后重试'

    if (error.response) {
      // 服务器响应了，但状态码不在 2xx 范围内
      const status = error.response.status

      switch (status) {
        case 400:
          message = '请求参数错误'
          break
        case 401:
          message = '未授权，请重新登录'
          // 可以在这里处理登出逻辑
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求的资源不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        default:
          message = `请求错误(${status})`
          break
      }
    } else if (error.request) {
      // 请求已经发出，但没有收到响应
      message = '无法连接到服务器'
    }

    // 可以调用全局错误提示
    console.error('网络错误:', message)
  }

  /**
   * 取消指定的请求
   * @param requestId 请求标识或前缀
   * @param isPrefix 是否使用前缀匹配模式
   */
  public cancelRequest(requestId: string, isPrefix: boolean = false): void {
    if (isPrefix) {
      // 使用前缀匹配模式取消请求
      this.cancelRequestsByPrefix(requestId)
    } else {
      // 精确匹配请求ID
      const source = this.cancelTokenMap.get(requestId)
      if (source) {
        source.cancel(`取消请求: ${requestId}`)
        this.cancelTokenMap.delete(requestId)
      }
    }
  }

  /**
   * 通过前缀取消请求
   * @param prefix 请求ID前缀
   */
  private cancelRequestsByPrefix(prefix: string): void {
    for (const [requestId, source] of this.cancelTokenMap.entries()) {
      if (requestId.startsWith(prefix)) {
        source.cancel(`取消前缀为 ${prefix} 的请求: ${requestId}`)
        this.cancelTokenMap.delete(requestId)
      }
    }
  }

  /**
   * 取消所有请求
   */
  public cancelAllRequests(): void {
    this.cancelTokenMap.forEach((source) => {
      source.cancel(`取消所有请求`)
    })
    this.cancelTokenMap.clear()
  }

  /**
   * 取消指定接口的所有请求
   * @param url 请求URL或URL前缀
   */
  public cancelRequestsByUrl(url: string): void {
    this.cancelRequest(url, true)
  }

  /**
   * 通用请求方法
   * @param config 请求配置
   * @returns Promise<T>
   */
  public async request<T = any>(config: RequestConfig): Promise<T> {
    try {
      return await this.instance.request<any, T>(config)
    } catch (error) {
      console.error('请求失败:', error)
      throw error
    }
  }

  /**
   * GET请求
   * @param url 请求地址
   * @param params 查询参数
   * @param config 其他配置
   * @returns Promise<T>
   */
  public get<T = any>(url: string, params?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>({
      ...config,
      method: 'get',
      url,
      params,
    })
  }

  /**
   * POST请求
   * @param url 请求地址
   * @param data 请求体数据
   * @param config 其他配置
   * @returns Promise<T>
   */
  public post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>({
      ...config,
      method: 'post',
      url,
      data,
    })
  }

  /**
   * PUT请求
   * @param url 请求地址
   * @param data 请求体数据
   * @param config 其他配置
   * @returns Promise<T>
   */
  public put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>({
      ...config,
      method: 'put',
      url,
      data,
    })
  }

  /**
   * DELETE请求
   * @param url 请求地址
   * @param params 查询参数
   * @param config 其他配置
   * @returns Promise<T>
   */
  public delete<T = any>(url: string, params?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>({
      ...config,
      method: 'delete',
      url,
      params,
    })
  }

  /**
   * 上传文件
   * @param url 请求地址
   * @param formData FormData对象
   * @param config 其他配置
   * @returns Promise<T>
   */
  public uploadFile<T = any>(url: string, formData: FormData, config?: RequestConfig): Promise<T> {
    return this.request<T>({
      ...config,
      method: 'post',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  /**
   * 下载文件
   * @param url 请求地址
   * @param params 查询参数
   * @param config 其他配置
   * @returns Promise<Blob>
   */
  public async downloadFile(url: string, params?: any, config?: RequestConfig): Promise<Blob> {
    const response = await this.instance.request({
      ...config,
      method: 'get',
      url,
      params,
      responseType: 'blob',
    })
    return response as unknown as Blob
  }

  /**
   * 设置通用头部
   * @param headers 头部信息对象
   */
  public setHeaders(headers: Record<string, string>): void {
    Object.keys(headers).forEach((key) => {
      this.instance.defaults.headers.common[key] = headers[key]
    })
  }

  /**
   * 设置认证Token
   * @param token 认证令牌
   */
  public setToken(token: string): void {
    this.instance.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  /**
   * 清除认证Token
   */
  public clearToken(): void {
    delete this.instance.defaults.headers.common['Authorization']
  }

  /**
   * 流式NDJSON请求（适用于application/x-ndjson）
   * @param url 请求地址
   * @param data 请求体数据
   * @param onMessage 每条消息的回调
   * @param config 其他配置
   * @returns Promise<void>
   */
  public async streamNDJSON(
    url: string,
    data: any,
    onMessage: (msg: any) => void,
    config?: RequestConfig,
  ): Promise<void> {
    // 仅支持浏览器Fetch API实现，axios不支持流式文本处理
    const token = localStorage.getItem('token')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/x-ndjson',
    }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const resp = await fetch(this.baseURL + url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      signal: (config as any)?.signal,
    })
    if (!resp.body) throw new Error('流式响应不支持')
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

export const http = new AxiosClient(import.meta.env.VITE_API_URL, 90000)
