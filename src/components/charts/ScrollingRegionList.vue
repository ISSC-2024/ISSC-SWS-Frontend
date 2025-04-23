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
        :class="{
          'row-selected': isRegionSelected(region),
          'row-alt': index % 2 === 1,
        }"
        @mouseenter="handleRegionHover(region)"
        @mouseleave="handleRegionLeave(region)"
        @click="handleRegionClick(region)"
      >
        <div class="list-item list-time">{{ region.timestamp }}</div>
        <div class="list-item list-region">{{ region.region }}</div>
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
  <TextMessageDisplayBox />
</template>

<script setup lang="ts">
import { ref, onMounted, computed, inject, onUnmounted } from 'vue'
import sensorData from '../../mock/riskRegionSummary.json'
import unityService from '../../services/UnityService'
import { message } from 'ant-design-vue'
import TextMessageDisplayBox from '../controls/windows/TextMessageDisplayBox.vue'
import { useMessageStore } from '../../stores/message'

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
const isExpanded = inject('isChartExpanded', ref(false))

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

// 配置字段映射
const textFieldConfig = {
  labelMap: {
    region: '区域名称',
    risk_level: '风险等级',
    message: '详细信息',
  },
  valueFormatters: {
    risk_level: (v: string) => getRiskLevelText(v), // 复用已有的翻译函数
  },
}

const messageStore = useMessageStore()
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
  // 发送消息给文本框
  messageStore.showMessage(unityData, textFieldConfig, {
    source: 'region', // 可选的消息来源标识
    title: `区域-${region.region}`, // 设置特定标题
  })
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
  border: 1px solid rgba(32, 160, 255, 0.15);
  border-radius: 8px;
  overflow: hidden;
  padding-top: 0;
  position: relative;
  z-index: 0;
  background-color: rgba(8, 15, 35, 0.97);
  color: rgba(220, 230, 240, 0.9);
  box-shadow: 0 0 25px rgba(0, 100, 255, 0.07);
  backdrop-filter: blur(5px);
  background: linear-gradient(135deg, rgba(15, 30, 60, 0.95), rgba(8, 15, 35, 0.95));
  isolation: isolate;
}

.scrolling-list-header {
  display: flex;
  background: linear-gradient(90deg, rgba(12, 24, 48, 0.9) 0%, rgba(20, 40, 80, 0.9) 50%, rgba(12, 24, 48, 0.9) 100%);
  font-weight: 600;
  padding: 10px 8px; /* 减小表头高度 */
  border-bottom: 1px solid rgba(32, 160, 255, 0.15);
  font-size: 12px;
  position: sticky;
  top: 0;
  z-index: 5;
  color: rgba(120, 180, 255, 0.95);
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 0 0 8px rgba(32, 160, 255, 0.4);
}

.header-item {
  flex: 1;
  text-align: center;
  position: relative;
}

.header-item::after {
  content: '';
  position: absolute;
  bottom: -10px; /* 调整下划线位置 */
  left: 50%;
  transform: translateX(-50%);
  width: 40%;
  height: 2px;
  background: linear-gradient(90deg, rgba(32, 160, 255, 0), rgba(32, 160, 255, 0.6), rgba(32, 160, 255, 0));
}

.scrolling-list-body {
  flex: 1;
  overflow-y: auto;
  font-size: 12px;
  font-family: 'Consolas', 'Monaco', monospace;
  scrollbar-width: thin;
  scrollbar-color: rgba(32, 160, 255, 0.6) rgba(11, 19, 43, 0.3);
  background: radial-gradient(ellipse at center, rgba(20, 40, 80, 0.3) 0%, rgba(8, 15, 35, 0.3) 100%);
}

.scrolling-list-body::-webkit-scrollbar {
  width: 5px;
}

.scrolling-list-body::-webkit-scrollbar-track {
  background: rgba(11, 19, 43, 0.3);
  border-radius: 3px;
}

.scrolling-list-body::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, rgba(32, 160, 255, 0.4), rgba(32, 160, 255, 0.8));
  border-radius: 3px;
  border: 1px solid rgba(0, 50, 126, 0.3);
}

.list-row {
  display: flex;
  padding: 6px 10px; /* 减小行高 */
  border-bottom: 1px solid rgba(32, 160, 255, 0.06);
  transition: all 0.2s ease; /* 简化过渡效果，减少抖动 */
  cursor: pointer;
  align-items: center;
  background-color: rgba(12, 20, 40, 0.75);
  position: relative;
  /* 移除模糊效果，提高清晰度 */
  /* backdrop-filter: blur(2px); */
}

.list-row::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background: transparent;
  transition: all 0.2s ease;
}

.row-alt {
  background-color: rgba(15, 30, 60, 0.75);
}

.list-row:hover {
  background-color: rgba(25, 45, 85, 0.95); /* 提高不透明度，减少模糊感 */
  transform: translateX(2px); /* 减小变换幅度，避免抖动 */
  box-shadow: -2px 0 8px rgba(32, 160, 255, 0.18);
  z-index: 2;
}

