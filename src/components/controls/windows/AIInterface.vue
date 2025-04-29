<script setup lang="ts">
/**
 * AIInterface.vue - 人机接口组件
 *
 * 1. 该组件负责提供AI聊天服务
 * 2. 根据不同厂区选择不同的AI模型
 * 3. 采用高级暗色科技风格设计
 */
import { ref, onMounted, watch, nextTick, computed, onBeforeUnmount } from 'vue'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'
// 导入API服务
import AIInterfaceAPI, { type AIModelType } from '@/apis/AIInterface'

// 添加props定义，接收外部传入的model
const props = defineProps({
  // 允许外部传入模型类型
  model: {
    type: String as () => AIModelType,
    default: 'top-llm',
  },
})

// 定义组件向外发出的事件
const emit = defineEmits(['close'])

/**
 * 关闭窗口
 * 调用父组件的关闭方法
 */
const close = () => {
  // 关闭窗口前取消所有未完成的请求
  AIInterfaceAPI.cancelAllQueries()
  emit('close')
}

// 添加模型选择器需要的状态
const selectedModel = ref<AIModelType>(props.model)

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

// 对话数据库模型相关定义 //

// 消息类型定义
interface Message {
  id?: number
  conversationId?: number | null
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
  isThinking?: boolean
  thinking?: string
  isThinkingExpanded?: boolean // 控制思考内容的展开/收起状态
  model?: AIModelType // 添加模型类型
}

// 对话类型定义
interface Conversation {
  id: number
  title: string
  createdAt: string
  updatedAt: string
  active?: boolean // UI状态，不需要存储到数据库
  messages?: Message[] // 关联的消息
}

// 状态
const messages = ref<Message[]>([])
const isLoading = ref(false)
const inputText = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// 对话历史数据
const conversations = ref<Conversation[]>([
  {
    id: 1,
    title: 'React虚拟DOM工作原理',
    createdAt: '2023-11-23T09:15:00Z',
    updatedAt: '2023-11-23T09:25:00Z',
    active: false,
    messages: [
      {
        id: 5,
        conversationId: 3,
        role: 'user',
        content: '帮我解释React中的虚拟DOM',
        timestamp: '2023-11-23T09:15:00Z',
      },
      {
        id: 6,
        conversationId: 3,
        role: 'assistant',
        content:
          '# React中的虚拟DOM\n\n## 什么是虚拟DOM？\n虚拟DOM(Virtual DOM)是React在内存中维护的UI表示，本质上是一个轻量级的JavaScript对象树，是实际DOM的副本。\n\n## 工作原理\n1. **初始渲染**：React创建整个虚拟DOM树\n2. **状态更新**：创建新的虚拟DOM树\n3. **对比(Diffing)**：比较新旧树差异\n4. **批量更新**：只将差异部分应用到实际DOM\n\n## 优势\n- **性能优化**：减少直接操作DOM\n- **跨平台能力**：抽象化DOM便于支持其他平台\n- **声明式编程**：让开发者专注于状态而非DOM操作\n\n```jsx\n// 使用React时我们只需声明UI状态\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  return <div>{count}</div>;\n}\n```',
        thinking:
          '这个问题是关于React中虚拟DOM的概念。\n我需要解释:\n1. 什么是虚拟DOM\n2. 为什么React使用虚拟DOM\n3. 它如何工作\n4. 它的优势是什么\n5. 可能的缺点',
        timestamp: '2023-11-23T09:15:12Z',
      },
    ],
  },
])

// 当前对话ID
const currentConversationId = ref<number | null>(null)

// 当前对话 - 通过计算属性获取
const currentConversation = computed(() => {
  return currentConversationId.value
    ? conversations.value.find((conversation) => conversation.id === currentConversationId.value)
    : null
})

// 当前对话标题
const currentChatTitle = computed(() => {
  return currentConversation.value?.title || '新对话'
})

// 初始化对话历史中的active状态
const initializeActiveState = () => {
  conversations.value.forEach((conversation) => {
    conversation.active = conversation.id === currentConversationId.value
  })
}

// 切换对话历史
const switchChat = (id: number) => {
  // 保存当前对话的消息
  saveCurrentMessages()

  // 更新当前对话ID
  currentConversationId.value = id

  // 更新激活状态
  initializeActiveState()

  // 加载对应对话的消息
  loadConversationMessages(id)
}

// 保存当前对话的消息
const saveCurrentMessages = () => {
  if (!currentConversation.value) return

  // 如果当前有消息，则保存到对应对话
  if (messages.value.length > 0) {
    const conversation = conversations.value.find((c) => c.id === currentConversationId.value)
    if (conversation) {
      conversation.messages = [...messages.value]
      conversation.updatedAt = new Date().toISOString()

      // 实际项目中，这里应该调用API保存到数据库
      console.log('保存对话消息:', conversation)
    }
  }
}

// 加载特定对话的消息
const loadConversationMessages = (conversationId: number) => {
  const conversation = conversations.value.find((c) => c.id === conversationId)

  if (conversation && conversation.messages && conversation.messages.length > 0) {
    messages.value = [...conversation.messages]
  } else {
    // 如果没有消息，清空消息列表
    messages.value = []

    // 实际项目中，这里应该调用API获取消息
    console.log('从API加载对话消息，对话ID:', conversationId)
  }
}

