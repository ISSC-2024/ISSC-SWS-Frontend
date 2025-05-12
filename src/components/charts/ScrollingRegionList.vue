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
  <div class="scrolling-list-container" :class="{ expanded: isExpanded }">
    <div class="graph-header">
      <div class="graph-title">
        <div class="title-icon">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="currentColor"
              d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z"
            />
          </svg>
        </div>
        <span>区域状态实时监控</span>
      </div>
      <!-- 导出按钮，仅在展开状态下显示 -->
      <div v-if="isExpanded" class="graph-actions">
        <button class="export-button" @click="handleExport">
          <download-outlined />
          <span>导出</span>
        </button>
      </div>
    </div>

    <div class="scrolling-list-header">
      <div class="header-item">
        <clock-circle-outlined />
        <span>时间戳</span>
      </div>
      <div class="header-item">
        <environment-outlined />
        <span>区域</span>
      </div>
      <div class="header-item">
        <safety-outlined />
        <span>安全预警</span>
      </div>
    </div>

    <div class="scrolling-list-body" ref="listBody">
      <!-- 加载状态提示 -->
      <div v-if="isLoading" class="loading-indicator">
        <span>正在加载数据...</span>
      </div>
      <div v-else-if="visibleRegions.length === 0" class="empty-data">
        <span>暂无区域数据</span>
      </div>
      <template v-else>
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
          <div class="list-item list-time">
            <clock-circle-outlined class="item-icon" />
            <span>{{ region.timestamp }}</span>
          </div>
          <div class="list-item list-region">
            <environment-outlined class="item-icon" />
            <span>{{ region.region }}</span>
          </div>
          <div class="list-item">
            <div
              class="status-indicator"
              :class="{
                'status-safe': region.risk_level === 'safe',
                'status-warning': region.risk_level === 'warning',
                'status-danger': region.risk_level === 'danger',
              }"
            >
              <check-circle-outlined v-if="region.risk_level === 'safe'" />
              <warning-outlined v-else-if="region.risk_level === 'warning'" />
              <exclamation-circle-outlined v-else-if="region.risk_level === 'danger'" />
              <span>{{ getRiskLevelText(region.risk_level) }}</span>
            </div>
          </div>
        </div>

        <!-- "加载更多"触发器元素 -->
        <div v-if="isExpanded" ref="loadTriggerRef" class="load-more-trigger">
          <div v-if="isLoadingMore" class="loading-more">
            <span>加载更多...</span>
          </div>
          <div v-else-if="!hasMore" class="no-more-data">
            <span>没有更多数据</span>
          </div>
        </div>
      </template>
    </div>
  </div>
  <TextMessageDisplayBox />
</template>

<script setup lang="ts">
import { ref, onMounted, computed, inject, onUnmounted, watch, nextTick } from 'vue'
import { useAlgorithmStore, ModuleType, AlgorithmType } from '@/stores/algorithmStore'
import unityService from '@/services/UnityService'
import { message } from 'ant-design-vue'
// 导入文本框组件和消息管理
import TextMessageDisplayBox from '../controls/windows/TextMessageDisplayBox.vue'
import { useMessageStore } from '@/stores/messageStore'
import Algorithm3Api, { type AlgorithmResult, type DownloadCsvParams } from '@/apis/Algorithm3'
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined, // 添加下载图标
} from '@ant-design/icons-vue'

// 使用算法数据 store
const algorithmStore = useAlgorithmStore()

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

// 加载状态
const isLoading = ref(false)
const isLoadingMore = ref(false)
// 分页参数
const pageSize = 50
const currentSkip = ref(0)
const hasMore = ref(true)

// 滚动相关
const listBody = ref<HTMLElement | null>(null)
let scrollObserver: IntersectionObserver | null = null
const loadTriggerRef = ref<HTMLDivElement | null>(null)

// 将API返回的数据转换为区域条目
const convertToRegionEntries = (results: AlgorithmResult[]): Region[] => {
  return results.map((result) => ({
    timestamp: result.timestamp,
    region: result.region,
    risk_level: result.risk_level as 'safe' | 'warning' | 'danger',
    message: result.message || '',
  }))
}

// 计算当前可见的区域数据
const visibleRegions = computed(() => {
  if (regions.value.length === 0) return []

  if (isExpanded.value) {
    // 展开状态下，显示所有数据，不滚动
    return regions.value
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
  return region.region.toUpperCase() === selectedRegion.value.region.toUpperCase()
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

// 鼠标点击的时候触发文本框显示功能
// 引入消息管理
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
    title: `区域风险预测-${region.region}`, // 设置特定标题
  })
}

