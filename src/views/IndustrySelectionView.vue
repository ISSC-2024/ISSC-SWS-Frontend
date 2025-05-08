<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, provide } from 'vue'
import UnityContainer from '../components/display/UnityContainer.vue'
import IndustryRelationshipGraph from '../components/charts/IndustryRelationshipGraph.vue'
import UnityService from '../services/UnityService'

// 定义类型接口
interface Industry {
  id: string
  name: string
  description: string
  dataPoints: string
  runningDevices: string
  monthlyDevices: string
  position: string
  color: string
  x: number
  y: number
}

interface Plant {
  id: string
  name: string
  description: string
}

interface LinkType {
  id: string
  name: string
  color: string
  description: string
}

interface Link {
  industry?: string
  source: string
  target: string
  type?: string
  linkType?: string
  description: string
}

// 为所有子组件提供展开状态
const isChartExpanded = ref(false)
provide('isChartExpanded', isChartExpanded)

const router = useRouter()

// 当前选中的行业和厂区
const selectedIndustry = ref('')
const selectedPlant = ref('')

// 行业数据
const industries: Industry[] = [
  {
    id: 'chemical',
    name: '化工',
    description: '化工行业数据展示',
    dataPoints: '12375台',
    runningDevices: '8623台',
    monthlyDevices: '178台',
    position: 'top-left',
    color: '#d84315',
    x: 400,
    y: 150,
  },
  {
    id: 'steel',
    name: '钢铁',
    description: '钢铁行业数据展示',
    dataPoints: '9845台',
    runningDevices: '7421台',
    monthlyDevices: '156台',
    position: 'bottom-left',
    color: '#1a5889',
    x: 150,
    y: 150,
  },
  {
    id: 'newEnergy',
    name: '新能源',
    description: '新能源行业数据展示',
    dataPoints: '8632台',
    runningDevices: '6589台',
    monthlyDevices: '211台',
    position: 'top-right',
    color: '#00695c',
    x: 400,
    y: 350,
  },
  {
    id: 'pharmaceutical',
    name: '医药',
    description: '医药行业数据展示',
    dataPoints: '7524台',
    runningDevices: '5863台',
    monthlyDevices: '143台',
    position: 'bottom-right',
    color: '#4527a0',
    x: 150,
    y: 350,
  },
]

// 厂区数据
const industryPlants: Record<string, Plant[]> = {
  chemical: [
    { id: 'material-storage', name: '原料储存区', description: '化工原料存储区域' },
    { id: 'reactor', name: '反应器区', description: '化学反应进行的主要区域' },
    { id: 'separation', name: '分离提纯区', description: '产品分离与纯化区域' },
    { id: 'product-storage', name: '成品储存区', description: '成品仓储和管理区域' },
    { id: 'utility', name: '公用工程区', description: '供水、供电、供热等公用设施区域' },
  ],
  steel: [
    { id: 'raw-material', name: '原料区', description: '钢铁原材料存储和处理区' },
    { id: 'smelting', name: '冶炼区', description: '铁矿石熔炼成生铁的区域' },
    { id: 'casting', name: '铸造区', description: '将熔融金属浇铸成型的区域' },
    { id: 'rolling', name: '轧制区', description: '对钢材进行轧制加工的区域' },
  ],
  newEnergy: [
    { id: 'solar', name: '光伏发电区', description: '太阳能电池板阵列区域' },
    { id: 'wind', name: '风力发电区', description: '风力涡轮机组区域' },
    { id: 'storage', name: '能源存储区', description: '电池储能系统区域' },
    { id: 'distribution', name: '配电区', description: '电能分配和管理区域' },
    { id: 'control', name: '集控中心', description: '中央监控和管理系统区域' },
  ],
  pharmaceutical: [
    { id: 'r-and-d', name: '研发区', description: '药品研发和测试区域' },
    { id: 'production', name: '生产区', description: '药品生产和制造区域' },
    { id: 'quality', name: '质检区', description: '药品质量控制和检验区域' },
    { id: 'packaging', name: '包装区', description: '药品包装和标签区域' },
  ],
}

