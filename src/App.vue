<script setup lang="ts">
import AppHeader from './components/layouts/AppHeader.vue'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const isLoginPage = () => route.path === '/login'

// 行业名称映射（钢铁行业为独立应用）
const industryNames = {
  chemical: '化工',
  newEnergy: '新能源',
  pharmaceutical: '医药',
} as const

// 根据路由决定AppHeader的配置
const headerConfig = computed(() => {
  if (route.path === '/industry-selection') {
    // 行业选择页面使用通用配置
    return {
      logoType: 'generic' as const,
      title: '全域互联的工业智能体协同平台',
    }
  } else if (route.path.startsWith('/dashboard/')) {
    // 仪表板页面根据行业参数配置
    const industry = route.params.industry as string
    const industryName = industryNames[industry as keyof typeof industryNames] || '未知'

    return {
      logoType: (industry || 'chemical') as 'generic' | 'chemical',
      title: `${industryName}行业-全域互联的工业智能体协同平台`,
    }
  } else {
    // 其他页面使用默认化工行业配置
    return {
      logoType: 'chemical' as const,
      title: '化工行业-全域互联的工业智能体协同平台',
    }
  }
})
</script>

<template>
  <div class="app-container">
    <AppHeader v-if="!isLoginPage()" :logoType="headerConfig.logoType" :title="headerConfig.title" />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style>
/* 全局样式已移至 assets/styles/main.css */
</style>
