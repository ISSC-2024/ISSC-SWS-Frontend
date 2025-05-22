<script setup lang="ts">
/**
 * ExpertCardCarousel.vue - 专家卡片轮播组件
 *
 * 该组件作为专家卡片的容器，提供横向轮播功能
 * 当卡片数量超出容器宽度时，可以通过左右箭头进行翻页
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { LeftOutlined, RightOutlined } from '@ant-design/icons-vue'
import ExpertCard from './ExpertCard.vue'
import { useEvaluationStore } from '@/stores/evaluationStore'

// 使用评价体系store
const evaluationStore = useEvaluationStore()

// 容器和卡片区域的引用
const containerRef = ref<HTMLElement | null>(null)
const expertCardRef = ref<InstanceType<typeof ExpertCard> | null>(null)

// 滚动状态
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

// 获取卡片区域元素
const getCardsElement = () => {
  return expertCardRef.value?.cardsElement || null
}

// 检查是否可以滚动
const checkScroll = () => {
  const cardsElement = getCardsElement()
  if (!cardsElement) return

  const { scrollLeft, scrollWidth, clientWidth } = cardsElement

  canScrollLeft.value = scrollLeft > 0
  canScrollRight.value = scrollLeft < scrollWidth - clientWidth
}

// 向左滚动
const scrollLeft = () => {
  const cardsElement = getCardsElement()
  if (!cardsElement || !canScrollLeft.value) return

  const scrollAmount = cardsElement.clientWidth / 2
  cardsElement.scrollBy({
    left: -scrollAmount,
    behavior: 'smooth',
  })
  // 更新滚动状态
  setTimeout(checkScroll, 500)
}

// 向右滚动
const scrollRight = () => {
  const cardsElement = getCardsElement()
  if (!cardsElement || !canScrollRight.value) return

  const scrollAmount = cardsElement.clientWidth / 2
  cardsElement.scrollBy({
    left: scrollAmount,
    behavior: 'smooth',
  })
  // 更新滚动状态
  setTimeout(checkScroll, 500)
}

// 获取当前选中的专家ID（从store获取）
const getSelectedExperts = () => {
  return evaluationStore.selectedExperts.map((expert) => expert.id)
}

// 获取当前选中的专家名称（从store获取）
const getSelectedExpertNames = () => {
  return evaluationStore.selectedExperts.map((expert) => expert.name)
}

// 重置专家选择
const resetSelection = () => {
  try {
    evaluationStore.clearExperts()
    console.log('已重置专家选择')
    return true
  } catch (error) {
    console.warn('重置专家选择失败:', error)
    return false
  }
}

// 组件挂载后初始化
onMounted(() => {
  // 初始化检查是否可以滚动
  setTimeout(checkScroll, 100)

  // 监听滚动事件
  const cardsElement = getCardsElement()
  if (cardsElement) {
    cardsElement.addEventListener('scroll', checkScroll)
  }

  // 监听窗口大小变化
  window.addEventListener('resize', checkScroll)
})

// 组件卸载前清理
onBeforeUnmount(() => {
  const cardsElement = getCardsElement()
  if (cardsElement) {
    cardsElement.removeEventListener('scroll', checkScroll)
  }
  window.removeEventListener('resize', checkScroll)
})

// 暴露方法给父组件
defineExpose({
  getSelectedExperts,
  getSelectedExpertNames,
  resetSelection,
  expertCardRef,
})
</script>

<template>
  <div class="expert-carousel" ref="containerRef">
    <!-- 左侧箭头 -->
    <div class="carousel-arrow left-arrow" v-show="canScrollLeft" @click="scrollLeft">
      <LeftOutlined />
    </div>

    <!-- 专家卡片 -->
    <ExpertCard ref="expertCardRef" />

    <!-- 右侧箭头 -->
    <div class="carousel-arrow right-arrow" v-show="canScrollRight" @click="scrollRight">
      <RightOutlined />
    </div>
  </div>
</template>

<style lang="scss" scoped>
$accent-color: rgba(64, 169, 255, 0.6);

.expert-carousel {
  position: relative;
  width: 100%;
  margin-bottom: 10px;
  padding: 0 25px;
  min-height: 200px;

  .carousel-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 40px;
    background: rgba(20, 30, 50, 0.8);
    border: 1px solid $accent-color;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    color: white;
    transition: all 0.2s ease;
    box-shadow: 0 0 10px rgba(64, 169, 255, 0.4);

    &:hover {
      background: rgba(64, 169, 255, 0.2);
      transform: translateY(-50%) scale(1.1);
      box-shadow: 0 0 15px rgba(64, 169, 255, 0.6);
    }

    &.left-arrow {
      left: 0;
    }

    &.right-arrow {
      right: 0;
    }
  }
}
</style>
