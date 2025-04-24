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
    <!-- 添加标题栏 -->
    <div class="graph-header">
      <div class="graph-title">
        <div class="title-icon">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="currentColor"
              d="M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M12,3A1,1 0 0,1 13,4A1,1 0 0,1 12,5A1,1 0 0,1 11,4A1,1 0 0,1 12,3M7,7H17V5H19V19H5V5H7V7M17,11H7V9H17V11M15,15H7V13H15V15Z"
            />
          </svg>
        </div>
        <span>系统运行日志</span>
      </div>
    </div>

    <!-- 添加表头 -->
    <div class="log-header">
      <div class="header-time">
        <clock-circle-outlined />
        <span>时间戳</span>
      </div>
      <div class="header-type">
        <environment-outlined />
        <span>区域</span>
      </div>
      <div class="header-message">
        <message-outlined />
        <span>消息内容</span>
      </div>
    </div>

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
        <!-- 添加图标到时间戳 -->
        <div class="log-time">
          <clock-circle-outlined />
          <span>{{ formatTime(log.timestamp) }}</span>
        </div>
        <!-- 添加图标到区域 -->
        <div class="log-type">
          <environment-outlined />
          <span>{{ log.region }}</span>
        </div>
        <!-- 添加图标到消息，替换原来的 > 符号 -->
        <div class="log-message" :class="{ expanded: isExpanded }" :title="log.message">
          <message-outlined />
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
import { ClockCircleOutlined, EnvironmentOutlined, MessageOutlined } from '@ant-design/icons-vue'

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
const visibleCount = 100 // 一次显示的行数（非展开状态）
let scrollTimer: ReturnType<typeof setInterval> | null = null

// 跟踪当前选中的日志项
const selectedLog = ref<LogEntry | null>(null)

// 计算当前可见的日志数据
const visibleLogs = computed(() => {
  if (logs.value.length === 0) return []

  if (isExpanded.value) {
    // 展开状态下，显示所有数据，不滚动
    return logs.value
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
  return log.region === selectedLog.value.region
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

// 滚动列表的函数
const scrollList = () => {
  if (logs.value.length > 0) {
    startIndex.value = (startIndex.value + 1) % logs.value.length
  }
}

onMounted(() => {
  // 直接一次性加载所有数据
  logs.value = newPlantLogData as unknown as LogEntry[]

  // 非展开状态下设置滚动定时器
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

/* 标题栏样式 */
.graph-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(20, 35, 65, 0.85);
  border-bottom: 1px solid rgba(74, 144, 226, 0.2);
  position: relative;
  z-index: 5;
}

.graph-title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(220, 230, 240, 0.9);
  font-weight: 600;
  font-size: 16px;
}

.title-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #20a0ff;
}

/* 表头样式 */
.log-header {
  display: flex;
  background: linear-gradient(90deg, rgba(12, 24, 48, 0.9) 0%, rgba(20, 40, 80, 0.9) 50%, rgba(12, 24, 48, 0.9) 100%);
  font-weight: 600;
  padding: 10px;
  border-bottom: 1px solid rgba(32, 160, 255, 0.15);
  font-size: 14px;
  color: rgba(120, 180, 255, 0.95);
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 0 0 8px rgba(32, 160, 255, 0.4);
}

.header-time {
  flex: 0 0 70px;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: 7px;
}

.header-type {
  flex: 0 0 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin-left: 4.5px;
}

.log-time {
  flex: 0 0 70px;
  color: rgba(130, 180, 230, 0.8);
  font-family: 'Consolas', monospace;
  text-shadow: 0 0 5px rgba(32, 160, 255, 0.3);
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 5px;
}

.log-type {
  flex: 0 0 70px;
  font-weight: bold;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.log-message {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  padding-left: 10px;
  position: relative;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.header-message {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.scrolling-log-body {
  height: calc(100% - 86px);
}

.log-row {
  display: flex;
  padding: 10px;
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
  width: 4px;
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
  box-shadow: 0 0 10px rgba(82, 196, 26, 0.8); /* 增强阴影效果 */
}

.log-warning::before {
  background: linear-gradient(to bottom, #faad14, #faad1480);
  box-shadow: 0 0 10px rgba(250, 173, 20, 0.8); /* 增强阴影效果 */
}

.log-danger::before {
  background: linear-gradient(to bottom, #f5222d, #f5222d80);
  box-shadow: 0 0 10px rgba(245, 34, 45, 0.8); /* 增强阴影效果 */
}

.log-selected {
  background-color: rgba(32, 87, 160, 0.4) !important;
  border-right: 1px solid rgba(32, 160, 255, 0.3);
}

.expanded .scrolling-log-body,
.expanded .log-time,
.expanded .log-type,
.expanded .log-message {
  font-size: 16px;
}

.log-message.expanded {
  white-space: normal;
  word-wrap: break-word;
  overflow: visible;
  text-overflow: clip;
  height: auto;
  line-height: 1.5;
  font-size: 16px;
}

.expanded-chart .log-type {
  flex: 0 0 100px;
}

.log-info .anticon {
  color: rgba(82, 196, 26, 0.9);
}

.log-warning .anticon {
  color: rgba(250, 173, 20, 0.9);
}

.log-danger .anticon {
  color: rgba(245, 34, 45, 0.9);
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
