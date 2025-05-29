<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { AIModelType } from '@/apis/AIInterface'

//! 扩展Window接口，之后需要改为监听事件
declare global {
  interface Window {
    RecvUnityAIReq?: (data: any) => void
  }
}

/**
 * ControlButtons.vue - 控制按钮主组件
 *
 * 该组件是应用的主控制面板，负责显示三个功能按钮
 * 并根据用户选择显示对应的功能窗口
 */

// 导入三个功能子组件
import SceneSwitcher from './windows/SceneSwitcher.vue'
import ModelSelector from './windows/ModelSelector.vue'
import AIInterface from './windows/AIInterface.vue'
import EvaluationSystem from './windows/EvaluationSystem.vue'

// 控制当前显示的浮窗
const activeWindow = ref<string | null>(null)

// 切换浮窗显示状态
const toggleWindow = (window: string) => {
  // 如果是点击按钮打开AI接口，重置modelValue为默认值
  if (window === 'interface') {
    // 设置为化工产业园区模型
    modelValue.value = 'top-llm'
  }

  activeWindow.value = activeWindow.value === window ? null : window
}

// 关闭浮窗
const closeWindow = () => {
  activeWindow.value = null
}

// 消息提示
const message = ref('')
const showMessage = ref(false)

// 显示消息提示
const showTip = (msg: string) => {
  message.value = msg
  showMessage.value = true
  setTimeout(() => {
    showMessage.value = false
  }, 3000)
}

// 处理子组件的表单提交
const handleFormSubmit = (data: any) => {
  console.log('提交表单:', data)

  closeWindow()
}

// 存储当前选中的AI模型
const modelValue = ref<AIModelType>('top-llm')

// 处理从Unity接收的AI请求
const handleUnityAIRequest = (data: any) => {
  // 将收到的区域参数转换为相应的模型类型
  const areaToModel: Record<string, AIModelType> = {
    RMS: 'sub-llm1', // 原料存储区
    PRO: 'sub-llm2', // 成品储存区
    REA: 'sub-llm3', // 反应器区
    SEP: 'sub-llm4', // 分离提纯区
    UTL: 'sub-llm5', // 公用工程区
  }

  // 设置模型值，如果没有匹配则使用默认的top-llm
  modelValue.value = areaToModel[data] || 'top-llm'

  // 打开AI接口窗口
  activeWindow.value = 'interface'
}

//! 组件挂载时添加Unity事件监听
onMounted(() => {
  window.RecvUnityAIReq = handleUnityAIRequest
})

//! 组件卸载前移除事件监听
onBeforeUnmount(() => {
  if (window.RecvUnityAIReq === handleUnityAIRequest) {
    window.RecvUnityAIReq = undefined
    console.log('RecvUnityAIReq 已被移除.')
  }
})
</script>

