/**
 * 认证服务
 * 负责用户登录认证的相关功能
 * 目前使用环境变量验证，未来可替换为API请求
 */

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  userData?: Record<string, any>;
}

/**
 * 用户认证服务
 */
export class AuthService {
  /**
   * 登录验证
   * @param credentials 用户凭证
   * @returns 认证结果
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // 当前从环境变量获取用户名和密码
      // 未来可替换为API请求
      const validUsername = import.meta.env.VITE_APP_USERNAME;
      const validPassword = import.meta.env.VITE_APP_PASSWORD;

      // 验证用户名和密码
      if (credentials.username === validUsername && credentials.password === validPassword) {
        // 设置登录状态
        localStorage.setItem('isLoggedIn', 'true');

        // 返回成功响应
        return {
          success: true,
          message: '登录成功',
          userData: {
            username: credentials.username,
            // 可以添加更多用户数据
          }
        };
      } else {
        return {
          success: false,
          message: '用户名或密码错误'
        };
      }
    } catch (error) {
      console.error('登录验证失败:', error);
      return {
        success: false,
        message: '登录过程发生错误'
      };
    }
  }

  /**
   * 检查用户是否已登录
   * @returns 是否已登录
   */
  static isLoggedIn(): boolean {
    // 检查URL中是否有logout参数
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const shouldLogout = urlParams.get('logout') === 'true';

      // 如果有logout参数，则执行退出登录操作
      if (shouldLogout) {
        this.logout();
        // 清除URL参数
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        return false;
      }
    }

    return localStorage.getItem('isLoggedIn') === 'true';
  }

  /**
   * 退出登录
   */
  static logout(): void {
    localStorage.removeItem('isLoggedIn');
  }
}

export default AuthService; 