// 链接类型
const linkTypes: LinkType[] = [
  { id: 'value', name: '价值链', color: '#F56C6C', description: '展示价值如何在各厂区传递' },
  { id: 'logistics', name: '物流链', color: '#409EFF', description: '展示物料在厂区间的运输路径' },
  { id: 'business', name: '业务链', color: '#67C23A', description: '展示各厂区间的业务协作关系' },
]

// 链接数据 - 定义行业内部厂区间的链接
const intraIndustryLinks: Record<string, Link[]> = {
  chemical: [
    { source: 'material-storage', target: 'reactor', type: 'value', description: '原料价值转化为反应物价值' },
    {
      source: 'material-storage',
      target: 'reactor',
      type: 'logistics',
      description: '原料从储存区运输到反应器区进行处理',
    },
    { source: 'reactor', target: 'separation', type: 'value', description: '反应产物价值向纯化产品价值转化' },
    { source: 'reactor', target: 'separation', type: 'logistics', description: '反应产物输送至分离提纯区进行后处理' },
    { source: 'separation', target: 'product-storage', type: 'value', description: '纯化产品价值向最终产品价值转化' },
    { source: 'separation', target: 'product-storage', type: 'logistics', description: '纯化后的产品输送到成品储存区' },
    { source: 'utility', target: 'reactor', type: 'business', description: '为反应过程提供动力与冷却支持' },
    { source: 'utility', target: 'separation', type: 'business', description: '为分离提纯过程提供能源支持' },
  ],
  steel: [
    { source: 'raw-material', target: 'smelting', type: 'value', description: '原料价值转化为生铁价值' },
    { source: 'raw-material', target: 'smelting', type: 'logistics', description: '原材料输送到冶炼炉进行熔炼' },
    { source: 'smelting', target: 'casting', type: 'value', description: '生铁价值转化为钢坯价值' },
    { source: 'smelting', target: 'casting', type: 'logistics', description: '熔融金属输送到铸造区进行成型' },
    { source: 'casting', target: 'rolling', type: 'value', description: '钢坯价值转化为成品钢材价值' },
    { source: 'casting', target: 'rolling', type: 'business', description: '铸造区与轧制区的工艺协同' },
  ],
  newEnergy: [
    { source: 'solar', target: 'storage', type: 'value', description: '太阳能转化为电能并存储' },
    { source: 'wind', target: 'storage', type: 'value', description: '风能转化为电能并存储' },
    { source: 'storage', target: 'distribution', type: 'value', description: '存储电能向分配电能价值转化' },
    { source: 'solar', target: 'control', type: 'business', description: '光伏发电系统监控与管理' },
    { source: 'wind', target: 'control', type: 'business', description: '风力发电系统监控与管理' },
    { source: 'storage', target: 'control', type: 'business', description: '储能系统监控与管理' },
    { source: 'distribution', target: 'control', type: 'business', description: '配电系统监控与管理' },
  ],
  pharmaceutical: [
    { source: 'r-and-d', target: 'production', type: 'value', description: '研发成果转化为生产价值' },
    { source: 'production', target: 'quality', type: 'logistics', description: '药品样本送检确保质量' },
    { source: 'quality', target: 'packaging', type: 'value', description: '合格药品转化为可销售产品价值' },
    { source: 'quality', target: 'production', type: 'business', description: '质检反馈优化生产工艺' },
    { source: 'r-and-d', target: 'quality', type: 'business', description: '研发标准指导质检流程' },
  ],
}

// 行业间链接 - 定义不同行业间的链接关系
const interIndustryLinks: Link[] = [
  {
    source: 'chemical',
    target: 'steel',
    type: 'value',
    description: '化工行业为钢铁行业提供表面处理材料，增加钢材的防腐性和使用寿命',
  },
  { source: 'chemical', target: 'pharmaceutical', type: 'value', description: '化工行业为医药行业提供原料药和中间体' },
  {
    source: 'steel',
    target: 'newEnergy',
    type: 'value',
    description: '钢铁行业为新能源行业提供风电塔架和光伏支架结构材料',
  },
  {
    source: 'newEnergy',
    target: 'chemical',
    type: 'business',
    description: '新能源行业为化工行业提供清洁能源支持，助力绿色化工转型',
  },
  {
    source: 'newEnergy',
    target: 'pharmaceutical',
    type: 'business',
    description: '新能源技术支持医药行业实现节能减排生产',
  },
  {
    source: 'pharmaceutical',
    target: 'chemical',
    type: 'business',
    description: '医药行业为化工行业提供环保解决方案，降低化工生产过程中的环境风险',
  },
]