<template>
  <div class="controls-wrapper">
    <button class="control-btn" @click="toggleWindow('scene')">
      <div class="btn-icon">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path
            fill="currentColor"
            d="M21,17H7V3H21M21,1H7A2,2 0 0,0 5,3V17A2,2 0 0,0 7,19H21A2,2 0 0,0 23,17V3A2,2 0 0,0 21,1M3,5H1V21A2,2 0 0,0 3,23H19V21H3M15.96,10.29L13.21,13.83L11.25,11.47L8.5,15H19.5L15.96,10.29Z"
          />
        </svg>
      </div>
      <span>场景切换</span>
      <div class="btn-glow"></div>
    </button>

    <button class="control-btn" @click="toggleWindow('model')">
      <div class="btn-icon">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path
            fill="currentColor"
            d="M12,0L3,7L4.5,8.5L12,4L19.5,8.5L21,7L12,0M12,4L4.5,8.5L12,13L19.5,8.5L12,4M3,7V15L4.5,16.5V9L12,13.5L19.5,9V16.5L21,15V7L12,12L3,7M4.5,16.5V18L12,22.5L19.5,18V16.5L12,21L4.5,16.5Z"
          />
        </svg>
      </div>
      <span>模型选择</span>
      <div class="btn-glow"></div>
    </button>

    <button class="control-btn" @click="toggleWindow('interface')">
      <div class="btn-icon">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path
            fill="currentColor"
            d="M21,15H23V17H21V15M21,11H23V13H21V11M23,19H21V21C22,21 23,20 23,19M13,3H15V5H13V3M21,7H23V9H21V7M21,3V5H23C23,4 22,3 21,3M1,7H3V9H1V7M17,3H19V5H17V3M17,19H19V21H17V19M3,3C2,3 1,4 1,5H3V3M9,3H11V5H9V3M5,3H7V5H5V3M1,11V19A2,2 0 0,0 3,21H15V11H1M3,19V13H13V19H3Z"
          />
        </svg>
      </div>
      <span>人机接口</span>
      <div class="btn-glow"></div>
    </button>

    <button class="control-btn" @click="toggleWindow('evaluation')">
      <div class="btn-icon">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path
            fill="currentColor"
            d="M12,3C17.5,3 22,6.58 22,11C22,15.42 17.5,19 12,19C10.76,19 9.57,18.82 8.47,18.5C5.55,21 2,21 2,21C4.33,18.67 4.7,17.1 4.75,16.5C3.05,15.07 2,13.13 2,11C2,6.58 6.5,3 12,3M11,14L13,14.03L13.03,11H15.03L15,14L18,14.03L18,16L15,16.03L14.97,19H13L12.97,16L11,16.03V14Z"
          />
        </svg>
      </div>
      <span>评价体系</span>
      <div class="btn-glow"></div>
    </button>

    <!-- 全局消息提示 -->
    <transition name="tip">
      <div v-if="showMessage" class="message-tip">
        <div class="message-icon">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path
              fill="currentColor"
              d="M12,2C6.48,2 2,6.48 2,12C2,17.52 6.48,22 12,22C17.52,22 22,17.52 22,12C22,6.48 17.52,2 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M11,7H13V13H11V7M11,15H13V17H11V15Z"
            />
          </svg>
        </div>
        <span>{{ message }}</span>
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
    <AIInterface v-if="activeWindow === 'interface'" :model="modelValue" @close="closeWindow" />

    <!-- 评价体系浮窗 -->
    <EvaluationSystem v-if="activeWindow === 'evaluation'" @close="closeWindow" />
  </div>
</template>

<style scoped>
.controls-wrapper {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
  padding: 10px 0;
  position: relative;
  background: linear-gradient(90deg, rgba(12, 24, 48, 0.9), rgba(20, 40, 80, 0.9), rgba(12, 24, 48, 0.9));
  border-radius: 10px;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.2),
    0 0 30px rgba(32, 160, 255, 0.07),
    inset 0 0 0 1px rgba(64, 169, 255, 0.2);
}

.controls-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, rgba(32, 160, 255, 0), rgba(64, 169, 255, 0.6), rgba(32, 160, 255, 0));
  z-index: 5;
}

.control-btn {
  position: relative;
  background: linear-gradient(135deg, rgba(25, 50, 100, 0.9), rgba(15, 30, 65, 0.9));
  color: rgba(220, 230, 240, 0.95);
  border: 1px solid rgba(64, 169, 255, 0.3);
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.05),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 130px;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(64, 169, 255, 0.9);
  filter: drop-shadow(0 0 4px rgba(32, 160, 255, 0.4));
}

.btn-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 40%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0));
  border-radius: 8px 8px 0 0;
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.control-btn:hover {
  background: linear-gradient(135deg, rgba(30, 60, 120, 0.9), rgba(20, 40, 85, 0.9));
  border-color: rgba(64, 169, 255, 0.5);
  transform: translateY(-2px);
  box-shadow:
    0 6px 15px rgba(0, 0, 0, 0.2),
    0 0 10px rgba(32, 160, 255, 0.15),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.control-btn:hover .btn-glow {
  opacity: 0.7;
}

.control-btn:active {
  transform: translateY(0);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.2),
    0 0 5px rgba(32, 160, 255, 0.1),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05);
}

.control-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, rgba(32, 160, 255, 0), rgba(64, 169, 255, 0.6), rgba(32, 160, 255, 0));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.control-btn:hover::before {
  opacity: 1;
}

/* 消息提示 */
.message-tip {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(15, 35, 70, 0.95), rgba(10, 25, 50, 0.95));
  color: rgba(220, 230, 240, 0.95);
  padding: 12px 20px;
  border-radius: 8px;
  z-index: 1000;
  font-size: 14px;
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.2),
    0 0 15px rgba(32, 160, 255, 0.1),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(64, 169, 255, 0.3);
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 220px;
  letter-spacing: 0.5px;
}

.message-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(64, 169, 255, 0.9);
  filter: drop-shadow(0 0 4px rgba(32, 160, 255, 0.4));
}

/* 提示动画 */
.tip-enter-active,
.tip-leave-active {
  transition:
    opacity 0.4s cubic-bezier(0.25, 0.8, 0.25, 1),
    transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.tip-enter-from,
.tip-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

/* 保留其他样式 */
</style>