// 新建对话
const createNewChat = () => {
  // 保存当前对话
  saveCurrentMessages()

  // 生成新ID (实际项目中应由后端生成)
  const newId = Math.max(...conversations.value.map((c) => c.id)) + 1

  // 当前时间
  const now = new Date().toISOString()

  // 创建新对话
  const newChat: Conversation = {
    id: newId,
    title: '新对话 ' + newId,
    createdAt: now,
    updatedAt: now,
    active: true,
    messages: [],
  }

  // 更新对话列表
  conversations.value.forEach((chat) => {
    chat.active = false
  })
  conversations.value.unshift(newChat)

  // 更新当前对话ID
  currentConversationId.value = newId

  // 清空消息
  messages.value = []

  // 实际项目中，这里应该调用API创建新对话
  console.log('创建新对话:', newChat)
}

// 重命名当前对话
const renameCurrentChat = () => {
  if (!currentConversation.value) return

  // 在实际项目中，这里应该弹出对话框让用户输入新名称
  const newTitle = prompt('请输入新的对话标题:', currentConversation.value.title)

  if (newTitle && newTitle.trim() !== '') {
    const conversation = conversations.value.find((c) => c.id === currentConversationId.value)
    if (conversation) {
      conversation.title = newTitle.trim()
      conversation.updatedAt = new Date().toISOString()

      // 实际项目中，这里应该调用API更新对话标题
      console.log('更新对话标题:', conversation)
    }
  }
}

// 控制是否应该自动滚动
const shouldAutoScroll = ref(true)

