<script setup lang="ts">
import { ref } from 'vue'
import unityService from '../../services/UnityService' // 请确保路径正确
import { useMessageStore } from '../../stores/messageStore'
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

// 添加人力资源悬停事件处理
const handleHumanResourceHover = (item: any) => {
  const dataJson = {
    name: item.name,
    job: item.job,
    age: item.age,
  }
  // 发送消息到Unity，启用高亮
  unityService.sendMessageToUnity('People', 'PeopleHighlightOn', JSON.stringify(dataJson))
}

// 添加人力资源离开事件处理
const handleHumanResourceLeave = (item: any) => {
  const dataJson = {
    name: item.name,
    job: item.job,
    age: item.age,
  }
  // 发送消息到Unity，禁用高亮
  unityService.sendMessageToUnity('People', 'PeopleHighlightOff', JSON.stringify(dataJson))
}

// 添加物料资源悬停事件处理
const handleMaterialResourceHover = (item: any) => {
  const dataJson = {
    name: item.name,
    desc: item.description,
  }
  // 发送消息到Unity，启用高亮
  unityService.sendMessageToUnity('Resource', 'ResourceHighlightOn', JSON.stringify(dataJson))
}

// 添加物料资源离开事件处理
const handleMaterialResourceLeave = (item: any) => {
  const dataJson = {
    name: item.name,
    desc: item.description,
  }
  // 发送消息到Unity，禁用高亮
  unityService.sendMessageToUnity('Resource', 'ResourceHighlightOff', JSON.stringify(dataJson))
}
</script>

<template>
  <div class="resources-display">
    <div class="resources-content">
      <!-- 人力资源列 -->
      <div class="resource-column">
        <div class="column-title">
          <div class="title-glow"></div>
          <div class="title-icon-small">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path
                fill="currentColor"
                d="M16,13C15.71,13 15.38,13 15.03,13.05C16.19,13.89 17,15 17,16.5V19H23V16.5C23,14.17 18.33,13 16,13M8,13C5.67,13 1,14.17 1,16.5V19H15V16.5C15,14.17 10.33,13 8,13M8,11A3,3 0 0,0 11,8A3,3 0 0,0 8,5A3,3 0 0,0 5,8A3,3 0 0,0 8,11M16,11A3,3 0 0,0 19,8A3,3 0 0,0 16,5A3,3 0 0,0 13,8A3,3 0 0,0 16,11Z"
              />
            </svg>
          </div>
          <span>人力资源</span>
        </div>
        <div class="column-items">
          <div
            class="resource-item"
            v-for="item in humanResources"
            :key="item.id"
            @click="handleHumanResourceClick(item)"
            @mouseenter="handleHumanResourceHover(item)"
            @mouseleave="handleHumanResourceLeave(item)"
            :class="{ 'item-active': activeHighlights.hr === item.name }"
          >
            <div class="resource-icon">
              <div class="icon-container">{{ item.icon }}</div>
              <div class="icon-reflection"></div>
            </div>
            <div class="resource-info">
              <div class="resource-name">{{ item.name }}</div>
              <div class="resource-description">{{ item.description }}</div>
            </div>
            <div class="item-glow"></div>
          </div>
        </div>
      </div>

      <!-- 物料资源列 -->
      <div class="resource-column">
        <div class="column-title">
          <div class="title-glow"></div>
          <div class="title-icon-small">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path
                fill="currentColor"
                d="M13,6V11H18V7.75L22.25,12L18,16.25V13H13V18H16.25L12,22.25L7.75,18H11V13H6V16.25L1.75,12L6,7.75V11H11V6H7.75L12,1.75L16.25,6H13Z"
              />
            </svg>
          </div>
          <span>物料资源</span>
        </div>
        <div class="column-items">
          <div
            class="resource-item"
            v-for="item in materialResources"
            :key="item.id"
            @click="handleMaterialResourceClick(item)"
            @mouseenter="handleMaterialResourceHover(item)"
            @mouseleave="handleMaterialResourceLeave(item)"
            :class="{ 'item-active': activeHighlights.mr === item.name }"
          >
            <div class="resource-icon">
              <div class="icon-container">{{ item.icon }}</div>
              <div class="icon-reflection"></div>
            </div>
            <div class="resource-info">
              <div class="resource-name">{{ item.displayName }}</div>
              <div class="resource-description">{{ item.description }}</div>
            </div>
            <div class="item-glow"></div>
          </div>
        </div>
      </div>

      <!-- 业务信息列 -->
      <div class="resource-column">
        <div class="column-title">
          <div class="title-glow"></div>
          <div class="title-icon-small">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path
                fill="currentColor"
                d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M9,18H7V16H9V18M9,15H7V9H9V15M13,18H11V13H13V18M13,12H11V9H13V12M17,18H15V11H17V18M17,10H15V9H17V10Z"
              />
            </svg>
          </div>
          <span>业务信息</span>
        </div>
        <div class="column-items">
          <div class="resource-item" v-for="item in businessInfo" :key="item.id">
            <div class="resource-icon">
              <div class="icon-container">{{ item.icon }}</div>
              <div class="icon-reflection"></div>
            </div>
            <div class="resource-info">
              <div class="resource-name">{{ item.name }}</div>
              <div class="resource-description">{{ item.description }}</div>
            </div>
            <div class="item-glow"></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 文本框组件 -->
  <TextMessageDisplayBox />
