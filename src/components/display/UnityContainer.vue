<script setup lang="ts">
/**
 * @description Unity WebGL 容器组件
 * 
 * 该组件负责加载和显示Unity WebGL内容，包含以下功能：
 * 1. 加载Unity WebGL应用并显示进度条
 * 2. 处理Unity加载状态和错误提示
 * 3. 管理Unity实例的生命周期
 * 4. 响应式设计，自适应容器大小
 */
import { ref, onMounted, onUnmounted } from 'vue';

// 定义Unity实例
const unityInstance = ref<any>(null);
const unityLoaded = ref(false);
const loadingProgress = ref(0);

// 创建对Unity实例的引用，便于Vue组件与Unity通信
(window as any).MyGameInstance = null;

// Unity容器元素引用
const unityCanvas = ref<HTMLCanvasElement | null>(null);
const progressBarFull = ref<HTMLDivElement | null>(null);

// Unity配置
const unityConfig = {
  dataUrl: "/unity/Release/Build/Release.data",
  frameworkUrl: "/unity/Release/Build/Release.framework.js",
  codeUrl: "/unity/Release/Build/Release.wasm",
  streamingAssetsUrl: "/unity/Release/StreamingAssets",
  companyName: "ISSC",
  productName: "DataDisplay",
  productVersion: "0.1.0",
};

// 加载Unity
onMounted(() => {
  const loadUnity = () => {
    // 创建Unity加载脚本
    const script = document.createElement("script");
    script.src = "/unity/Release/Build/Release.loader.js";
    script.async = true;
    script.onload = () => {
      // 脚本加载完成后创建Unity实例
      const createUnityInstance = (window as any).createUnityInstance;
      
      if (typeof createUnityInstance === 'function' && unityCanvas.value) {
        createUnityInstance(unityCanvas.value, unityConfig, (progress: number) => {
          // 更新加载进度
          loadingProgress.value = progress;
          if (progressBarFull.value) {
            progressBarFull.value.style.width = 100 * progress + "%";
          }
        }).then((instance: any) => {
          // Unity加载完成
          unityInstance.value = instance;
          (window as any).MyGameInstance = instance;
          unityLoaded.value = true;
        }).catch((message: string) => {
          console.error("Unity WebGL加载失败:", message);
        });
      }
    };
    
    document.body.appendChild(script);
  };
  
  // 页面加载后开始加载Unity
  loadUnity();
});

// 在组件卸载时清理
onUnmounted(() => {
  if (unityInstance.value && typeof unityInstance.value.Quit === 'function') {
    unityInstance.value.Quit();
  }
});
</script>

<template>
  <div class="unity-content">
    <!-- Unity画布 -->
    <canvas 
      ref="unityCanvas" 
      id="unity-canvas" 
      class="unity-canvas"
    ></canvas>

    <!-- 加载进度条 -->
    <div id="unity-loading-bar" class="unity-loading-bar" v-show="!unityLoaded">
      <div id="unity-logo" class="unity-logo"></div>
      <div id="unity-progress-bar-empty" class="unity-progress-bar-empty">
        <div id="unity-progress-bar-full" class="unity-progress-bar-full" ref="progressBarFull"></div>
      </div>
    </div>
    
    <!-- 警告信息 -->
    <div id="unity-warning" class="unity-warning"></div>
  </div>
</template>

<style scoped>
.unity-content {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.unity-canvas {
  width: 100%;
  height: 100%;
  background: #1F1F20;
  display: block;
}

.unity-loading-bar {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.unity-logo {
  width: 154px;
  height: 130px;
  background: url('/unity/Release/TemplateData/unity-logo-dark.png') no-repeat center;
  margin-bottom: 10px;
}

.unity-progress-bar-empty {
  width: 141px;
  height: 18px;
  background: url('/unity/Release/TemplateData/progress-bar-empty-dark.png') no-repeat center;
  position: relative;
}

.unity-progress-bar-full {
  width: 0%;
  height: 18px;
  background: url('/unity/Release/TemplateData/progress-bar-full-dark.png') no-repeat center;
  position: absolute;
  top: 0;
  left: 0;
}

.unity-warning {
  position: absolute;
  left: 50%;
  bottom: 5%;
  transform: translate(-50%);
  padding: 10px;
  display: none;
}
</style> 