// 聊天记录和用户输入
const chatHistory = ref([{ role: 'assistant', content: '欢迎使用工业智能体协同平台！请问有什么可以帮您？' }])
const userInput = ref('')

// 选择行业并跳转
const selectIndustry = (industryId: string): void => {
  selectedIndustry.value = industryId
  // 将所选行业保存到会话存储中，以便在仪表板中使用
  sessionStorage.setItem('selectedIndustry', industryId)
  // 跳转到仪表板页面
  router.push('/dashboard')
}

// 选择厂区并在Unity WebGL中显示相应视图
const selectPlant = (industryId: string, plantId: string): void => {
  selectedIndustry.value = industryId
  selectedPlant.value = plantId
  // 将所选厂区保存到会话存储中
  sessionStorage.setItem('selectedIndustry', industryId)
  sessionStorage.setItem('selectedPlant', plantId)

  // 如果是化工行业，调用Unity的视角聚焦API
  if (industryId === 'chemical') {
    // 化工厂区ID到Unity区域代码的映射
    const plantToUnityAreaMap: Record<string, string> = {
      'material-storage': 'RMS', // 原料储存区
      reactor: 'REA', // 反应器区
      separation: 'SEP', // 分离提纯区
      'product-storage': 'PRO', // 成品储存区
      utility: 'UTL', // 公用工程区
    }

    // 获取对应的Unity区域代码
    const areaCode = plantToUnityAreaMap[plantId]
    if (areaCode) {
      // 调用Unity接口切换视角
      UnityService.sendMessageToUnity('MainCamera', 'SwitchArea', areaCode)
      console.log(`切换Unity视角到化工行业的${getPlantName(industryId, plantId)}(${areaCode})`)
    }
  }

  // 这里将来会调用Unity WebGL的方法切换到对应厂区视图
  // 目前只是打印日志，等待Unity模型集成
  console.log(`加载 ${industryId} 行业的 ${plantId} 厂区视图`)

  // 添加指示性消息到聊天窗口
  chatHistory.value.push({
    role: 'assistant',
    content: `正在加载 ${getIndustryName(industryId)} 行业的 ${getPlantName(industryId, plantId)} 厂区视图...`,
  })
}

// 处理链接的点击事件
const handleLinkClick = (link: Link, isInterIndustry = false): void => {
  let message = ''

  if (isInterIndustry) {
    const sourceIndustry = getIndustryName(link.source)
    const targetIndustry = getIndustryName(link.target)
    message = `【${getLinkTypeName(link.type || '')}】${sourceIndustry} → ${targetIndustry}：${link.description}`
  } else {
    const industryId = link.industry || ''
    const sourcePlant = getPlantName(industryId, link.source.replace(`${industryId}_`, ''))
    const targetPlant = getPlantName(industryId, link.target.replace(`${industryId}_`, ''))
    message = `【${getLinkTypeName(link.linkType || '')}】${sourcePlant} → ${targetPlant}：${link.description}`
  }

  // 添加链接信息到聊天历史
  chatHistory.value.push({ role: 'assistant', content: message })
}

// 辅助函数 - 获取行业名称
const getIndustryName = (industryId: string): string => {
  const industry = industries.find((ind) => ind.id === industryId)
  return industry ? industry.name : industryId
}

// 辅助函数 - 获取厂区名称
const getPlantName = (industryId: string, plantId: string): string => {
  const plants = industryPlants[industryId as keyof typeof industryPlants] || []
  const plant = plants.find((p) => p.id === plantId)
  return plant ? plant.name : plantId
}

// 辅助函数 - 获取链接类型名称
const getLinkTypeName = (typeId: string): string => {
  const linkType = linkTypes.find((lt) => lt.id === typeId)
  return linkType ? linkType.name : typeId
}

