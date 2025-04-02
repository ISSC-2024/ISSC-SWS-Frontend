<script setup lang="ts">
import { ref } from 'vue';

/**
 * ModelSelector.vue - 模型选择组件
 * 
 * 该组件负责模型选择和参数配置功能
 * 从主控制组件中拆分出来，使代码结构更加清晰
 */

// 定义组件向外发出的事件
const emit = defineEmits(['close', 'show-tip', 'submit']);

// 模型选择相关数据
const selectedModel = ref('');
const modelParams = ref<Record<string, string>>({
  param1: '',
  param2: '',
  param3: ''
});

// 模型列表
const models = [
  { id: 'model1', name: '模型1' },
  { id: 'model2', name: '模型2' },
  { id: 'model3', name: '模型3' },
  { id: 'model4', name: '模型4' }
];

// 模型参数配置
const modelParamsConfig = {
  model1: [
    { id: 'param1', name: '参数1', options: ['选项1', '选项2', '选项3'] },
    { id: 'param2', name: '参数2', options: ['选项A', '选项B', '选项C'] },
    { id: 'param3', name: '参数3', options: ['选项X', '选项Y', '选项Z'] }
  ],
  model2: [
    { id: 'param1', name: '阈值', options: ['0.1', '0.2', '0.3', '0.4'] },
    { id: 'param2', name: '精度', options: ['高', '中', '低'] },
    { id: 'param3', name: '迭代次数', options: ['100', '200', '500', '1000'] }
  ],
  model3: [
    { id: 'param1', name: '学习率', options: ['0.001', '0.01', '0.1'] },
    { id: 'param2', name: '优化器', options: ['Adam', 'SGD', 'RMSprop'] },
    { id: 'param3', name: '批次大小', options: ['32', '64', '128', '256'] }
  ],
  model4: [
    { id: 'param1', name: '模式', options: ['快速', '标准', '精确'] },
    { id: 'param2', name: '并行度', options: ['低', '中', '高'] },
    { id: 'param3', name: '预处理', options: ['是', '否'] }
  ]
};

/**
 * 获取当前模型的参数配置
 * 根据选择的模型，返回对应的参数配置
 */
const getCurrentModelParams = () => {
  if (!selectedModel.value) return [];
  return modelParamsConfig[selectedModel.value as keyof typeof modelParamsConfig] || [];
};

/**
 * 选择模型
 * 设置当前选择的模型并重置参数
 * @param modelId 模型ID
 */
const selectModel = (modelId: string) => {
  selectedModel.value = modelId;
  // 重置参数
  resetModelParams();
};

/**
 * 重置模型参数
 * 清空当前模型的所有参数选择
 */
const resetModelParams = () => {
  const currentParams = getCurrentModelParams();
  currentParams.forEach(param => {
    modelParams.value[param.id] = '';
  });
};

/**
 * 提交模型选择
 * 验证是否完整选择模型和参数，然后提交数据
 */
const submitModelSelection = () => {
  const currentParams = getCurrentModelParams();
  const isComplete = currentParams.every(param => modelParams.value[param.id]);

  // 验证是否完整填写
  if (!selectedModel.value || !isComplete) {
    emit('show-tip', '请完整填写表单');
    return;
  }
  
  // 准备提交数据
  const submitData = {
    模型: selectedModel.value,
    参数: { ...modelParams.value }
  };
  
  // 向父组件发送提交事件和数据
  emit('submit', submitData);
};

/**
 * 关闭窗口
 * 调用父组件的关闭方法
 */
const close = () => {
  emit('close');
};
</script>

<template>
  <!-- 模型选择浮窗 -->
  <transition name="fade">
    <div class="overlay" @click="close">
      <div class="floating-window" @click.stop>
        <button class="close-btn" @click="close">×</button>
        
        <div class="window-content">
          <!-- 模型选择内容 -->
          <div class="model-window">
            <h2 class="window-title">模型选择</h2>
            
            <div class="model-container">
              <div class="model-sidebar">
                <!-- 模型选择按钮组 -->
                <div class="model-buttons">
                  <button 
                    v-for="model in models" 
                    :key="model.id" 
                    class="model-btn" 
                    :class="{ 'active': selectedModel === model.id }"
                    @click="selectModel(model.id)"
                  >
                    {{ model.name }}
                  </button>
                </div>
              </div>
              
              <div class="model-content">
                <div class="model-params">
                  <!-- 模型参数表单 -->
                  <div v-if="selectedModel" class="param-form">
                    <div v-for="param in getCurrentModelParams()" :key="param.id" class="param-item">
                      <div class="param-label">{{ param.name }}</div>
                      <select v-model="modelParams[param.id]" class="param-select">
                        <option value="">请选择</option>
                        <option v-for="option in param.options" :key="option" :value="option">
                          {{ option }}
                        </option>
                      </select>
                    </div>
                  </div>
                  <div v-else class="no-model-selected">
                    请先选择左侧的模型
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 按钮组 -->
            <div class="button-group">
              <button class="submit-btn" @click="submitModelSelection">提交</button>
              <button class="reset-btn" @click="resetModelParams">重置</button>
            </div>
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

/* 窗口标题 */
.window-title {
  text-align: center;
  margin-top: 0;
  margin-bottom: 40px;
  font-size: 24px;
  color: #333;
}

/* 按钮组 */
.button-group {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 10px; /* 模型选择窗口特有的margin-top */
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

/* 模型窗口特定样式 */
.model-window {
  min-height: 450px;
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