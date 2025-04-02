# 工业数据可视化大屏项目

## 一、项目概览

### 项目简介
本项目是一个基于Vue3、Ant Design Vue和ECharts的工业数据可视化大屏前端项目，集成了Unity WebGL动画演示功能。项目采用单页面应用设计，界面分为左中右三列布局，实现了登录认证保护功能。

### 技术栈
- **前端框架**: Vue 3 (3.5.x) + TypeScript + Vite (6.2.x)
- **UI组件库**: Ant Design Vue (4.2.x)
- **可视化图表**: ECharts (5.6.x)
- **3D动画**: Unity WebGL
- **状态管理**: Pinia (3.0.x)
- **HTTP客户端**: Axios (1.8.x)
- **图标**: @ant-design/icons-vue (7.0.x)
- **路由**: Vue Router (4.5.x)

### 项目结构
```
├── public/                 # 静态资源
│   ├── unity/              # Unity WebGL 资源
│   │   └── Release/        # Unity WebGL 发布文件
│   └── images/             # 静态图片资源
├── src/
│   ├── assets/             # 项目资源文件
│   │   └── styles/         # 全局样式文件
│   ├── components/         # 通用组件
│   │   ├── layouts/        # 布局组件
│   │   ├── charts/         # 图表组件
│   │   ├── controls/       # 控制组件
│   │   │   └── windows/    # 弹窗控制组件
│   │   └── display/        # 显示组件
│   ├── views/              # 页面视图
│   │   ├── DashboardView.vue       # 主仪表盘视图
│   │   └── LoginView.vue           # 登录页面
│   ├── services/           # API服务
│   │   ├── AuthService.ts          # 认证服务
│   │   └── UnityService.ts         # Unity交互服务
│   ├── router/             # 路由配置
│   ├── mock/               # 模拟数据
│   │   ├── sensors.json            # 传感器数据
│   │   ├── plantLogs.json          # 工厂日志数据
│   │   ├── resourceAllocation.json # 资源分配数据
│   │   ├── staffDistribution.json  # 人员分布数据
│   │   ├── eventResponse.json      # 事件响应数据
│   │   └── chemicalKnowledgeGraph.json # 化学知识图谱数据
│   ├── types/              # 类型定义
│   ├── App.vue             # 根组件
│   └── main.ts             # 入口文件
├── .env.example            # 环境变量示例文件
├── .env                    # 环境变量文件
├── package.json            # 项目依赖
└── vite.config.ts          # Vite配置
```

### 界面布局
页面采用三列布局：
- **左侧列**: 数据可视化图表展示区（传感器列表、知识图谱、日志列表）
- **中间列**: 上部分为Unity WebGL内容展示区域，下部分为控制区域和资源展示区
    - 控制区域包含场景切换、模型选择和**FastGPT人机对话接口**按钮
- **右侧列**: 数据可视化图表展示区（资源分配图表、人员分布图表、事件响应雷达图）

### 已实现功能
- ✅ 主界面三列布局
- ✅ Unity WebGL容器集成与加载
- ✅ 控制按钮面板
- ✅ 资源信息显示面板
- ✅ 通用面板组件
- ✅ 多种图表组件：
  - ✅ 滚动传感器列表
  - ✅ 滚动日志列表
  - ✅ 资源分配图表
  - ✅ 人员分布图表
  - ✅ 事件响应雷达图
  - ✅ 知识图谱
- ✅ 基于FastGPT的AI对话助手
  - ✅ 嵌入式交互界面
  - ✅ 免登录分享链接集成
- ✅ 用户登录认证
- ✅ 受保护的路由
- ✅ 模拟数据集成

## 二、开发者指南

### 快速开始

#### 开发与构建
```bash
# 配置环境变量 编辑.env文件，设置用户名和密码
cp .env.example .env

# 安装依赖
npm install

# 开发模式启动
npm run dev

# 构建生产版本
npm run build
```

### 核心API说明

#### 认证服务 (AuthService)
```typescript
// 用户登录
AuthService.login(credentials: LoginCredentials): Promise<AuthResponse>

// 检查用户是否已登录
AuthService.isLoggedIn(): boolean

// 退出登录
AuthService.logout(): void
```

#### Unity交互服务 (UnityService)
```typescript
// 向Unity发送消息
sendMessageToUnity(gameObject: string, method: string, parameter?: any): boolean

// 添加Unity事件监听器
addUnityEventListener(eventName: string, callback: (data: any) => void): void

// 移除Unity事件监听器
removeUnityEventListener(eventName: string, callback: (data: any) => void): void

// 检查Unity是否已加载完成
isUnityLoaded(): boolean
```

### 添加新组件指南

#### 添加新的图表组件
1. 在`src/components/charts/`目录下创建新的组件文件
2. 引入所需的AntV库(G2/G6/L7)或ECharts
3. 创建组件并实现图表逻辑
4. 在相应的视图文件中引入并使用该组件

示例:
```vue
<!-- src/components/charts/MyNewChart.vue -->
<template>
  <div class="chart-container" ref="chartContainer"></div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import { Chart } from '@antv/g2';

export default defineComponent({
  name: 'MyNewChart',
  setup() {
    const chartContainer = ref<HTMLElement | null>(null);
    
    onMounted(() => {
      if (chartContainer.value) {
        const chart = new Chart({
          container: chartContainer.value,
          // 其他配置
        });
        
        // 设置数据和绘制图表
        chart.data([/* 数据 */]);
        chart.render();
      }
    });
    
    return {
      chartContainer
    };
  }
});
</script>
```

#### 添加新的控制组件
1. 在`src/components/controls/`目录下创建新的组件文件
2. 设计组件UI和交互逻辑
3. 如需与Unity交互，引入UnityService

示例:
```vue
<!-- src/components/controls/NewControl.vue -->
<template>
  <div class="control-component">
    <a-button @click="sendCommandToUnity">执行操作</a-button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { sendMessageToUnity } from '@/services/UnityService';

export default defineComponent({
  name: 'NewControl',
  setup() {
    const sendCommandToUnity = () => {
      sendMessageToUnity('GameController', 'PerformAction', 'action_parameter');
    };
    
    return {
      sendCommandToUnity
    };
  }
});
</script>
```

### 认证与路由

用户认证系统使用环境变量存储凭据，可通过以下配置:
```
VITE_APP_USERNAME=your_username
VITE_APP_PASSWORD=your_password
```

路由保护已配置，未登录用户会被重定向到登录页，可通过URL参数`?logout=true`实现退出登录。

### FastGPT AI对话集成

项目集成了FastGPT提供的大模型对话功能，后续可以用于提供工业领域智能问答服务。

#### 配置方法
1. 在FastGPT平台编排工作流，创建应用
2. 发布应用，获取用于嵌入对话框的iframe代码片段
3. 将iframe代码片段放置在AIInterface.vue组件中

#### 使用方式
1. 在控制面板上点击"人机接口"按钮
2. 在弹出的对话框中输入问题

#### 功能特点
- 无需登录即可使用
- 提供可视化的对话界面
- 支持历史对话记录查看

### 注意事项
- Unity WebGL资源需单独打包并放置在public/unity/Release目录下
- 大屏设计基于1920x1080分辨率，适配其他分辨率仍在优化中
- 环境变量文件(.env)不应提交到版本控制系统
- 当前使用的模拟数据位于src/mock目录，实际部署时应替换为真实数据源