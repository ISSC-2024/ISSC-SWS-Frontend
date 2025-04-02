<template>
  <!-- 
   * @description 传感器数据滚动列表组件
   * 
   * 该组件显示传感器的实时数据列表，包括传感器编号、温度、压力和安全状态。
   * 包含以下功能：
   * 1. 非展开状态下自动滚动显示传感器数据
   * 2. 展开状态下显示全部传感器数据，可滚动查看
   * 3. 根据安全状态自动显示不同颜色的状态指示器（安全/警告/危险）
   * 4. 响应式布局设计，适应不同显示状态
   * 5. 带有固定表头的数据列表
   * 
   -->
  <div class="scrolling-list-container">
    <div class="scrolling-list-header">
      <div class="header-item">传感器编号</div>
      <div class="header-item">温度</div>
      <div class="header-item">压力</div>
      <div class="header-item">安全预警</div>
    </div>
    <div class="scrolling-list-body" ref="listBody">
      <div 
        v-for="sensor in isExpanded ? allSensors : visibleSensors" 
        :key="sensor.id" 
        class="list-row"
      >
        <div class="list-item">{{ sensor.id }}</div>
        <div class="list-item">{{ sensor.temperature.toFixed(1) }}°C</div>
        <div class="list-item">{{ sensor.pressure.toFixed(1) }} kPa</div>
        <div class="list-item">
          <div 
            class="status-indicator" 
            :class="{
              'status-safe': sensor.status === 'safe',
              'status-warning': sensor.status === 'warning',
              'status-danger': sensor.status === 'danger'
            }"
          >
            {{ getStatusText(sensor.status) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, inject, watch, onUnmounted } from 'vue';
import sensorData from '@/mock/sensors.json';

interface Sensor {
  id: string;
  temperature: number;
  pressure: number;
  status: 'safe' | 'warning' | 'danger';
}

// 从ChartContainer注入的扩展状态
const isExpanded = inject('isChartExpanded', ref(false));

const sensors = ref<Sensor[]>([]);
const startIndex = ref(0);
const visibleCount = 10; // 一次显示的行数
let scrollTimer: number | null = null;

// 所有传感器数据
const allSensors = computed(() => sensors.value);

// 计算当前可见的传感器数据（用于非扩展状态）
const visibleSensors = computed(() => {
  const all = [...sensors.value];
  // 循环显示数据
  return [...all.slice(startIndex.value), ...all.slice(0, startIndex.value)]
    .slice(0, visibleCount);
});

// 获取状态文本
const getStatusText = (status: string): string => {
  switch (status) {
    case 'safe': return '安全';
    case 'warning': return '警告';
    case 'danger': return '危险';
    default: return '未知';
  }
};

// 滚动列表的函数
const scrollList = () => {
  if (!isExpanded.value) {
    startIndex.value = (startIndex.value + 1) % sensors.value.length;
  }
};

// 启动或停止滚动
const toggleScrolling = (expanded: boolean) => {
  if (expanded) {
    // 扩展模式下停止滚动
    if (scrollTimer) {
      clearInterval(scrollTimer);
      scrollTimer = null;
    }
  } else {
    // 非扩展模式下启动滚动
    if (!scrollTimer) {
      scrollTimer = setInterval(scrollList, 2000) as unknown as number;
    }
  }
};

// 监听扩展状态变化
watch(isExpanded, (newValue) => {
  toggleScrolling(newValue);
});

onMounted(() => {
  // 加载模拟数据
  sensors.value = sensorData as Sensor[];
  
  // 设置定时器，每2秒滚动一次（仅在非扩展模式下）
  if (!isExpanded.value) {
    scrollTimer = setInterval(scrollList, 2000) as unknown as number;
  }
});

onUnmounted(() => {
  // 清除定时器
  if (scrollTimer) {
    clearInterval(scrollTimer);
  }
});
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
  padding-top: 0; /* 移除顶部内边距 */
  position: relative; /* 确保定位上下文 */
  z-index: 0; /* 设置较低的z-index */
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
  z-index: 5; /* 确保表头在内容之上，但在扩展图标之下 */
  margin-top: 5px; /* 为扩展图标留出空间 */
}

.header-item {
  flex: 1;
  text-align: center;
}

.scrolling-list-body {
  flex: 1;
  overflow-y: auto;
  font-size: 12px; /* 减小字体大小 */
}

.list-row {
  display: flex;
  padding: 6px 8px; /* 减小行高 */
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