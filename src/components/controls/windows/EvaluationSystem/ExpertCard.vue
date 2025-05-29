<script setup lang="ts">
/**
 * ExpertCard.vue - 专家卡片组件
 *
 * 该组件用于展示评价体系中的各类专家信息
 * 包含专家头像、姓名、简要介绍
 */
import { ref, computed, nextTick } from 'vue'
import { useEvaluationStore, type FullExpertInfo } from '@/stores/evaluationStore'
import ExpertConfigModal from '@/components/controls/windows/ExpertConfigModal.vue'

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
const currentEditingExpert = ref<FullExpertInfo | null>(null)

// 直接使用store中的选中专家ID列表
const selectedExpertIds = computed(() => {
  return evaluationStore.selectedExperts.map((expert) => expert.id)
})

// 计算选中专家的名称
const selectedExpertNames = computed(() => {
  return evaluationStore.selectedExperts.map((expert) => expert.name)
})

// 滚动到最右侧，保证添加专家按钮可见
const scrollToEnd = () => {
  nextTick(() => {
    if (cardsElement.value) {
      cardsElement.value.scrollLeft = cardsElement.value.scrollWidth
    }
  })
}

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
const toggleSelectExpert = (expert: FullExpertInfo) => {
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
    evaluationStore.removeSelectedExpert(expert.id)
  }

  console.log('选中专家ID:', selectedExpertIds.value)
  console.log('选中专家名称:', selectedExpertNames.value)
}

// 删除专家
const deleteExpert = (expertId: string, event: Event) => {
  event.stopPropagation()
  evaluationStore.removeBaseExpert(expertId)
}

// 检查专家是否被选中
const isExpertSelected = (expertId: string) => {
  return selectedExpertIds.value.includes(expertId)
}

// 打开配置弹窗
const openConfigModal = (expert: FullExpertInfo, event: Event) => {
  event.stopPropagation()
  currentEditingExpert.value = expert
  showConfigModal.value = true
}

// 打开添加专家弹窗
const openAddExpertModal = (event: Event) => {
  event.stopPropagation()
  // 创建新的空专家对象
  currentEditingExpert.value = {
    id: Date.now().toString(), // 使用时间戳作为临时ID
    name: '',
    desc: '',
    prompt: '',
    avatar: defaultAvatar,
  }
  showConfigModal.value = true
}

// 关闭配置弹窗
const closeConfigModal = () => {
  showConfigModal.value = false
  currentEditingExpert.value = null
}

// 保存配置
const handleSaveConfig = (data: { name: string; desc: string; prompt: string }) => {
  if (!currentEditingExpert.value) return

  // 判断是编辑现有专家还是添加新专家
  const existingExpert = expertData.value.find((e) => e.id === currentEditingExpert.value?.id)

  if (existingExpert) {
    // 更新现有专家
    evaluationStore.updateBaseExpert(currentEditingExpert.value.id, {
      name: data.name,
      desc: data.desc,
      prompt: data.prompt,
    })
  } else {
    // 添加新专家到基础数据
    const newExpert: FullExpertInfo = {
      id: currentEditingExpert.value.id,
      name: data.name,
      desc: data.desc,
      prompt: data.prompt,
      avatar: defaultAvatar,
    }
    // 这里需要将新专家添加到store中
    evaluationStore.updateBaseExpert(newExpert.id, newExpert)
    scrollToEnd() // 新增专家后滚动到最右侧
  }

  // 关闭弹窗
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
        <div class="delete-icon" v-if="!isExpertSelected(expert.id)" @click="deleteExpert(expert.id, $event)">🗑️</div>
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

      <!-- 添加专家卡片 -->
      <div class="expert-card add-expert-card" @click="openAddExpertModal($event)">
        <div class="add-icon">+</div>
        <p class="add-text">添加专家</p>
      </div>
    </div>

    <!-- 专家配置弹窗 -->
    <ExpertConfigModal
      v-model:visible="showConfigModal"
      :expert="currentEditingExpert"
      @save="handleSaveConfig"
      @cancel="closeConfigModal"
    />
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

    &.add-expert-card {
      display: flex;
      flex-direction: column;
      justify-content: center;
      background: linear-gradient(rgba(25, 35, 45, 0.6), rgba(15, 25, 35, 0.6));
      border: 2px dashed $border-color;
      transition: all 0.3s ease;

      &:hover {
        border-color: $accent-color;
        background: linear-gradient(rgba(30, 40, 55, 0.7), rgba(20, 30, 45, 0.7));
        transform: translateY(-3px);
        box-shadow: 0 5px 15px rgba(64, 169, 255, 0.15);
      }

      .add-icon {
        font-size: 48px;
        color: $accent-color;
        margin-bottom: 10px;
        font-weight: 300;
        line-height: 1;
      }

      .add-text {
        font-size: 14px;
        color: $text-color;
        margin: 0;
        font-weight: 500;
      }
    }

    .delete-icon {
      position: absolute;
      top: 5px;
      right: 5px;
      width: 22px;
      height: 22px;
      background: rgba(255, 77, 79, 0.85);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      z-index: 20;
      transition:
        background 0.2s,
        transform 0.2s;
      &:hover {
        background: rgba(255, 77, 79, 1);
        transform: scale(1.1);
      }
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
}
</style>