// 切换思考内容的展开/收起状态
const toggleThinking = (index: number) => {
  if (messages.value[index]) {
    // 切换展开状态前暂时禁用自动滚动
    shouldAutoScroll.value = false
    messages.value[index].isThinkingExpanded = !messages.value[index].isThinkingExpanded

    // 使用setTimeout确保在DOM更新后恢复自动滚动
    setTimeout(() => {
      shouldAutoScroll.value = true
    }, 100)
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
  messages,
  () => {
    // 只有当shouldAutoScroll为true时才滚动
    if (shouldAutoScroll.value) {
      scrollToBottom()
    }
  },
  { deep: true },
)

// 监听props.model变化，更新内部selectedModel
watch(
  () => props.model,
  (newModel) => {
    selectedModel.value = newModel
  },
)

const fillQuestion = (question: string) => {
  inputText.value = question
  if (textareaRef.value) {
    textareaRef.value.focus()
  }
}

// 处理回车键的函数，手动实现Shift+Enter换行
const handleEnter = (e: KeyboardEvent) => {
  // 如果是Shift+Enter，手动插入换行符
  if (e.key === 'Enter' && e.shiftKey) {
    // 获取文本框和光标位置
    const textarea = e.target as HTMLTextAreaElement
    const start = textarea.selectionStart || 0
    const end = textarea.selectionEnd || 0

    // 在光标位置插入换行符
    const newValue = inputText.value.substring(0, start) + '\n' + inputText.value.substring(end)
    inputText.value = newValue

    // 设置新的光标位置
    nextTick(() => {
      if (textarea) {
        textarea.selectionStart = textarea.selectionEnd = start + 1
        textarea.focus()
      }
    })

    return
  }

  // 如果只是Enter，发送消息
  if (e.key === 'Enter' && !e.shiftKey) {
    sendMessage()
  }
}

// 清空输入框
const clearInput = () => {
  inputText.value = ''
}

// 使用API服务的模型选项
const modelOptions = [
  { value: 'top-llm', label: '化工产业园区' },
  { value: 'sub-llm1', label: '原料储存区' },
  { value: 'sub-llm2', label: '成品储存区' },
  { value: 'sub-llm3', label: '反应器区' },
  { value: 'sub-llm4', label: '分离提纯区' },
  { value: 'sub-llm5', label: '公用工程区' },
]

// 获取模型友好名称
const getModelLabel = (modelValue: AIModelType): string => {
  const model = modelOptions.find((m) => m.value === modelValue)
  return model ? model.label : modelValue
}

// 添加特殊算法处理函数
const handleSpecialAlgorithm = (algorithm: string) => {
  // 算法处理逻辑先空着，后续可以扩展
  console.log(`调用了特殊算法: ${algorithm}`)

  // 构建格式化的响应
  return `## 算法已调用\n\n**${algorithm}** 算法已成功执行。\n\n### 状态信息\n- 算法: ${algorithm}\n- 结果: 已更新至前端模块\n- 时间: ${new Date().toLocaleString()}\n\n> ${algorithm}算法已执行`
}

// 修改发送消息处理函数中的特殊算法处理部分
const sendMessage = async () => {
  const content = inputText.value.trim()
  if (!content || isLoading.value) return

  // 如果currentConversationId为null，说明需要创建新对话
  if (currentConversationId.value === null) {
    createNewChat()
  } else if (!currentConversation.value) {
    // 如果ID存在但对话不存在，也创建新对话
    createNewChat()
  }

  // 为消息生成时间戳
  const timestamp = new Date().toISOString()

  // 添加用户消息
  const userMessage: Message = {
    conversationId: currentConversationId.value,
    role: 'user',
    content,
    timestamp,
    model: selectedModel.value, // 记录使用的模型
  }

  messages.value.push(userMessage)

  // 清空输入框
  clearInput()

  // 聚焦输入框
  if (textareaRef.value) {
    textareaRef.value.focus()
  }

  isLoading.value = true

  // 添加思考中的助手消息
  const thinkingMessageIndex = messages.value.length
  const assistantMessage: Message = {
    conversationId: currentConversationId.value,
    role: 'assistant',
    content: '',
    isThinking: true,
    thinking: `正在使用${getModelLabel(selectedModel.value)}模型思考中...`,
    isThinkingExpanded: true, // 思考过程中默认展开
    timestamp: new Date().toISOString(),
    model: selectedModel.value, // 记录使用的模型
  }

  messages.value.push(assistantMessage)

  try {
    // 调用API获取响应
    const { response, thinking } = await AIInterfaceAPI.queryLLM(selectedModel.value, content)

    // 更新对话标题
    if (currentConversation.value && currentConversation.value.title.startsWith('新对话 ')) {
      const newTitle = content.length > 20 ? content.substring(0, 20) + '...' : content
      currentConversation.value.title = newTitle
      currentConversation.value.updatedAt = new Date().toISOString()
      console.log('自动更新对话标题:', currentConversation.value)
    }

    // 更新思考过程
    messages.value[thinkingMessageIndex].thinking = thinking || '已完成思考'
    messages.value[thinkingMessageIndex].isThinkingExpanded = false

    // 检查是否为特殊算法关键词
    const specialAlgorithms = ['TimeMixer', 'KonwledgeGraph', 'DON', 'MAPPO']

    let contentToDisplay = ''

    if (specialAlgorithms.includes(response.trim())) {
      //! 如果是特殊算法关键词，使用特殊处理函数生成响应
      const algorithm = response.trim()
      contentToDisplay = handleSpecialAlgorithm(algorithm)
    } else {
      // 正常响应
      contentToDisplay = response
    }

    // 使用流式输出
    let displayedContent = ''
    for (const char of contentToDisplay) {
      displayedContent += char
      messages.value[thinkingMessageIndex].content = displayedContent
      await new Promise((resolve) => setTimeout(resolve, 20))
    }

    // 完成后保留思考内容，但保持收起状态
    messages.value[thinkingMessageIndex].isThinking = false

    // 更新对话的最后更新时间
    if (currentConversation.value) {
      currentConversation.value.updatedAt = new Date().toISOString()
    }

    // 保存对话消息
    saveCurrentMessages()
  } catch (error) {
    console.error(`从${selectedModel.value}获取回复失败:`, error)
    messages.value[thinkingMessageIndex].content = '抱歉，发生了错误，请稍后再试。'
    messages.value[thinkingMessageIndex].isThinking = false
    messages.value[thinkingMessageIndex].isThinkingExpanded = false
  } finally {
    isLoading.value = false
  }
}

// 在组件卸载前取消所有请求
onBeforeUnmount(() => {
  AIInterfaceAPI.cancelAllQueries()
})

onMounted(() => {
  // 初始化激活状态
  initializeActiveState()

  // 保留滚动到底部
  scrollToBottom()
})
</script>

<template>
  <!-- 人机接口浮窗 -->
  <transition name="fade">
    <div class="overlay" @click="close">
      <div class="ai-window" @click.stop>
        <!-- 窗口顶部装饰线 -->
        <div class="window-top-line"></div>

        <div class="ai-header">
          <div class="header-left">
            <div class="ai-icon">
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
                class="ai-icon-svg"
              >
                <path
                  d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"
                ></path>
                <circle cx="7.5" cy="14.5" r="1.5"></circle>
                <circle cx="16.5" cy="14.5" r="1.5"></circle>
              </svg>
            </div>
            <h2>化工AI助手</h2>
          </div>

          <button class="close-button" @click.stop="close" aria-label="关闭窗口">
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
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="ai-body">
          <!-- 左侧对话历史面板 -->
          <div class="chat-history">
            <div class="history-header">
              <h3>对话历史</h3>
              <button class="new-chat-button" @click="createNewChat">
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
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                新对话
              </button>
            </div>

            <div class="history-list">
              <div
                v-for="chat in conversations"
                :key="chat.id"
                class="history-item"
                :class="{ active: chat.active }"
                @click="switchChat(chat.id)"
              >
                <div class="history-item-icon">
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
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <div class="history-item-content">
                  <div class="history-item-title">{{ chat.title }}</div>
                  <div class="history-item-date">{{ new Date(chat.updatedAt).toLocaleDateString() }}</div>
                </div>
              </div>
            </div>

            <div class="history-footer">
              <!-- 添加模型选择器，取代原来的设置按钮 -->
              <div class="model-selector">
                <select v-model="selectedModel" class="model-select">
                  <option v-for="option in modelOptions" :key="option.value" :value="option.value">
                    {{ option.label + '模型' }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div class="ai-content">
            <!-- 当前对话标题 -->
            <div class="chat-title">
              <h3>{{ currentChatTitle }}</h3>
              <div class="title-actions">
                <button class="title-action-button" @click="renameCurrentChat">
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
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  重命名
                </button>
              </div>
            </div>

            <!-- 消息列表 -->
            <div class="message-list" ref="messagesContainer">
              <div v-if="messages.length === 0" class="empty-state">
                <div class="empty-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="80"
                    height="80"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="empty-state-svg"
                  >
                    <path
                      d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44A2.5 2.5 0 0 1 2 17.5v-11a2.5 2.5 0 0 1 2.5-2.5h5.5"
                    ></path>
                    <path
                      d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44A2.5 2.5 0 0 0 22 17.5v-11a2.5 2.5 0 0 0-2.5-2.5h-5.5"
                    ></path>
                    <circle cx="12" cy="12" r="2"></circle>
                    <path d="M12 9v1"></path>
                    <path d="M12 14v1"></path>
                    <path d="M14 12h1"></path>
                    <path d="M9 12h1"></path>
                    <path d="M6 8.5a6.5 6.5 0 0 1 12 0" stroke-dasharray="1 2"></path>
                    <circle cx="6" cy="8.5" r=".5" fill="currentColor"></circle>
                    <circle cx="18" cy="8.5" r=".5" fill="currentColor"></circle>
                  </svg>
                </div>
                <div class="empty-text">准备就绪</div>
                <div class="empty-desc">
                  您的化工AI助手可以回答<span class="model-name-highlight">{{ getModelLabel(selectedModel) }}</span
                  >的各种问题
                </div>
                <div class="empty-suggestions">
                  <p>试试这些问题:</p>
                  <ul>
                    <li @click="fillQuestion('原料储存区最危险的传感器')">
                      <span class="suggestion-tag">风险</span> 原料储存区最危险的传感器
                    </li>
                    <li @click="fillQuestion('原料存储区当前人力配置情况')">
                      <span class="suggestion-tag">资源</span> 原料存储区当前人力配置情况
                    </li>
                    <li @click="fillQuestion('调用决策功能，重新进行检测异常数据')">
                      <span class="suggestion-tag">操作</span> 调用决策功能，重新进行检测异常数据
                    </li>
                  </ul>
                </div>
              </div>

              <div
                v-for="(message, index) in messages"
                :key="index"
                class="message"
                :class="{ 'user-message': message.role === 'user', 'ai-message': message.role === 'assistant' }"
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
                      <!-- 显示使用的模型 -->
                      <span v-if="message.model && message.role === 'assistant'" class="model-badge">
                        {{ getModelLabel(message.model) }}
                      </span>
                      <span class="message-time" v-if="message.timestamp">
                        {{ new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
                      </span>
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

            <!-- 输入区域 -->
            <div class="input-area">
              <div class="input-container">
                <!-- 必须阻止keydown的冒泡，否则会被不明拦截 -->
                <a-textarea
                  ref="textareaRef"
                  v-model:value="inputText"
                  placeholder="输入您的问题..."
                  @keydown.stop="handleEnter"
                  :disabled="isLoading"
                  :auto-size="{ minRows: 1, maxRows: 5 }"
                  class="ai-textarea"
                />

                <!-- 按钮部分保持不变 -->
                <a-button
                  type="primary"
                  class="send-button"
                  @click="sendMessage"
                  :disabled="isLoading || !inputText.trim()"
                  :loading="isLoading"
                  shape="circle"
                >
                  <template #icon>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </template>
                </a-button>
              </div>
              <div class="input-hint">按Enter发送，Shift+Enter换行</div>
            </div>

            <!-- 底部装饰线 -->
            <div class="window-bottom-line"></div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style>
/* 确保重置样式应用到所有相关元素 */
.ai-window * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* 全局覆盖Ant Design样式，确保与自定义主题一致 */
.ai-window .ant-btn-primary {
  background-color: #61dafb !important;
  border-color: #61dafb !important;
  color: #121826 !important;
}

.ai-window .ant-btn-primary:hover {
  background-color: #4bc0e3 !important;
  border-color: #4bc0e3 !important;
}

.ai-window .ant-btn-primary:disabled,
.ai-window .ant-btn-primary[disabled] {
  background-color: #232b3c !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  color: rgba(255, 255, 255, 0.4) !important;
}

.ai-window .ant-btn-text {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
}

.ai-window .ant-btn-text:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

/* 强制应用于markdown元素的全局样式 - 这些将覆盖任何默认或scoped样式 */
.ai-window .message-text ul,
.ai-window .message-text ol {
  padding-left: 2em !important;
  margin: 12px 0 !important;
  list-style-position: outside !important;
}

.ai-window .message-text li {
  margin-bottom: 8px !important;
  line-height: 1.5 !important;
}

.ai-window .message-text ul {
  list-style-type: disc !important;
}

.ai-window .message-text ol {
  list-style-type: decimal !important;
}

.ai-window .message-text li p {
  display: inline !important;
  margin: 0 !important;
}

/* 增强代码块的样式 */
.ai-window .message-text pre {
  background-color: rgba(0, 0, 0, 0.3) !important;
  border-radius: 8px !important;
  border: 1px solid rgba(97, 218, 251, 0.15) !important;
  margin: 14px 0 !important;
  padding: 16px !important;
  overflow-x: auto !important;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2) !important;
}

.ai-window .message-text code {
  font-family: 'Courier New', monospace !important;
  font-size: 0.9em !important;
}

/* 行内代码样式 */
.ai-window .message-text p code,
.ai-window .message-text li code,
.ai-window .message-text h1 code,
.ai-window .message-text h2 code,
.ai-window .message-text h3 code {
  background-color: rgba(97, 218, 251, 0.1) !important;
  color: #61dafb !important;
  padding: 0.2em 0.4em !important;
  border-radius: 3px !important;
  font-size: 0.85em !important;
  border: 1px solid rgba(97, 218, 251, 0.2) !important;
  margin: 0 2px !important;
}

/* 确保代码块中的代码不受行内代码样式影响 */
.ai-window .message-text pre code {
  background-color: transparent !important;
  padding: 0 !important;
  border: none !important;
  color: inherit !important;
  margin: 0 !important;
}

/* 增强标题样式 */
.ai-window .message-text h1,
.ai-window .message-text h2,
.ai-window .message-text h3 {
  color: #61dafb !important;
  margin-top: 20px !important;
  margin-bottom: 12px !important;
  font-weight: 500 !important;
  letter-spacing: 0.5px !important;
}

.ai-window .message-text h1 {
  font-size: 1.8em !important;
  border-bottom: 1px solid rgba(97, 218, 251, 0.2) !important;
  padding-bottom: 8px !important;
}

.ai-window .message-text h2 {
  font-size: 1.4em !important;
  border-bottom: 1px solid rgba(97, 218, 251, 0.1) !important;
  padding-bottom: 6px !important;
}

.ai-window .message-text h3 {
  font-size: 1.2em !important;
}

/* 表格样式 */
.ai-window .message-text table {
  border-collapse: collapse !important;
  width: 100% !important;
  margin: 16px 0 !important;
  background-color: rgba(26, 34, 52, 0.5) !important;
  border-radius: 6px !important;
  overflow: hidden !important;
}

.ai-window .message-text th,
.ai-window .message-text td {
  border: 1px solid rgba(97, 218, 251, 0.15) !important;
  padding: 8px 12px !important;
  text-align: left !important;
}

.ai-window .message-text th {
  background-color: rgba(97, 218, 251, 0.08) !important;
  color: #61dafb !important;
  font-weight: 500 !important;
}

.ai-window .message-text tr:nth-child(even) {
  background-color: rgba(97, 218, 251, 0.02) !important;
}

/* 块引用样式 */
.ai-window .message-text blockquote {
  border-left: 3px solid rgba(97, 218, 251, 0.4) !important;
  padding: 0.5em 1em !important;
  margin: 1em 0 !important;
  background-color: rgba(97, 218, 251, 0.05) !important;
  border-radius: 0 4px 4px 0 !important;
  color: rgba(255, 255, 255, 0.8) !important;
}

.ai-window .message-text blockquote p:last-child {
  margin-bottom: 0 !important;
}
</style>

<style scoped>
/* 基础变量 */
:root {
  --ai-bg-dark: #121826;
  --ai-bg-darker: #0b101b;
  --ai-bg-medium: #1a2234;
  --ai-bg-light: #232b3c;
  --ai-accent: #61dafb;
  --ai-accent-soft: rgba(97, 218, 251, 0.15);
  --ai-accent-hover: #4bc0e3;
  --ai-text-primary: #ffffff;
  --ai-text-secondary: rgba(255, 255, 255, 0.8);
  --ai-text-tertiary: rgba(255, 255, 255, 0.6);
  --ai-text-dim: rgba(255, 255, 255, 0.4);
  --ai-border: rgba(255, 255, 255, 0.1);
  --ai-user-bubble: rgba(97, 218, 251, 0.1);
  --ai-ai-bubble: rgba(55, 65, 81, 0.6);
  --ai-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  --ai-glow: 0 0 15px rgba(97, 218, 251, 0.3);
}

/* 基础样式 */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.ai-window {
  position: relative;
  width: 90%;
  max-width: 1200px;
  height: 85vh;
  background-color: var(--ai-bg-dark);
  border-radius: 12px;
  box-shadow:
    0 0 0 1px rgba(97, 218, 251, 0.3),
    0 8px 30px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(97, 218, 251, 0.3);
  /* 改进的背景纹理 */
  background-image:
    linear-gradient(to bottom, rgba(18, 24, 38, 0.95), rgba(11, 16, 27, 0.98)),
    repeating-linear-gradient(
      45deg,
      rgba(97, 218, 251, 0.02) 0,
      rgba(97, 218, 251, 0.02) 1px,
      transparent 1px,
      transparent 4px
    );
}

/* 装饰线条 */
.window-top-line {
  position: absolute;
  top: 0;
  left: 5%;
  right: 5%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--ai-accent), transparent);
  opacity: 0.8;
  box-shadow: 0 0 8px rgba(97, 218, 251, 0.5);
}

.window-bottom-line {
  height: 1px;
  margin: 0 5%;
  background: linear-gradient(90deg, transparent, var(--ai-accent), transparent);
  opacity: 0.3;
}

/* 头部样式 - 增强对比度和层次感 */
.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  background-color: #081020;
  border-bottom: 1px solid rgba(97, 218, 251, 0.2);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
}

