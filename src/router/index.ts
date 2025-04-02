import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import AuthService from '../services/AuthService';

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 全局导航守卫，检查登录状态
router.beforeEach((to, _from, next) => {
  const isLoggedIn = AuthService.isLoggedIn();
  
  // 如果路由需要认证且用户未登录，重定向到登录页面
  if (to.meta.requiresAuth && !isLoggedIn) {
    next('/login');
  } else if (to.path === '/login' && isLoggedIn) {
    // 如果用户已登录且尝试访问登录页面，重定向到仪表盘
    next('/dashboard');
  } else {
    next();
  }
});

export default router; 