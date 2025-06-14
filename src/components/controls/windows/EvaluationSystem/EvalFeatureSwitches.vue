<script setup lang="ts">
import { useEvaluationStore } from '@/stores/evaluationStore'

const evaluationStore = useEvaluationStore()

const toggleFeature = (feature: 'debate' | 'indicators' | 'adversarial') => {
  evaluationStore.toggleAITool(feature)
}
</script>

<template>
  <div class="ai-features-section">
    <h3 class="section-title">智能评价工具</h3>
    <div class="feature-buttons">
      <button
        class="feature-button"
        :class="{ active: evaluationStore.aiDebateEnabled }"
        @click="() => toggleFeature('debate')"
      >
        <span class="button-icon">🔄</span>
        <span class="button-text">多智能体辩论评价</span>
      </button>
      <button
        class="feature-button"
        :class="{ active: evaluationStore.autoIndicatorsEnabled }"
        @click="() => toggleFeature('indicators')"
      >
        <span class="button-icon">📊</span>
        <span class="button-text">评价指标自生成</span>
      </button>
      <button
        class="feature-button"
        :class="{ active: evaluationStore.adversarialEvaluationEnabled }"
        @click="() => toggleFeature('adversarial')"
      >
        <span class="button-icon">⚖️</span>
        <span class="button-text">对抗式评价判别</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.ai-features-section {
  margin-top: 10px;
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
</style>
