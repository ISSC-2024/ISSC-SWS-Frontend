<!--文本框组件-->
<template>
  <div v-if="visible" class="text-message-display-box">
    <div class="message-box-content">
      <h3 class="message-box-title">{{ messageStore.title }}</h3>
      <div class="message-box-body">
        <div v-for="key in filteredKeys" :key="key" class="message-row">
          <span class="attribute-label">{{ getFieldLabel(key) }}：</span>
          <span class="attribute-value" :class="getStatusClass(key, currentData[key])">
            {{ formatValue(key, currentData[key]) }}
          </span>
        </div>
        <!-- 如果有详细信息，单独处理 -->
        <div v-if="currentData.message" class="message-row message-long-text">
          <span class="attribute-label">详细信息：</span>
          <div class="message-text-container">
            <div v-for="(line, index) in messageLines" :key="index" class="message-text-line">
              <div class="message-text-content" :class="getMessageStatusClass(line)">
                {{ line }}
              </div>
              <div v-if="index !== messageLines.length - 1" class="line-separator"></div>
            </div>
          </div>
        </div>
      </div>
      <button class="close-icon" @click="handleClose">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMessageStore } from '@/stores/messageStore' // 根据实际路径调整

// type StatusType = 'normal' | 'warning' | 'danger'
// 在这里直接读取消息管理中的信息进行显示
const messageStore = useMessageStore()

// 从store获取状态
const visible = computed(() => messageStore.visible)
const currentData = computed(() => messageStore.currentData)
const fieldConfig = computed(() => messageStore.fieldConfig)

// 默认字段标签映射
const defaultLabelMap: Record<string, string> = {
  timestamp: '时间戳',
  device_id: '设备编号',
  temperature: '温度',
  pressure: '压力',
  flow_rate: '流量',
  level: '液位',
  gas_type: '气体类型',
  gas_concentration: '气体浓度',
  status: '状态',
  region: '区域',
  risk_level: '风险等级',
  message: '详细信息',
}

// 过滤需要显示的字段
const filteredKeys = computed(() => {
  // 排除message字段，确保它不会被当作普通属性显示
  return Object.keys(currentData.value).filter(
    (key) =>
      !fieldConfig.value.excludeFields?.includes(key) &&
      key !== 'message' && // 明确排除message字段
      currentData.value[key] !== undefined &&
      currentData.value[key] !== null,
  )
})

// 获取字段显示标签
const getFieldLabel = (key: string) => {
  return fieldConfig.value.labelMap?.[key] || defaultLabelMap[key] || key
}

// 格式化显示值，确保所有数值最多保留两位小数
const formatValue = (key: string, value: any) => {
  if (fieldConfig.value.valueFormatters?.[key]) {
    return fieldConfig.value.valueFormatters[key](value)
  }

  if (typeof value === 'number') {
    if (key === 'gas_concentration') {
      // 气体浓度特殊情况可以在这里处理
      return `${value.toFixed(2)} ppm`
    } else {
      return value.toFixed(2)
    }
  }

  if (value instanceof Date) {
    return value.toLocaleString()
  }

  return value?.toString() || '--'
}

// 获取状态样式
const getStatusClass = (key: string, value: any) => {
  const status = fieldConfig.value.statusCheckers?.[key]?.(value)
  // defaultStatusCheck(key, value)

  return {
    'normal-status': status === 'normal',
    'warning-status': status === 'warning',
    'danger-status': status === 'danger',
  }
}

// // 默认状态判断逻辑
// const defaultStatusCheck = (key: string, value: any): StatusType => {
//   if (typeof value !== 'number') return 'normal'
//
//   const safetyRanges: Record<string, [number, number]> = {
//     temperature: [20, 40],
//     pressure: [0.5, 3.0],
//     gas_concentration: [0, 50],
//     level: [20, 80]
//   }
//
//   const range = safetyRanges[key]
//   if (!range) return 'normal'
//
//   const [min, max] = range
//   if (value < min || value > max) return 'danger'
//   if (value < min * 1.1 || value > max * 0.9) return 'warning'
//
//   return 'normal'
// }

