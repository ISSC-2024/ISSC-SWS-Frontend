<script setup lang="ts">
import { ref, nextTick, defineProps, defineEmits } from 'vue'
import MultiLevelIndicatorTable, {
  type IndicatorItem,
} from '@/components/controls/windows/EvaluationSystem/MultiLevelIndicatorTable.vue'
import ExpertCardCarousel from '@/components/controls/windows/EvaluationSystem/ExpertCardCarousel.vue'
import { useEvaluationStore } from '@/stores/evaluationStore'
import { validateEvaluationData, processIndicators, generateConfigMarkdown } from '@/utils/evaluationUtils'
import EvalFeatureSwitches from '@/components/controls/windows/EvaluationSystem/EvalFeatureSwitches.vue'
import ConfigSummary from './ConfigSummary.vue'

const props = defineProps({
  isEvaluating: Boolean,
  evalError: String,
  evalResultMarkdown: String,
  showEvalBtn: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['submitted', 'back-edit', 'show-eval'])

const evaluationStore = useEvaluationStore()
const expertCarouselRef = ref<InstanceType<typeof ExpertCardCarousel> | null>(null)
const indicatorTableRef = ref<InstanceType<typeof MultiLevelIndicatorTable> | null>(null)
const isTransitioning = ref(false)
const abortController = ref<AbortController | null>(null)

const handleDataChange = (newData: IndicatorItem[]) => {
  evaluationStore.updateIndicatorData(newData)
}

const handleSubmit = async () => {
  try {
    isTransitioning.value = true
    const storeExperts = evaluationStore.selectedExperts
    const selectedExperts = storeExperts.map((expert) => ({
      id: expert.id,
      name: expert.name,
      desc: expert.desc || '',
      prompt: expert.prompt || '',
    }))
    const currentTableData = indicatorTableRef.value?.getCurrentData() || []
    const aiTools = evaluationStore.getEnabledAITools()
    const evaluationData = {
      experts: selectedExperts,
      indicators: {
        id: 'root',
        name: '智能化园区评价指标体系',
        children: processIndicators(currentTableData),
      },
      tools: aiTools,
    }
    const validationResult = validateEvaluationData(evaluationData)
    if (!validationResult.valid) {
      alert('提交数据格式不符合要求，请检查配置后重新提交。')
      isTransitioning.value = false
      return
    }
    evaluationStore.setSelectedExperts(evaluationData.experts)
    evaluationStore.updateIndicatorData(currentTableData)
    const markdownContent = generateConfigMarkdown(evaluationData)
    evaluationStore.setMarkdownContent(markdownContent)
    await new Promise((resolve) => setTimeout(resolve, 800))
    await nextTick()
    evaluationStore.setSubmitted(true)
    await nextTick()
    isTransitioning.value = false
    emit('submitted', evaluationData)
    return evaluationData
  } catch (error) {
    alert('提交数据时出错，请查看控制台获取详情')
    await nextTick()
    isTransitioning.value = false
    throw error
  }
}

const handleReset = () => {
  evaluationStore.resetAll()
}

const handleBackToEdit = () => {
  abortController.value?.abort()
  evaluationStore.setSubmitted(false)
  emit('back-edit')
}
</script>

<template>
  <div class="evaluation-config-flow">
    <transition name="loading">
      <div v-if="isTransitioning" class="loading-overlay">
        <div class="loading-spinner"></div>
        <div class="loading-text">正在处理配置数据...</div>
      </div>
    </transition>
    <transition name="slide-fade" mode="out-in">
      <div v-if="!evaluationStore.isSubmitted" key="form" class="form-container">
        <div class="experts-section">
          <h3 class="section-title">评价专家团队</h3>
          <div class="experts-carousel-wrapper">
            <ExpertCardCarousel ref="expertCarouselRef" />
          </div>
        </div>
        <div class="indicators-section">
          <h3 class="section-title">评价指标体系</h3>
          <MultiLevelIndicatorTable @change="handleDataChange" ref="indicatorTableRef" />
        </div>
        <EvalFeatureSwitches />
        <div class="action-buttons">
          <button class="submit-button" @click="() => handleSubmit().catch(console.error)" :disabled="isTransitioning">
            <span class="button-icon">✓</span>
            提交
          </button>
          <button class="reset-button" @click="handleReset" :disabled="isTransitioning">
            <span class="button-icon">↺</span>
            重置
          </button>
        </div>
      </div>
      <ConfigSummary
        v-else
        :markdown="evaluationStore.markdownContent"
        :isEvaluating="props.isEvaluating"
        :evalError="props.evalError ?? ''"
        @back-edit="handleBackToEdit"
        :showEvalBtn="props.showEvalBtn && !!props.evalResultMarkdown"
        @show-eval="emit('show-eval')"
      />
    </transition>
  </div>
</template>

<style lang="scss" scoped>
@use '../styles/common-window.scss';
// 复用原有样式
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
.indicators-section {
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
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
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
</style>
