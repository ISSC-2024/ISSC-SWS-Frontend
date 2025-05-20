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
import ConversationAPI, {
  type Conversation as ConversationType,
  type Message as MessageType,
  type CreateMessageRequest,
} from '@/apis/Conversation'
import { useAlgorithmStore, AlgorithmType, ModuleType } from '@/stores/algorithmStore'

import {
  GlobalOutlined,
  InboxOutlined,
  BoxPlotOutlined,
  ExperimentOutlined,
  FilterOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue'

const algorithmStore = useAlgorithmStore()

// props接收外部传入的model
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
  //同时取消对话API的请求
  ConversationAPI.cancelAllRequests()
  //
  emit('close')
}

// 模型选择器需要的状态
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

// Message类型定义
type Message = MessageType & {
  isThinking?: boolean // 不保存到数据库，只用于UI状态
  isThinkingExpanded?: boolean // 控制思考内容的展开/收起状态
  model?: AIModelType // 模型类型
}

// 对话类型定义
type Conversation = ConversationType & {
  active?: boolean // UI状态，不需要存储到数据库
}

// 状态
const messages = ref<Message[]>([])
const isLoading = ref(false)
const inputText = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
//标题编辑状态
const isEditingTitle = ref(false)
const editingTitle = ref('')

// 对话历史数据
const conversations = ref<Conversation[]>([])

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
const switchChat = async (id: number) => {
  // 保存当前对话的消息
  if (currentConversationId.value) {
    await saveCurrentMessages()
  }

  // 更新当前对话ID
  currentConversationId.value = id

  // 更新激活状态
  initializeActiveState()

  // 加载对应对话的消息
  await loadConversationMessages(id)
}

// 保存当前对话的消息，占位
const saveCurrentMessages = async () => {
  // 当前实现只在发送消息时保存单条消息，不再需要批量保存
  console.log('当前对话消息已通过API保存')
}

// 加载特定对话的消息
const loadConversationMessages = async (conversationId: number) => {
  try {
    // 从API获取消息
    const conversationMessages = await ConversationAPI.getConversationMessages(conversationId)

    if (conversationMessages && conversationMessages.length > 0) {
      // 转换消息格式，确保UI状态属性存在，并处理类型不匹配问题
      messages.value = conversationMessages.map((msg) => {
        // 将API返回的model字段转换为AIModelType或undefined
        let modelValue: AIModelType | undefined = undefined
        if (msg.model) {
          // 检查model值是否为有效的AIModelType
          if (['top-llm', 'sub-llm1', 'sub-llm2', 'sub-llm3', 'sub-llm4', 'sub-llm5'].includes(msg.model)) {
            modelValue = msg.model as AIModelType
          }
        }

        return {
          ...msg,
          model: modelValue,
          isThinkingExpanded: false, // 默认收起思考内容
        } as Message
      })
    } else {
      // 如果没有消息，清空消息列表
      messages.value = []
    }

    console.log(`已加载对话ID: ${conversationId}的消息，共${messages.value.length}条`)
  } catch (error) {
    console.error('加载对话消息失败:', error)
    messages.value = []
  }
}

// 加载所有对话
const loadConversations = async () => {
  try {
    const result = await ConversationAPI.getConversations()

    // 转换为组件使用的格式
    conversations.value = result.map((conversation) => ({
      ...conversation,
      active: false, // 所有对话初始状态都是非激活的
    }))

    console.log(`已加载${conversations.value.length}个对话`)
  } catch (error) {
    console.error('加载对话列表失败:', error)
  }
}