// 对详细信息进行格式化，确保数字最多保留两位小数，并处理换行
const formatMessage = (message: string) => {
  if (!message) return ''

  // 定义一个函数来格式化数字，保留两位小数
  const formatNumber = (match: string) => {
    // 去掉百分号等非数字字符，保留数字部分
    const numMatch = match.match(/([-+]?\d*\.?\d+)/)
    if (!numMatch) return match

    const numStr = numMatch[0]
    let num = parseFloat(numStr)

    // 如果是整数或者小数点后不足两位，直接返回原值
    if (Number.isInteger(num) || (num.toString().includes('.') && num.toString().split('.')[1].length <= 2)) {
      return numStr
    }

    // 否则，四舍五入到小数点后两位
    return num.toFixed(2)
  }

  // 使用正则表达式匹配所有数字（包括百分比等）
  // 替换小数点后超过两位的数字
  return message
    .replace(/；/g, '；\n') // 中文分号
    .replace(/;/g, '；\n') // 英文分号
    .replace(/\n+/g, '\n') // 合并多余换行
    .trim() // 去除首尾空白
    .replace(/([-+]?\d*\.?\d+)([%°℃℉°]?)|(NaN)/g, (fullMatch) => {
      // 如果匹配到 NaN，直接返回原值
      if (fullMatch.includes('NaN')) return fullMatch

      // 否则格式化数字部分
      const [, numPart, unitPart] = fullMatch.match(/([-+]?\d*\.?\d+)([%°℃℉°]?)|(NaN)/) || [fullMatch, fullMatch, '']
      return `${formatNumber(numPart)}${unitPart}`
    })
}

// 计算分割后的详细信息行
const messageLines = computed(() => {
  if (!currentData.value.message) return []

  const formattedMessage = formatMessage(currentData.value.message)
  return formattedMessage.split('\n')
})

// 获取每行详细信息的颜色样式
const getMessageStatusClass = (messageLine: string) => {
  // 危险关键词列表，可以根据需要扩展
  const dangerKeywords = ['危险', '警报', '紧急', '故障', '危险值', '超出范围']

  // 检查是否包含危险关键词
  const isDanger = dangerKeywords.some((keyword) => messageLine.includes(keyword))

  return {
    'normal-message': messageLine.includes('正常'),
    'warning-message': !messageLine.includes('正常') && !isDanger,
    'danger-message': isDanger,
  }
}

// const handleClose = () => {
//   messageStore.hideMessage()
// }

// 关闭时不再指定来源，关闭所有消息
const handleClose = () => {
  messageStore.hideMessage() // 不传参数，关闭所有消息
}
</script>

<style scoped>
.text-message-display-box {
  position: absolute;
  bottom: 1000px;
  left: 1000px;
  z-index: 1000;
  pointer-events: none;
}

.message-box-content {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  width: 300px;
  max-width: 90vw;
  max-height: 70vh;
  padding: 24px;
  position: relative;
  pointer-events: auto;
  overflow: hidden; /* 防止内部元素溢出 */
}

.message-box-body {
  max-height: 30vh;
  overflow-y: auto;
  padding-right: 10px;
  scrollbar-width: thin;
  scrollbar-color: #ddd #f5f5f5;
}

.message-box-body::-webkit-scrollbar {
  width: 6px;
}

.message-box-body::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.message-box-body::-webkit-scrollbar-thumb {
  background-color: #ddd;
  border-radius: 6px;
}

.message-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
  gap: 8px;
}

.attribute-label {
  flex: 0 0 120px;
  color: #666;
  font-size: 14px;
}

.attribute-value {
  flex: 1;
  min-width: 0;
  color: #333;
  font-weight: 500;
  word-break: break-word;
  overflow-wrap: break-word;
}

.normal-status {
  color: #333;
}

.warning-status {
  color: #faad14;
}

.danger-status {
  color: #ff4d4f;
  font-weight: 600;
}

.close-icon {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  color: #999;
  transition: color 0.2s;
  padding: 4px;
}

.close-icon:hover {
  color: #666;
}

/* 详细信息样式优化 */
.message-long-text {
  display: block;
  margin-top: 16px;
}

.message-text-container {
  padding-left: 120px;
  margin-top: 6px;
}

.message-text-line {
  margin-bottom: 10px;
}

.message-text-content {
  word-break: break-word;
  white-space: pre-line;
  font-size: 14px;
  line-height: 1.6;
  background-color: #fafafa;
  border-radius: 4px;
  padding: 8px;
}

.line-separator {
  height: 1px;
  background-color: #e8e8e8;
  margin: 8px 0;
}

/* 根据消息内容显示不同颜色 */
.normal-message {
  background-color: #f6ffed; /* 绿色背景表示正常 */
  color: #52c41a;
}

.warning-message {
  background-color: #fff7e6; /* 橙色背景表示警告 */
  color: #faad14;
}

.danger-message {
  background-color: #fff1f0; /* 红色背景表示危险 */
  color: #ff4d4f;
  font-weight: 600;
}

@media (max-width: 480px) {
  .message-box-content {
    padding: 16px;
  }

  .attribute-label {
    font-size: 13px;
    width: 90px;
  }

  .attribute-value {
    font-size: 14px;
    max-width: calc(100% - 105px);
  }

  .message-text-container {
    padding-left: 95px;
  }

  .message-text-content {
    font-size: 13px;
  }
}
</style>
