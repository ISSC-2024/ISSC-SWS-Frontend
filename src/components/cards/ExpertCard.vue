<script setup lang="ts">
/**
 * ExpertCard.vue - 专家卡片组件
 *
 * 该组件用于展示评价体系中的各类专家信息
 * 包含专家头像、姓名、简要介绍
 */
import { ref, computed, nextTick } from 'vue'
import { useEvaluationStore } from '@/stores/evaluationStore'

// 专家信息接口 - 与store保持一致
export interface ExpertInfo {
  id: string
  name: string
  avatar: string
  desc?: string
  prompt?: string
}

// 使用评价体系store
const evaluationStore = useEvaluationStore()

// 默认头像路径
const defaultAvatar = '/images/experts/default-avatar.png'

// 专家数据 - 从store获取
const expertData = computed(() => evaluationStore.getBaseExperts())

// 卡片容器的引用
const cardsElement = ref<HTMLElement | null>(null)

// 配置弹窗状态
const showConfigModal = ref(false)
const currentEditingExpert = ref<ExpertInfo | null>(null)
const editForm = ref({
  name: '',
  desc: '',
  prompt: '',
})

// 输入框引用
const nameInputRef = ref<HTMLInputElement | null>(null)

// 直接使用store中的选中专家ID列表
const selectedExpertIds = computed(() => {
  return evaluationStore.selectedExperts.map((expert) => expert.id)
})

// 计算选中专家的名称
const selectedExpertNames = computed(() => {
  return evaluationStore.selectedExperts.map((expert) => expert.name)
})

// 处理图片加载失败
const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  if (target) {
    // 设置默认头像
    target.src = defaultAvatar
    // 防止循环触发错误
    target.onerror = null
  }
}

// 处理专家卡片点击
const toggleSelectExpert = (expert: ExpertInfo) => {
  const currentExperts = evaluationStore.selectedExperts
  const existingIndex = currentExperts.findIndex((e) => e.id === expert.id)

  if (existingIndex === -1) {
    // 添加到选中列表
    evaluationStore.addExpert({
      id: expert.id,
      name: expert.name,
      desc: expert.desc || '',
      prompt: expert.prompt || '',
    })
  } else {
    // 从选中列表移除
    evaluationStore.removeExpert(expert.id)
  }

  console.log('选中专家ID:', selectedExpertIds.value)
  console.log('选中专家名称:', selectedExpertNames.value)
}

// 检查专家是否被选中
const isExpertSelected = (expertId: string) => {
  return selectedExpertIds.value.includes(expertId)
}

// 打开配置弹窗
const openConfigModal = async (expert: ExpertInfo, event: Event) => {
  event.stopPropagation() // 阻止事件冒泡
  currentEditingExpert.value = expert
  editForm.value = {
    name: expert.name,
    desc: expert.desc || '',
    prompt: expert.prompt || '',
  }
  showConfigModal.value = true

  // 等待DOM更新后自动聚焦到第一个输入框
  await nextTick()
  if (nameInputRef.value) {
    nameInputRef.value.focus()
  }
}

// 关闭配置弹窗
const closeConfigModal = () => {
  showConfigModal.value = false
  currentEditingExpert.value = null
}

// 保存配置
const saveConfig = () => {
  if (!currentEditingExpert.value) return

  // 使用 store 的 updateBaseExpert 方法更新基础专家数据
  evaluationStore.updateBaseExpert(currentEditingExpert.value.id, {
    name: editForm.value.name,
    desc: editForm.value.desc,
    prompt: editForm.value.prompt,
  })

  closeConfigModal()
}

// 暴露卡片元素和状态给父组件
defineExpose({
  cardsElement,
  selectedExpertIds,
  selectedExpertNames,
})
</script>