.row-selected {
  background: linear-gradient(90deg, rgba(20, 60, 130, 0.5), rgba(30, 80, 160, 0.5)) !important; /* 提高不透明度 */
  border-right: 1px solid rgba(64, 180, 255, 0.35);
  box-shadow: 0 0 15px rgba(32, 160, 255, 0.2);
}

.list-item {
  flex: 1;
  text-align: center;
}

.list-time {
  color: rgba(140, 190, 240, 0.85);
  font-family: 'Consolas', monospace;
  text-shadow: 0 0 5px rgba(32, 160, 255, 0.3);
  letter-spacing: 0.5px;
  font-size: 11px;
}

.list-region {
  font-weight: bold;
  letter-spacing: 0.5px; /* 减小字母间距 */
  position: relative;
  text-shadow: 0 0 5px rgba(32, 160, 255, 0.25); /* 减少文字模糊 */
}

.list-region::after {
  content: '';
  position: absolute;
  bottom: -3px; /* 调整位置 */
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 1px;
  background: linear-gradient(90deg, rgba(32, 160, 255, 0), rgba(32, 160, 255, 0.7), rgba(32, 160, 255, 0));
  transition: width 0.25s ease;
}

.list-row:hover .list-region::after {
  width: 40%;
}

/* 全新设计的状态指示器 */
.status-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px 10px; /* 减小内边距 */
  border-radius: 10px; /* 减小圆角 */
  font-size: 11px;
  min-width: 70px;
  font-weight: 600;
  transition: all 0.2s ease; /* 简化过渡效果 */
  position: relative;
  overflow: hidden;
  letter-spacing: 0.5px;
  height: 18px; /* 减小高度 */
  border: 1px solid rgba(255, 255, 255, 0.15);
}

/* 发光效果 */
.status-indicator::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  filter: blur(6px); /* 减少模糊半径 */
  opacity: 0.5; /* 减少发光强度 */
  transform: scale(0.9);
  transition: all 0.3s ease;
}

.status-indicator::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0));
  border-radius: 10px 10px 0 0; /* 调整圆角 */
  pointer-events: none;
}

.list-row:hover .status-indicator {
  transform: scale(1.03); /* 减小缩放比例 */
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}

.list-row:hover .status-indicator::before {
  transform: scale(0.95);
  opacity: 0.6;
}

.status-safe {
  background: linear-gradient(145deg, rgba(40, 170, 30, 0.8), rgba(60, 200, 40, 0.8)); /* 提高不透明度 */
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 1px 6px rgba(82, 196, 26, 0.3);
  text-shadow: 0 1px 1px rgba(0, 80, 0, 0.5); /* 减少文字阴影 */
}

.status-safe::before {
  background: rgba(82, 196, 26, 0.6);
}

.status-warning {
  background: linear-gradient(145deg, rgba(250, 150, 0, 0.8), rgba(255, 180, 30, 0.8)); /* 提高不透明度 */
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 1px 6px rgba(250, 173, 20, 0.3);
  text-shadow: 0 1px 1px rgba(120, 60, 0, 0.5); /* 减少文字阴影 */
}

.status-warning::before {
  background: rgba(250, 173, 20, 0.6);
}

.status-danger {
  background: linear-gradient(145deg, rgba(220, 20, 10, 0.8), rgba(255, 50, 30, 0.8)); /* 提高不透明度 */
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 1px 6px rgba(245, 34, 45, 0.3);
  text-shadow: 0 1px 1px rgba(100, 0, 0, 0.5); /* 减少文字阴影 */
}

.status-danger::before {
  background: rgba(245, 34, 45, 0.6);
}

/* 添加精致的扫描线效果和网格 */
.scrolling-list-container::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  background-image:
    linear-gradient(to bottom, transparent 49.5%, rgba(32, 160, 255, 0.03) 50%, transparent 50.5%),
    /* 减少扫描线对比度 */ linear-gradient(90deg, rgba(32, 160, 255, 0.01) 1px, transparent 1px),
    linear-gradient(rgba(32, 160, 255, 0.01) 1px, transparent 1px);
  background-size:
    100% 6px,
    20px 20px,
    20px 20px;
  z-index: 1;
}

/* 添加全息投影效果 */
.scrolling-list-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(64, 120, 255, 0.05) 0%, rgba(64, 120, 255, 0) 70%),
    radial-gradient(ellipse at 50% 100%, rgba(64, 120, 255, 0.05) 0%, rgba(64, 120, 255, 0) 70%);
  pointer-events: none;
  z-index: 0;
}

/* 行内信息前缀符号 */
.list-time::before {
  content: '⏱';
  margin-right: 3px;
  font-size: 9px; /* 减小图标尺寸 */
  opacity: 0.7;
}

.list-region::before {
  content: '◉';
  margin-right: 3px;
  font-size: 9px; /* 减小图标尺寸 */
  opacity: 0.7;
}

/* 状态脉动动画 - 减少强度 */
@keyframes pulse {
  0% {
    opacity: 0.8;
  }
  50% {
    opacity: 0.95;
  }
  100% {
    opacity: 0.8;
  }
}

.status-danger {
  animation: pulse 2.5s infinite;
}
</style>