// 新建对话
const createNewChat = async () => {
  try {
    // 保存当前对话
    if (currentConversationId.value) {
      await saveCurrentMessages()
    }

    // 创建新对话
    const title = '新对话'
    const newChat = await ConversationAPI.createConversation(title, selectedModel.value)

    // UI状态属性
    const conversationWithUI = {
      ...newChat,
      active: true,
    }

    // 更新对话列表
    conversations.value.forEach((chat) => {
      chat.active = false
    })
    conversations.value.unshift(conversationWithUI)

    // 更新当前对话ID
    currentConversationId.value = newChat.id

    // 清空消息
    messages.value = []

    console.log('创建新对话成功:', newChat)
    return newChat.id
  } catch (error) {
    console.error('创建新对话失败:', error)
    return null
  }
}

// 重命名当前对话
const renameCurrentChat = async () => {
  startEditingTitle()
}

// 开始编辑标题
const startEditingTitle = () => {
  if (!currentConversation.value) return

  editingTitle.value = currentConversation.value.title
  isEditingTitle.value = true

  // 等待DOM更新后聚焦输入框
  nextTick(() => {
    const titleInput = document.getElementById('title-input') as HTMLInputElement
    if (titleInput) {
      titleInput.focus()
      titleInput.select()
    }
  })
}

// 保存编辑后的标题
const saveEditedTitle = async () => {
  if (!currentConversation.value || !editingTitle.value.trim()) {
    isEditingTitle.value = false
    return
  }

  const newTitle = editingTitle.value.trim()

  try {
    // 调用API更新对话标题
    const updatedConversation = await ConversationAPI.renameConversation(
      currentConversationId.value as number,
      newTitle,
    )

    // 更新本地状态
    const conversation = conversations.value.find((c) => c.id === currentConversationId.value)
    if (conversation) {
      conversation.title = updatedConversation.title
      conversation.updatedAt = updatedConversation.updatedAt
    }

    console.log('更新对话标题成功:', updatedConversation)
  } catch (error) {
    console.error('更新对话标题失败:', error)
  } finally {
    isEditingTitle.value = false
  }
}

// 处理标题输入框的按键事件
const handleTitleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    saveEditedTitle()
    // ESC取消编辑
  } else if (e.key === 'Escape') {
    cancelTitleEditing()
  }
}

// 取消编辑标题
const cancelTitleEditing = () => {
  isEditingTitle.value = false
  // 不保存更改，直接恢复为原标题
  editingTitle.value = currentConversation.value?.title || ''
}

// 失焦时保存标题
const onTitleInputBlur = () => {
  saveEditedTitle()
}