</template>

<style scoped>
/* 容器样式增强 */
.resources-display {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, rgba(10, 25, 50, 0.98), rgba(5, 10, 25, 0.98));
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.25),
    0 0 50px rgba(32, 160, 255, 0.08);
  border: 1px solid rgba(64, 169, 255, 0.2);
  position: relative;
}

/* 容器发光效果 */
.resources-display::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, rgba(32, 160, 255, 0), rgba(64, 169, 255, 0.6), rgba(32, 160, 255, 0));
  z-index: 5;
}

/* 内容区域样式 */
.resources-content {
  display: flex;
  flex: 1;
  gap: 12px;
  padding: 10px;
  position: relative;
  overflow: hidden;
  height: 100%;
}

/* 高级背景网格效果 */
.resources-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  background-image:
    radial-gradient(circle at 50% 50%, rgba(64, 169, 255, 0.04) 0%, rgba(0, 0, 0, 0) 70%),
    linear-gradient(to bottom, transparent 49.75%, rgba(32, 160, 255, 0.05) 50%, transparent 50.25%),
    linear-gradient(90deg, rgba(32, 160, 255, 0.02) 1px, transparent 1px),
    linear-gradient(rgba(32, 160, 255, 0.02) 1px, transparent 1px);
  background-size:
    100% 100%,
    100% 10px,
    20px 20px,
    20px 20px;
  opacity: 0.8;
  z-index: 0;
}

.resource-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(20, 40, 80, 0.5), rgba(10, 25, 50, 0.5));
  backdrop-filter: blur(10px);
  padding: 10px;
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(64, 169, 255, 0.15),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05),
    inset 0 0 30px rgba(32, 160, 255, 0.03);
  position: relative;
  overflow: hidden;
  z-index: 1;
  min-width: 0; /* 确保flex子项不会溢出 */
}

.resource-column::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, rgba(32, 160, 255, 0), rgba(64, 169, 255, 0.6), rgba(32, 160, 255, 0));
  z-index: 2;
}

/* 列标题样式 */
.column-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(220, 230, 240, 0.98);
  margin-bottom: 8px;
  text-align: center;
  padding: 6px 0;
  border-bottom: 1px solid rgba(64, 169, 255, 0.15);
  letter-spacing: 0.5px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  text-shadow: 0 0 10px rgba(32, 160, 255, 0.4);
}

.title-glow {
  position: absolute;
  bottom: -1px;
  left: 10%;
  width: 80%;
  height: 1px;
  background: linear-gradient(90deg, rgba(32, 160, 255, 0), rgba(64, 169, 255, 0.8), rgba(32, 160, 255, 0));
  filter: blur(0.5px);
}

.title-icon-small {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(64, 169, 255, 0.9);
  filter: drop-shadow(0 0 5px rgba(32, 160, 255, 0.5));
}

.title-icon-small svg {
  width: 14px;
  height: 14px;
}

.column-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  padding-right: 3px;
  flex: 1;
  max-height: calc(100% - 35px); /* 确保滚动区域有足够的空间 */
  min-height: 0; /* 确保flex子项可以收缩 */
}

/* 高级定制滚动条 */
.column-items::-webkit-scrollbar {
  width: 4px;
}

.column-items::-webkit-scrollbar-track {
  background: rgba(15, 35, 70, 0.1);
  border-radius: 10px;
}

.column-items::-webkit-scrollbar-thumb {
  background: rgba(32, 160, 255, 0.3);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.2);
}

