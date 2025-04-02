/**
 * 认证服务
 * 负责用户登录认证的相关功能
 * 目前使用环境变量验证，未来可替换为API请求
 */

import { useAuthStore } from '../stores/authStore';

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  userData?: {
    username: string;
    role: string;
  };
}

/**
 * 用户认证服务
 */
export class AuthService {
  private static userTypes = ['ADMIN', 'USER1', 'USER2', 'USER3', 'USER4'];

  /**
   * 登录验证
   * @param credentials 用户凭证
   * @returns 认证结果
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // 遍历检查用户名和密码是否与环境变量匹配
      const validUser = this.userTypes.find(type =>
        credentials.username === import.meta.env[`VITE_${type}_USERNAME`] &&
        credentials.password === import.meta.env[`VITE_${type}_PASSWORD`]
      );

      if (validUser) {
        const authStore = useAuthStore();
        // 登录成功，保存用户信息到 Pinia authStore
        authStore.loginSuccess({
          username: credentials.username,
          role: validUser.toLowerCase()
        });
        return { success: true, message: '登录成功' };
      }
      return { success: false, message: '用户名或密码错误' };
    } catch (error) {
      console.error(' 登录错误:', error);
      return { success: false, message: '系统错误' };
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
    return useAuthStore().isLoggedIn;
  }

  /**
   * 退出登录
   */
  static logout(): void {
    useAuthStore().logout();
  }
}

export default AuthService;