<script setup lang="ts">
/**
 * EvaluationSystem.vue - 评价体系组件
 *
 * 该组件负责显示评价体系相关内容
 * 从主控制组件中拆分出来，使代码结构更加清晰
 */
import { ref } from 'vue'
import MultiLevelIndicatorTable from '@/components/tables/MultiLevelIndicatorTable.vue'

// 指标项接口定义
interface IndicatorItem {
  id: string
  name: string
  children?: IndicatorItem[]
  value?: number | string
  editable?: boolean
  colSpan?: number
}

// 定义组件向外发出的事件
const emit = defineEmits(['close'])

// 表格数据
const tableData = ref<IndicatorItem[]>([])

// 数据变更处理
const handleDataChange = (newData: IndicatorItem[]) => {
  tableData.value = newData
  // 可以在这里添加保存数据的逻辑
}

/**
 * 关闭窗口
 * 调用父组件的关闭方法
 */
const close = () => {
  emit('close')
}
</script>

<template>
  <!-- 评价体系浮窗 -->
  <transition name="fade">
    <div class="overlay" @click="close">
      <div class="floating-window evaluation-window-container" @click.stop>
        <div class="corner top-left"></div>
        <div class="corner top-right"></div>
        <div class="corner bottom-left"></div>
        <div class="corner bottom-right"></div>

        <button class="close-btn" @click="close">
          <span class="close-icon">×</span>
        </button>

        <div class="window-content">
          <!-- 评价体系内容 -->
          <div class="evaluation-window">
            <h2 class="window-title">评价体系</h2>
            <div class="title-underline"></div>

            <div class="form-container">
              <!-- 使用多级指标表格组件 -->
              <MultiLevelIndicatorTable v-model:data="tableData" @change="handleDataChange" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style lang="scss" scoped>
@use './styles/common-window.scss';

/* 评价体系窗口特定样式 */
.floating-window {
  top: 0%;
}

.evaluation-window-container {
  width: 90%;
  max-width: 1200px;
  height: 800px;
  display: flex;
  flex-direction: column;
}

.evaluation-window {
  flex: 1;
  display: flex;
  flex-direction: column;

  .window-title {
    margin-bottom: 10px;
  }

  .title-underline {
    margin-bottom: 25px;
  }

  .form-container {
    height: 500px;
    overflow-y: auto;
    padding: 0 15px 15px;
    display: flex;
    justify-content: center;
    max-width: 1100px;

    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(20, 30, 50, 0.2);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(64, 169, 255, 0.5);
      border-radius: 3px;
    }
  }
}
</style>