.ai-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--ai-accent-soft), transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  animation: pulse 2s infinite;
  box-shadow: 0 0 10px rgba(97, 218, 251, 0.4);
  color: var(--ai-accent);
}

.ai-icon-svg {
  filter: drop-shadow(0 0 5px rgba(97, 218, 251, 0.6));
}

.ai-header h2 {
  margin: 0;
  font-weight: 500;
  font-size: 1.1rem;
  color: var(--ai-text-primary);
  letter-spacing: 0.5px;
  text-shadow: 0 0 10px rgba(97, 218, 251, 0.3);
}

/* 关闭按钮样式修复 */
.close-button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--ai-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  padding: 0;
  outline: none;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: rotate(90deg);
}

/* 内容区域调整 */
.ai-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 对话历史面板 */
.chat-history {
  width: 240px;
  min-width: 240px;
  background-color: var(--ai-bg-darker);
  border-right: 1px solid rgba(97, 218, 251, 0.15);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.history-header {
  padding: 16px;
  border-bottom: 1px solid rgba(97, 218, 251, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-header h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--ai-text-primary);
}

.new-chat-button {
  display: flex;
  align-items: center;
  background-color: rgba(97, 218, 251, 0.1);
  color: var(--ai-accent);
  border: 1px solid rgba(97, 218, 251, 0.2);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.new-chat-button svg {
  margin-right: 4px;
}

.new-chat-button:hover {
  background-color: rgba(97, 218, 251, 0.2);
  border-color: rgba(97, 218, 251, 0.3);
}

/* 历史记录列表 */
.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 4px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.history-item:hover {
  background-color: rgba(97, 218, 251, 0.05);
}

.history-item.active {
  background-color: rgba(97, 218, 251, 0.1);
  border-color: rgba(97, 218, 251, 0.2);
}

.history-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background-color: rgba(97, 218, 251, 0.08);
  margin-right: 10px;
  color: var(--ai-accent);
}

.history-item-content {
  flex: 1;
  overflow: hidden;
}

.history-item-title {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--ai-text-secondary);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-item.active .history-item-title {
  color: var(--ai-accent);
}

.history-item-date {
  font-size: 0.7rem;
  color: var(--ai-text-dim);
}

/* 历史面板底部 */
.history-footer {
  padding: 16px;
  border-top: 1px solid rgba(97, 218, 251, 0.1);
  background-color: rgba(8, 16, 32, 0.5);
}

.history-footer > div > .model-select {
  width: 100%;
  position: relative;
  text-align: center;
}

.model-select {
  width: 100%;
  padding: 10px 12px;
  padding-right: 12px !important;
  background-color: rgba(26, 34, 52, 0.8);
  border: 1px solid rgba(97, 218, 251, 0.2);
  border-radius: 8px;
  color: var(--ai-text-secondary);
  font-size: 0.85rem;
  outline: none;
  appearance: none;
  cursor: pointer;
  transition: all 0.2s;
  padding-right: 30px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.model-select:hover {
  background-color: rgba(97, 218, 251, 0.12);
  border-color: rgba(97, 218, 251, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
}

.model-select:focus {
  border-color: var(--ai-accent);
  box-shadow:
    0 0 0 2px rgba(97, 218, 251, 0.15),
    0 4px 10px rgba(0, 0, 0, 0.2);
}

.model-select option {
  background-color: #081020;
  color: var(--ai-text-primary);
  padding: 10px;
}

.model-badge {
  font-size: 0.7rem;
  padding: 2px 6px;
  background-color: rgba(97, 218, 251, 0.1);
  color: var(--ai-accent);
  border-radius: 4px;
  margin: 0 8px;
  border: 1px solid rgba(97, 218, 251, 0.2);
  box-shadow: 0 0 5px rgba(97, 218, 251, 0.1);
  text-shadow: 0 0 3px rgba(97, 218, 251, 0.3);
}

/* 对话区域，让其占据剩余空间 */
.ai-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0; /* 确保flexbox可以正常收缩 */
  overflow: hidden; /* 防止溢出 */
}

/* 对话标题 */
.chat-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background-color: rgba(11, 16, 27, 0.5);
  border-bottom: 1px solid rgba(97, 218, 251, 0.1);
}

.chat-title h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  color: var(--ai-accent);
}

