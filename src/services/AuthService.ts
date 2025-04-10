/**
 * 认证服务
 * 负责用户登录认证的相关功能
 * 目前使用环境变量验证，未来可替换为API请求
 */

import { useAuthStore } from '../stores/authStore'

interface LoginCredentials {
  username: string
  password: string
}

interface AuthResponse {
  success: boolean
  message: string
  userData?: {
    username: string
    role: string
  }
}

/**
 * 用户认证服务
 */
export class AuthService {
  // 企业用户类型
  private static userTypes = ['USER1', 'USER2', 'USER3', 'USER4']

  /**
   * 登录验证
   * @param credentials 用户凭证
   * @param loginType 登录类型 'admin' 或 'user'
   * @returns 认证结果
   */
  static async login(credentials: LoginCredentials, loginType: string): Promise<AuthResponse> {
    try {
      if (loginType === 'admin') {
        // 只验证管理员账户
        if (
          credentials.username === import.meta.env.VITE_ADMIN_USERNAME &&
          credentials.password === import.meta.env.VITE_ADMIN_PASSWORD
        ) {
          const authStore = useAuthStore()
          authStore.loginSuccess({
            username: credentials.username,
            role: 'admin',
          })
          return { success: true, message: '管理员登录成功' }
        }
        return { success: false, message: '管理员账号或密码错误' }
      } else {
        // 验证企业用户账户 (USER1-USER4)
        const validUser = this.userTypes.find(
          (type) =>
            credentials.username === import.meta.env[`VITE_${type}_USERNAME`] &&
            credentials.password === import.meta.env[`VITE_${type}_PASSWORD`],
        )

        if (validUser) {
          const authStore = useAuthStore()
          authStore.loginSuccess({
            username: credentials.username,
            role: validUser.toLowerCase(),
          })
          return { success: true, message: '用户登录成功' }
        }
        return { success: false, message: '用户名或密码错误' }
      }
    } catch (error) {
      console.error('登录错误:', error)
      return { success: false, message: '系统错误' }
    }
  }

  /**
   * 检查用户是否已登录
   * @returns 是否已登录
   */
  static isLoggedIn(): boolean {
    // 检查URL中是否有logout参数
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const shouldLogout = urlParams.get('logout') === 'true'

      // 如果有logout参数，则执行退出登录操作
      if (shouldLogout) {
        this.logout()
        // 清除URL参数
        const newUrl = window.location.pathname
        window.history.replaceState({}, document.title, newUrl)
        return false
      }
    }
    return useAuthStore().isLoggedIn
  }

  /**
   * 退出登录
   * @returns Promise
   */
  static logout(): Promise<void> {
    return new Promise<void>((resolve) => {
      useAuthStore().logout()
      // 确保异步操作完成
      setTimeout(() => {
        resolve()
      }, 10)
    })
  }
}

export default AuthService
