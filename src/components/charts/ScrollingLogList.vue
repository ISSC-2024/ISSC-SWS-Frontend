<template>
  <!-- 
   * @description 化工厂日志滚动列表组件
   * 
   * 该组件显示化工厂的实时日志列表，包括区域、时间戳、消息内容和风险等级。
   * 包含以下功能：
   * 1. 非展开状态下自动滚动显示日志数据
   * 2. 展开状态下显示全部日志数据，可滚动查看
   * 3. 根据风险等级自动显示不同颜色的状态指示器（信息/警告/危险）
   * 4. 响应式布局设计，适应不同显示状态
   * 5. 点击日志行可以将信息发送至Unity进行区域高亮
   * 
   -->
  <div class="scrolling-log-container">
    <div class="scrolling-log-body" ref="logBody">
      <div
        v-for="log in isExpanded ? allLogs : visibleLogs"
        :key="log.timestamp + log.region"
        class="log-row"
        :class="{
          'log-info': log.risk_level === 'safe',
          'log-warning': log.risk_level === 'warning',
          'log-danger': log.risk_level === 'danger',
        }"
        @click="handleLogClick(log)"
      >
        <div class="log-time">{{ formatTime(log.timestamp) }}</div>
        <div class="log-type">{{ log.region }}</div>
        <div class="log-message">{{ log.message }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, inject, watch, onUnmounted, type InjectionKey, type Ref } from 'vue'
import newPlantLogData from '../../mock/regionRiskSummary.json'
import unityService from '../../services/UnityService'
import { message } from 'ant-design-vue'

// 定义新的日志数据结构接口
interface LogEntry {
  timestamp: string
  region: string
  risk_level: 'safe' | 'warning' | 'danger'
  message: string
}

// 从ChartContainer注入的扩展状态
const isChartExpandedKey = Symbol() as InjectionKey<Ref<boolean>>
const isExpanded = inject(isChartExpandedKey, ref(false))

const logs = ref<LogEntry[]>([])
const startIndex = ref(0)
const visibleCount = 100 // 一次显示的行数
let scrollTimer: ReturnType<typeof setInterval> | null = null

// 性能优化参数
const CHUNK_SIZE = 500 // 每次处理2000条
const MAX_LOG_ITEMS = 1000 // 内存最大保留1k条
let processingIndex = 0

// 所有日志数据
const allLogs = computed(() => logs.value)

// 计算当前可见的日志数据（用于非扩展状态）
const visibleLogs = computed(() => {
  const total = logs.value.length
  if (total === 0) return []

  const start = startIndex.value % total
  const end = Math.min(start + visibleCount, total)

  // 双段拼接保证视觉连续性
  return [...logs.value.slice(start, end), ...logs.value.slice(0, Math.max(0, visibleCount - (total - start)))]
})

// 点击日志行时的处理函数
const handleLogClick = (log: LogEntry) => {
  // 检查Unity是否已加载
  if (unityService.isUnityLoaded()) {
    const logDataString = JSON.stringify(log)

    // 调用Unity的方法传递数据
    unityService.sendMessageToUnity('Sensor', 'HighlightRegion', logDataString)
  } else {
    // 如果Unity未加载，发出提示
    message.warning('Unity尚未加载完成，无法发送日志')
  }
}

// 批量加载数据，优化性能
const loadDataInChunks = () => {
  requestIdleCallback(
    () => {
      const rawData = newPlantLogData as unknown as LogEntry[]
      const chunk = rawData.slice(processingIndex, processingIndex + CHUNK_SIZE)

      // 内存清理策略（保留最新数据）
      if (logs.value.length + chunk.length > MAX_LOG_ITEMS) {
        logs.value.splice(0, chunk.length)
      }
      logs.value.push(...chunk)

      processingIndex += CHUNK_SIZE
      if (processingIndex < rawData.length) {
        loadDataInChunks()
      }
    },
    // 超时保障
    { timeout: 1000 },
  )
}

// 格式化时间戳
const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

// 滚动列表的函数
const scrollList = () => {
  if (!isExpanded.value && logs.value.length > 0) {
    requestAnimationFrame(() => {
      startIndex.value = (startIndex.value + 1) % logs.value.length
    })
  }
}

// 启动或停止滚动
const toggleScrolling = (expanded: boolean) => {
  if (expanded) {
    // 扩展模式下停止滚动
    if (scrollTimer) {
      clearInterval(scrollTimer)
      scrollTimer = null
    }
  } else {
    // 非扩展模式下启动滚动
    if (!scrollTimer) {
      scrollTimer = setInterval(scrollList, 2000)
    }
  }
}

// 监听扩展状态变化
watch(isExpanded, (newValue) => {
  toggleScrolling(newValue)
})

onMounted(() => {
  // 加载模拟数据
  loadDataInChunks()

  // 设置定时器，每2秒滚动一次（仅在非扩展模式下）
  if (!isExpanded.value) {
    scrollTimer = setInterval(scrollList, 2000)
  }
})

onUnmounted(() => {
  // 清除定时器
  if (scrollTimer) {
    clearInterval(scrollTimer)
  }
})
</script>

<style scoped>
.scrolling-log-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
  padding-top: 0;
  position: relative;
  z-index: 0;
  background-color: #f9f9f9;
  color: #333;
}

.scrolling-log-body {
  flex: 1;
  overflow-y: auto;
  font-size: 12px;
  font-family: 'Consolas', 'Monaco', monospace;
}

.log-row {
  display: flex;
  padding: 6px 8px;
  border-bottom: 1px solid #e8e8e8;
  transition: background-color 0.3s;
  align-items: center;
  cursor: pointer; /* 添加鼠标指针样式，表明可点击 */
}

.log-row:hover {
  background-color: #f0f0f0;
}

.log-info {
  border-left: 3px solid #52c41a;
}

.log-warning {
  border-left: 3px solid #faad14;
}

.log-danger {
  border-left: 3px solid #f5222d;
}

.log-time {
  flex: 0 0 80px;
  color: #888;
}

.log-type {
  flex: 0 0 100px;
  font-weight: bold;
}

.log-message {
  flex: 1;
}

.log-info .log-type {
  color: #52c41a;
}

.log-warning .log-type {
  color: #faad14;
}

.log-danger .log-type {
  color: #f5222d;
}
</style>
