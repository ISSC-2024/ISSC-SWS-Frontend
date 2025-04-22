<script setup lang="ts">
import { ref } from 'vue'
import unityService from '../../services/UnityService' // 请确保路径正确
import { useMessageStore } from '../../stores/message'
import TextMessageDisplayBox from '../controls/windows/TextMessageDisplayBox.vue' // 引入文本框组件

const messageStore = useMessageStore()

// 记录当前高亮状态
const activeHighlights = ref({
  hr: null as string | null,
  mr: null as string | null,
  bi: null as string | null,
})

// 定义人力资源数据，新增job和age属性
const humanResources = [
  { id: 1, name: '技术员', description: '技术员 (90人)', icon: '👨‍🔬', job: 'Engineer', age: 35 },
  { id: 2, name: '管理员', description: '管理员 (45人)', icon: '👨‍💼', job: 'Operator', age: 42 },
  { id: 3, name: '维修员', description: '维修员 (65人)', icon: '🔧', job: 'Engineer', age: 38 },
  { id: 4, name: '操作员', description: '操作员 (110人)', icon: '👨‍🏭', job: 'Operator', age: 32 },
  { id: 5, name: '安全员', description: '安全员 (30人)', icon: '🛡️', job: 'SafetyOfficer', age: 40 },
]

// 物料资源数据，更新name以匹配Unity要求
const materialResources = [
  { id: 1, name: 'RawMaterialInventory', displayName: '原料库存', description: '乙烯 (900吨)', icon: '🧪' },
  { id: 2, name: 'Catalyst', displayName: '催化剂', description: '钯碳催化剂 (400kg)', icon: '⚗️' },
  { id: 3, name: 'TankCapacity', displayName: '储罐容量', description: '液化气储罐 (400吨)', icon: '🔋' },
]

const businessInfo = [
  { id: 1, name: '生产计划', description: '聚合物生产 (92%)', icon: '📊' },
  { id: 2, name: '订单状态', description: '待处理订单 (7个)', icon: '📋' },
  { id: 3, name: '质检报告', description: '合格率 (98.5%)', icon: '✅' },
]

// 处理人员点击事件（切换显示/隐藏）
const handleHumanResourceClick = (item: any) => {
  const dataJson = {
    name: item.name,
    job: item.job,
    age: item.age,
  }

  // 发送消息到Unity
  unityService.sendMessageToUnity('People', 'PeopleContinuousHighlight', JSON.stringify(dataJson))

  // 更新本地高亮状态
  if (activeHighlights.value.hr === item.name) {
    activeHighlights.value.hr = null
    // 第二次点击时隐藏消息
    messageStore.hideMessage('HumanResource')
  } else {
    activeHighlights.value.hr = item.name
    // 第一次点击时显示消息
    messageStore.showMessage(
      {
        message: `职位: ${item.job}\n年龄: ${item.age}`,
        timestamp: new Date().toISOString(),
      },
      {
        labelMap: {
          timestamp: '时间戳',
          status: '状态',
        },
        valueFormatters: {
          timestamp: (v: string) => new Date(v).toLocaleString(),
        },
      },
      {
        source: 'HumanResource',
        title: `人力资源`,
      },
    )
  }
}

// 处理物料资源点击事件（切换显示/隐藏）
const handleMaterialResourceClick = (item: any) => {
  const dataJson = {
    name: item.name,
    desc: item.description,
  }

  // 发送消息到Unity
  unityService.sendMessageToUnity('Resource', 'ResourceContinuousHighlight', JSON.stringify(dataJson))

  // 更新本地高亮状态
  if (activeHighlights.value.mr === item.name) {
    activeHighlights.value.mr = null
    // 第二次点击时隐藏消息
    messageStore.hideMessage('MaterialResource')
  } else {
    activeHighlights.value.mr = item.name
    // 第一次点击时显示消息
    messageStore.showMessage(
      {
        message: `${item.description}`,
        timestamp: new Date().toISOString(),
      },
      {
        labelMap: {
          timestamp: '时间戳',
          status: '状态',
        },
        valueFormatters: {
          timestamp: (v: string) => new Date(v).toLocaleString(),
        },
      },
      {
        source: 'MaterialResource',
        title: `物料资源`,
      },
    )
  }
}
</script>

<template>
  <div class="resources-display">
    <div class="resources-content">
      <!-- 人力资源列 -->
      <div class="resource-column">
        <div class="column-title">人力资源</div>
        <div class="column-items">
          <div
            class="resource-item"
            v-for="item in humanResources"
            :key="item.id"
            @click="handleHumanResourceClick(item)"
            :class="{ 'item-active': activeHighlights.hr === item.name }"
          >
            <div class="resource-icon">
              <div class="icon-container">{{ item.icon }}</div>
            </div>
            <div class="resource-info">
              <div class="resource-name">{{ item.name }}</div>
              <div class="resource-description">{{ item.description }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 物料资源列 -->
      <div class="resource-column">
        <div class="column-title">物料资源</div>
        <div class="column-items">
          <div
            class="resource-item"
            v-for="item in materialResources"
            :key="item.id"
            @click="handleMaterialResourceClick(item)"
            :class="{ 'item-active': activeHighlights.mr === item.name }"
          >
            <div class="resource-icon">
              <div class="icon-container">{{ item.icon }}</div>
            </div>
            <div class="resource-info">
              <div class="resource-name">{{ item.displayName }}</div>
              <div class="resource-description">{{ item.description }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 业务信息列 -->
      <div class="resource-column">
        <div class="column-title">业务信息</div>
        <div class="column-items">
          <div class="resource-item" v-for="item in businessInfo" :key="item.id">
            <div class="resource-icon">
              <div class="icon-container">{{ item.icon }}</div>
            </div>
            <div class="resource-info">
              <div class="resource-name">{{ item.name }}</div>
              <div class="resource-description">{{ item.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 文本框组件 -->
  <TextMessageDisplayBox />
</template>

<style scoped>
.resources-display {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.resources-content {
  display: flex;
  flex: 1;
  gap: 10px;
  padding: 5px 5px 10px 5px;
}

.resource-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.08);
  padding: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.column-title {
  font-size: 14px;
  font-weight: 600;
  color: #2c5282;
  margin-bottom: 12px;
  text-align: center;
  padding: 6px 0;
  border-bottom: 2px solid rgba(44, 82, 130, 0.2);
  letter-spacing: 1px;
}

.column-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}

.resource-item {
  display: flex;
  align-items: center;
  background-color: white;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 6px 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
  height: 42px;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  cursor: pointer;
}

.resource-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.06);
}

.item-active {
  border: 2px solid #4299e1;
  background-color: #ebf8ff;
}

.resource-icon {
  margin-right: 6px;
}

.icon-container {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  background-color: #f0f7ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.resource-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.resource-name {
  font-weight: 600;
  font-size: 13px;
  line-height: 1.3;
  color: #2d3748;
}

.resource-description {
  font-size: 11px;
  color: #4a5568;
  line-height: 1.3;
}
</style>
