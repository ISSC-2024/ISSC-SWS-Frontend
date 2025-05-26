<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, provide, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
import UnityContainer from '../components/display/UnityContainer.vue'
import IndustryRelationshipGraph from '../components/charts/IndustryRelationshipGraph.vue'
import UnityService from '../services/UnityService'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css' // 使用暗色主题
import AIInterfaceAPI from '../apis/AIInterface'
import type { AIModelType } from '../apis/AIInterface'
import type { ChatMessage } from '@/types/common'
import AIInterface from '../components/controls/windows/AIInterface.vue'

// 定义类型接口
interface Industry {
  id: string
  name: string
  description: string
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
    position: 'top-left',
    color: '#d84315',
    x: 400,
    y: 150,
  },
  {
    id: 'steel',
    name: '钢铁',
    description: '钢铁行业数据展示',
    position: 'bottom-left',
    color: '#1a5889',
    x: 150,
    y: 150,
  },
  {
    id: 'newEnergy',
    name: '新能源',
    description: '新能源行业数据展示',
    position: 'top-right',
    color: '#00695c',
    x: 400,
    y: 350,
  },
  {
    id: 'pharmaceutical',
    name: '医药',
    description: '医药行业数据展示',
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

// 使用markedHighlight配置marked
const marked = new Marked(
  markedHighlight({
    async: false,
    langPrefix: 'language-', // 代码块类名前缀
    emptyLangClass: 'no-lang', // 无语言代码块的类名
    highlight: (code, lang) => {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value
      }
      return hljs.highlightAuto(code).value
    },
  }),
)

// 渲染Markdown函数
const renderMarkdown = (content: string): string => {
  if (!content) return ''
  const html = marked.parse(content)
  return DOMPurify.sanitize(html as string)
}

// 当前使用的AI模型
const currentModel: AIModelType = 'top-llm'
// 控制AI对话框显示
const showAIDialog = ref(false)
// 当前使用的AI模型类型
const currentAIModel = ref<AIModelType>('top-llm')

// 弹窗状态
const showLinkDialog = ref(false)
const dialogTitle = ref('')
const dialogContent = ref('')

// 是否正在加载
const isLoading = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)

// 聊天记录和用户输入
const chatHistory = ref<ChatMessage[]>([
  { role: 'assistant', content: '欢迎使用工业智能体协同平台！请问有什么可以帮您？' },
])
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
  if (isInterIndustry) {
    const sourceIndustry = getIndustryName(link.source)
    const targetIndustry = getIndustryName(link.target)
    dialogTitle.value = `${sourceIndustry} → ${targetIndustry}`
    dialogContent.value = `【${getLinkTypeName(link.type || '')}】${link.description}`
  } else {
    const industryId = link.industry || ''
    const sourcePlant = getPlantName(industryId, link.source.replace(`${industryId}_`, ''))
    const targetPlant = getPlantName(industryId, link.target.replace(`${industryId}_`, ''))
    dialogTitle.value = `${sourcePlant} → ${targetPlant}`
    dialogContent.value = `【${getLinkTypeName(link.linkType || '')}】${link.description}`
  }

  // 显示弹窗
  showLinkDialog.value = true
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

// 切换思考内容的展开/收起状态
const toggleThinking = (index: number) => {
  if (chatHistory.value[index]) {
    chatHistory.value[index].isThinkingExpanded = !chatHistory.value[index].isThinkingExpanded
  }
}

// 自动滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 监听消息变化，自动滚动
watch(
  chatHistory,
  () => {
    scrollToBottom()
  },
  { deep: true },
)

// 处理回车键
const handleEnter = (e: KeyboardEvent) => {
  if (e.shiftKey) return // Shift+Enter 允许换行
  sendMessage()
}