// 滚动列表的函数
const scrollList = () => {
  if (regions.value.length > 0) {
    startIndex.value = (startIndex.value + 1) % regions.value.length
  }
}

// 加载区域数据
const loadRegionData = async (reset = true) => {
  try {
    if (reset) {
      isLoading.value = true
      currentSkip.value = 0
      regions.value = []
      hasMore.value = true
    } else {
      isLoadingMore.value = true
    }

    // 获取当前选中的算法类型
    const selectedAlgorithm = algorithmStore.getModuleSelectedAlgorithm(ModuleType.Module3)

    // 获取当前算法的参数
    const params = algorithmStore.getAlgorithmParams(selectedAlgorithm)

    // 构建请求参数
    const requestParams = {
      algorithm: selectedAlgorithm,
      learning_rate: Number(params.learning_rate) || 0.1,
      max_depth:
        selectedAlgorithm === AlgorithmType.xgboost || selectedAlgorithm === AlgorithmType.lightGBM
          ? Number(params.max_depth)
          : null,
      max_epochs: selectedAlgorithm === AlgorithmType.TabNet ? Number(params.max_epochs) : null,
      skip: currentSkip.value,
      limit: pageSize,
    }

    // 调用API获取数据（带分页）
    const response = await Algorithm3Api.getResultsWithPagination(requestParams)

    // 更新分页信息
    hasMore.value = response.pagination.has_more

    // 转换数据格式并添加到当前列表
    if (reset) {
      regions.value = convertToRegionEntries(response.data)
    } else {
      regions.value = [...regions.value, ...convertToRegionEntries(response.data)]
    }

    // 更新下一页的偏移量
    currentSkip.value += response.data.length
  } catch (error) {
    console.error(`加载模块3区域数据失败:`, error)
    message.error('加载区域数据失败，请稍后再试')
    if (reset) regions.value = [] // 重置时才清空区域列表
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

// 加载更多数据
const loadMoreData = async () => {
  if (!hasMore.value || isLoadingMore.value) return
  await loadRegionData(false)
}

// 设置滚动监听
const setupScrollObserver = () => {
  if (scrollObserver) {
    scrollObserver.disconnect()
  }

  scrollObserver = new IntersectionObserver(
    (entries) => {
      // 只在展开状态下监听滚动加载更多
      if (!isExpanded.value) return

      const entry = entries[0]
      if (entry && entry.isIntersecting && hasMore.value && !isLoadingMore.value) {
        loadMoreData()
      }
    },
    {
      rootMargin: '100px',
    },
  )

  nextTick(() => {
    if (loadTriggerRef.value) {
      scrollObserver?.observe(loadTriggerRef.value)
    }
  })
}

/**
 * 处理导出操作 - 下载CSV文件
 */
const handleExport = async () => {
  try {
    // 获取当前选中的算法类型
    const selectedAlgorithm = algorithmStore.getModuleSelectedAlgorithm(ModuleType.Module3)

    // 获取当前算法的参数
    const params = algorithmStore.getAlgorithmParams(selectedAlgorithm)

    // 构建下载参数
    const downloadParams: DownloadCsvParams = {
      algorithm: selectedAlgorithm,
      learning_rate: Number(params.learning_rate) || 0.1,
      max_depth:
        selectedAlgorithm === AlgorithmType.xgboost || selectedAlgorithm === AlgorithmType.lightGBM
          ? Number(params.max_depth)
          : null,
      max_epochs: selectedAlgorithm === AlgorithmType.TabNet ? Number(params.max_epochs) : null,
      localize: true,
      filename: `${selectedAlgorithm}_region`,
    }

    // 下载CSV文件
    const blobData = await Algorithm3Api.downloadResultsCsv(downloadParams)

    // 创建下载链接并触发下载
    const url = window.URL.createObjectURL(blobData)
    const link = document.createElement('a')
    link.href = url
    link.download = `${downloadParams.filename || 'algorithm_results'}.csv`
    document.body.appendChild(link)
    link.click()

    // 清理
    window.URL.revokeObjectURL(url)
    document.body.removeChild(link)

    message.success('导出成功')
  } catch (error) {
    console.error('导出CSV文件失败:', error)
    message.error('导出失败，请稍后再试')
  }
}

onMounted(async () => {
  // 初始加载数据
  await loadRegionData()

  // 设置滚动观察器
  setupScrollObserver()

  // 设置定时器，每2秒滚动一次
  scrollTimer = setInterval(scrollList, 2000) as unknown as number
})

// 监听模块3的任何变化（包括算法选择和参数）
watch(
  () => [
    algorithmStore.selectedAlgorithms[ModuleType.Module3],
    algorithmStore.algorithms[algorithmStore.selectedAlgorithms[ModuleType.Module3]]?.params,
  ],
  async () => {
    console.log('模块3配置已更新，重新加载数据')
    await loadRegionData()
    // 重置开始索引
    startIndex.value = 0
    // 清除选中状态
    selectedRegion.value = null
  },
  { deep: true },
)

onUnmounted(() => {
  // 清除定时器
  if (scrollTimer) {
    clearInterval(scrollTimer)
    scrollTimer = null
  }

  // 清除滚动观察器
  if (scrollObserver) {
    scrollObserver.disconnect()
    scrollObserver = null
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

/* 标题栏 */
.graph-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(
    90deg,
    rgba(12, 24, 48, 0.95) 0%,
    rgba(20, 40, 80, 0.95) 50%,
    rgba(12, 24, 48, 0.95) 100%
  );
  border-bottom: 1px solid rgba(74, 144, 226, 0.2);
  position: relative;
  z-index: 5;
}

.graph-header::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: linear-gradient(90deg, rgba(32, 160, 255, 0), rgba(32, 160, 255, 0.5), rgba(32, 160, 255, 0));
}

.graph-title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(220, 230, 240, 0.95);
  font-weight: 600;
  font-size: 16px;
  text-shadow: 0 0 10px rgba(32, 160, 255, 0.3);
  letter-spacing: 0.5px;
}

.title-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #20a0ff;
  filter: drop-shadow(0 0 5px rgba(32, 160, 255, 0.5));
}

.scrolling-list-header {
  display: flex;
  background: linear-gradient(90deg, rgba(12, 24, 48, 0.9) 0%, rgba(20, 40, 80, 0.9) 50%, rgba(12, 24, 48, 0.9) 100%);
  font-weight: 600;
  padding: 10px 8px;
  border-bottom: 1px solid rgba(32, 160, 255, 0.15);
  font-size: 14px;
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.header-item::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 40%;
  height: 2px;
  background: linear-gradient(90deg, rgba(32, 160, 255, 0), rgba(32, 160, 255, 0.6), rgba(32, 160, 255, 0));
}

.scrolling-list-body {
  flex: 1;
  overflow-y: auto;
  font-size: 14px;
  font-family: 'Consolas', 'Monaco', monospace;
  background: radial-gradient(ellipse at center, rgba(20, 40, 80, 0.3) 0%, rgba(8, 15, 35, 0.3) 100%);
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: rgba(32, 160, 255, 0.6) rgba(11, 19, 43, 0.3);
}

/* WebKit/Chrome滚动条样式 */
.scrolling-list-body::-webkit-scrollbar {
  width: 6px;
}

.scrolling-list-body::-webkit-scrollbar-track {
  background: rgba(11, 19, 43, 0.3);
}

.scrolling-list-body::-webkit-scrollbar-thumb {
  background-color: rgba(32, 160, 255, 0.6);
  border-radius: 3px;
}

/* 非展开状态隐藏滚动条 */
.scrolling-list-container:not(.expanded) .scrolling-list-body {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}

.scrolling-list-container:not(.expanded) .scrolling-list-body::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.list-row {
  display: flex;
  padding: 10px;
  border-bottom: 1px solid rgba(32, 160, 255, 0.06);
  transition: all 0.2s ease;
  cursor: pointer;
  align-items: center;
  background-color: rgba(12, 20, 40, 0.75);
  position: relative;
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
  background-color: rgba(25, 45, 85, 0.95);
  transform: translateX(2px);
  box-shadow: -2px 0 8px rgba(32, 160, 255, 0.18);
  z-index: 2;
}

.row-selected {
  background: linear-gradient(90deg, rgba(20, 60, 130, 0.5), rgba(30, 80, 160, 0.5)) !important;
  border-right: 1px solid rgba(64, 180, 255, 0.35);
  box-shadow: 0 0 15px rgba(32, 160, 255, 0.2);
}

.list-item {
  flex: 1;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.list-time {
  color: rgba(140, 190, 240, 0.85);
  font-family: 'Consolas', monospace;
  text-shadow: 0 0 5px rgba(32, 160, 255, 0.3);
  letter-spacing: 0.5px;
  font-size: 13px;
}

.list-region {
  font-weight: bold;
  letter-spacing: 0.5px;
  position: relative;
  text-shadow: 0 0 5px rgba(32, 160, 255, 0.25);
  font-size: 13px;
}

.list-region::after {
  content: '';
  position: absolute;
  bottom: -3px;
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

/* 状态指示器样式 */
.status-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 13px;
  min-width: 90px;
  font-weight: 600;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  letter-spacing: 0.5px;
  height: 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  gap: 6px;
}

/* 发光效果 */
.status-indicator::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  filter: blur(6px);
  opacity: 0.5;
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
  border-radius: 10px 10px 0 0;
  pointer-events: none;
}

.list-row:hover .status-indicator {
  transform: scale(1.03);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}

.list-row:hover .status-indicator::before {
  transform: scale(0.95);
  opacity: 0.6;
}

.status-safe {
  background: linear-gradient(145deg, rgba(40, 170, 30, 0.8), rgba(60, 200, 40, 0.8));
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 1px 6px rgba(82, 196, 26, 0.3);
  text-shadow: 0 1px 1px rgba(0, 80, 0, 0.5);
}

.status-safe::before {
  background: rgba(82, 196, 26, 0.6);
}

.status-warning {
  background: linear-gradient(145deg, rgba(250, 150, 0, 0.8), rgba(255, 180, 30, 0.8));
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 1px 6px rgba(250, 173, 20, 0.3);
  text-shadow: 0 1px 1px rgba(120, 60, 0, 0.5);
}

.status-warning::before {
  background: rgba(250, 173, 20, 0.6);
}

.status-danger {
  background: linear-gradient(145deg, rgba(220, 20, 10, 0.8), rgba(255, 50, 30, 0.8));
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 1px 6px rgba(245, 34, 45, 0.3);
  text-shadow: 0 1px 1px rgba(100, 0, 0, 0.5);
}

.status-danger::before {
  background: rgba(245, 34, 45, 0.6);
}

/* 扫描线效果和网格 */
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
    linear-gradient(90deg, rgba(32, 160, 255, 0.01) 1px, transparent 1px),
    linear-gradient(rgba(32, 160, 255, 0.01) 1px, transparent 1px);
  background-size:
    100% 6px,
    20px 20px,
    20px 20px;
  z-index: 1;
}

