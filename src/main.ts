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

const app = createApp(App)

// 注册Pinia状态管理
app.use(createPinia())
// 注册Ant Design Vue
app.use(Antd)
// 注册路由
app.use(router)

app.mount('#app')