const deleteChat = async (id: number) => {
  try {
    // 调用API删除对话
    await ConversationAPI.deleteConversation(id)

    // 从列表中移除该对话
    conversations.value = conversations.value.filter((chat) => chat.id !== id)

    // 如果删除的是当前选中的对话，则清空消息并设置当前对话ID为null
    if (currentConversationId.value === id) {
      messages.value = []
      currentConversationId.value = null
    }

    console.log('删除对话成功:', id)
  } catch (error) {
    console.error('删除对话失败:', error)
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
  nextTick(() => {
    sendMessage()
  })
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

// 添加特殊算法处理函数// 修改特殊算法处理函数
const handleSpecialAlgorithm = async (algorithm: string) => {
  console.log(`调用了特殊算法: ${algorithm}`)

  // 算法类型映射
  const algorithmTypeMap: Record<string, { type: AlgorithmType; module: ModuleType }> = {
    TimeMixer: { type: AlgorithmType.TimeMixer, module: ModuleType.Module1 },
    TimesNet: { type: AlgorithmType.TimesNet, module: ModuleType.Module1 },
    KnowledgeGraph: { type: AlgorithmType.KnowledgeGraph, module: ModuleType.Module2 },
    xgboost: { type: AlgorithmType.xgboost, module: ModuleType.Module3 },
    lightGBM: { type: AlgorithmType.lightGBM, module: ModuleType.Module3 },
    TabNet: { type: AlgorithmType.TabNet, module: ModuleType.Module3 },
    IQL: { type: AlgorithmType.IQL, module: ModuleType.Module4 },
    DQN: { type: AlgorithmType.DQN, module: ModuleType.Module4 },
    MADDPG: { type: AlgorithmType.MADDPG, module: ModuleType.Module4 },
    MAPPO: { type: AlgorithmType.MAPPO, module: ModuleType.Module4 },
  }

  // 检查算法是否在映射中
  if (algorithm in algorithmTypeMap) {
    const { type, module } = algorithmTypeMap[algorithm]
    try {
      // 获取算法当前参数
      const currentParams = JSON.parse(JSON.stringify(algorithmStore.getAlgorithmParams(type)))

      // 获取当前文件路径
      const currentFilePath = algorithmStore.getAlgorithmFilePath(type)
      console.log(`当前算法参数文件: ${currentFilePath}`)

      // 根据不同算法设置新参数
      let newParams: Record<string, number | string> = {}

      switch (algorithm) {
        case 'KnowledgeGraph': {
          // KnowledgeGraph参数: max_depth, sensitivity, tree_count

          // 按照max_depth, sensitivity, tree_count参数轮换
          if (currentParams.max_depth === 4 && currentParams.sensitivity === 0.8 && currentParams.tree_count === 100) {
            newParams = { max_depth: 6, sensitivity: 1.0, tree_count: 150 }
          } else if (
            currentParams.max_depth === 6 &&
            currentParams.sensitivity === 1.0 &&
            currentParams.tree_count === 150
          ) {
            newParams = { max_depth: 8, sensitivity: 1.2, tree_count: 200 }
          } else {
            newParams = { max_depth: 4, sensitivity: 0.8, tree_count: 100 }
          }
          break
        }

        case 'DQN': {
          // DQN参数: convergence_threshold, max_epochs

          // 轮换convergence_threshold
          if (currentParams.convergence_threshold === 0.001) {
            newParams = { convergence_threshold: 0.005, max_epochs: 1000 }
          } else {
            newParams = { convergence_threshold: 0.001, max_epochs: 1000 }
          }
          break
        }

        case 'MAPPO': {
          // MAPPO参数: convergence_threshold, max_epochs

          // 与DQN相同的逻辑轮换convergence_threshold
          if (currentParams.convergence_threshold === 0.001) {
            newParams = { convergence_threshold: 0.005, max_epochs: 1000 }
          } else {
            newParams = { convergence_threshold: 0.001, max_epochs: 1000 }
          }
          break
        }

        default: {
          // 其他算法使用默认参数调整逻辑
          if (type === AlgorithmType.TimeMixer || type === AlgorithmType.TimesNet) {
            // 对于模型1的时间序列算法，轮换传感器ID
            const sensorIds = ['RMS001', 'RMS002', 'RMS003']
            const currentIndex = sensorIds.indexOf(currentParams.model_id as string)
            const nextIndex = (currentIndex + 1) % sensorIds.length
            newParams = {
              ...currentParams,
              model_id: sensorIds[nextIndex],
              task_name: 'short_term_forecast',
            }
          } else if (type === AlgorithmType.xgboost || type === AlgorithmType.lightGBM) {
            // 调整学习率和最大深度
            if (type === AlgorithmType.xgboost) {
              if (currentParams.max_depth === 6) {
                newParams = { learning_rate: 0.1, max_depth: 8 }
              } else {
                newParams = { learning_rate: 0.1, max_depth: 6 }
              }
            } else {
              // lightGBM
              if (currentParams.max_depth === 4) {
                newParams = { learning_rate: 0.1, max_depth: 6 }
              } else {
                newParams = { learning_rate: 0.1, max_depth: 4 }
              }
            }
          } else if (type === AlgorithmType.TabNet) {
            // 轮换学习率和最大轮次
            if (currentParams.learning_rate === 0.01) {
              newParams = { learning_rate: 0.02, max_epochs: 50 }
            } else {
              newParams = { learning_rate: 0.01, max_epochs: 100 }
            }
          } else if (type === AlgorithmType.IQL || type === AlgorithmType.MADDPG) {
            // 调整收敛阈值
            if (currentParams.convergence_threshold === 0.001) {
              newParams = { convergence_threshold: 0.005, max_epochs: 1000 }
            } else {
              newParams = { convergence_threshold: 0.001, max_epochs: 1000 }
            }
          }
          break
        }
      }

      // 应用新参数
      algorithmStore.updateAlgorithmParams(type, newParams)

      // 设置为当前选中的算法
      algorithmStore.setModuleSelectedAlgorithm(module, type)

      // 获取更新后的新文件路径
      const newFilePath = algorithmStore.getAlgorithmFilePath(type)
      console.log(`更新后的算法参数文件: ${newFilePath}`)

      // 构建响应消息
      const oldParamsString = Object.entries(currentParams)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')

      const newParamsString = Object.entries(newParams)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')

      return `## 算法参数已更新

**${algorithm}** 算法参数已成功更新。

### 更新详情
- **算法**: ${algorithm}
- **模块**: ${module}
- **原参数**: \`${oldParamsString}\`
- **新参数**: \`${newParamsString}\`
- **对应文件**: ${newFilePath.split('/').pop()}
- **时间**: ${new Date().toLocaleString()}

> 算法参数已更新，关联的数据视图将在下一次刷新时应用新参数。`
    } catch (error) {
      console.error(`修改算法参数出错:`, error)
      return `## 算法参数更新失败

尝试更新 **${algorithm}** 算法参数时发生错误。

### 错误详情
- **算法**: ${algorithm}
- **错误**: ${error}
- **时间**: ${new Date().toLocaleString()}

> 请稍后再试，或联系系统管理员。`
    }
  } else {
    return `## 未知算法

**${algorithm}** 不是系统中已知的算法。

### 状态信息
- **请求算法**: ${algorithm}
- **可用算法**: TimeMixer, TimesNet, KnowledgeGraph, xgboost, lightGBM, TabNet, IQL, DQN, MADDPG, MAPPO
- **时间**: ${new Date().toLocaleString()}

> 请检查算法名称是否正确，并重新尝试。`
  }
}

const renameConversationWithoutPrompt = async (conversationId: number, title: string) => {
  try {
    const updatedConversation = await ConversationAPI.renameConversation(conversationId, title)

    // 更新本地状态
    const conversation = conversations.value.find((c) => c.id === conversationId)
    if (conversation) {
      conversation.title = updatedConversation.title
      conversation.updatedAt = updatedConversation.updatedAt
    }

    console.log('自动更新对话标题成功:', title)
  } catch (error) {
    console.error('自动更新对话标题失败:', error)
  }
}

// 发送消息处理函数
const sendMessage = async () => {
  const content = inputText.value.trim()
  if (!content || isLoading.value) return

  // 如果currentConversationId为null，说明需要创建新对话
  if (currentConversationId.value === null) {
    const newId = await createNewChat()
    if (!newId) {
      console.error('无法创建新对话')
      return
    }

    // 新对话创建后，不需要展示"准备就绪"页面，将立即添加新消息
  }

  // 添加用户消息
  const userMessageRequest: CreateMessageRequest = {
    role: 'user',
    content,
    model: selectedModel.value,
  }

  // 立即添加到UI
  const tempUserMessage: Message = {
    id: -1, // 临时ID
    conversation_id: currentConversationId.value as number,
    role: 'user',
    content,
    timestamp: new Date().toISOString(),
    model: selectedModel.value,
  }

  messages.value.push(tempUserMessage)

  try {
    // 保存用户消息到服务器
    const savedUserMessage = await ConversationAPI.createMessage(
      currentConversationId.value as number,
      userMessageRequest,
    )

    // 更新临时消息的ID
    const userMessageIndex = messages.value.findIndex((m) => m.content === content && m.role === 'user' && m.id === -1)
    if (userMessageIndex !== -1) {
      messages.value[userMessageIndex] = {
        ...messages.value[userMessageIndex],
        id: savedUserMessage.id,
        timestamp: savedUserMessage.timestamp,
      }
    }
  } catch (error) {
    console.error('保存用户消息失败:', error)
    // 继续执行，即使保存失败
  }

  // 清空输入框
  clearInput()

  // 聚焦输入框
  if (textareaRef.value) {
    textareaRef.value.focus()
  }

  isLoading.value = true

  // 添加思考中的助手消息
  const thinkingMessageIndex = messages.value.length
  const assistantTempMessage: Message = {
    id: -2, // 临时ID给思考中的消息
    conversation_id: currentConversationId.value as number,
    role: 'assistant',
    content: '',
    isThinking: true,
    thinking: `正在使用${getModelLabel(selectedModel.value)}模型思考中...`,
    isThinkingExpanded: true, // 思考过程中默认展开
    timestamp: new Date().toISOString(),
    model: selectedModel.value,
  }

  messages.value.push(assistantTempMessage)

  try {
    // 调用API获取响应
    const { response, thinking } = await AIInterfaceAPI.queryLLM(selectedModel.value, content)

    // 更新对话标题（新对话）（截取部分前缀）
    if (currentConversation.value && currentConversation.value.title === '新对话') {
      const newTitle = content.length > 20 ? content.substring(0, 20) + '...' : content
      await renameConversationWithoutPrompt(currentConversationId.value as number, newTitle)
    }

    // 更新思考过程
    messages.value[thinkingMessageIndex].thinking = thinking || '已完成思考'
    messages.value[thinkingMessageIndex].isThinkingExpanded = false

    // 检查是否为特殊算法关键词
    const specialAlgorithms = ['TimeMixer', 'KonwledgeGraph', 'DQN', 'MAPPO']

    let contentToDisplay = ''

    if (specialAlgorithms.includes(response.trim())) {
      //! 如果是特殊算法关键词，使用特殊处理函数生成响应
      const algorithm = response.trim()
      contentToDisplay = await handleSpecialAlgorithm(algorithm)
    } else {
      // 正常响应
      contentToDisplay = response
    }

    // 使用流式输出
    let displayedContent = ''
    for (const char of contentToDisplay) {
      displayedContent += char
      messages.value[thinkingMessageIndex].content = displayedContent
      await new Promise((resolve) => setTimeout(resolve, 10))
    }

    // 完成后保留思考内容，但保持收起状态
    messages.value[thinkingMessageIndex].isThinking = false

    // 保存助手消息到服务器
    const assistantMessageRequest: CreateMessageRequest = {
      role: 'assistant',
      content: contentToDisplay,
      thinking: thinking || undefined,
      model: selectedModel.value,
    }

    try {
      const savedAssistantMessage = await ConversationAPI.createMessage(
        currentConversationId.value as number,
        assistantMessageRequest,
      )

      // 更新临时消息的ID
      messages.value[thinkingMessageIndex].id = savedAssistantMessage.id
      messages.value[thinkingMessageIndex].timestamp = savedAssistantMessage.timestamp
    } catch (error) {
      console.error('保存助手消息失败:', error)
    }
  } catch (error) {
    console.error(`从${selectedModel.value}获取回复失败:`, error)
    messages.value[thinkingMessageIndex].content = '抱歉，发生了错误，请稍后再试。'
    messages.value[thinkingMessageIndex].isThinking = false
    messages.value[thinkingMessageIndex].isThinkingExpanded = false

    // 即使失败也保存错误消息
    try {
      const errorMessage: CreateMessageRequest = {
        role: 'assistant',
        content: '抱歉，发生了错误，请稍后再试。',
        thinking: `发生错误: ${error}`,
        model: selectedModel.value,
      }

      const savedErrorMessage = await ConversationAPI.createMessage(currentConversationId.value as number, errorMessage)

      messages.value[thinkingMessageIndex].id = savedErrorMessage.id
    } catch (saveError) {
      console.error('保存错误消息失败:', saveError)
    }
  } finally {
    isLoading.value = false
  }
}

// 根据模型类型获取对应的图标组件
const getModelIcon = (modelType: string | undefined) => {
  if (!modelType) return GlobalOutlined

  switch (modelType) {
    case 'top-llm':
      return GlobalOutlined
    case 'sub-llm1':
      return InboxOutlined
    case 'sub-llm2':
      return BoxPlotOutlined
    case 'sub-llm3':
      return ExperimentOutlined
    case 'sub-llm4':
      return FilterOutlined
    case 'sub-llm5':
      return SettingOutlined
    default:
      return GlobalOutlined
  }
}

// 获取模型对应的主色调
const getModelColor = (modelType: string | undefined) => {
  if (!modelType) return '#1890ff'

  switch (modelType) {
    case 'top-llm':
      return '#1890ff'
    case 'sub-llm1':
      return '#52c41a'
    case 'sub-llm2':
      return '#faad14'
    case 'sub-llm3':
      return '#f5222d'
    case 'sub-llm4':
      return '#722ed1'
    case 'sub-llm5':
      return '#13c2c2'
    default:
      return '#1890ff'
  }
}

onBeforeUnmount(() => {
  AIInterfaceAPI.cancelAllQueries()
  ConversationAPI.cancelAllRequests()
})

onMounted(async () => {
  // 加载对话列表
  await loadConversations()

  // 初始化激活状态，但不自动选择第一个对话
  conversations.value.forEach((conversation) => {
    conversation.active = false
  })

  // 清空消息列表，确保显示"准备就绪"页面
  messages.value = []

  // 设置当前对话ID为null，表示没有选择任何对话
  currentConversationId.value = null

  // 保留滚动到底部
  scrollToBottom()
})
// 修改结束
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
                <div class="history-item-icon" :style="{ color: getModelColor(chat.model) }">
                  <component :is="getModelIcon(chat.model)" />
                </div>
                <div class="history-item-content">
                  <div class="history-item-title">{{ chat.title }}</div>
                  <div class="history-item-date">{{ new Date(chat.updatedAt).toLocaleString() }}</div>
                </div>
                <div class="delete-icon" @click.stop="deleteChat(chat.id)">
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
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div class="history-footer">
              <!-- 模型选择器 -->
              <div class="model-selector">
                <div class="select-wrapper">
                  <select v-model="selectedModel" class="model-select">
                    <option v-for="option in modelOptions" :key="option.value" :value="option.value">
                      {{ option.label + '模型' }}
                    </option>
                  </select>
                  <!-- 添加选中模型的图标 -->
                  <div class="select-icon" :style="{ color: getModelColor(selectedModel) }">
                    <component :is="getModelIcon(selectedModel)" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="ai-content">
            <!-- 当前对话标题 -->
            <div class="chat-title">
              <div v-if="isEditingTitle" class="title-editing-container" @click.stop>
                <input
                  id="title-input"
                  v-model="editingTitle"
                  @keydown.stop="handleTitleKeydown"
                  @blur.stop="onTitleInputBlur"
                  class="title-input"
                  type="text"
                  maxlength="50"
                />
              </div>
              <h3 v-else>{{ currentChatTitle }}</h3>
              <div class="title-actions">
                <button class="title-action-button" @click.stop="renameCurrentChat">
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
                  您的化工AI助手可以回答<span
                    class="model-name-highlight"
                    :style="{ color: getModelColor(selectedModel) }"
                  >
                    {{ getModelLabel(selectedModel) }} </span
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
                    <li @click="fillQuestion('对厂区资源重新进行调度')">
                      <span class="suggestion-tag">操作</span> 对厂区资源重新进行调度
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

<style lang="scss">
// 颜色变量
$ai-accent: #61dafb;
$ai-accent-hover: #4bc0e3;
$ai-bg-dark: #121826;
$ai-bg-medium: #1a2234;
$ai-bg-light: #232b3c;
$ai-text-primary: #ffffff;

// 颜色函数
@function ai-accent-alpha($alpha) {
  @return rgba($ai-accent, $alpha);
}

@function ai-text-alpha($alpha) {
  @return rgba($ai-text-primary, $alpha);
}

/* 确保重置样式应用到所有相关元素 */
.ai-window * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* 全局覆盖Ant Design样式 */
.ai-window .ant-btn-primary {
  background-color: $ai-accent !important;
  border-color: $ai-accent !important;
  color: $ai-bg-dark !important;
}

.ai-window .ant-btn-primary:hover {
  background-color: $ai-accent-hover !important;
  border-color: $ai-accent-hover !important;
}

.ai-window .ant-btn-primary:disabled,
.ai-window .ant-btn-primary[disabled] {
  background-color: $ai-bg-light !important;
  border-color: ai-text-alpha(0.1) !important;
  color: ai-text-alpha(0.4) !important;
}

.ai-window .ant-btn-text {
  background: ai-text-alpha(0.1) !important;
  color: $ai-text-primary !important;
}

.ai-window .ant-btn-text:hover {
  background: ai-text-alpha(0.2) !important;
}

/* 强制应用于markdown元素的全局样式 */
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

/* 代码块的样式 */
.ai-window .message-text pre {
  background-color: rgba(0, 0, 0, 0.3) !important;
  border-radius: 8px !important;
  border: 1px solid ai-accent-alpha(0.15) !important;
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
  background-color: ai-accent-alpha(0.1) !important;
  color: $ai-accent !important;
  padding: 0.2em 0.4em !important;
  border-radius: 3px !important;
  font-size: 0.85em !important;
  border: 1px solid ai-accent-alpha(0.2) !important;
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

/* 标题样式 */
.ai-window .message-text h1,
.ai-window .message-text h2,
.ai-window .message-text h3 {
  color: $ai-accent !important;
  margin-top: 20px !important;
  margin-bottom: 12px !important;
  font-weight: 500 !important;
  letter-spacing: 0.5px !important;
}

.ai-window .message-text h1 {
  font-size: 1.8em !important;
  border-bottom: 1px solid ai-accent-alpha(0.2) !important;
  padding-bottom: 8px !important;
}

.ai-window .message-text h2 {
  font-size: 1.4em !important;
  border-bottom: 1px solid ai-accent-alpha(0.1) !important;
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
  background-color: rgba($ai-bg-medium, 0.5) !important;
  border-radius: 6px !important;
  overflow: hidden !important;
}

.ai-window .message-text th,
.ai-window .message-text td {
  border: 1px solid ai-accent-alpha(0.15) !important;
  padding: 8px 12px !important;
  text-align: left !important;
}

.ai-window .message-text th {
  background-color: ai-accent-alpha(0.08) !important;
  color: $ai-accent !important;
  font-weight: 500 !important;
}

.ai-window .message-text tr:nth-child(even) {
  background-color: ai-accent-alpha(0.02) !important;
}

/* 块引用样式 */
.ai-window .message-text blockquote {
  border-left: 3px solid ai-accent-alpha(0.4) !important;
  padding: 0.5em 1em !important;
  margin: 1em 0 !important;
  background-color: ai-accent-alpha(0.05) !important;
  border-radius: 0 4px 4px 0 !important;
  color: ai-text-alpha(0.8) !important;
}

.ai-window .message-text blockquote p:last-child {
  margin-bottom: 0 !important;
}
</style>
<style lang="scss" scoped>
@use '@/assets/styles/AIInterface.scss';
</style>
