<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue'

const props = defineProps<{
  markdown: string
  isEvaluating: boolean
  evalError: string
}>()

const emit = defineEmits<{
  (e: 'back-summary'): void
}>()

// 导出评估结果为markdown文件
const exportMarkdown = () => {
  if (!props.markdown || props.isEvaluating) return

  const blob = new Blob([props.markdown], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  const date = new Date()
  const fileName = `evaluation-result-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.md`

  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="eval-result-panel">
    <div class="eval-result-header">
      <span class="eval-title">专家评估结果</span>
      <div class="eval-actions">
        <button class="export-button" @click="exportMarkdown" :disabled="isEvaluating || !!evalError">
          <span class="button-icon">⬇️</span> 导出结果
        </button>
        <button class="back-edit-button" @click="() => emit('back-summary')">
          <span class="button-icon">⟲</span> 返回查看配置
        </button>
      </div>
    </div>
    <div class="eval-progress">
      <div v-if="props.isEvaluating" class="progress-spinner"></div>
      <span class="progress-text">
        {{ props.isEvaluating ? '评估进行中...' : props.evalError ? props.evalError : '评估已完成' }}
      </span>
    </div>
    <div class="eval-markdown-content">
      <MarkdownRenderer :content="props.markdown" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.eval-result-panel {
  margin-top: 0;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: rgba(20, 30, 50, 0.85);
  border-radius: 10px;
  box-shadow: 0 4px 24px rgba(64, 169, 255, 0.08);
  padding: 0 0 24px 0;
  .eval-result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 24px 8px 24px;
    .eval-title {
      font-size: 20px;
      color: #61dafb;
      font-weight: 700;
    }
    .eval-actions {
      display: flex;
      gap: 12px;
      .back-edit-button,
      .export-button {
        background: rgba(64, 169, 255, 0.15);
        color: #fff;
        border: 1px solid rgba(64, 169, 255, 0.3);
        border-radius: 6px;
        padding: 8px 16px;
        font-size: 15px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        .button-icon {
          margin-right: 6px;
          font-size: 16px;
        }
        &:hover:not(:disabled) {
          background: rgba(64, 169, 255, 0.35);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(64, 169, 255, 0.2);
        }
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
      .export-button {
        background: rgba(0, 150, 136, 0.15);
        border-color: rgba(0, 150, 136, 0.3);
        &:hover:not(:disabled) {
          background: rgba(0, 150, 136, 0.35);
          box-shadow: 0 4px 12px rgba(0, 150, 136, 0.2);
        }
      }
    }
  }
  .eval-progress {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 24px 8px 24px;
    .progress-spinner {
      width: 18px;
      height: 18px;
      border: 3px solid #61dafb44;
      border-top: 3px solid #61dafb;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    .progress-text {
      color: #fff;
      font-size: 15px;
      font-weight: 500;
    }
  }
  .eval-markdown-content {
    flex: 1;
    min-height: 120px;
    overflow-y: auto;
    margin: 0 24px;
    background: rgba(10, 15, 25, 0.18);
    border-radius: 6px;
    border: 1px solid rgba(64, 169, 255, 0.1);
    padding: 18px 18px 12px 18px;
    margin-top: 8px;
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
</style>
