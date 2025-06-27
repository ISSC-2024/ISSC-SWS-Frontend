# 全域互联的工业智能体协同平台

## 项目概述

### 项目简介

本项目是一个基于Vue3的多行业工业数据可视化大屏前端原型应用，专注于构建全域互联的工业智能体协同平台。项目支持化工、钢铁、新能源、医药四大行业，集成了Unity WebGL 3D可视化、AI智能对话、算法评估系统等先进功能，实现了工业数据的智能化展示与交互。

### 相关仓库

- **前端仓库**: [ISSC-SWS-Frontend](https://github.com/ISSC-2024/ISSC-SWS-Frontend) (当前仓库)
- **后端仓库**: [ISSC-SWS-Backend](https://github.com/ISSC-2024/ISSC-SWS-Backend) (智能算法和AI服务)

### 核心特色

- 🏭 **多行业支持**: 支持化工、钢铁、新能源、医药四大工业领域
- 🤖 **AI智能体**: 集成多模型AI对话系统，支持行业专业知识问答
- 🎮 **3D可视化**: Unity WebGL实现的沉浸式工业场景展示
- 📊 **智能算法**: 多种机器学习算法（TimeMixer、XGBoost、DQN等）
- 🔗 **全域互联**: 实现跨行业数据互通与协同分析
- 📈 **实时监控**: 多维度数据可视化与实时监控面板

### 技术栈

- **前端框架**: Vue 3 (3.5.17) + TypeScript (5.7.2) + Vite (6.2.0)
- **UI组件库**: Ant Design Vue (4.2.6)
- **可视化图表**: ECharts (5.6.0) + AntV (G2/G6/L7)
- **3D渲染**: Unity WebGL
- **状态管理**: Pinia (3.0.3)
- **HTTP客户端**: Axios (1.10.0)
- **路由管理**: Vue Router (4.5.1)
- **包管理器**: PNPM
- **构建工具**: Vite + TypeScript

### 项目架构

```
├── public/                     # 静态资源
│   ├── unity/                  # Unity WebGL 资源
│   │   └── Release/            # Unity WebGL 发布文件
│   └── images/                 # 静态图片资源
├── src/
│   ├── apis/                   # API接口层
│   │   ├── AIInterface.ts      # AI对话接口
│   │   ├── Algorithm*.ts       # 算法相关接口
│   │   ├── AxiosClient.ts      # HTTP客户端配置
│   │   ├── Conversation.ts     # 对话管理接口
│   │   └── EvaluationSystem.ts # 评估系统接口
│   ├── assets/                 # 项目资源文件
│   │   └── styles/             # 全局样式文件
│   ├── components/             # 组件库
│   │   ├── layouts/            # 布局组件
│   │   ├── charts/             # 图表组件
│   │   ├── controls/           # 控制组件
│   │   │   └── windows/        # 弹窗控制组件
│   │   ├── display/            # 显示组件
│   │   └── common/             # 通用组件
│   ├── views/                  # 页面视图
│   │   ├── DashboardView.vue           # 主仪表盘视图
│   │   ├── LoginView.vue               # 登录页面
│   │   └── IndustrySelectionView.vue   # 行业选择页面
│   ├── services/               # 业务服务层
│   │   ├── AuthService.ts      # 认证服务
│   │   └── UnityService.ts     # Unity交互服务
│   ├── stores/                 # 状态管理
│   │   ├── algorithmStore.ts   # 算法状态管理
│   │   ├── authStore.ts        # 认证状态管理
│   │   ├── evaluationStore.ts  # 评估系统状态
│   │   ├── graphStore.ts       # 图谱状态管理
│   │   └── messageStore.ts     # 消息状态管理
│   ├── router/                 # 路由配置
│   ├── mock/                   # 模拟数据
│   │   ├── DQN/                # DQN算法数据
│   │   ├── MAPPO/              # MAPPO算法数据
│   │   ├── KnowledgeGraph/     # 知识图谱数据
│   │   └── *.json              # 各类模拟数据文件
│   ├── types/                  # TypeScript类型定义
│   ├── utils/                  # 工具函数
│   ├── App.vue                 # 根组件
│   └── main.ts                 # 应用入口
├── cli/                        # 开发工具脚本
│   ├── git/                    # Git相关工具
│   └── lint/                   # 代码检查工具
├── .github/workflows/          # GitHub Actions CI/CD
├── .env.example                # 环境变量示例
├── package.json                # 项目依赖配置
├── vite.config.ts              # Vite构建配置
├── tsconfig.*.json             # TypeScript配置
├── eslint.config.js            # ESLint配置
└── .prettierrc                 # Prettier配置
```

### 支持行业

- **化工行业**: 化学工艺流程监控、反应器管理、安全预警系统
- **钢铁行业**: 高炉监控、轧钢工艺、质量控制系统（独立端口5174）
- **新能源行业**: 风电光伏监控、储能系统、智能电网管理
- **医药行业**: 制药工艺监控、质量检测、合规管理系统

### 核心功能模块

#### 🎮 3D可视化系统

- Unity WebGL集成的沉浸式工业场景
- 实时数据驱动的3D模型展示
- 交互式场景切换与视角控制
- 工业设备状态可视化

> **注意**: 当前项目包含的Unity WebGL文件为示例文件，如需获取最新的Unity资源文件，请在GitHub上提交Issue。

#### 🤖 AI智能对话系统 (需要后端支持)

- 多模型AI架构（top-llm + 5个子模型）
- 行业专业知识问答
- 区域化智能助手（原料区、反应区、分离区等）
- 实时对话与历史记录管理
- **后端仓库**: [ISSC-SWS-Backend](https://github.com/ISSC-2024/ISSC-SWS-Backend)

#### 📊 数据可视化面板

- **左侧面板**: 传感器监控、知识图谱、日志系统
- **中间面板**: Unity 3D场景、控制台、资源展示
- **右侧面板**: 区域列表、图表轮播、事件响应雷达图

#### 🧠 智能算法引擎 (需要后端支持)

- **时序预测**: TimeMixer、TimesNet
- **机器学习**: XGBoost、LightGBM、TabNet
- **强化学习**: DQN、MAPPO、IQL、MADDPG
- **知识图谱**: 工业关系网络分析
- **后端仓库**: [ISSC-SWS-Backend](https://github.com/ISSC-2024/ISSC-SWS-Backend)

#### 📈 评估系统 (需要后端支持)

- 专家评估模块
- 多维度指标分析
- 智能化评分系统
- 优化建议生成
- **后端仓库**: [ISSC-SWS-Backend](https://github.com/ISSC-2024/ISSC-SWS-Backend)

## 快速开始

### 环境要求

- **Node.js**: >= 22.x
- **包管理器**: PNPM (推荐) / NPM
- **浏览器**: Chrome/Edge/Firefox (支持WebGL)
- **后端服务**: [ISSC-SWS-Backend](https://github.com/ISSC-2024/ISSC-SWS-Backend) (AI和算法功能)

### 安装与运行

#### 1. 克隆项目

```bash
git clone <repository-url>
cd ISSC-SWS-Frontend
```

#### 2. 安装依赖

```bash
# 使用 PNPM (推荐)
pnpm install

# 或使用 NPM
npm install
```

#### 3. 环境配置

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，设置登录凭据
VITE_APP_USERNAME=your_username
VITE_APP_PASSWORD=your_password
```

#### 4. 启动开发服务器

```bash
# 使用 PNPM
pnpm dev

# 或使用 NPM
npm run dev
```

#### 5. 构建生产版本

```bash
# 使用 PNPM
pnpm build

# 或使用 NPM
npm run build
```

### 访问应用

- **前端主应用**: http://localhost:5173
- **钢铁行业**: 请参考[ISSC-Iron-Frontend](https://github.com/ISSC-2024/ISSC-Iron-Frontend) 仓库启动说明
- **后端服务**: 请参考 [ISSC-SWS-Backend](https://github.com/ISSC-2024/ISSC-SWS-Backend) 仓库启动说明

> **注意**: AI对话和智能算法功能需要后端服务支持，请确保后端服务正常运行。

## 开发指南

### 可用脚本命令

```bash
# 开发相关
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm preview      # 预览构建结果

# 代码质量
pnpm lint         # ESLint代码检查
pnpm format       # Prettier代码格式化

# Git工具
pnpm commit       # 交互式提交工具
pnpm push         # 推送代码工具
```

### 核心服务API

#### 认证服务 (AuthService)

```typescript
// 用户登录
AuthService.login(credentials: LoginCredentials): Promise<AuthResponse>

// 检查登录状态
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
```

#### AI接口服务 (AIInterfaceAPI)

```typescript
// 查询AI模型
AIInterfaceAPI.queryLLM(model: AIModelType, userQuestion: string): Promise<AIResponse>

// 取消所有查询
AIInterfaceAPI.cancelAllQueries(): void
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
import { defineComponent, onMounted, ref } from 'vue'
import { Chart } from '@antv/g2'

export default defineComponent({
  name: 'MyNewChart',
  setup() {
    const chartContainer = ref<HTMLElement | null>(null)

    onMounted(() => {
      if (chartContainer.value) {
        const chart = new Chart({
          container: chartContainer.value,
          // 其他配置
        })

        // 设置数据和绘制图表
        chart.data([
          /* 数据 */
        ])
        chart.render()
      }
    })

    return {
      chartContainer,
    }
  },
})
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
import { defineComponent } from 'vue'
import { sendMessageToUnity } from '@/services/UnityService'

export default defineComponent({
  name: 'NewControl',
  setup() {
    const sendCommandToUnity = () => {
      sendMessageToUnity('GameController', 'PerformAction', 'action_parameter')
    }

    return {
      sendCommandToUnity,
    }
  },
})
</script>
```

### 开发工具链

#### 代码质量保证

- **ESLint**: 代码静态检查，支持Vue和TypeScript
- **Prettier**: 代码格式化，统一代码风格
- **Husky**: Git钩子，提交前自动检查
- **TypeScript**: 类型检查，提高代码质量

#### 构建优化

- **Vite**: 快速构建工具，支持HMR
- **代码分割**: 按需加载，优化首屏性能
- **资源压缩**: 自动压缩CSS/JS/图片资源

## 项目配置

### Unity WebGL集成

```typescript
// Unity配置示例
const unityConfig = {
  dataUrl: '/unity/Release/Build/Release.data',
  frameworkUrl: '/unity/Release/Build/Release.framework.js',
  codeUrl: '/unity/Release/Build/Release.wasm',
  streamingAssetsUrl: '/unity/Release/StreamingAssets',
  companyName: 'ISSC',
  productName: 'DataDisplay',
  productVersion: '0.1.0',
}
```

> **重要提示**:
>
> - 当前项目中的Unity WebGL文件为示例文件，仅用于演示基本功能
> - 如需获取最新的完整Unity资源文件，请在GitHub仓库中提交Issue
> - Unity资源文件需要放置在 `public/unity/Release/` 目录下

### 环境变量配置

```bash
# .env 文件配置
VITE_APP_USERNAME=admin          # 登录用户名
VITE_APP_PASSWORD=password       # 登录密码
```

### 路由系统

- `/login` - 登录页面
- `/industry-selection` - 行业选择页面
- `/dashboard/:industry` - 行业仪表板页面
- 路由守卫：未登录用户自动重定向到登录页

### AI对话系统 (需要后端支持)

项目集成了多模型AI对话系统，支持以下功能：

- **多模型架构**: top-llm主模型 + 5个专业子模型
- **区域化助手**: 不同工业区域对应专门的AI助手
- **实时对话**: 支持流式输出和历史记录
- **Unity集成**: 支持从Unity场景直接调用AI对话
- **后端依赖**: 需要配合 [ISSC-SWS-Backend](https://github.com/ISSC-2024/ISSC-SWS-Backend) 使用

## 部署指南

### 完整系统部署

#### 前置条件

1. **后端服务**: 首先部署 [ISSC-SWS-Backend](https://github.com/ISSC-2024/ISSC-SWS-Backend)
2. **数据库**: 确保后端所需的数据库服务正常运行
3. **AI服务**: 确保AI模型服务可用

### 前端部署

#### 1. 构建项目

```bash
pnpm build
```

#### 2. 部署静态文件

将 `dist` 目录下的文件部署到Web服务器

#### 3. Unity资源部署

确保Unity WebGL资源正确放置在 `public/unity/Release/` 目录

> **注意**: 当前包含的Unity文件为示例文件，生产环境请使用最新的Unity资源文件

#### 4. 环境变量配置

在生产环境中正确配置环境变量

#### 5. 后端服务配置

确保前端能够正确访问后端API服务，配置相应的代理或CORS设置

### CI/CD流程

项目配置了GitHub Actions自动化流程：

- **主分支推送**: 自动构建和部署
- **PR检查**: 自动运行构建测试
- **代码质量**: 自动ESLint和格式化检查

## 注意事项

### 开发注意事项

- Unity WebGL资源需单独打包并放置在指定目录
- **当前Unity文件为示例文件**，如需最新完整版本请在GitHub提交Issue
- 大屏设计基于1920x1080分辨率优化
- 环境变量文件(.env)不应提交到版本控制
- 钢铁行业使用独立端口5174运行

### 性能优化

- 使用代码分割减少首屏加载时间
- 图表组件支持懒加载和虚拟滚动
- Unity WebGL资源采用流式加载
- 状态管理使用Pinia提高性能

### 浏览器兼容性

- 推荐使用Chrome/Edge/Firefox最新版本
- 需要WebGL支持用于Unity 3D渲染
- 需要ES2020+支持用于现代JavaScript特性

## 贡献指南

### 开发流程

1. Fork 项目到个人仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`pnpm commit`)
4. 推送到分支 (`pnpm push`)
5. 创建 Pull Request

### 代码规范

- 遵循ESLint和Prettier配置
- 使用TypeScript进行类型检查
- 组件命名使用PascalCase
- 文件命名使用kebab-case
- 提交信息遵循Conventional Commits规范

### 测试要求

- 新功能需要添加相应的单元测试
- 确保所有测试通过后再提交
- 重要功能变更需要添加集成测试

## 技术支持

### 常见问题

- **Unity WebGL加载失败**: 检查Unity资源文件是否正确放置，当前为示例文件，如需最新文件请提交Issue
- **AI对话无响应**: 检查后端服务是否启动，参考 [ISSC-SWS-Backend](https://github.com/ISSC-2024/ISSC-SWS-Backend)
- **智能算法功能异常**: 确保后端算法服务正常运行
- **图表显示异常**: 检查数据格式和图表配置
- **登录失败**: 检查环境变量配置
- **Unity功能受限**: 当前Unity文件为示例版本，完整功能需要最新Unity资源文件

### 联系方式

- 项目维护者: ISSC团队
- 技术支持: 请通过GitHub Issues提交问题
- 文档更新: 欢迎提交PR改进文档

## 更新日志

### v1.0.0 (当前版本)

- ✅ 完成多行业支持架构
- ✅ 集成Unity WebGL 3D可视化
- ✅ 实现AI多模型对话系统
- ✅ 完成智能算法引擎集成
- ✅ 实现专家评估系统
- ✅ 完成CI/CD自动化流程

---

**© 2024 ISSC. 全域互联的工业智能体协同平台**