// 发送消息
const sendMessage = async (): Promise<void> => {
  const trimmedInput = userInput.value.trim()
  if (!trimmedInput || isLoading.value) return

  // 添加用户消息
  chatHistory.value.push({
    role: 'user',
    content: trimmedInput,
  })

  // 清空输入框
  userInput.value = ''

  isLoading.value = true

  // 添加思考中的助手消息
  const thinkingMessageIndex = chatHistory.value.length
  chatHistory.value.push({
    role: 'assistant',
    content: '',
    isThinking: true,
    thinking: '正在思考中...',
    isThinkingExpanded: true, // 思考过程中默认展开
  })

  try {
    // 调用AI接口获取回复
    const { response, thinking } = await AIInterfaceAPI.queryLLM(currentModel, trimmedInput)

    // 思考过程展示完毕后，收起思考内容
    chatHistory.value[thinkingMessageIndex].isThinkingExpanded = false

    // 更新回复内容
    chatHistory.value[thinkingMessageIndex].content = response
    chatHistory.value[thinkingMessageIndex].thinking = thinking || '(无思考过程)'
    chatHistory.value[thinkingMessageIndex].isThinking = false
  } catch (error) {
    console.error('调用AI接口出错:', error)
    chatHistory.value[thinkingMessageIndex].content = '抱歉，发生了错误，请稍后再试。'
    chatHistory.value[thinkingMessageIndex].isThinking = false
  } finally {
    isLoading.value = false
    // 滚动到最新消息
    scrollToBottom()
  }
}

// 处理键盘输入事件
const handleKeyDown = (e: KeyboardEvent): void => {
  // 阻止事件冒泡，防止被外部事件处理器捕获
  e.stopPropagation()

  // 对于退格键，确保它能正常工作
  if (e.key === 'Backspace') {
    // 由于使用v-model，Vue会自动处理输入，这里只需确保事件不被干扰
    // 不要阻止默认行为，让浏览器处理退格键
  }
  // 对于回车键，我们在keydown事件中处理，而不是keyup
  else if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
  // 其他按键正常处理
}

// 组件挂载完成后，滚动到底部
onMounted(() => {
  scrollToBottom()

  // 添加Unity事件监听器，用于接收Unity的聊天请求
  UnityService.addUnityEventListener('chat_request', handleUnityChatRequest)
})

// 在组件销毁前移除事件监听器
onBeforeUnmount(() => {
  // 移除Unity事件监听器
  UnityService.removeUnityEventListener('chat_request', handleUnityChatRequest)
})

// 处理Unity发来的聊天请求
const handleUnityChatRequest = (data: string) => {
  // 根据Unity发送的区域代码设置模型
  const areaToModel: Record<string, AIModelType> = {
    RMS: 'sub-llm1', // 原料存储区
    PRO: 'sub-llm2', // 成品储存区
    REA: 'sub-llm3', // 反应器区
    SEP: 'sub-llm4', // 分离提纯区
    UTL: 'sub-llm5', // 公用工程区
  }

  // 设置当前使用的模型
  currentAIModel.value = areaToModel[data] || 'top-llm'

  // 显示AI对话框
  showAIDialog.value = true

  console.log(`收到Unity聊天请求，区域：${data}，使用模型：${currentAIModel.value}`)
}

// 关闭对话框
const closeAIDialog = () => {
  showAIDialog.value = false
}
</script>

