import { defineStore } from 'pinia'

interface AuthState {
  isLoggedIn: boolean
  username: string | null
  role: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    isLoggedIn: localStorage.getItem('auth') !== null,
    username: localStorage.getItem('username') || null,
    role: localStorage.getItem('role') || null,
  }),
  actions: {
    loginSuccess(payload: { username: string; role: string }) {
      this.isLoggedIn = true
      this.username = payload.username
      this.role = payload.role
      localStorage.setItem('auth', 'true')
      localStorage.setItem('username', payload.username)
      localStorage.setItem('role', payload.role)
    },
    logout() {
      this.$reset()
      localStorage.removeItem('auth')
      localStorage.removeItem('username')
      localStorage.removeItem('role')
    },
  },
})
