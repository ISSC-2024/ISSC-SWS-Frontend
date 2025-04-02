<script setup lang="ts">
/**
 * AIInterface.vue - 人机接口组件
 * 
 * 该组件负责嵌入第三方AI聊天服务
 * 从主控制组件中拆分出来，使代码结构更加清晰
 */

// 定义组件向外发出的事件
const emit = defineEmits(['close']);

/**
 * 关闭窗口
 * 调用父组件的关闭方法
 */
const close = () => {
  emit('close');
};
</script>

<template>
  <!-- 人机接口浮窗 -->
  <transition name="fade">
    <div class="overlay" @click="close">
      <div class="floating-window interface-floating-window" @click.stop>
        <button class="close-btn" @click="close">×</button>
        
        <div class="window-content">
          <!-- 人机接口内容 -->
          <div class="interface-window">
            <iframe
              src="https://share.fastgpt.in/chat/share?shareId=czky0t6cloyw6l5ck80pnbgq"
              style="width: 100%; height: 95%;"
              frameborder="0" 
              allow="*"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
/* 遮罩层样式 */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 99;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 浮窗样式 */
.floating-window {
  position: relative;
  top: -10%;
  width: 80%;
  max-width: 800px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 100;
  overflow: hidden;
  padding: 40px 10px 10px;
}

/* 人机接口浮窗的特定样式 */
.interface-floating-window {
  width: 90%;
  max-width: 1200px;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: #333;
  font-size: 20px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.window-content {
  max-height: 70vh;
  overflow-y: auto;
}

/* 特别为iframe设置高度 */
.interface-window {
  height: 550px;
  min-height: 450px;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-from .floating-window,
.fade-leave-to .floating-window {
  transform: scale(0.95);
}
</style> 