<template>
  <div class="industry-selection-container">
    <header class="header">
      <h1 class="title">全域互联的工业智能体协同平台</h1>
    </header>

    <!-- 链接信息弹窗 -->
    <div v-if="showLinkDialog" class="link-dialog-overlay" @click.self="showLinkDialog = false">
      <div class="link-dialog">
        <div class="link-dialog-header">
          <h2>{{ dialogTitle }}</h2>
          <button class="close-button" @click="showLinkDialog = false">×</button>
        </div>
        <div class="link-dialog-content">
          {{ dialogContent }}
        </div>
      </div>
    </div>

    <!-- AI对话框 -->
    <AIInterface v-if="showAIDialog" :model="currentAIModel" @close="closeAIDialog" />

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
        <div class="chat-history" ref="messagesContainer">
          <!-- 对话信息 -->
          <div
            v-for="(message, index) in chatHistory"
            :key="index"
            class="message"
            :class="{ 'user-message': message.role === 'user', 'assistant-message': message.role === 'assistant' }"
          >
            <div class="message-container">
              <div class="message-avatar-container">
                <div
                  class="message-avatar"
                  :class="{ 'user-avatar': message.role === 'user', 'ai-avatar': message.role === 'assistant' }"
                >
                  <template v-if="message.role === 'user'">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </template>
                  <template v-else>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path
                        d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"
                      ></path>
                      <circle cx="7.5" cy="14.5" r="1.5"></circle>
                      <circle cx="16.5" cy="14.5" r="1.5"></circle>
                    </svg>
                  </template>
                </div>
                <div class="message-sender">
                  {{ message.role === 'user' ? '您' : 'AI助手' }}
                </div>
              </div>

              <div class="message-bubble">
                <!-- 思考内容 -->
                <div v-if="message.role === 'assistant' && message.thinking" class="thinking-box">
                  <div class="thinking-header" @click="toggleThinking(index)">
                    <div class="thinking-title">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 16v-4"></path>
                        <path d="M12 8h.01"></path>
                      </svg>
                      思考过程
                    </div>
                    <div class="thinking-toggle">
                      {{ message.isThinkingExpanded ? '收起' : '展开' }}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        :class="{ 'toggle-rotated': message.isThinkingExpanded }"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>

                  <div class="thinking-content" v-show="message.isThinkingExpanded">
                    {{ message.thinking }}
                  </div>
                </div>

                <!-- 消息内容 -->
                <div class="message-text" v-html="renderMarkdown(message.content)"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-input-area">
          <!-- 用户输入文本 -->
          <div class="input-wrapper">
            <textarea
              v-model="userInput"
              placeholder="在此输入您的问题..."
              rows="3"
              @keydown.enter.prevent="handleEnter"
              @keydown="handleKeyDown"
              :disabled="isLoading"
            ></textarea>
            <button @click="sendMessage" class="send-btn" :disabled="isLoading || !userInput.trim()">
              {{ isLoading ? '发送中...' : '发送' }}
            </button>
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
  flex: 0.95; /* 占据剩余垂直空间 */
  display: flex;
  gap: 15px; /* 增加间距 */
  padding: 15px; /* 增加内边距 */
  overflow: hidden; /* 尽可能防止内部滚动条 */
  height: calc(100vh - 75px); /* 明确的高度计算 */
  box-sizing: border-box; /* 确保内边距计入总高度 */
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
  margin-bottom: 5px;
}

.chat-history {
  flex: 1; /* 占据可用空间 */
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

.message {
  display: flex;
  margin-bottom: 20px;
  animation: fadeIn 0.3s ease;
}

.user-message {
  justify-content: flex-end;
}

.assistant-message {
  justify-content: flex-start;
}

.message-container {
  display: flex;
  flex-direction: column;
  max-width: 85%;
}

.user-message .message-container {
  margin-left: auto;
}

.assistant-message .message-container {
  margin-right: auto;
}

.message-avatar-container {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
}

.user-avatar {
  background-color: rgba(97, 218, 251, 0.15);
  color: #409eff;
  border: 1px solid rgba(97, 218, 251, 0.3);
}

.ai-avatar {
  background-color: rgba(97, 218, 251, 0.1);
  color: #409eff;
  border: 1px solid rgba(97, 218, 251, 0.2);
}

.message-sender {
  color: #e0e0e0;
  font-size: 0.85rem;
}

.message-bubble {
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
  width: 100%;
}

.user-message .message-bubble {
  background-color: rgba(97, 218, 251, 0.12);
  border-top-right-radius: 4px;
  border: 1px solid rgba(97, 218, 251, 0.25);
}

.user-message .message-bubble::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(97, 218, 251, 0.5), transparent);
}

.assistant-message .message-bubble {
  background-color: rgba(26, 34, 52, 0.75);
  border-top-left-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.assistant-message .message-bubble::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.2), transparent);
}

.thinking-box {
  background-color: rgba(35, 43, 60, 0.8);
  border-radius: 8px;
  margin-bottom: 14px;
  overflow: hidden;
  border-left: 3px solid #409eff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.thinking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
}

.thinking-header:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.thinking-title {
  font-weight: 500;
  color: #409eff;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
}

.thinking-title svg {
  margin-right: 6px;
}

.thinking-toggle {
  font-size: 0.8rem;
  color: #aaa;
  display: flex;
  align-items: center;
  padding: 4px 8px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  transition: all 0.2s;
}

.thinking-toggle:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
}

.thinking-toggle svg {
  margin-left: 4px;
  transition: transform 0.2s;
}

.toggle-rotated {
  transform: rotate(180deg);
}

