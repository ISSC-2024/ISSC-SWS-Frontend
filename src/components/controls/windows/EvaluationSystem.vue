<script setup lang="ts">
/**
 * EvaluationSystem.vue - 评价体系组件
 *
 * 该组件负责显示评价体系相关内容
 * 从主控制组件中拆分出来，使代码结构更加清晰
 */

// 定义组件向外发出的事件
const emit = defineEmits(['close'])

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
      <div class="floating-window" @click.stop>
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
              <!-- 评价体系的具体内容将在这里添加 -->
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
.evaluation-window {
  min-height: 450px;
}
</style>