.column-items::-webkit-scrollbar-thumb:hover {
  background: rgba(64, 169, 255, 0.5);
}

/* 资源项目样式 */
.resource-item {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, rgba(25, 50, 90, 0.7), rgba(15, 30, 60, 0.7));
  border: 1px solid rgba(64, 169, 255, 0.15);
  border-radius: 8px;
  padding: 8px 10px;
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.15),
    0 1px 3px rgba(0, 0, 0, 0.08),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  min-height: 48px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(4px);
}

/* 项目发光效果 */
.item-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 40%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0));
  border-radius: 8px 8px 0 0;
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

/* 悬停效果 */
.resource-item:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.2),
    0 0 10px rgba(32, 160, 255, 0.1),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  background: linear-gradient(135deg, rgba(30, 60, 100, 0.75), rgba(20, 40, 80, 0.75));
  border-color: rgba(64, 169, 255, 0.3);
}

.resource-item:hover .item-glow {
  opacity: 0.7;
}

/* 激活状态 */
.item-active {
  border: 1px solid rgba(64, 169, 255, 0.6);
  background: linear-gradient(135deg, rgba(35, 70, 120, 0.8), rgba(25, 50, 90, 0.8));
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.2),
    0 0 15px rgba(32, 160, 255, 0.15),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.item-active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, rgba(64, 169, 255, 0), rgba(74, 184, 255, 0.9), rgba(64, 169, 255, 0));
  filter: blur(0.5px);
}

.item-active .item-glow {
  opacity: 0.8;
}

.resource-icon {
  margin-right: 10px;
  align-self: flex-start;
  position: relative;
  flex-shrink: 0;
}

.icon-container {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(30, 65, 120, 0.8), rgba(20, 45, 90, 0.8));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  box-shadow:
    0 3px 8px rgba(0, 0, 0, 0.2),
    0 0 8px rgba(32, 160, 255, 0.1),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

/* 图标反光效果 */
.icon-reflection {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
  border-radius: 8px 8px 0 0;
  pointer-events: none;
  z-index: 2;
}

.resource-item:hover .icon-container {
  background: linear-gradient(135deg, rgba(40, 80, 140, 0.8), rgba(30, 60, 110, 0.8));
  transform: translateY(-2px);
  box-shadow:
    0 5px 10px rgba(0, 0, 0, 0.25),
    0 0 10px rgba(32, 160, 255, 0.15),
    inset 0 0 0 1px rgba(255, 255, 255, 0.15);
}

.item-active .icon-container {
  background: linear-gradient(135deg, rgba(50, 100, 170, 0.8), rgba(35, 70, 130, 0.8));
  box-shadow:
    0 5px 10px rgba(0, 0, 0, 0.25),
    0 0 15px rgba(64, 169, 255, 0.2),
    inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.resource-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0; /* 确保内容可以被截断而不会溢出 */
}

.resource-name {
  font-weight: 600;
  font-size: 13px;
  line-height: 1.3;
  color: rgba(230, 240, 250, 0.98);
  margin-bottom: 2px;
  letter-spacing: 0.2px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.resource-description {
  font-size: 11px;
  color: rgba(180, 210, 230, 0.85);
  line-height: 1.3;
  letter-spacing: 0.1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 高级动画效果 */
@keyframes pulsate {
  0% {
    box-shadow:
      0 0 8px rgba(32, 160, 255, 0.1),
      0 0 16px rgba(32, 160, 255, 0);
  }
  50% {
    box-shadow:
      0 0 8px rgba(32, 160, 255, 0.2),
      0 0 16px rgba(32, 160, 255, 0.1);
  }
  100% {
    box-shadow:
      0 0 8px rgba(32, 160, 255, 0.1),
      0 0 16px rgba(32, 160, 255, 0);
  }
}

.item-active .icon-container {
  animation: pulsate 2s infinite ease-in-out;
}

/* 修复媒体查询，确保在小屏幕上能显示所有内容 */
@media (max-width: 1600px) {
  .resources-content {
    padding: 8px;
    gap: 8px;
  }

  .resource-column {
    padding: 8px;
  }

  .column-title {
    font-size: 12px;
    padding: 5px 0;
    margin-bottom: 6px;
  }

  .resource-item {
    padding: 6px 8px;
    min-height: 40px;
    margin-bottom: 6px;
  }

  .icon-container {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }

  .resource-name {
    font-size: 12px;
  }

  .resource-description {
    font-size: 10px;
  }
}
</style>
