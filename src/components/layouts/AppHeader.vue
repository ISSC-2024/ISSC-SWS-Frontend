<script setup lang="ts">
/**
 * @description 应用头部组件
 * 
 * 该组件显示应用的顶部标题栏，包含以下功能：
 * 1. 显示应用名称"安全风险智能预警决策"
 * 2. 实时显示当前系统时间，每秒更新一次
 * 3. 渐变色标题文本，增强视觉效果
 * 4. 响应式布局设计
 * 5. 提供Unity通信测试按钮
 */
import { ref, onMounted, onUnmounted } from 'vue';
// import UnityService from '../../services/UnityService';

// 时间显示逻辑
const currentTime = ref(new Date().toLocaleTimeString());

// // Unity事件回调处理函数
// const handleUnityMessage = (data: any) => {
//   alert(`收到Unity消息: ${data.detail}`);
// };

onMounted(() => {
  // 设置时间更新
  setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString();
  }, 1000);
  
  // 添加Unity消息监听
  // UnityService.addUnityEventListener('frontend_unity', handleUnityMessage);
});

onUnmounted(() => {
  // 移除Unity消息监听
  // UnityService.removeUnityEventListener('frontend_unity', handleUnityMessage);
});

// // 发送消息到Unity
// const sendTimeToUnity = () => {
//   const currentDateTime = new Date().toLocaleString();
//   UnityService.sendMessageToUnity('MessageTest', 'frontend2unity', currentDateTime);
// };
</script>

<template>
  <header class="app-header">
    <div class="logo">
      <span class="logo-text">安全风险智能预警决策</span>
    </div>
    <div class="header-right">
      <!-- <button 
        @click="sendTimeToUnity" 
        class="unity-test-btn"
        title="发送当前时间到Unity"
      >
        Unity测试
      </button> -->
      <span class="time">{{ currentTime }}</span>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  height: var(--header-height);
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.logo {
  display: flex;
  align-items: center;
}

.logo-text {
  font-size: 24px;
  font-weight: bold;
  letter-spacing: 1px;
  background: linear-gradient(to right, #4a90e2, #7cb3f5);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.time {
  font-size: 18px;
  font-family: monospace;
  color: var(--accent-color);
}

.unity-test-btn {
  padding: 6px 12px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.unity-test-btn:hover {
  background-color: #357ab8;
}
</style> 