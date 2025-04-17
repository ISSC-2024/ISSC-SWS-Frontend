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
        v-for="log in visibleLogs"
        :key="log.timestamp + log.region"
        class="log-row"
        :class="{
          'log-info': log.risk_level === 'safe',
          'log-warning': log.risk_level === 'warning',
          'log-danger': log.risk_level === 'danger',
          'log-selected': isLogSelected(log),
        }"
        @click="handleLogClick(log)"
        @mouseenter="handleLogHover(log)"
        @mouseleave="handleLogLeave(log)"
      >
        <div class="log-time">{{ formatTime(log.timestamp) }}</div>
        <div class="log-type">{{ log.region }}</div>
        <div class="log-message">{{ log.message }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, inject, onUnmounted, type InjectionKey, type Ref } from 'vue'
import newPlantLogData from '../../mock/riskRegionSummary.json'
import unityService from '../../services/UnityService'
import { message } from 'ant-design-vue'

// 定义新的日志数据结构接口
interface LogEntry {
  timestamp: string
  region: string
  risk_level: 'safe' | 'warning' | 'danger'
  message: string
}

// 定义有效区域常量
const VALID_REGIONS = ['RMS', 'REA', 'SEP', 'PRO', 'UTL']
const VALID_RISK_LEVELS = ['safe', 'warning', 'danger']

// 从ChartContainer注入的扩展状态
const isChartExpandedKey = Symbol() as InjectionKey<Ref<boolean>>
const isExpanded = inject(isChartExpandedKey, ref(false))

const logs = ref<LogEntry[]>([])
const startIndex = ref(0)
const visibleCount = 100 // 一次显示的行数
let scrollTimer: ReturnType<typeof setInterval> | null = null

// 跟踪当前选中的日志项
const selectedLog = ref<LogEntry | null>(null)

// 性能优化参数
const CHUNK_SIZE = 500 // 每次处理500条
const MAX_LOG_ITEMS = 1000 // 内存最大保留1k条
let processingIndex = 0

// 计算当前可见的日志数据
const visibleLogs = computed(() => {
  if (logs.value.length === 0) return []

  if (isExpanded.value) {
    // 展开状态下，显示部分数据，以滚动更新
    const total = logs.value.length
    const start = startIndex.value % total
    const end = Math.min(start + visibleCount, total)

    // 双段拼接保证视觉连续性
    return [...logs.value.slice(start, end), ...logs.value.slice(0, Math.max(0, visibleCount - (total - start)))]
  } else {
    // 非展开状态下，显示部分数据并滚动
    const total = logs.value.length
    const start = startIndex.value % total

    // 双段拼接保证视觉连续性
    return [...logs.value.slice(start), ...logs.value.slice(0, start)].slice(0, visibleCount)
  }
})

// 判断日志是否被选中
const isLogSelected = (log: LogEntry): boolean => {
  if (!selectedLog.value) return false
  return (
    log.region === selectedLog.value.region &&
    log.message === selectedLog.value.message &&
    log.risk_level === selectedLog.value.risk_level
  )
}

// 验证并确保日志数据有效性
const validateLog = (log: LogEntry): { isValid: boolean; log: LogEntry } => {
  // 创建副本防止修改原始数据
  const validatedLog = { ...log }

  // 验证区域
  if (!VALID_REGIONS.includes(validatedLog.region)) {
    console.warn(`非法区域值: ${validatedLog.region}，将使用默认值 RMS`)
    validatedLog.region = 'RMS'
  }

  // 验证风险等级
  if (!VALID_RISK_LEVELS.includes(validatedLog.risk_level)) {
    console.warn(`非法风险等级: ${validatedLog.risk_level}，将使用默认值 safe`)
    validatedLog.risk_level = 'safe'
  }

  return {
    isValid: true,
    log: validatedLog,
  }
}

// 准备发送给Unity的数据
const prepareUnityData = (log: LogEntry) => {
  const { isValid, log: validatedLog } = validateLog(log)

  if (!isValid) return null

  return {
    region: validatedLog.region,
    risk_level: validatedLog.risk_level,
    message: validatedLog.message,
  }
}

// 鼠标悬停在日志行时触发高亮
const handleLogHover = (log: LogEntry) => {
  if (!unityService.isUnityLoaded()) return

  const unityData = prepareUnityData(log)
  if (unityData) {
    unityService.sendMessageToUnity('Sensor', 'RegionHighlightOn', JSON.stringify(unityData))
  }
}

// 鼠标离开日志行时取消高亮
const handleLogLeave = (log: LogEntry) => {
  if (!unityService.isUnityLoaded()) return

  const unityData = prepareUnityData(log)
  if (unityData) {
    unityService.sendMessageToUnity('Sensor', 'RegionHighlightOff', JSON.stringify(unityData))
  }
}

// 点击日志行时的处理函数 - 持续高亮/取消高亮
const handleLogClick = (log: LogEntry) => {
  // 检查Unity是否已加载
  if (!unityService.isUnityLoaded()) {
    message.warning('Unity尚未加载完成，无法发送日志')
    return
  }

  const unityData = prepareUnityData(log)
  if (!unityData) return

  // 如果点击的是已选中的日志，则取消选中状态
  if (isLogSelected(log)) {
    selectedLog.value = null
  } else {
    // 否则设置为选中状态
    selectedLog.value = log
  }

  // 无论是选中还是取消选中，都发送同一个消息
  unityService.sendMessageToUnity('Sensor', 'RegionContinuousHighlight', JSON.stringify(unityData))
}

// 格式化时间戳
const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
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

// 滚动列表的函数 - 简化为与ScrollingRegionList一致
const scrollList = () => {
  if (logs.value.length > 0) {
    startIndex.value = (startIndex.value + 1) % logs.value.length
  }
}

onMounted(() => {
  // 加载模拟数据
  loadDataInChunks()

  // 设置定时器，每2秒滚动一次（与ScrollingRegionList保持一致）
  scrollTimer = setInterval(scrollList, 2000)
})

onUnmounted(() => {
  // 清除定时器
  if (scrollTimer) {
    clearInterval(scrollTimer)
    scrollTimer = null
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
  cursor: pointer;
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

.log-selected {
  background-color: #e6f7ff;
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
