<template>
  <div class="scrolling-list-container">
    <!-- 左上角下拉框 -->
    <div class="dropdown-container">
      <div class="dropdown">
        <select v-model="selectedRegion" @change="handleRegionChange">
          <option value="">选择区域</option>
          <option value="PRO">PRO</option>
          <option value="REA">REA</option>
          <option value="SEP">SEP</option>
          <option value="UTL">UTL</option>
        </select>
      </div>
      <div class="dropdown">
        <div class="select-container" @click="toggleAttributeDropdown">
          <span>选择属性</span>
          <div class="arrow" :class="{ open: showAttributeDropdown }"></div>
        </div>
        <div class="dropdown-content" v-if="showAttributeDropdown">
          <div class="attribute-item" v-for="attribute in attributes" :key="attribute.value">
            <label>
              <input type="checkbox" :value="attribute.value" v-model="selectedAttributes" />
              {{ attribute.label }}
            </label>
          </div>
        </div>
      </div>
    </div>

    <div class="scrolling-list-header">
      <div class="header-item">时间戳</div>
      <div class="header-item">传感器编号</div>
      <div class="header-item" v-for="attribute in selectedAttributes" :key="attribute">
        {{ getAttributeName(attribute) }}
      </div>
    </div>
    <div class="scrolling-list-body" ref="listBody">
      <div v-for="sensor in visibleSensors" :key="sensor.point_id" class="list-row">
        <div class="list-item">{{ formatTimestamp(sensor.timestamp) }}</div>
        <div class="list-item">{{ sensor.point_id }}</div>
        <div class="list-item" v-for="attribute in selectedAttributes" :key="attribute">
          <div
            v-if="attribute === 'temperature'"
            :class="{ 'high-value': isHighValue(sensor.temperature, 'temperature', sensor.region) }"
          >
            {{ formatValue(sensor.temperature) }}°C
          </div>
          <div
            v-else-if="attribute === 'pressure'"
            :class="{ 'high-value': isHighValue(sensor.pressure, 'pressure', sensor.region) }"
          >
            {{ formatValue(sensor.pressure) }} kPa
          </div>
          <div
            v-else-if="attribute === 'flow_rate'"
            :class="{ 'high-value': isHighValue(sensor.flow_rate, 'flow_rate', sensor.region) }"
          >
            {{ formatValue(sensor.flow_rate) }} m³/h
          </div>
          <div
            v-else-if="attribute === 'level'"
            :class="{ 'high-value': isHighValue(sensor.level, 'level', sensor.region) }"
          >
            {{ formatValue(sensor.level) }} %
          </div>
          <div
            v-else-if="attribute === 'gas_concentration'"
            :class="{ 'high-value': isHighValue(sensor.gas_concentration, 'gas_concentration', sensor.gas_type) }"
          >
            {{ formatValue(sensor.gas_concentration) }}
          </div>
          <div v-else>{{ getAttributeValue(sensor, attribute) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, inject, watch, onUnmounted } from 'vue'
import sensorData from '@/mock/predictions_arima_auto.json'

// 嵌入 metadata.json 中的 sensors 部分
const sensorMetadata = {
  temperature: {
    unit: '°C',
    normal_ranges: {
      RMS: [15, 35],
      REA: [80, 150],
      SEP: [50, 120],
      PRO: [15, 35],
      UTL: [20, 90],
    },
    precision: '±0.5°C',
    response_time: '1-3秒',
  },
  pressure: {
    unit: 'MPa',
    normal_ranges: {
      RMS: [0.1, 0.5],
      REA: [0.5, 3.0],
      SEP: [0.3, 2.0],
      PRO: [0.1, 0.5],
      UTL: [0.2, 1.5],
    },
    precision: '±0.01MPa',
    response_time: '小于1秒',
  },
  flow_rate: {
    unit: 'm³/h',
    normal_ranges: {
      RMS: [5, 50],
      REA: [20, 100],
      SEP: [15, 90],
      PRO: [5, 60],
      UTL: [30, 150],
    },
    precision: '±0.5m³/h',
    response_time: '1-2秒',
  },
  level: {
    unit: '%',
    normal_ranges: {
      RMS: [20, 80],
      REA: [30, 60],
      SEP: [20, 70],
      PRO: [20, 80],
      UTL: [30, 70],
    },
    precision: '±1%',
    response_time: '2-5秒',
  },
  gas_concentration: {
    unit: 'ppm',
    gas_types: ['H₂S', 'NH₃', 'CO'],
    normal_ranges: {
      'H₂S': [0, 10],
      'NH₃': [0, 25],
      CO: [0, 50],
    },
    precision: '±1ppm',
    response_time: '2-4秒',
  },
}

// 状态加载函数
const loadSavedState = () => {
  const savedRegion = localStorage.getItem('scrollingListSelectedRegion')
  const savedAttributes = localStorage.getItem('scrollingListSelectedAttributes')

  return {
    region: savedRegion || '',
    attributes: savedAttributes ? JSON.parse(savedAttributes) : ['temperature', 'gas_type', 'gas_concentration'],
  }
}

interface Sensor {
  timestamp: string
  point_id: string
  temperature: number
  pressure: number
  flow_rate: number
  level: number
  gas_type: string
  gas_concentration: number
  region: string
}

const isExpanded = inject('isChartExpanded', ref(false))

// 响应式状态
const selectedRegion = ref('')
const selectedAttributes = ref<string[]>([])
const showAttributeDropdown = ref(false)

// 初始化加载状态
const initializeState = () => {
  const savedState = loadSavedState()
  selectedRegion.value = savedState.region
  selectedAttributes.value = savedState.attributes
}

onMounted(initializeState)
watch(isExpanded, initializeState)

const attributes = [
  { value: 'temperature', label: '温度' },
  { value: 'pressure', label: '压力' },
  { value: 'flow_rate', label: '流量' },
  { value: 'level', label: '液位' },
  { value: 'gas_type', label: '气体类型' },
  { value: 'gas_concentration', label: '气体浓度' },
]

// 动态获取区域和属性的正常范围
const sensors = ref<Sensor[]>([])
const startIndex = ref(0)
const visibleCount = 10
let scrollTimer: number | null = null

// 状态持久化监听
watch(selectedRegion, (newVal) => {
  localStorage.setItem('scrollingListSelectedRegion', newVal)
})

watch(
  selectedAttributes,
  (newVal) => {
    const sortedAttributes = newVal.sort((a, b) => {
      const indexA = attributes.findIndex((attr) => attr.value === a)
      const indexB = attributes.findIndex((attr) => attr.value === b)
      return indexA - indexB
    })
    selectedAttributes.value = sortedAttributes
    localStorage.setItem('scrollingListSelectedAttributes', JSON.stringify(sortedAttributes))
  },
  { deep: true },
)

const processSensorData = (rawData: any[]): Sensor[] => {
  return rawData.map((item) => {
    const pointIdPrefix = item.point_id.slice(0, 3).toUpperCase()
    const region = pointIdPrefix

    return {
      timestamp: item.timestamp || new Date().toISOString(),
      point_id: item.point_id || 'UNKNOWN',
      temperature: Number(item.temperature) || 0,
      pressure: Number(item.pressure) || 0,
      flow_rate: Number(item.flow_rate) || 0,
      level: Number(item.level) || 0,
      gas_type: item.gas_type || 'N/A',
      gas_concentration: Number(item.gas_concentration) || 0,
      region: region,
    }
  })
}

const isHighValue = (value: number, type: keyof typeof sensorMetadata, key: string): boolean => {
  const sensorMeta = sensorMetadata[type]
  if (!sensorMeta?.normal_ranges) return false

  let ranges: [number, number] = [0, 0]
  if (type === 'gas_concentration') {
    ranges = (sensorMeta.normal_ranges as Record<string, [number, number]>)[key] || [0, 100]
  } else {
    ranges = (sensorMeta.normal_ranges as Record<string, [number, number]>)[key] || [0, 100]
  }

  return value < ranges[0] || value > ranges[1]
}

const handleRegionChange = () => {
  startIndex.value = 0
}

const toggleAttributeDropdown = () => {
  showAttributeDropdown.value = !showAttributeDropdown.value
}

const getAttributeName = (attribute: string): string => {
  const map: Record<string, string> = {
    timestamp: '时间戳',
    point_id: '传感器编号',
    region: '区域',
    temperature: '温度',
    pressure: '压力',
    flow_rate: '流量',
    level: '液位',
    gas_type: '气体类型',
    gas_concentration: '气体浓度',
  }
  return map[attribute] || attribute
}

const getAttributeValue = (sensor: Sensor, attribute: string): any => {
  return sensor[attribute as keyof Sensor]
}

const formatValue = (value: number): string => {
  return value.toFixed(2)
}

const formatTimestamp = (timestamp: string): string => {
  return timestamp.slice(0, 19).replace('T', ' ')
}

const filteredSensors = computed(() => {
  if (!selectedRegion.value) return sensors.value
  return sensors.value.filter((sensor) => sensor.region === selectedRegion.value.toUpperCase())
})

const visibleSensors = computed(() => {
  const all = [...filteredSensors.value]
  return isExpanded.value ? all : all.slice(startIndex.value, startIndex.value + visibleCount)
})

const scrollList = () => {
  if (isExpanded.value || filteredSensors.value.length === 0) return

  if (startIndex.value + visibleCount >= filteredSensors.value.length) {
    startIndex.value = 0
  } else {
    startIndex.value += 1
  }
}

const toggleScrolling = (expanded: boolean) => {
  if (expanded) {
    if (scrollTimer) {
      clearInterval(scrollTimer)
    }
    scrollTimer = null
  } else {
    scrollTimer = setInterval(scrollList, 2000) as unknown as number
  }
}

watch(isExpanded, toggleScrolling)
watch([filteredSensors, selectedAttributes], () => (startIndex.value = 0))

onMounted(() => {
  sensors.value = processSensorData(sensorData)
  toggleScrolling(isExpanded.value)
})

onUnmounted(() => {
  if (scrollTimer) {
    clearInterval(scrollTimer)
  }
})
</script>

<style scoped>
/* 样式部分保持不变，同用户提供的原始代码 */
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

.dropdown-container {
  position: absolute;
  top: 5px;
  left: 5px;
  display: flex;
  gap: 10px;
  z-index: 10;
}

.dropdown select {
  padding: 4px 8px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  font-size: 12px;
  background-color: white;
}

.select-container {
  padding: 4px 8px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  font-size: 12px;
  background-color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.arrow {
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid #333;
  margin-left: 5px;
  transition: transform 0.3s;
}

.arrow.open {
  transform: rotate(180deg);
}

.dropdown-content {
  position: absolute;
  top: 100%;
  left: 0;
  width: 150px;
  background-color: white;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 5px 0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  z-index: 100;
}

.attribute-item {
  padding: 5px 10px;
}

.attribute-item label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.attribute-item input {
  margin-right: 5px;
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
  margin-top: 30px;
}

.header-item {
  flex: 1;
  text-align: center;
}

.scrolling-list-body {
  flex: 1;
  overflow-y: auto;
  font-size: 12px;
  height: calc(100% - 50px);
}

.list-row {
  display: flex;
  padding: 6px 8px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.3s;
}

.list-row:hover {
  background-color: #f9f9f9;
}

.list-item {
  flex: 1;
  text-align: center;
}

.high-value {
  color: #ff4d4f;
  font-weight: bold;
}
</style>
