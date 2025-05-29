<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue'

const props = defineProps<{
  markdown: string
  isEvaluating: boolean
  evalError: string
  showEvalBtn: boolean
}>()

const emit = defineEmits<{
  (e: 'back-edit'): void
  (e: 'show-eval'): void
}>()
</script>

<template>
  <div class="summary-container">
    <div class="summary-header">
      <div class="title-with-status">
        <h3 class="summary-title">配置摘要</h3>
        <div class="execution-status">
          <div v-if="props.isEvaluating" class="status-spinner"></div>
          <span v-else-if="props.evalError" class="status-icon error">❗</span>
          <span v-else class="status-icon success">✔️</span>
          <span class="status-text">
            {{ props.isEvaluating ? '正在执行' : props.evalError ? '执行异常' : '执行完毕' }}
          </span>
        </div>
      </div>
      <button class="back-edit-button" @click="() => emit('back-edit')">
        <span class="button-icon">⟲</span> 返回编辑
      </button>
    </div>
    <div class="markdown-content">
      <MarkdownRenderer :content="props.markdown" />
    </div>
    <transition name="fade">
      <div v-if="props.showEvalBtn" class="eval-action-bar">
        <button class="eval-btn" @click="() => emit('show-eval')">
          <span class="button-icon">🚀</span> 查看评估报告
        </button>
      </div>
    </transition>
  </div>
</template>

<style scoped lang="scss">
.summary-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 15px 15px;
  overflow: hidden;
  .summary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 0 10px;
    .title-with-status {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .summary-title {
      font-size: 18px;
      color: rgba(220, 240, 255, 0.95);
      margin: 0;
    }
    .execution-status {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      background: rgba(20, 60, 100, 0.6);
      border: 1px solid rgba(64, 169, 255, 0.4);
      border-radius: 20px;
      font-size: 12px;
      color: rgba(220, 240, 255, 0.9);
      .status-spinner {
        width: 16px;
        height: 16px;
        min-width: 16px;
        min-height: 16px;
        margin-right: 2px;
        display: inline-block;
        vertical-align: middle;
        border: 2px solid rgba(64, 169, 255, 0.3);
        border-top: 2px solid rgba(64, 169, 255, 0.8);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        box-sizing: border-box;
      }
      .status-icon {
        font-size: 16px;
        margin-right: 2px;
        line-height: 1;
        vertical-align: middle;
        display: flex;
        align-items: center;
      }
      .status-icon.success {
        color: #52c41a;
      }
      .status-icon.error {
        color: #ff4d4f;
      }
      .status-text {
        font-weight: 500;
        display: flex;
        align-items: center;
      }
    }
    .back-edit-button {
      display: flex;
      align-items: center;
      padding: 8px 16px;
      background: rgba(64, 169, 255, 0.15);
      color: rgb(255, 255, 255);
      border: 1px solid rgba(64, 169, 255, 0.3);
      border-radius: 6px;
      cursor: pointer;
      font-size: 15px;
      font-weight: 500;
      transition: all 0.2s ease;
      .button-icon {
        margin-right: 6px;
        font-size: 16px;
      }
      &:hover {
        background: rgba(64, 169, 255, 0.35);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(64, 169, 255, 0.2);
      }
    }
  }
  .markdown-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background: rgba(10, 15, 25, 0.3);
    border-radius: 8px;
    border: 1px solid rgba(64, 169, 255, 0.15);
    &::-webkit-scrollbar {
      width: 6px;
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