.title-actions {
  display: flex;
}

.title-action-button {
  display: flex;
  align-items: center;
  background-color: rgba(97, 218, 251, 0.05);
  color: var(--ai-text-tertiary);
  border: 1px solid rgba(97, 218, 251, 0.1);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.title-action-button svg {
  margin-right: 4px;
}

.title-action-button:hover {
  background-color: rgba(97, 218, 251, 0.1);
  color: var(--ai-accent);
  border-color: rgba(97, 218, 251, 0.2);
}

/* 消息列表 */
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background-color: rgba(11, 16, 27, 0.6);
  scroll-behavior: smooth;
  background-image:
    linear-gradient(to bottom, rgba(18, 24, 38, 0.3), rgba(11, 16, 27, 0.4)),
    url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2361dafb' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  display: flex;
  flex-direction: column;
}

/* 空状态占满高度 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--ai-text-tertiary);
  text-align: center;
  padding: 20px;
  background: radial-gradient(circle at center, rgba(97, 218, 251, 0.03) 0%, transparent 70%);
}

.empty-icon {
  margin-bottom: 20px;
  color: var(--ai-accent);
  animation: float 3s ease-in-out infinite;
  filter: drop-shadow(0 0 8px rgba(97, 218, 251, 0.3));
}

.empty-state-svg {
  filter: drop-shadow(0 0 10px rgba(97, 218, 251, 0.6));
}

.empty-text {
  font-size: 1.5rem;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--ai-text-primary);
  letter-spacing: 0.5px;
  text-shadow: 0 0 10px rgba(97, 218, 251, 0.2);
}

.empty-desc {
  color: var(--ai-text-tertiary);
  margin-bottom: 30px;
  font-size: 0.95rem;
}

.model-name-highlight {
  color: #1890ff;
  font-weight: 600;
  margin: 0 2px;
}

.empty-suggestions {
  background-color: rgba(26, 34, 52, 0.8);
  border-radius: 12px;
  padding: 20px;
  width: 100%;
  max-width: 450px;
  border: 1px solid rgba(97, 218, 251, 0.15);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(5px);
}

.empty-suggestions p {
  color: var(--ai-text-secondary);
  margin-bottom: 14px;
  font-size: 0.9rem;
}

.empty-suggestions ul {
  text-align: left;
  list-style-type: none;
}

.empty-suggestions li {
  margin-bottom: 12px;
  padding: 12px;
  background-color: rgba(35, 43, 60, 0.8);
  border-radius: 8px;
  cursor: pointer;
  color: var(--ai-text-secondary);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  font-size: 0.95rem;
  border: 1px solid rgba(97, 218, 251, 0.05);
  position: relative;
  overflow: hidden;
}

/* 添加点击波纹效果 */
.empty-suggestions li:active::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  background-color: rgba(97, 218, 251, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  animation: ripple 0.6s linear;
}