/* 全息投影效果 */
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

/* 状态脉动动画 */
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

/* 展开状态下更大字体 */
.expanded .scrolling-list-body,
.expanded .list-time,
.expanded .list-region,
.expanded .status-indicator {
  font-size: 16px;
}

.expanded .status-indicator {
  height: 28px;
  padding: 4px 14px;
}

/* 图标样式 */
.item-icon {
  font-size: 14px;
  display: flex;
  align-items: center;
}

/* 状态指示器内图标颜色 */
.status-indicator svg {
  font-size: 14px;
}

/* 展开状态下的图标 */
.expanded .item-icon,
.expanded .status-indicator svg {
  font-size: 16px;
}

/* 图标颜色随风险等级变化 */
.row-selected .item-icon,
.list-row:hover .item-icon {
  color: rgba(220, 230, 240, 0.9);
}

/* 安全状态图标颜色 */
.list-row .status-safe ~ .list-item .item-icon,
.list-row:has(.status-safe) .item-icon {
  color: rgba(82, 196, 26, 0.9);
}

/* 警告状态图标颜色 */
.list-row .status-warning ~ .list-item .item-icon,
.list-row:has(.status-warning) .item-icon {
  color: rgba(250, 173, 20, 0.9);
}

/* 危险状态图标颜色 */
.list-row .status-danger ~ .list-item .item-icon,
.list-row:has(.status-danger) .item-icon {
  color: rgba(245, 34, 45, 0.9);
}

/* 加载状态和空数据状态 */
.loading-indicator,
.empty-data {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  width: 100%;
  color: rgba(32, 160, 255, 0.7);
  font-size: 16px;
  text-align: center;
}

/* 加载更多相关样式 */
.load-more-trigger {
  padding: 15px;
  text-align: center;
  color: rgba(32, 160, 255, 0.7);
}

.loading-more {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.no-more-data {
  font-size: 14px;
  color: rgba(180, 200, 220, 0.5);
  padding: 10px;
}

/* 导出按钮样式 */
.graph-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.export-button {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(32, 160, 255, 0.15);
  border: 1px solid rgba(32, 160, 255, 0.3);
  color: rgba(220, 230, 240, 0.9);
  padding: 5px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  outline: none;
}

.export-button:hover {
  background: rgba(32, 160, 255, 0.25);
  border-color: rgba(32, 160, 255, 0.5);
  box-shadow: 0 0 8px rgba(32, 160, 255, 0.4);
}

.export-button:active {
  background: rgba(32, 160, 255, 0.35);
  transform: translateY(1px);
}
</style>
