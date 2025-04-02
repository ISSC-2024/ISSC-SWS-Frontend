<script setup lang="ts">
import MainLayout from '../components/layouts/MainLayout.vue';
import ChartContainer from '../components/layouts/ChartContainer.vue';
import ScrollingSensorList from '../components/charts/ScrollingSensorList.vue';
import ScrollingLogList from '../components/charts/ScrollingLogList.vue';
import UnityContainer from '../components/display/UnityContainer.vue';
import ControlButtons from '../components/controls/ControlButtons.vue';
import ResourcesPanel from '../components/display/ResourcesPanel.vue';
import ResourceAllocationChart from '../components/charts/ResourceAllocationChart.vue';
import StaffDistributionChart from '../components/charts/StaffDistributionChart.vue';
import EventResponseRadarChart from '../components/charts/EventResponseRadarChart.vue';
import ChemicalKnowledgeGraph from '../components/charts/ChemicalKnowledgeGraph.vue';
</script>

<template>
  <MainLayout>
    <!-- 左侧列内容 - 三个图表 -->
    <template #left-column>
      <ChartContainer>
        <ScrollingSensorList />
      </ChartContainer>
      
      <ChartContainer>
        <ChemicalKnowledgeGraph />
      </ChartContainer>

      <ChartContainer>
        <ScrollingLogList />
      </ChartContainer>
    </template>
    
    <!-- 中间列WebGL内容 -->
    <template #webgl-content>
      <UnityContainer />
    </template>
    
    <!-- 中间列底部控制区 -->
    <template #controls>
      <ControlButtons />
    </template>
    
    <!-- 中间列资源展示区 -->
    <template #resources>
      <ResourcesPanel />
    </template>
    
    <!-- 右侧列内容 - 三个图表 -->
    <template #right-column>
      <ChartContainer>
        <ResourceAllocationChart />
      </ChartContainer>
      
      <ChartContainer>
        <StaffDistributionChart />
      </ChartContainer>

      <ChartContainer>
        <EventResponseRadarChart />
      </ChartContainer>
    </template>
  </MainLayout>
</template>

<style scoped>
/* 移除高度限制，因为图表现在会填充整个面板 */
</style> 