// 发送消息
const sendMessage = (): void => {
  const trimmedInput = userInput.value.trim()
  if (trimmedInput) {
    chatHistory.value.push({ role: 'user', content: trimmedInput })
    userInput.value = ''
    // TODO: 实现实际的大模型API调用
    // 模拟助手响应
    setTimeout(() => {
      chatHistory.value.push({ role: 'assistant', content: `收到您的消息："${trimmedInput}"。正在处理...` })
    }, 500)
  }
}
</script>

<template>
  <div class="industry-selection-container">
    <header class="header">
      <h1 class="title">全域互联的工业智能体协同平台</h1>
    </header>

    <div class="main-content">
      <!-- 左侧：分为上下两部分 -->
      <div class="left-panels">
        <!-- 左上：Unity WebGL模型展示区 -->
        <div class="unity-container">
          <div class="unity-placeholder">
            <!-- Unity WebGL Canvas 稍后会在这里挂载 -->
            <UnityContainer />
          </div>
        </div>

        <!-- 左下：行业关系展示框 - 使用ECharts组件 -->
        <div class="industry-relationship">
          <IndustryRelationshipGraph
            :industries="industries"
            :industryPlants="industryPlants"
            :linkTypes="linkTypes"
            :intraIndustryLinks="intraIndustryLinks"
            :interIndustryLinks="interIndustryLinks"
            @selectIndustry="selectIndustry"
            @selectPlant="selectPlant"
            @linkClicked="handleLinkClick"
          />
        </div>
      </div>

      <!-- 右侧：大模型对话框 -->
      <div class="chat-container">
        <div class="chat-history">
          <!-- 对话信息 -->
          <div v-for="(message, index) in chatHistory" :key="index" :class="['chat-message', message.role]">
            <span class="message-content">{{ message.content }}</span>
          </div>
        </div>

        <div class="chat-input-area">
          <!-- 用户输入文本 -->
          <div class="input-wrapper">
            <textarea
              v-model="userInput"
              placeholder="在此输入您的问题..."
              rows="3"
              @keyup.enter.prevent="sendMessage"
            ></textarea>
            <button @click="sendMessage" class="send-btn">发送</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.industry-selection-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #0c1e3e; /* 深蓝色背景 */
  color: #fff;
  overflow: hidden; /* 防止主容器上出现滚动条 */
}

.header {
  text-align: center;
  padding: 15px 0;
  background-color: rgba(0, 0, 0, 0.2); /* 稍微透明的黑色 */
  flex-shrink: 0; /* 防止头部收缩 */
}

.title {
  margin: 0;
  font-size: 28px; /* 调整大小 */
  color: #e0e0e0; /* 较浅的文字颜色 */
  font-weight: bold;
  text-shadow: 0 0 8px rgba(64, 158, 255, 0.7); /* 调整阴影 */
}

.main-content {
  flex: 1; /* 占据剩余垂直空间 */
  display: flex;
  gap: 15px; /* 增加间距 */
  padding: 15px; /* 增加内边距 */
  overflow: hidden; /* 尽可能防止内部滚动条 */
  height: calc(100vh - 70px); /* 明确的高度计算 */
}

/* 左列 */
.left-panels {
  flex: 3; /* 占据3/5的宽度 */
  display: flex;
  flex-direction: column;
  gap: 15px; /* 增加间距 */
  overflow: hidden; /* 防止内部滚动条 */
}

/* 左上：Unity容器 */
.unity-container {
  flex: 2; /* 占据左列的3/4高度 */
  border: 1px solid #444; /* 较暗的边框 */
  border-radius: 4px; /* 圆角 */
  overflow: hidden;
  background-color: #000; /* 黑色背景占位符 */
  display: flex; /* 用于居中占位符文本 */
  align-items: center;
  justify-content: center;
}

.unity-placeholder {
  width: 100%;
  height: 100%;
  background-color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333; /* 深灰色文字 */
  font-size: 20px;
}

/* 左下：行业关系展示 */
.industry-relationship {
  flex: 1; /* 占据左列的1/4高度 */
  border: 1px solid #444; /* 较暗的边框 */
  border-radius: 4px; /* 圆角 */
  overflow: hidden;
  display: flex; /* 使用flex容纳SVG */
  background-color: #1a2940; /* 稍微浅一点的蓝色 */
  padding: 10px; /* 添加一些内边距 */
}

