<script setup lang="ts">
/**
 * ExpertConfigModal.vue - 专家配置弹窗组件
 *
 * 用于编辑专家的基本信息和评价提示语
 */
import { ref, watch, nextTick } from 'vue'
import type { FullExpertInfo } from '@/stores/evaluationStore'

// Props
interface Props {
  visible: boolean
  expert: FullExpertInfo | null
}

// Emits
interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'save', data: { name: string; desc: string; prompt: string }): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 表单数据
const editForm = ref({
  name: '',
  desc: '',
  prompt: '',
})

// 输入框引用
const nameInputRef = ref<HTMLInputElement | null>(null)

// 监听专家数据变化，更新表单
watch(
  () => props.expert,
  (expert) => {
    if (expert) {
      editForm.value = {
        name: expert.name,
        desc: expert.desc || '',
        prompt: expert.prompt || '',
      }
    }
  },
  { immediate: true },
)

// 监听弹窗显示状态，处理自动聚焦
watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      // 等待DOM更新后自动聚焦到第一个输入框
      await nextTick()
      if (nameInputRef.value) {
        nameInputRef.value.focus()
      }
    }
  },
)

// 处理保存
const handleSave = () => {
  emit('save', { ...editForm.value })
}

// 处理取消/关闭
const handleCancel = () => {
  emit('update:visible', false)
  emit('cancel')
}

// 处理遮罩层点击
const handleOverlayClick = () => {
  handleCancel()
}

// 阻止弹窗内容区域的点击事件冒泡
const handleModalClick = (event: Event) => {
  event.stopPropagation()
}

// 处理键盘事件阻止冒泡
const handleKeydown = (event: KeyboardEvent) => {
  event.stopPropagation()
}
</script>

<template>
  <div v-if="visible" class="config-modal-overlay" @click="handleOverlayClick" @keydown="handleKeydown">
    <div class="config-modal" @click="handleModalClick" tabindex="-1">
      <h3 class="modal-title">编辑专家信息</h3>
      <div class="modal-content">
        <label for="expert-name" class="modal-label">姓名</label>
        <input
          id="expert-name"
          ref="nameInputRef"
          v-model="editForm.name"
          type="text"
          class="modal-input"
          placeholder="请输入专家姓名"
          @keydown.stop
        />

        <label for="expert-desc" class="modal-label">简介</label>
        <textarea
          id="expert-desc"
          v-model="editForm.desc"
          class="modal-textarea"
          placeholder="请输入专家简介"
          rows="3"
          @keydown.stop
        ></textarea>

        <label for="expert-prompt" class="modal-label">评价提示语</label>
        <textarea
          id="expert-prompt"
          v-model="editForm.prompt"
          class="modal-textarea"
          placeholder="请输入专家评价提示语"
          rows="5"
          @keydown.stop
        ></textarea>
      </div>
      <div class="modal-actions">
        <button class="modal-save-btn" @click="handleSave">保存</button>
        <button class="modal-cancel-btn" @click="handleCancel">取消</button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$text-color: rgba(220, 240, 255, 0.95);
$border-color: rgba(64, 169, 255, 0.3);
$accent-color: rgba(64, 169, 255, 0.6);
$bg-gradient-start: rgba(20, 30, 50, 0.98);
$bg-gradient-end: rgba(12, 22, 40, 0.98);

.config-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.config-modal {
  background: linear-gradient(135deg, $bg-gradient-start, $bg-gradient-end);
  border: 1px solid rgba(64, 169, 255, 0.2);
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 450px;
  min-width: 400px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 20px rgba(64, 169, 255, 0.1);
  position: relative;
  animation: modalSlideIn 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(64, 169, 255, 0.5), transparent);
  }

  .modal-title {
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 24px 0;
    color: $text-color;
    text-align: center;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 40px;
      height: 2px;
      background: linear-gradient(90deg, transparent, $accent-color, transparent);
      border-radius: 1px;
    }
  }

  .modal-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .modal-label {
    font-size: 14px;
    font-weight: 500;
    color: $text-color;
    margin-bottom: 6px;
    display: flex;
    align-items: center;

    &::before {
      content: '';
      display: inline-block;
      width: 3px;
      height: 14px;
      background: $accent-color;
      border-radius: 2px;
      margin-right: 8px;
    }
  }

  .modal-input,
  .modal-textarea {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(64, 169, 255, 0.25);
    border-radius: 6px;
    padding: 12px 14px;
    font-size: 14px;
    color: $text-color;
    width: 100%;
    box-sizing: border-box;
    transition: all 0.3s ease;
    font-family: inherit;

    &::placeholder {
      color: rgba(220, 240, 255, 0.5);
      font-style: italic;
    }

    &:focus {
      outline: none;
      border-color: $accent-color;
      background: rgba(255, 255, 255, 0.12);
      box-shadow:
        0 0 0 3px rgba(64, 169, 255, 0.1),
        inset 0 1px 3px rgba(0, 0, 0, 0.2);
      transform: translateY(-1px);
    }

    &:hover:not(:focus) {
      border-color: rgba(64, 169, 255, 0.4);
      background: rgba(255, 255, 255, 0.1);
    }
  }

  .modal-textarea {
    resize: vertical;
    min-height: 60px;
    max-height: 200px;
    line-height: 1.5;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid rgba(64, 169, 255, 0.1);
  }

  .modal-save-btn,
  .modal-cancel-btn {
    border: none;
    border-radius: 6px;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      transition:
        width 0.6s,
        height 0.6s;
    }

    &:active::before {
      width: 300px;
      height: 300px;
    }
  }

  .modal-save-btn {
    background: linear-gradient(135deg, $accent-color, rgba(64, 169, 255, 0.8));
    color: #0a1525;
    box-shadow: 0 3px 12px rgba(64, 169, 255, 0.3);

    &:hover {
      background: linear-gradient(135deg, rgba(64, 169, 255, 0.8), rgba(64, 169, 255, 0.9));
      box-shadow: 0 5px 15px rgba(64, 169, 255, 0.4);
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .modal-cancel-btn {
    background: rgba(255, 255, 255, 0.1);
    color: $text-color;
    border: 1px solid rgba(255, 255, 255, 0.2);

    &:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .config-modal {
    width: 95%;
    min-width: unset;
    max-width: 90vw;
    padding: 20px;
    margin: 20px;

    .modal-title {
      font-size: 18px;
    }

    .modal-actions {
      flex-direction: column;
      gap: 8px;

      .modal-save-btn,
      .modal-cancel-btn {
        width: 100%;
        justify-content: center;
      }
    }
  }
}
</style>
