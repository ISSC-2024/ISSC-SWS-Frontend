import { defineStore } from 'pinia'
import { ref } from 'vue'

// 定义认证状态接口
interface AuthPayload {
  username: string
  role: string
}

// 创建认证状态管理
export const useAuthStore = defineStore('auth', () => {
  // 状态定义
  const isLoggedIn = ref<boolean>(localStorage.getItem('auth') !== null)
  const username = ref<string | null>(localStorage.getItem('username') || null)
  const role = ref<string | null>(localStorage.getItem('role') || null)

  // 登录成功处理
  function loginSuccess(payload: AuthPayload) {
    isLoggedIn.value = true
    username.value = payload.username
    role.value = payload.role
    localStorage.setItem('auth', 'true')
    localStorage.setItem('username', payload.username)
    localStorage.setItem('role', payload.role)
  }

  // 登出处理
  function logout() {
    isLoggedIn.value = false
    username.value = null
    role.value = null
    localStorage.removeItem('auth')
    localStorage.removeItem('username')
    localStorage.removeItem('role')
  }

  return {
    isLoggedIn,
    username,
    role,
    loginSuccess,
    logout,
  }
})
