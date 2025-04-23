<template>
  <div class="chat-container">
    <!-- 消息列表 -->
    <div class="chat-messages" ref="messagesContainer">
      <div
        v-for="(message, index) in messages"
        :key="index"
        class="message"
        :class="{ 'user-message': message.role === 'user', 'assistant-message': message.role === 'assistant' }"
      >
        <div class="message-avatar">
          {{ message.role === 'user' ? '👤' : '🤖' }}
        </div>
        <div class="message-content">
          <!-- 思考内容 -->
          <div v-if="message.role === 'assistant' && message.thinking" class="thinking-container">
            <div class="thinking-header" @click="toggleThinking(index)">
              <div class="thinking-indicator">AI 的思考过程:</div>
              <div class="thinking-toggle">{{ message.isThinkingExpanded ? '收起 ▲' : '展开 ▼' }}</div>
            </div>
            <div class="thinking-content" v-show="message.isThinkingExpanded">
              {{ message.thinking }}
            </div>
          </div>
          <!-- 使用v-html渲染markdown内容 -->
          <div v-html="renderMarkdown(message.content)"></div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-container">
      <textarea
        ref="textareaRef"
        v-model="inputText"
        placeholder="输入你的问题..."
        @keydown.enter.prevent="handleEnter"
        :disabled="isLoading"
        rows="3"
      ></textarea>
      <button @click="sendMessage" :disabled="isLoading || !inputText.trim()">
        {{ isLoading ? '发送中...' : '发送' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-light.css' // 使用更清晰的主题

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

// 消息类型定义
interface Message {
  role: 'user' | 'assistant'
  content: string
  isThinking?: boolean
  thinking?: string
  isThinkingExpanded?: boolean // 新增属性：控制思考内容的展开/收起状态
}

// 预设的响应映射
const presetResponses: Record<string, { thinking: string; response: string }> = {
  '# 今天天气如何?': {
    thinking:
      '让我思考一下如何回答关于天气的问题。\n我应该提醒用户我无法获取实时天气数据，但可以提供一些关于天气描述的一般信息。\n我也可以建议用户查看天气预报应用或网站。',
    response:
      '我无法获取实时的天气数据，因为我没有连接到实时天气服务。\n\n建议您：\n- 查看本地天气应用或网站\n- 使用天气预报服务如天气通、Weather Channel等\n- 或者直接在搜索引擎中搜索"[您所在城市]天气"',
  },
  '如何学习编程?': {
    thinking:
      '这是一个关于学习编程的宽泛问题。\n我应该提供一个结构化的回答，包括：\n1. 选择编程语言\n2. 学习资源推荐\n3. 实践项目的重要性\n4. 持续学习的建议',
    response:
      '# 学习编程的路径\n\n## 第一步：选择一门语言\n- 初学者友好：Python, JavaScript\n- 移动开发：Swift (iOS), Kotlin (Android)\n- 网站开发：HTML/CSS/JavaScript\n- 游戏开发：C#, C++\n\n## 学习资源\n- 在线平台：Codecademy, freeCodeCamp, Coursera\n- 视频教程：B站, YouTube上的编程频道\n- 交互式学习：LeetCode, HackerRank\n\n## 实践项目\n建立个人项目是巩固知识的最佳方式！\n\n## 保持学习\n编程领域不断发展，持续学习至关重要。',
  },
  帮我解释React中的虚拟DOM: {
    thinking:
      '这个问题是关于React中虚拟DOM的概念。\n我需要解释:\n1. 什么是虚拟DOM\n2. 为什么React使用虚拟DOM\n3. 它如何工作\n4. 它的优势是什么\n5. 可能的缺点',
    response:
      '# React中的虚拟DOM\n\n## 什么是虚拟DOM？\n虚拟DOM(Virtual DOM)是React在内存中维护的UI表示，本质上是一个轻量级的JavaScript对象树，是实际DOM的副本。\n\n## 工作原理\n1. **初始渲染**：React创建整个虚拟DOM树\n2. **状态更新**：创建新的虚拟DOM树\n3. **对比(Diffing)**：比较新旧树差异\n4. **批量更新**：只将差异部分应用到实际DOM\n\n## 优势\n- **性能优化**：减少直接操作DOM\n- **跨平台能力**：抽象化DOM便于支持其他平台\n- **声明式编程**：让开发者专注于状态而非DOM操作\n\n```jsx\n// 使用React时我们只需声明UI状态\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  return <div>{count}</div>;\n}\n```',
  },
}

// 默认回复（当没有匹配到预设回复时）
const defaultResponse = {
  thinking: '我需要考虑如何回应这个问题。\n看起来这个问题不在我的预设回复中。\n我应该提供一个通用但有帮助的回答。',
  response:
    '感谢您的提问！这似乎是一个我没有预设回复的问题。在实际应用中，AI会根据您的问题生成相关回复。\n\n您可以尝试以下预设问题以查看完整效果：\n- "# 今天天气如何?"\n- "如何学习编程?"\n- "帮我解释React中的虚拟DOM"',
}

// 模拟 API 响应
const simulateResponse = async (message: string) => {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 800))

  // 查找预设回复或使用默认回复
  return presetResponses[message] || defaultResponse
}

// 状态
const messages = ref<Message[]>([])
const isLoading = ref(false)
const inputText = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// 切换思考内容的展开/收起状态
const toggleThinking = (index: number) => {
  if (messages.value[index]) {
    messages.value[index].isThinkingExpanded = !messages.value[index].isThinkingExpanded
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
    scrollToBottom()
  },
  { deep: true },
)