@keyframes ripple {
  to {
    transform: translate(-50%, -50%) scale(3);
    opacity: 0;
  }
}

.empty-suggestions li:hover {
  background-color: rgba(97, 218, 251, 0.15);
  color: var(--ai-text-primary);
  border-color: rgba(97, 218, 251, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.suggestion-tag {
  font-size: 0.75rem;
  padding: 3px 8px;
  background-color: rgba(97, 218, 251, 0.15);
  color: var(--ai-accent);
  border-radius: 4px;
  margin-right: 10px;
  border: 1px solid rgba(97, 218, 251, 0.2);
}

/* 消息样式 */
.message {
  margin-bottom: 28px;
  animation: messageAppear 0.3s ease;
  position: relative;
}

.message-container {
  display: flex;
  flex-direction: column;
  max-width: 85%;
}

.user-message .message-container {
  margin-left: auto;
}

.ai-message .message-container {
  margin-right: auto;
}

/* 头像和发送者样式 */
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
  color: var(--ai-accent);
  border: 1px solid rgba(97, 218, 251, 0.3);
}

.ai-avatar {
  background-color: rgba(97, 218, 251, 0.1);
  color: var(--ai-accent);
  border: 1px solid rgba(97, 218, 251, 0.2);
}

.message-sender {
  color: var(--ai-text-tertiary);
  font-size: 0.85rem;
}

.message-bubble {
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
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

.ai-message .message-bubble {
  background-color: rgba(26, 34, 52, 0.75);
  border-top-left-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
}

.ai-message .message-bubble::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.2), transparent);
}