<template>
  <div class="expert-card-container">
    <div class="expert-cards" ref="cardsElement">
      <div
        v-for="expert in expertData"
        :key="expert.id"
        class="expert-card"
        :class="{ selected: isExpertSelected(expert.id) }"
        @click="toggleSelectExpert(expert)"
      >
        <div class="expert-avatar">
          <img :src="expert.avatar" :alt="expert.name" @error="handleImageError" class="avatar-img" />
        </div>
        <div class="expert-info">
          <h3 class="expert-name">{{ expert.name }}</h3>
          <p class="expert-intro">{{ expert.desc }}</p>
        </div>
        <div class="select-indicator" v-show="isExpertSelected(expert.id)">✓</div>
        <div class="config-icon" @click="openConfigModal(expert, $event)">📖</div>
      </div>
    </div>
    <!-- 配置弹窗 -->
    <div v-if="showConfigModal" class="config-modal-overlay" @click="closeConfigModal" @keydown.stop>
      <div class="config-modal" @click.stop tabindex="-1">
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
          <button class="modal-save-btn" @click="saveConfig">保存</button>
          <button class="modal-cancel-btn" @click="closeConfigModal">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$text-color: rgba(220, 240, 255, 0.95);
$border-color: rgba(64, 169, 255, 0.3);
$accent-color: rgba(64, 169, 255, 0.6);
$bg-gradient-start: rgba(20, 30, 50, 0.95);
$bg-gradient-end: rgba(12, 22, 40, 0.95);

.expert-card-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;

  .expert-cards {
    display: flex;
    overflow-x: auto;
    padding: 10px 0;
    scroll-behavior: smooth;
    gap: 15px;
    scrollbar-width: none;
    -ms-overflow-style: none;
    height: auto;
    width: 100%;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .expert-card {
    min-width: 180px;
    max-width: 200px;
    background: linear-gradient($bg-gradient-start, $bg-gradient-end);
    border: 1px solid $border-color;
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition:
      transform 0.2s,
      box-shadow 0.2s,
      border-color 0.2s;
    height: 180px;
    justify-content: space-between;
    position: relative;
    cursor: pointer;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
      border-color: $accent-color;
    }

    &.selected {
      border-color: rgba(64, 255, 170, 0.8);
      box-shadow: 0 0 15px rgba(64, 255, 170, 0.4);
      background: linear-gradient(rgba(25, 35, 55, 0.95), rgba(15, 25, 45, 0.95));
    }

    .expert-avatar {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid $accent-color;
      margin-bottom: 8px;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .expert-info {
      text-align: center;
      width: 100%;

      .expert-name {
        font-size: 15px;
        font-weight: 500;
        margin: 0 0 6px 0;
        color: $text-color;
      }
      .expert-intro {
        font-size: 12px;
        color: rgba(220, 240, 255, 0.8);
        margin: 0;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        line-clamp: 3;
        -webkit-box-orient: vertical;
        line-height: 1.3;
      }
    }
    .select-indicator {
      position: absolute;
      top: 5px;
      right: 5px;
      width: 22px;
      height: 22px;
      background: rgba(64, 255, 170, 0.8);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0a1525;
      font-weight: bold;
      font-size: 14px;
    }

    .config-icon {
      position: absolute;
      top: 5px;
      left: 5px;
      width: 22px;
      height: 22px;
      background: rgba(255, 193, 7, 0.8);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      z-index: 10;

      &:hover {
        background: rgba(255, 193, 7, 1);
        transform: scale(1.1);
      }
    }
  }

  .config-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .config-modal {
    background: rgba(20, 30, 50, 0.95);
    border-radius: 8px;
    padding: 20px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    position: relative;

    .modal-title {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 15px 0;
      color: $text-color;
      text-align: center;
    }

    .modal-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .modal-label {
      font-size: 14px;
      color: $text-color;
      margin-bottom: 6px;
    }

    .modal-input,
    .modal-textarea {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 4px;
      padding: 10px;
      font-size: 14px;
      color: $text-color;
      width: 100%;
      box-sizing: border-box;

      &::placeholder {
        color: rgba(220, 240, 255, 0.7);
      }
    }

    .modal-textarea {
      resize: none;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 15px;
    }

    .modal-save-btn,
    .modal-cancel-btn {
      background: $accent-color;
      border: none;
      border-radius: 4px;
      padding: 10px 15px;
      font-size: 14px;
      font-weight: 500;
      color: #0a1525;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: rgba(64, 169, 255, 0.8);
      }
    }
  }
}
</style>
