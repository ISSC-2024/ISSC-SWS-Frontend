<template>
  <!-- 
   * @description 区域风险滚动列表组件
   * 
   * 该组件显示区域的实时风险数据列表，包括时间戳、区域和安全状态。
   * 包含以下功能：
   * 1. 非展开状态下自动滚动显示区域数据
   * 2. 展开状态下显示全部区域数据，可滚动查看
   * 3. 根据风险级别自动显示不同颜色的状态指示器（安全/警告/危险）
   * 4. 响应式布局设计，适应不同显示状态
   * 5. 带有固定表头的数据列表
   * 6. 与Unity交互：鼠标悬停高亮区域，离开取消高亮，点击持续高亮/再次点击取消高亮
   * 
   -->
  <div class="scrolling-list-container">
    <div class="scrolling-list-header">
      <div class="header-item">时间戳</div>
      <div class="header-item">区域</div>
      <div class="header-item">安全预警</div>
    </div>
    <div class="scrolling-list-body" ref="listBody">
      <div
        v-for="(region, index) in visibleRegions"
        :key="index"
        class="list-row"
        :class="{ 'row-selected': isRegionSelected(region) }"
        @mouseenter="handleRegionHover(region)"
        @mouseleave="handleRegionLeave(region)"
        @click="handleRegionClick(region)"
      >
        <div class="list-item">{{ region.timestamp }}</div>
        <div class="list-item">{{ region.region }}</div>
        <div class="list-item">
          <div
            class="status-indicator"
            :class="{
              'status-safe': region.risk_level === 'safe',
              'status-warning': region.risk_level === 'warning',
              'status-danger': region.risk_level === 'danger',
            }"
          >
            {{ getRiskLevelText(region.risk_level) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, inject, onUnmounted, type InjectionKey, type Ref } from 'vue'
import sensorData from '../../mock/riskRegionSummary.json'
import unityService from '../../services/UnityService'
import { message } from 'ant-design-vue'

interface Region {
  timestamp: string
  region: string
  risk_level: 'safe' | 'warning' | 'danger'
  message: string
}

// Unity通信数据结构
interface UnityData {
  region: string
  risk_level: string
  message: string
}

// 定义有效区域常量
const VALID_REGIONS = ['RMS', 'REA', 'SEP', 'PRO', 'UTL']
const VALID_RISK_LEVELS = ['safe', 'warning', 'danger']

// 根据风险级别返回对应的中文文本
const getRiskLevelText = (riskLevel: string): string => {
  switch (riskLevel) {
    case 'safe':
      return '安全'
    case 'warning':
      return '警告'
    case 'danger':
      return '危险'
    default:
      return '未知'
  }
}

// 从ChartContainer注入的扩展状态
const isChartExpandedKey = Symbol() as InjectionKey<Ref<boolean>>
const isExpanded = inject(isChartExpandedKey, ref(false))

const regions = ref<Region[]>([])
const startIndex = ref(0)
const visibleCount = 100 // 一次显示的行数
let scrollTimer: number | null = null

// 跟踪当前选中的区域
const selectedRegion = ref<Region | null>(null)

// 计算当前可见的区域数据
const visibleRegions = computed(() => {
  if (regions.value.length === 0) return []

  if (isExpanded.value) {
    // 展开状态下，显示部分数据，以滚动更新
    const total = regions.value.length
    const start = startIndex.value % total
    const end = Math.min(start + visibleCount, total)

    // 双段拼接保证视觉连续性
    return [...regions.value.slice(start, end), ...regions.value.slice(0, Math.max(0, visibleCount - (total - start)))]
  } else {
    // 非展开状态下，显示部分数据并滚动
    const total = regions.value.length
    const start = startIndex.value % total

    // 双段拼接保证视觉连续性
    return [...regions.value.slice(start), ...regions.value.slice(0, start)].slice(0, visibleCount)
  }
})

// 判断区域是否被选中
const isRegionSelected = (region: Region): boolean => {
  if (!selectedRegion.value) return false
  return (
    region.region === selectedRegion.value.region &&
    region.message === selectedRegion.value.message &&
    region.risk_level === selectedRegion.value.risk_level
  )
}

// 验证并构造发送给Unity的数据
const prepareUnityData = (region: Region): UnityData | null => {
  // 验证区域名称
  if (!VALID_REGIONS.includes(region.region)) {
    console.warn(`非法区域值: ${region.region}，有效区域应为: ${VALID_REGIONS.join(', ')}`)
    return null
  }

  // 验证风险等级
  if (!VALID_RISK_LEVELS.includes(region.risk_level)) {
    console.warn(`非法风险等级: ${region.risk_level}，有效风险等级应为: ${VALID_RISK_LEVELS.join(', ')}`)
    return null
  }

  // 返回有效的Unity数据
  return {
    region: region.region,
    risk_level: region.risk_level,
    message: region.message || '',
  }
}

// 鼠标悬停在区域上时触发高亮
const handleRegionHover = (region: Region) => {
  if (!unityService.isUnityLoaded()) return
  // 鼠标悬停时停止滚动
  if (scrollTimer) {
    clearInterval(scrollTimer)
    scrollTimer = null
  }
  const unityData = prepareUnityData(region)
  if (unityData) {
    unityService.sendMessageToUnity('Sensor', 'RegionHighlightOn', JSON.stringify(unityData))
  }
}

// 鼠标离开区域时取消高亮
const handleRegionLeave = (region: Region) => {
  if (!unityService.isUnityLoaded()) return
  // 如果不在展开状态，重新开始滚动
  if (!isExpanded.value && !scrollTimer) {
    scrollTimer = setInterval(scrollList, 2000) as unknown as number
  }
  const unityData = prepareUnityData(region)
  if (unityData) {
    unityService.sendMessageToUnity('Sensor', 'RegionHighlightOff', JSON.stringify(unityData))
  }
}

// 点击区域时的处理函数 - 持续高亮/取消高亮
const handleRegionClick = (region: Region) => {
  // 检查Unity是否已加载
  if (!unityService.isUnityLoaded()) {
    message.warning('Unity尚未加载完成，无法发送区域数据')
    return
  }

  const unityData = prepareUnityData(region)
  if (!unityData) return

  // 如果点击的是已选中的区域，则取消选中状态
  if (isRegionSelected(region)) {
    selectedRegion.value = null
  } else {
    // 否则设置为选中状态
    selectedRegion.value = region
  }

  // 无论是选中还是取消选中，都发送同一个消息
  unityService.sendMessageToUnity('Sensor', 'RegionContinuousHighlight', JSON.stringify(unityData))
}

// 滚动列表的函数
const scrollList = () => {
  if (regions.value.length > 0) {
    startIndex.value = (startIndex.value + 1) % regions.value.length
  }
}

onMounted(() => {
  // 加载模拟数据
  regions.value = sensorData as Region[]

  // 设置定时器，每2秒滚动一次
  scrollTimer = setInterval(scrollList, 2000) as unknown as number
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
.scrolling-list-container {
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
}

.scrolling-list-header {
  display: flex;
  background-color: #f5f5f5;
  font-weight: bold;
  padding: 8px 8px;
  border-bottom: 1px solid #e8e8e8;
  font-size: 12px;
  position: sticky;
  top: 0;
  z-index: 5;
  margin-top: 5px;
}

.header-item {
  flex: 1;
  text-align: center;
}

.scrolling-list-body {
  flex: 1;
  overflow-y: auto;
  font-size: 12px;
}

.list-row {
  display: flex;
  padding: 6px 8px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.3s;
  cursor: pointer;
}

.list-row:hover {
  background-color: #f9f9f9;
}

.row-selected {
  background-color: #e6f7ff;
}

.list-item {
  flex: 1;
  text-align: center;
}

.status-indicator {
  display: inline-block;
  padding: 1px 6px; /* 减小内边距 */
  border-radius: 8px; /* 稍微减小圆角 */
  font-size: 0.8em; /* 进一步缩小字体 */
  min-width: 50px; /* 减小最小宽度 */
}

.status-safe {
  background-color: #52c41a;
  color: white;
}

.status-warning {
  background-color: #faad14;
  color: white;
}

.status-danger {
  background-color: #f5222d;
  color: white;
}
</style>