// 处理回车键
const handleEnter = (e: KeyboardEvent) => {
  if (e.shiftKey) return // Shift+Enter 允许换行
  sendMessage()
}

// 发送消息处理函数
const sendMessage = async () => {
  const content = inputText.value.trim()
  if (!content || isLoading.value) return

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content,
  })

  // 清空输入框
  inputText.value = ''

  // 聚焦输入框
  if (textareaRef.value) {
    textareaRef.value.focus()
  }

  isLoading.value = true

  // 添加思考中的助手消息
  const thinkingMessageIndex = messages.value.length
  messages.value.push({
    role: 'assistant',
    content: '',
    isThinking: true,
    thinking: '',
    isThinkingExpanded: true, // 思考过程中默认展开
  })

  try {
    // 模拟获取 AI 回复
    const { thinking, response } = await simulateResponse(content)

    // 模拟流式输出思考过程
    let displayedThinking = ''
    for (const char of thinking) {
      displayedThinking += char
      messages.value[thinkingMessageIndex].thinking = displayedThinking
      await new Promise((resolve) => setTimeout(resolve, 10))
    }

    // 思考过程展示完毕后，立即收起思考内容
    messages.value[thinkingMessageIndex].isThinkingExpanded = false

    // 展示回复内容
    let displayedContent = ''
    for (const char of response) {
      displayedContent += char
      messages.value[thinkingMessageIndex].content = displayedContent
      await new Promise((resolve) => setTimeout(resolve, 20))
    }

    // 完成后保留思考内容，但保持收起状态
    messages.value[thinkingMessageIndex].isThinking = false
  } catch (error) {
    console.error('Error getting AI response:', error)
    messages.value[thinkingMessageIndex].content = '抱歉，发生了错误，请稍后再试。'
    messages.value[thinkingMessageIndex].isThinking = false
    messages.value[thinkingMessageIndex].isThinkingExpanded = false
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  scrollToBottom()
})
</script>

<style>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 10px;
  margin-bottom: 20px;
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

.message-avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #e0e0e0;
  margin: 0 10px;
  font-size: 20px;
}

.message-content {
  max-width: 70%;
  padding: 15px;
  border-radius: 10px;
  background-color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.user-message .message-content {
  background-color: #dcf8c6;
}

.assistant-message .message-content {
  background-color: white;
}

.thinking-container {
  margin-bottom: 10px;
  background-color: #f0f0f0;
  border-radius: 8px;
  border-left: 3px solid #3498db;
  overflow: hidden;
}

.thinking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.thinking-header:hover {
  background-color: #e6e6e6;
}

.thinking-indicator {
  font-weight: bold;
  color: #3498db;
}

.thinking-toggle {
  font-size: 0.9em;
  color: #666;
}

.thinking-content {
  color: #666;
  font-style: italic;
  white-space: pre-wrap;
  padding: 0 10px 10px 10px;
  border-top: 1px solid #e0e0e0;
  animation: slideDown 0.3s ease;
}

/* Markdown 样式 */
.message-content h1,
.message-content h2,
.message-content h3,
.message-content h4,
.message-content h5,
.message-content h6 {
  margin-top: 1em;
  margin-bottom: 0.5em;
}

.message-content p {
  margin-bottom: 1em;
}

.message-content pre {
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
}

.message-content code {
  font-family: 'Courier New', Courier, monospace;
  background-color: #f6f8fa;
  padding: 0.2em 0.4em;
  border-radius: 3px;
}

.message-content pre code {
  background-color: transparent;
  padding: 0;
  white-space: pre;
}

.message-content blockquote {
  border-left: 4px solid #dfe2e5;
  padding-left: 1em;
  color: #6a737d;
  margin-left: 0;
}

.message-content ul,
.message-content ol {
  padding-left: 2em;
  margin-bottom: 1em;
}

.message-content table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 1em;
}

.message-content th,
.message-content td {
  border: 1px solid #dfe2e5;
  padding: 6px 13px;
}

.message-content th {
  background-color: #f6f8fa;
}

/* 输入区域样式 */
.input-container {
  display: flex;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

textarea {
  flex: 1;
  padding: 12px;
  border: none;
  outline: none;
  resize: none;
  font-family: inherit;
  font-size: 16px;
}

button {
  padding: 0 20px;
  background-color: #4a9df8;
  color: white;
  border: none;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}

button:hover:not(:disabled) {
  background-color: #3b7dcc;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

/* 高亮代码块样式 */
pre code.hljs {
  display: block;
  overflow-x: auto;
  padding: 1em;
}

code.hljs {
  padding: 3px 5px;
}

.hljs {
  background: #f3f3f3;
  color: #444;
}

.hljs-comment {
  color: #697070;
}

.hljs-tag,
.hljs-punctuation,
.hljs-tag .hljs-name,
.hljs-tag .hljs-attr {
  color: #444a;
}

.hljs-keyword,
.hljs-attribute,
.hljs-selector-tag,
.hljs-meta .hljs-keyword,
.hljs-doctag,
.hljs-name {
  font-weight: bold;
  color: #d73a49;
}

.hljs-string,
.hljs-meta,
.hljs-meta .hljs-string {
  color: #008000;
}

.hljs-function,
.hljs-number,
.hljs-literal,
.hljs-type,
.hljs-params {
  color: #0086b3;
}

.hljs-built_in,
.hljs-builtin-name {
  color: #0000ff;
}

.hljs-section,
.hljs-selector-id,
.hljs-title {
  color: #900;
  font-weight: bold;
}

.hljs-subst {
  font-weight: normal;
  color: #444;
}

@keyframes fadeIn {
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
    max-height: 1000px;
    opacity: 1;
  }
}
</style>