/* 思考框样式 */
.thinking-box {
  background-color: rgba(35, 43, 60, 0.8);
  border-radius: 8px;
  margin-bottom: 14px;
  overflow: hidden;
  border-left: 3px solid var(--ai-accent);
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
  color: var(--ai-accent);
  font-size: 0.85rem;
  display: flex;
  align-items: center;
}

.thinking-title svg {
  margin-right: 6px;
  filter: drop-shadow(0 0 2px rgba(97, 218, 251, 0.3));
}

.thinking-toggle {
  font-size: 0.8rem;
  color: var(--ai-text-tertiary);
  display: flex;
  align-items: center;
  padding: 4px 8px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  transition: all 0.2s;
}

.thinking-toggle:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--ai-text-secondary);
}

.thinking-toggle svg {
  margin-left: 4px;
  transition: transform 0.2s;
}

.toggle-rotated {
  transform: rotate(180deg);
}

.thinking-content {
  padding: 14px 16px;
  border-top: 1px solid rgba(97, 218, 251, 0.1);
  color: var(--ai-text-tertiary);
  font-size: 0.85rem;
  line-height: 1.5;
  white-space: pre-wrap;
  animation: slideDown 0.3s ease;
  background-color: rgba(0, 0, 0, 0.2);
  font-family: 'Courier New', monospace;
}

/* 消息文本内容 */
.message-text {
  line-height: 1.6;
  color: var(--ai-text-primary);
  word-break: break-word;
}