.thinking-content {
  color: #aaa;
  font-style: italic;
  white-space: pre-wrap;
  padding: 14px 16px;
  border-top: 1px solid rgba(97, 218, 251, 0.1);
  animation: slideDown 0.3s ease;
  background-color: rgba(0, 0, 0, 0.2);
  font-family: 'Courier New', monospace;
}

/* 消息文本内容 */
.message-text {
  line-height: 1.6;
  color: #e0e0e0;
  word-break: break-word;
}

/* Markdown 样式 */
.message-text h1,
.message-text h2,
.message-text h3,
.message-text h4,
.message-text h5,
.message-text h6 {
  color: #409eff;
  margin-top: 16px;
  margin-bottom: 12px;
  font-weight: 500;
}

.message-text p {
  margin-bottom: 0.3em;
  margin-top: 0.3em;
  width: 100%;
}

.message-text pre {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  border: 1px solid rgba(97, 218, 251, 0.1);
  margin: 12px 0;
  padding: 14px;
  overflow: auto;
}

.message-text code {
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.message-text ul,
.message-text ol {
  padding-left: 2.5em;
  margin: 12px 0;
  list-style-position: outside;
}

.message-text li {
  margin-bottom: 8px;
  line-height: 1.5;
  color: #e0e0e0;
  position: relative;
}

/* 无序列表样式 */
.message-text ul {
  list-style-type: disc;
}

/* 有序列表样式 */
.message-text ol {
  list-style-type: decimal;
}

/* 列表项中的文本 */
.message-text li > p {
  display: inline-block;
  margin: 0;
}

/* 嵌套列表样式 */
.message-text li > ul,
.message-text li > ol {
  margin: 8px 0 0 0;
  padding-left: 2em;
}

/* 无序列表的嵌套样式 */
.message-text ul ul {
  list-style-type: circle;
}

.message-text ul ul ul {
  list-style-type: square;
}

/* 处理代码块在列表项中的情况 */
.message-text li pre,
.message-text li code {
  display: block;
  margin-top: 8px;
  margin-bottom: 8px;
}

@keyframes slideDown {
  from {
    max-height: 0;
    opacity: 0;
  }
  to {
    max-height: 500px;
    opacity: 1;
  }
}

/* 链接弹窗样式 */
.link-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.link-dialog {
  background-color: #1a2940;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  animation: scaleIn 0.3s ease;
}

.link-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #263c5a;
  padding: 15px 20px;
  border-bottom: 1px solid #409eff;
}

.link-dialog-header h2 {
  margin: 0;
  color: #e0e0e0;
  font-size: 18px;
}

.close-button {
  background: none;
  border: none;
  color: #aaa;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.link-dialog-content {
  padding: 20px;
  color: #e0e0e0;
  line-height: 1.6;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
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

/* 聊天输入区样式 */
.chat-input-area {
  border-top: 1px solid #444; /* 分隔线 */
  padding: 5px 5px 5px 5px;
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
  padding: 5px 12px;
  font-size: 16px;
  outline: none;
  background-color: #0c1e3e; /* 较暗的输入背景 */
  color: #e0e0e0; /* 浅色文字 */
  resize: none; /* 禁止手动调整大小 */
  min-height: 150px; /* 确保最低高度 */
  line-height: 1.4;
}

.input-wrapper textarea::placeholder {
  color: #777;
}

.send-btn {
  background-color: #409eff; /* 强调色 */
  color: #fff;
  border: none;
  border-radius: 15px;
  padding: 0 15px;
  cursor: pointer;
  height: 150px; /* 匹配textarea的最低高度 */
  font-size: 16px;
  transition: background-color 0.2s ease;
  align-self: flex-end; /* 对齐到底部 */
  width: 80px; /* 设置固定宽度 */
}

.send-btn:hover {
  background-color: #66b1ff; /* 悬停时的浅蓝色 */
}

.send-btn:disabled {
  background-color: #555;
  cursor: not-allowed;
}

.message-text blockquote {
  border-left: 3px solid rgba(97, 218, 251, 0.4);
  padding: 0.5em 1em;
  margin: 1em 0;
  background-color: rgba(97, 218, 251, 0.05);
  border-radius: 0 4px 4px 0;
  color: rgba(255, 255, 255, 0.8);
}

.message-text blockquote p:last-child {
  margin-bottom: 0;
}

.message-text pre code {
  background-color: transparent;
  padding: 0;
  white-space: pre;
}
</style>
