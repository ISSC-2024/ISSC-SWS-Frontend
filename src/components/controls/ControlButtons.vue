<script setup lang="ts">
import { ref } from 'vue';

/**
 * ControlButtons.vue - 控制按钮主组件
 * 
 * 该组件是应用的主控制面板，负责显示三个功能按钮
 * 并根据用户选择显示对应的功能窗口
 */

// 导入三个功能子组件
import SceneSwitcher from './windows/SceneSwitcher.vue';
import ModelSelector from './windows/ModelSelector.vue';
import AIInterface from './windows/AIInterface.vue';

// 控制当前显示的浮窗
const activeWindow = ref<string | null>(null);

// 切换浮窗显示状态
const toggleWindow = (window: string) => {
  activeWindow.value = activeWindow.value === window ? null : window;
};

// 关闭浮窗
const closeWindow = () => {
  activeWindow.value = null;
};

// 消息提示
const message = ref('');
const showMessage = ref(false);

// 显示消息提示
const showTip = (msg: string) => {
  message.value = msg;
  showMessage.value = true;
  setTimeout(() => {
    showMessage.value = false;
  }, 3000);
};

// 处理子组件的表单提交
const handleFormSubmit = (data: any) => {
  console.log('提交表单:', data);
  closeWindow();
};
</script>

<template>
  <div class="controls-wrapper">
    <button class="control-btn" @click="toggleWindow('scene')">场景切换</button>
    <button class="control-btn" @click="toggleWindow('model')">模型选择</button>
    <button class="control-btn" @click="toggleWindow('interface')">人机接口</button>

    <!-- 全局消息提示 -->
    <transition name="tip">
      <div v-if="showMessage" class="message-tip">
        {{ message }}
      </div>
    </transition>

    <!-- 场景切换浮窗 -->
    <SceneSwitcher 
      v-if="activeWindow === 'scene'" 
      @close="closeWindow" 
      @show-tip="showTip"
      @submit="handleFormSubmit"
    />

    <!-- 模型选择浮窗 -->
    <ModelSelector 
      v-if="activeWindow === 'model'" 
      @close="closeWindow" 
      @show-tip="showTip"
      @submit="handleFormSubmit"
    />

    <!-- 人机接口浮窗 -->
    <AIInterface 
      v-if="activeWindow === 'interface'" 
      @close="closeWindow"
    />
  </div>
</template>

<style scoped>
.controls-wrapper {
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
  padding: 5px 0;
  position: relative;
}

.control-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(74, 144, 226, 0.2);
}

.control-btn:hover {
  background-color: var(--primary-dark);
  box-shadow: 0 4px 6px rgba(74, 144, 226, 0.3);
}

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
  padding: 40px 20px 20px;
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

/* 消息提示 */
.message-tip {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  z-index: 1000;
  font-size: 14px;
}

/* 提示动画 */
.tip-enter-active,
.tip-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.tip-enter-from,
.tip-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

/* 窗口标题 */
.window-title {
  text-align: center;
  margin-top: 0;
  margin-bottom: 40px;
  font-size: 24px;
  color: #333;
}

/* 表单样式 */
.form-container {
  max-width: 500px;
  margin: 0 auto;
  padding-top: 20px;
}

.form-group {
  margin-bottom: 30px;
  display: flex;
  align-items: center;
}

.form-label {
  flex: 0 0 120px;
  text-align: right;
  margin-right: 20px;
  font-size: 16px;
}

.form-select {
  flex: 1;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0 10px;
  font-size: 14px;
  background-color: white;
}

.form-select:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

/* 按钮组 */
.button-group {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 40px;
}

/* 针对不同窗口中的按钮组应用不同的margin-top */
.scene-window .button-group {
  margin-top: 60px;
}

.model-window .button-group {
  margin-top: 10px;
}

.interface-window .button-group {
  margin-top: 30px;
}

.submit-btn,
.reset-btn {
  min-width: 100px;
  padding: 10px 25px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid #ddd;
  transition: all 0.3s;
}

.submit-btn {
  background-color: #2c3e50;
  color: white;
  border-color: #2c3e50;
}

.reset-btn {
  background-color: white;
  color: #333;
}

.submit-btn:hover {
  background-color: #1e2a36;
}

.reset-btn:hover {
  background-color: #f5f5f5;
}

/* 各个窗口特定样式 */
.scene-window,
.model-window,
.interface-window {
  min-height: 450px;
}

/* 特别为iframe设置高度 */
.interface-window {
  height: 600px;
}

/* 模型选择窗口样式 */
.model-container {
  display: flex;
  min-height: 350px;
  margin-bottom: 10px;
}

.model-sidebar {
  flex: 0 0 220px;
  margin-right: 30px;
}

.model-content {
  flex: 1;
}

.model-buttons {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.model-btn {
  width: 100%;
  padding: 15px 20px;
  text-align: center;
  border: 1px solid #ddd;
  border-radius: 20px;
  background-color: white;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 16px;
}

.model-btn:hover {
  background-color: #f5f5f5;
  border-color: #ccc;
}

.model-btn.active {
  background-color: #2c3e50;
  color: white;
  border-color: #2c3e50;
}

.model-params {
  padding: 10px;
  min-height: 350px;
}

.param-form {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.param-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.param-label {
  flex: 0 0 70px;
  text-align: right;
  margin-right: 20px;
  font-size: 16px;
}

.param-select {
  flex: 1;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0 10px;
  font-size: 14px;
  background-color: white;
}

.no-model-selected {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #999;
  font-size: 16px;
  border: 1px dashed #ddd;
  border-radius: 4px;
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