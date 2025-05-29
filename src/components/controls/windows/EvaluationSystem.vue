<script setup lang="ts">
/**
 * EvaluationSystem.vue - 评价体系组件
 *
 * 该组件负责显示评价体系相关内容
 */
import { ref } from 'vue'
import { useEvaluationStore } from '@/stores/evaluationStore'
import EvaluationSystemAPI from '@/apis/EvaluationSystem'
import EvalReport from './EvaluationSystem/EvalReport.vue'
import EvaluationConfigFlow from './EvaluationSystem/EvaluationConfigFlow.vue'

// 定义组件向外发出的事件
const emit = defineEmits(['close'])

// 使用评价体系store
const evaluationStore = useEvaluationStore()

// 视图状态控制
const isTransitioning = ref(false)

// 评估结果相关状态
const isEvaluating = ref(false) // 是否正在评估
const showEvalResult = ref(false) // 是否展示评估结果
const evalResultMarkdown = ref('') // 评估结果markdown内容
const evalError = ref('') // 错误信息
const abortController = ref<AbortController | null>(null)

// 数据变更处理
// const handleDataChange = (newData: IndicatorItem[]) => { ... }

// 提交处理函数
// const handleSubmit = async () => { ... }

// 评估流式请求（提交后自动调用）
const startEvaluation = async (evaluationData: any) => {
  isEvaluating.value = true
  showEvalResult.value = false // 默认先不显示评估报告
  evalResultMarkdown.value = ''
  evalError.value = ''
  abortController.value = new AbortController()
  try {
    await EvaluationSystemAPI.evalLLMStream(
      evaluationData,
      (msg: any) => {
        console.log('msg', msg)
        if (msg?.type === 'expert_response') {
          evalResultMarkdown.value += `\n**专家：${msg.expert_name}**（第${msg.round}轮）\n\n${msg.response}\n\n---\n`
        } else if (msg?.type === 'summary') {
          evalResultMarkdown.value += `\n## 🏁 最终报告\n\n${msg.content}\n\n`
        } else if (msg?.content) {
          evalResultMarkdown.value += msg.content
        }
      },
      { signal: abortController.value.signal },
    )
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      evalError.value = '已中断评估。'
    } else {
      evalError.value = '评估过程中发生错误。'
      console.error(err)
    }
  } finally {
    isEvaluating.value = false
    abortController.value = null
  }
}

// 用户点击"查看评估报告"
// const handleShowEvalResult = () => { ... }

// 用户点击"返回配置信息"
const handleBackToSummary = () => {
  showEvalResult.value = false
}

// 用户点击"返回编辑"
const handleBackToEdit = () => {
  // 中断流式请求
  abortController.value?.abort()
  // 重置所有评估相关状态
  showEvalResult.value = false
  evalResultMarkdown.value = ''
  evalError.value = ''
  isEvaluating.value = false
  abortController.value = null
  evaluationStore.setSubmitted(false)
}

// 重置处理函数
// const handleReset = () => { ... }

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
    <div class="overlay" v-if="true" @click="close">
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

            <!-- 过渡动画遮罩 -->
            <transition name="loading">
              <div v-if="isTransitioning" class="loading-overlay">
                <div class="loading-spinner"></div>
                <div class="loading-text">正在处理配置数据...</div>
              </div>
            </transition>

            <!-- 表单容器 -->
            <transition name="slide-fade" mode="out-in">
              <!-- 配置表单与摘要视图 -->
              <template v-if="!evaluationStore.isSubmitted || !showEvalResult">
                <EvaluationConfigFlow
                  :isEvaluating="isEvaluating"
                  :evalError="evalError"
                  :evalResultMarkdown="evalResultMarkdown"
                  :showEvalBtn="true"
                  @submitted="startEvaluation"
                  @back-edit="handleBackToEdit"
                  @show-eval="showEvalResult = true"
                />
              </template>
              <!-- 评估报告视图 -->
              <EvalReport
                v-else
                :markdown="evalResultMarkdown"
                :isEvaluating="isEvaluating"
                :evalError="evalError"
                @back-summary="handleBackToSummary"
              />
            </transition>
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
  position: relative;

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

      &:hover:not(:disabled) {
        transform: translateY(-2px);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .submit-button {
      background: rgba(0, 120, 212, 0.8);
      color: white;
      border: 1px solid rgba(0, 150, 255, 0.5);

      &:hover:not(:disabled) {
        background: rgba(0, 140, 230, 0.9);
        box-shadow: 0 4px 12px rgba(0, 120, 212, 0.3);
      }
    }

    .reset-button {
      background: rgba(40, 50, 70, 0.7);
      color: rgba(220, 240, 255, 0.9);
      border: 1px solid rgba(100, 120, 150, 0.5);

      &:hover:not(:disabled) {
        background: rgba(50, 60, 80, 0.8);
        box-shadow: 0 4px 12px rgba(20, 30, 50, 0.3);
      }
    }
  }

  // 加载动画样式
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(10, 15, 25, 0.9);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(4px);

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(64, 169, 255, 0.3);
      border-top: 3px solid rgba(64, 169, 255, 0.8);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    .loading-text {
      color: rgba(220, 240, 255, 0.9);
      font-size: 16px;
    }
  }
}

// 动画定义
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
// 过渡动画
.loading-enter-active,
.loading-leave-active {
  transition: opacity 0.3s ease;
}

.loading-enter-from,
.loading-leave-to {
  opacity: 0;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.5s ease;
}

.slide-fade-enter-from {
  transform: translateX(30px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-30px);
  opacity: 0;
}

.eval-action-bar {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  .eval-btn {
    background: linear-gradient(90deg, #40a9ff 0%, #61dafb 100%);
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 12px 32px;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(64, 169, 255, 0.15);
    transition: all 0.2s;
    .button-icon {
      margin-right: 8px;
      font-size: 20px;
    }
    &:hover {
      background: linear-gradient(90deg, #61dafb 0%, #40a9ff 100%);
      box-shadow: 0 4px 16px rgba(64, 169, 255, 0.25);
      transform: translateY(-2px);
    }
  }
}
</style>
