<template>
  <!-- 
   * @description 化工厂日志滚动列表组件
   * 
   * 该组件显示化工厂的实时日志列表，包括日志类型、时间戳、消息内容和严重程度。
   * 包含以下功能：
   * 1. 非展开状态下自动滚动显示日志数据
   * 2. 展开状态下显示全部日志数据，可滚动查看
   * 3. 根据严重程度自动显示不同颜色的状态指示器（信息/警告/危险）
   * 4. 响应式布局设计，适应不同显示状态
   * 
   -->
  <div class="scrolling-log-container">
    <div class="scrolling-log-body" ref="logBody">
      <div 
        v-for="log in isExpanded ? allLogs : visibleLogs" 
        :key="log.id" 
        class="log-row"
        :class="{
          'log-info': log.severity === 'info',
          'log-warning': log.severity === 'warning',
          'log-danger': log.severity === 'danger'
        }"
      >
        <div class="log-time">{{ formatTime(log.timestamp) }}</div>
        <div class="log-type">{{ log.type }}</div>
        <div class="log-message">{{ log.message }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, inject, watch, onUnmounted } from 'vue';
import logData from '@/mock/plantLogs.json';

interface Log {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'danger';
}

// 从ChartContainer注入的扩展状态
const isExpanded = inject('isChartExpanded', ref(false));

const logs = ref<Log[]>([]);
const startIndex = ref(0);
const visibleCount = 10; // 一次显示的行数
let scrollTimer: number | null = null;

// 所有日志数据
const allLogs = computed(() => logs.value);

// 计算当前可见的日志数据（用于非扩展状态）
const visibleLogs = computed(() => {
  const all = [...logs.value];
  // 循环显示数据
  return [...all.slice(startIndex.value), ...all.slice(0, startIndex.value)]
    .slice(0, visibleCount);
});

// 格式化时间戳
const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

// 滚动列表的函数
const scrollList = () => {
  if (!isExpanded.value) {
    startIndex.value = (startIndex.value + 1) % logs.value.length;
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
  logs.value = logData as Log[];
  
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