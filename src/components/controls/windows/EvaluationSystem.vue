<script setup lang="ts">
/**
 * EvaluationSystem.vue - 评价体系组件
 *
 * 该组件负责显示评价体系相关内容
 * 从主控制组件中拆分出来，使代码结构更加清晰
 */
import { ref } from 'vue'
import MultiLevelIndicatorTable, { type IndicatorItem } from '@/components/tables/MultiLevelIndicatorTable.vue'
import ExpertCardCarousel from '@/components/cards/ExpertCardCarousel.vue'

// 定义组件向外发出的事件
const emit = defineEmits(['close'])

// 表格数据
const tableData = ref<IndicatorItem[]>([])

// 专家轮播组件引用
const expertCarouselRef = ref<InstanceType<typeof ExpertCardCarousel> | null>(null)

// 功能开关状态
const aiDebateEnabled = ref(false)
const autoIndicatorsEnabled = ref(false)
const adversarialEvaluationEnabled = ref(false)

// 数据变更处理
const handleDataChange = (newData: IndicatorItem[]) => {
  tableData.value = newData
  // 可以在这里添加保存数据的逻辑
}

// 功能开关切换处理
const toggleFeature = (feature: 'debate' | 'indicators' | 'adversarial') => {
  switch (feature) {
    case 'debate':
      aiDebateEnabled.value = !aiDebateEnabled.value
      console.log('多智能体辩论评价生成:', aiDebateEnabled.value ? '已开启' : '已关闭')
      break
    case 'indicators':
      autoIndicatorsEnabled.value = !autoIndicatorsEnabled.value
      console.log('评价指标自生成:', autoIndicatorsEnabled.value ? '已开启' : '已关闭')
      break
    case 'adversarial':
      adversarialEvaluationEnabled.value = !adversarialEvaluationEnabled.value
      console.log('对抗式评价判别:', adversarialEvaluationEnabled.value ? '已开启' : '已关闭')
      break
  }
}

// 提交处理函数
const handleSubmit = () => {
  console.log('提交评价数据')
  // 后续可以添加提交逻辑
}

// 重置处理函数
const handleReset = () => {
  console.log('重置评价数据')
  // 后续可以添加重置逻辑
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
              <!-- 专家卡片轮播 -->
              <div class="experts-section">
                <h3 class="section-title">评价专家团队</h3>
                <div class="experts-carousel-wrapper">
                  <ExpertCardCarousel ref="expertCarouselRef" />
                </div>
              </div>

              <!-- 多级指标表格部分 -->
              <div class="indicators-section">
                <h3 class="section-title">评价指标体系</h3>
                <MultiLevelIndicatorTable v-model:data="tableData" @change="handleDataChange" />
              </div>

              <!-- 智能评价功能开关 -->
              <div class="ai-features-section">
                <h3 class="section-title">智能评价工具</h3>
                <div class="feature-buttons">
                  <button class="feature-button" :class="{ active: aiDebateEnabled }" @click="toggleFeature('debate')">
                    <span class="button-icon">🔄</span>
                    <span class="button-text">多智能体辩论评价</span>
                  </button>

                  <button
                    class="feature-button"
                    :class="{ active: autoIndicatorsEnabled }"
                    @click="toggleFeature('indicators')"
                  >
                    <span class="button-icon">📊</span>
                    <span class="button-text">评价指标自生成</span>
                  </button>

                  <button
                    class="feature-button"
                    :class="{ active: adversarialEvaluationEnabled }"
                    @click="toggleFeature('adversarial')"
                  >
                    <span class="button-icon">⚖️</span>
                    <span class="button-text">对抗式评价判别</span>
                  </button>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="action-buttons">
                <button class="submit-button" @click="handleSubmit">
                  <span class="button-icon">✓</span>
                  提交
                </button>
                <button class="reset-button" @click="handleReset">
                  <span class="button-icon">↺</span>
                  重置
                </button>
              </div>
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
  top: 2%;
}

.evaluation-window-container {
  width: 90%;
  max-width: 1200px;
  height: 900px;
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
    margin-bottom: 20px;
  }

  .form-container {
    overflow-y: auto;
    padding: 0 15px 15px;
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 1100px;
    margin: 0 auto;
    position: relative;

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

  .experts-section,
  .indicators-section,
  .ai-features-section {
    width: 100%;
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;

    .section-title {
      font-size: 16px;
      color: rgba(220, 240, 255, 0.95);
      margin-bottom: 6px;
      position: relative;
      padding-left: 15px;

      &:before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 4px;
        height: 16px;
        background: rgba(64, 169, 255, 0.8);
        border-radius: 2px;
      }
    }
  }

  .experts-section {
    flex: 0.8;
    min-height: 220px;

    .experts-carousel-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
  }

  .ai-features-section {
    margin-top: 10px;

    .feature-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      justify-content: center;
      margin-top: 10px;

      .feature-button {
        display: flex;
        align-items: center;
        padding: 8px 16px;
        background: rgba(20, 30, 50, 0.7);
        border: 1px solid rgba(64, 169, 255, 0.3);
        border-radius: 6px;
        color: rgba(220, 240, 255, 0.9);
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 180px;

        &:hover {
          background: rgba(30, 40, 60, 0.8);
          border-color: rgba(64, 169, 255, 0.5);
          transform: translateY(-2px);
        }

        &.active {
          background: rgba(20, 60, 100, 0.7);
          border-color: rgba(64, 169, 255, 0.8);
          box-shadow: 0 0 10px rgba(64, 169, 255, 0.3);
        }

        .button-icon {
          margin-right: 8px;
          font-size: 18px;
        }

        .button-text {
          font-size: 14px;
        }
      }
    }
  }

  .action-buttons {
    width: 100%;
    display: flex;
    justify-content: center;
    gap: 30px;
    margin-top: 25px;
    padding-bottom: 20px;

    button {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px 30px;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      .button-icon {
        margin-right: 8px;
      }

      &:hover {
        transform: translateY(-2px);
      }
    }

    .submit-button {
      background: rgba(0, 120, 212, 0.8);
      color: white;
      border: 1px solid rgba(0, 150, 255, 0.5);

      &:hover {
        background: rgba(0, 140, 230, 0.9);
        box-shadow: 0 4px 12px rgba(0, 120, 212, 0.3);
      }
    }

    .reset-button {
      background: rgba(40, 50, 70, 0.7);
      color: rgba(220, 240, 255, 0.9);
      border: 1px solid rgba(100, 120, 150, 0.5);

      &:hover {
        background: rgba(50, 60, 80, 0.8);
        box-shadow: 0 4px 12px rgba(20, 30, 50, 0.3);
      }
    }
  }
}
</style>