/* 右列：聊天容器 */
.chat-container {
  flex: 2; /* 占据2/5的宽度 */
  border: 1px solid #444; /* 较暗的边框 */
  border-radius: 4px; /* 圆角 */
  display: flex;
  flex-direction: column;
  background-color: #1a2940; /* 匹配关系面板背景 */
  overflow: hidden; /* 防止容器上的滚动条 */
}

.chat-history {
  flex: 0.96; /* 占据可用空间 */
  padding: 15px;
  overflow-y: auto; /* 允许消息滚动 */
  display: flex;
  flex-direction: column;
  gap: 12px; /* 消息间的间距 */
  color: #e0e0e0; /* 浅色文字 */
}

/* 为聊天历史设计滚动条样式 */
.chat-history::-webkit-scrollbar {
  width: 6px;
}

.chat-history::-webkit-scrollbar-track {
  background: #1a2940; /* 匹配背景 */
}

.chat-history::-webkit-scrollbar-thumb {
  background-color: #409eff; /* 强调色 */
  border-radius: 3px;
}

.chat-message {
  max-width: 85%; /* 稍宽的消息 */
  padding: 10px 15px;
  border-radius: 18px; /* 更圆的角 */
  line-height: 1.5;
  word-wrap: break-word; /* 确保长单词换行 */
}

.chat-message.assistant {
  align-self: flex-start;
  background-color: #2c3e50; /* 助手的深蓝灰色 */
  border-bottom-left-radius: 4px; /* 稍有不同的形状 */
  color: #e0e0e0;
}

.chat-message.user {
  align-self: flex-end;
  background-color: #409eff; /* 用户的亮蓝色 */
  border-bottom-right-radius: 4px; /* 稍有不同的形状 */
  color: #fff; /* 白色文字以形成对比 */
}

.message-content {
  white-space: pre-wrap; /* 保留空格并换行文本 */
}

.chat-input-area {
  border-top: 1px solid #444; /* 分隔线 */
  padding: 15px;
  background-color: #1a2940; /* 匹配背景 */
  flex-shrink: 0; /* 防止输入区域收缩 */
}

.input-wrapper {
  display: flex;
  align-items: flex-end; /* 将按钮对齐到底部 */
  gap: 10px;
}

.input-wrapper textarea {
  flex: 1;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
  background-color: #0c1e3e; /* 较暗的输入背景 */
  color: #e0e0e0; /* 浅色文字 */
  resize: none; /* 禁止手动调整大小 */
  min-height: 40px; /* 确保最低高度 */
  line-height: 1.4;
}

.input-wrapper textarea::placeholder {
  color: #777;
}

.send-btn {
  background-color: #409eff; /* 强调色 */
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 0 15px;
  cursor: pointer;
  height: 80px; /* 匹配textarea的最低高度 */
  font-size: 14px;
  transition: background-color 0.2s ease;
  align-self: flex-end; /* 对齐到底部 */
}

.send-btn:hover {
  background-color: #66b1ff; /* 悬停时的浅蓝色 */
}

.send-btn:disabled {
  background-color: #555;
  cursor: not-allowed;
}

/* 基本响应式调整 */
@media (max-width: 1024px) {
  .main-content {
    flex-direction: column;
    height: auto; /* 允许内容决定高度 */
    overflow-y: auto; /* 如果需要，允许主内容滚动 */
  }

  .left-panels {
    flex: none; /* 重置flex基础 */
    width: 100%; /* 占据全部宽度 */
    height: 60vh; /* 示例固定高度，根据需要调整 */
  }

  .chat-container {
    flex: none; /* 重置flex基础 */
    width: 100%; /* 占据全部宽度 */
    height: 40vh; /* 示例固定高度 */
  }

  .title {
    font-size: 24px;
  }
}

@media (max-width: 768px) {
  .left-panels {
    height: 55vh; /* 为较小屏幕调整高度 */
  }

  .chat-container {
    height: 45vh; /* 调整高度 */
  }

  .title {
    font-size: 20px;
  }

  .chat-message {
    max-width: 90%;
  }
}
</style>