/* Markdown渲染的代码块样式 */
.message-text pre {
  background-color: rgba(0, 0, 0, 0.3) !important;
  border-radius: 8px !important;
  border: 1px solid rgba(97, 218, 251, 0.1) !important;
  margin: 12px 0 !important;
  padding: 14px !important;
}

.message-text code {
  font-family: 'Courier New', monospace !important;
  font-size: 0.9em !important;
}

.message-text h1,
.message-text h2,
.message-text h3 {
  color: var(--ai-accent) !important;
  margin-top: 16px !important;
  margin-bottom: 12px !important;
  font-weight: 500 !important;
}

.message-text ul,
.message-text ol {
  padding-left: 2.5em !important;
  margin: 12px 0 !important;

  list-style-position: outside !important;
}

.message-text li {
  margin-bottom: 8px !important;
  line-height: 1.5 !important;
  color: var(--ai-text-secondary) !important;
  position: relative !important;
}

/* 无序列表样式 */
.message-text ul {
  list-style-type: disc !important;
}

/* 有序列表样式 */
.message-text ol {
  list-style-type: decimal !important;
}

/* 列表项中的文本 */
.message-text li > p {
  display: inline-block !important;
  margin: 0 !important;
}

/* 嵌套列表样式 */
.message-text li > ul,
.message-text li > ol {
  margin: 8px 0 0 0 !important;
  padding-left: 2em !important;
}

/* 无序列表的嵌套样式 */
.message-text ul ul {
  list-style-type: circle !important; /* 二级列表使用空心圆 */
}

.message-text ul ul ul {
  list-style-type: square !important; /* 三级列表使用方块 */
}

/* 处理代码块在列表项中的情况 */
.message-text li pre,
.message-text li code {
  display: block !important;
  margin-top: 8px !important;
  margin-bottom: 8px !important;
}

/* 输入区域 */
.input-area {
  padding: 20px;
  background-color: #081020;
  position: relative;
  z-index: 100;
  isolation: isolate;
  border-top: 1px solid rgba(97, 218, 251, 0.15);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
}

.input-container {
  display: flex;
  align-items: flex-end;
  padding: 8px 8px 8px 16px;
  background-color: rgba(26, 34, 52, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(97, 218, 251, 0.2);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.3s;
  overflow: visible;
  backdrop-filter: blur(5px);
}

.input-container:focus-within {
  border-color: var(--ai-accent);
  box-shadow:
    0 0 0 2px rgba(97, 218, 251, 0.15),
    0 0 15px rgba(97, 218, 251, 0.3);
  transform: translateY(-2px);
}

/* 覆盖 Ant Design 文本输入区域的默认样式 */
:deep(.ant-input) {
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
  color: var(--ai-text-primary) !important;
  outline: none !important;
}

:deep(.ant-input:focus) {
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
}

:deep(.ant-input-affix-wrapper) {
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

:deep(.ant-input-affix-wrapper:focus),
:deep(.ant-input-affix-wrapper-focused) {
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
}

/* 发送按钮样式自定义 */
.send-button {
  margin-left: 10px !important;
  align-self: flex-end !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  width: 40px !important;
  height: 40px !important;
  flex-shrink: 0 !important;
  border: none !important;
  box-shadow: 0 2px 8px rgba(97, 218, 251, 0.3) !important;
  transition: all 0.2s !important;
}

.send-button:hover:not(:disabled) {
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 12px rgba(97, 218, 251, 0.4) !important;
}

.input-hint {
  text-align: center;
  color: var(--ai-text-dim);
  font-size: 0.75rem;
  margin-top: 8px;
  background-color: rgba(97, 218, 251, 0.05);
  padding: 4px 10px;
  border-radius: 12px;
  display: inline-block;
  position: relative;
  left: 50%;
  transform: translateX(-50%);
  border: 1px solid rgba(97, 218, 251, 0.1);
}

/* 动画 */
@keyframes messageAppear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(97, 218, 251, 0.4);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(97, 218, 251, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(97, 218, 251, 0);
  }
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s,
    transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-from .ai-window,
.fade-leave-to .ai-window {
  transform: scale(0.95);
}
</style>

<style scoped>
/* 原生文本框样式  */
.ai-textarea {
  flex: 1;
  min-height: 42px;
  max-height: 150px;
  background-color: transparent;
  color: var(--ai-text-primary);
  border: none;
  resize: none;
  font-family: inherit;
  font-size: 0.95rem;
  line-height: 1.5;
  outline: none;
  padding: 10px 0;
  overflow-y: auto;
}

/* 专门处理输入框聚焦时的样式 */
.ai-textarea:focus {
  outline: none !important;
  box-shadow: none !important;
  border: none !important;
}

.ai-textarea::placeholder {
  color: rgba(255, 255, 255, 0.4);
  padding-left: 1em;
}

/* 添加自定义滚动条 */
.ai-textarea::-webkit-scrollbar {
  width: 4px;
}

.ai-textarea::-webkit-scrollbar-track {
  background: transparent;
}

.ai-textarea::-webkit-scrollbar-thumb {
  background-color: rgba(97, 218, 251, 0.2);
  border-radius: 2px;
}

.ai-textarea::-webkit-scrollbar-thumb:hover {
  background-color: rgba(97, 218, 251, 0.4);
}
</style>
