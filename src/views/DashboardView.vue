<script setup lang="ts">
import MainLayout from '../components/layouts/MainLayout.vue'
import ChartContainer from '../components/layouts/ChartContainer.vue'
import ScrollingSensorList from '../components/charts/ScrollingSensorList.vue'
import ScrollingLogList from '../components/charts/ScrollingLogList.vue'
import UnityContainer from '../components/display/UnityContainer.vue'
import ControlButtons from '../components/controls/ControlButtons.vue'
import ResourcesPanel from '../components/display/ResourcesPanel.vue'
import ChartCarousel from '../components/layouts/ChartCarousel.vue'
import EventResponseRadarChart from '../components/charts/EventResponseRadarChart.vue'
import ChemicalKnowledgeGraph from '../components/charts/ChemicalKnowledgeGraph.vue'
import ScrollingRegionList from '../components/charts/ScrollingRegionList.vue'
import { onMounted } from 'vue'

// 接收路由参数
const props = defineProps<{
  industry: string
}>()

// 组件挂载时打印当前行业信息
onMounted(() => {
  console.log(`当前仪表板行业: ${props.industry}`)
  // 确保sessionStorage中的行业信息与路由参数一致
  sessionStorage.setItem('selectedIndustry', props.industry)
})
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
        <ScrollingRegionList />
      </ChartContainer>

      <ChartContainer>
        <ChartCarousel />
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
