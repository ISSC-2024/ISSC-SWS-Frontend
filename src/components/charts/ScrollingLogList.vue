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
   * 5. 点击日志行可以将信息发送至Unity进行区域高亮，并显示在文本框中
   * 6. 非展开状态下，消息内容过长会被截断并显示省略号
   *
   -->
  <div class="scrolling-log-container">
    <div class="scrolling-log-body" ref="logBody">
      <div
        v-for="(log, index) in visibleLogs"
        :key="log.timestamp + log.region"
        class="log-row"
        :class="{
          'log-info': log.risk_level === 'safe',
          'log-warning': log.risk_level === 'warning',
          'log-danger': log.risk_level === 'danger',
          'log-selected': isLogSelected(log),
          'log-row-alt': index % 2 === 1,
        }"
        @click="handleLogClick(log)"
        @mouseenter="handleLogHover(log)"
        @mouseleave="handleLogLeave(log)"
      >
        <div class="log-time">{{ formatTime(log.timestamp) }}</div>
        <div class="log-type">{{ log.region }}</div>
        <div class="log-message" :class="{ expanded: isExpanded }" :title="log.message">
          {{ log.message }}
        </div>
      </div>
    </div>
  </div>
  <TextMessageDisplayBox />
</template>

<script setup lang="ts">
import { ref, onMounted, computed, inject, onUnmounted } from 'vue'
import newPlantLogData from '../../mock/riskRegionSummary.json'
import unityService from '../../services/UnityService'
import { message } from 'ant-design-vue'
import TextMessageDisplayBox from '../controls/windows/TextMessageDisplayBox.vue'
import { useMessageStore } from '../../stores/message'

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
const isExpanded = inject('isChartExpanded', ref(false))

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
  // 鼠标悬停时停止滚动
  if (scrollTimer) {
    clearInterval(scrollTimer)
    scrollTimer = null
  }
  const unityData = prepareUnityData(log)
  if (unityData) {
    unityService.sendMessageToUnity('Sensor', 'RegionHighlightOn', JSON.stringify(unityData))
  }
}

// 鼠标离开日志行时取消高亮
const handleLogLeave = (log: LogEntry) => {
  if (!unityService.isUnityLoaded()) return
  // 如果不在展开状态，重新开始滚动
  if (!isExpanded.value && !scrollTimer) {
    scrollTimer = setInterval(scrollList, 2000) as unknown as number
  }
  const unityData = prepareUnityData(log)
  if (unityData) {
    unityService.sendMessageToUnity('Sensor', 'RegionHighlightOff', JSON.stringify(unityData))
  }
}

// 点击日志行时的处理函数 - 持续高亮/取消高亮
const messageStore = useMessageStore()
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

  // 将数据发送到文本框
  const textFieldConfig = {
    labelMap: {
      region: '区域',
      risk_level: '风险等级',
      message: '详细信息',
    },
    valueFormatters: {
      risk_level: (v: string) => {
        switch (v) {
          case 'safe':
            return '安全'
          case 'warning':
            return '警告'
          case 'danger':
            return '危险'
          default:
            return '未知'
        }
      },
    },
  }
  // 创建副本防止修改原始数据
  const validatedLog = { ...log }
  messageStore.showMessage(unityData, textFieldConfig, {
    source: 'region', // 可选的消息来源标识
    title: `日志-${validatedLog.region}`, // 设置特定标题
  })
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
  border: 1px solid rgba(32, 160, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  padding-top: 0;
  position: relative;
  z-index: 0;
  background-color: rgba(11, 19, 43, 0.95);
  color: rgba(220, 230, 240, 0.9);
  box-shadow: 0 0 15px rgba(0, 100, 255, 0.1);
}

.scrolling-log-body {
  flex: 1;
  overflow-y: auto;
  font-size: 12px;
  font-family: 'Consolas', 'Monaco', monospace;
  /* 添加自定义滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: rgba(32, 160, 255, 0.6) rgba(11, 19, 43, 0.3);
}

.scrolling-log-body::-webkit-scrollbar {
  width: 6px;
}

.scrolling-log-body::-webkit-scrollbar-track {
  background: rgba(11, 19, 43, 0.3);
}

.scrolling-log-body::-webkit-scrollbar-thumb {
  background-color: rgba(32, 160, 255, 0.6);
  border-radius: 3px;
}

.log-row {
  display: flex;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(32, 160, 255, 0.1);
  transition: all 0.25s ease;
  align-items: center;
  cursor: pointer;
  background-color: rgba(15, 25, 50, 0.7);
  position: relative;
}

.log-row::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 2px;
  background: transparent;
  transition: all 0.2s ease;
}

.log-row-alt {
  background-color: rgba(20, 35, 65, 0.7);
}

.log-row:hover {
  background-color: rgba(30, 50, 90, 0.8);
  transform: translateX(2px);
  box-shadow: -2px 0 8px rgba(32, 160, 255, 0.15);
}

.log-info::before {
  background: linear-gradient(to bottom, #52c41a, #52c41a80);
  box-shadow: 0 0 8px rgba(82, 196, 26, 0.6);
}

.log-warning::before {
  background: linear-gradient(to bottom, #faad14, #faad1480);
  box-shadow: 0 0 8px rgba(250, 173, 20, 0.6);
}

.log-danger::before {
  background: linear-gradient(to bottom, #f5222d, #f5222d80);
  box-shadow: 0 0 8px rgba(245, 34, 45, 0.6);
}

.log-selected {
  background-color: rgba(32, 87, 160, 0.4) !important;
  border-right: 1px solid rgba(32, 160, 255, 0.3);
}

.log-time {
  flex: 0 0 70px;
  color: rgba(130, 180, 230, 0.8);
  font-family: 'Consolas', monospace;
  text-shadow: 0 0 5px rgba(32, 160, 255, 0.3);
}

.log-type {
  flex: 0 0 70px;
  font-weight: bold;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log-message {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  padding-left: 10px;
  position: relative;
}

.log-message::before {
  content: '>';
  position: absolute;
  left: 0;
  color: rgba(32, 160, 255, 0.6);
}

.log-message.expanded {
  white-space: normal;
  word-wrap: break-word;
  overflow: visible;
  text-overflow: clip;
  height: auto;
  line-height: 1.4;
}

.expanded-chart .log-type {
  flex: 0 0 100px;
}

.log-info .log-type {
  color: rgba(82, 196, 26, 0.9);
  text-shadow: 0 0 5px rgba(82, 196, 26, 0.4);
}

.log-warning .log-type {
  color: rgba(250, 173, 20, 0.9);
  text-shadow: 0 0 5px rgba(250, 173, 20, 0.4);
}

.log-danger .log-type {
  color: rgba(245, 34, 45, 0.9);
  text-shadow: 0 0 5px rgba(245, 34, 45, 0.4);
}

/* 轻微扫描线效果 */
.scrolling-log-container::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  background: linear-gradient(to bottom, transparent 50%, rgba(32, 160, 255, 0.03) 50%);
  background-size: 100% 4px;
  z-index: 1;
}
</style>
