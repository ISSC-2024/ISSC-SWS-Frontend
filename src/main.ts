import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import App from './App.vue'

// 导入路由
import router from './router'

// 导入Ant Design Vue样式
import 'ant-design-vue/dist/reset.css'
// 导入全局样式
import './assets/styles/main.css'

// 在开发环境中导入stagewise工具栏
if (import.meta.env.DEV) {
  const { StagewiseToolbar } = await import('@stagewise/toolbar-vue')

  // 创建stagewise配置
  const stagewiseConfig = {
    plugins: [],
  }

  // 创建工具栏容器
  const toolbarContainer = document.createElement('div')
  toolbarContainer.id = 'stagewise-toolbar-container'
  document.body.appendChild(toolbarContainer)

  // 创建并挂载工具栏
  const toolbarApp = createApp(StagewiseToolbar, { config: stagewiseConfig })
  toolbarApp.mount('#stagewise-toolbar-container')
}

const app = createApp(App)

// 注册Pinia状态管理
app.use(createPinia())
// 注册Ant Design Vue
app.use(Antd)
// 注册路由
app.use(router)

app.mount('#app')
