<script setup lang="ts">
/**
 * @description 资源展示面板组件
 * 
 * 该组件显示应用中的资源信息列表，包含以下功能：
 * 1. 显示三类资源：人力资源、物料资源和业务信息
 * 2. 统一的布局和样式设计
 * 3. 简洁的视觉呈现，便于用户快速了解资源信息
 */

// 定义三类资源数据
const humanResources = [
  { id: 1, name: '工程师', description: '化工工艺专家 (12人)', icon: '👨‍🔬' },
  { id: 2, name: '操作员', description: '设备操作人员 (28人)', icon: '👨‍🏭' },
  { id: 3, name: '安全员', description: '安全监督人员 (8人)', icon: '🛡️' },
];

const materialResources = [
  { id: 1, name: '原料库存', description: '乙烯 (85吨)', icon: '🧪' },
  { id: 2, name: '催化剂', description: '钯碳催化剂 (12kg)', icon: '⚗️' },
  { id: 3, name: '储罐容量', description: '液化气储罐 (65%)', icon: '🔋' },
];

const businessInfo = [
  { id: 1, name: '生产计划', description: '聚合物生产 (92%)', icon: '📊' },
  { id: 2, name: '订单状态', description: '待处理订单 (7个)', icon: '📋' },
  { id: 3, name: '质检报告', description: '合格率 (98.5%)', icon: '✅' },
];
</script>

<template>
  <div class="resources-display">
    <div class="resources-content">
      <!-- 人力资源列 -->
      <div class="resource-column">
        <div class="column-title">人力资源</div>
        <div class="column-items">
          <div class="resource-item" v-for="item in humanResources" :key="item.id">
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
          <div class="resource-item" v-for="item in materialResources" :key="item.id">
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
  transition: transform 0.2s, box-shadow 0.2s;
}

.resource-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.06);
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