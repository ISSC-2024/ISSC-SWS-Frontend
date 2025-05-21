<script setup lang="ts">
import { ref } from 'vue'
import { useAlgorithmStore, ModuleType, AlgorithmType } from '@/stores/algorithmStore'

// 定义组件向外发出的事件
const emit = defineEmits(['close', 'show-tip', 'submit'])

// 获取算法状态管理
const algorithmStore = useAlgorithmStore()

// 模型选择相关数据
const selectedModel = ref('')
const modelParams = ref<Record<string, any>>({})

// 模块映射
const modelToModule: Record<string, ModuleType> = {
  model1: ModuleType.Module1,
  model2: ModuleType.Module2,
  model3: ModuleType.Module3,
  model4: ModuleType.Module4,
}

// 模型列表
const models = [
  { id: 'model1', name: '模型1' },
  { id: 'model2', name: '模型2' },
  { id: 'model3', name: '模型3' },
  { id: 'model4', name: '模型4' },
]

const modelParamsConfig = {
  model1: [
    {
      id: 'algorithm',
      name: '算法',
      options: [AlgorithmType.TimesNet, AlgorithmType.TimeMixer],
    },
    { id: 'task_name', name: '任务', options: ['short_term_forecast'] },
    { id: 'model_id', name: '传感器编号', options: ['RMS001', 'RMS002', 'RMS003'] },
  ],
  model2: [
    { id: 'tree_count', name: '决策树数量', options: ['100', '150', '200'] },
    { id: 'max_depth', name: '树最大深度', options: ['4', '6', '8'] },
    { id: 'sensitivity', name: '偏离敏感度', options: ['0.8', '1.0', '1.2'] },
  ],
  // 模型三动态根据选择的算法配置对应的参数
  model3: [
    {
      id: 'algorithm',
      name: '算法',
      options: [AlgorithmType.xgboost, AlgorithmType.lightGBM, AlgorithmType.TabNet],
    },
  ],
  model4: [
    {
      id: 'algorithm',
      name: '算法',
      options: [AlgorithmType.IQL, AlgorithmType.DQN, AlgorithmType.MADDPG, AlgorithmType.MAPPO],
    },
    { id: 'convergence_threshold', name: '收敛阈值', options: ['0.001', '0.005'] },
    { id: 'max_epochs', name: '最大迭代次数', options: ['1000'] },
  ],
}

/**
 * 获取当前模型的参数配置
 */
const getCurrentModelParams = () => {
  if (!selectedModel.value) return []
  // 保存返回参数
  let params = modelParamsConfig[selectedModel.value as keyof typeof modelParamsConfig] || []

  // 对模型三的参数选择根据对应的算法进行显示
  if (selectedModel.value === 'model3') {
    const algorithm = modelParams.value.algorithm
    if (algorithm === AlgorithmType.xgboost) {
      params = [
        ...params,
        { id: 'learning_rate', name: '学习率', options: ['0.1'] },
        { id: 'max_depth', name: '最大深度', options: ['6', '8'] },
      ]
    } else if (algorithm === AlgorithmType.lightGBM) {
      params = [
        ...params,
        { id: 'learning_rate', name: '学习率', options: ['0.1'] },
        { id: 'max_depth', name: '最大深度', options: ['4', '6'] },
      ]
    } else if (algorithm === AlgorithmType.TabNet) {
      const lr = modelParams.value.learning_rate
      params = [
        ...params,
        {
          id: 'learning_rate',
          name: '学习率',
          options: ['0.01', '0.02'],
        },
      ]

      // 如果已经选择了学习率，添加最大轮次参数
      if (lr) {
        params.push({
          id: 'max_epochs',
          name: '最大轮次',
          options: lr === '0.01' ? ['100'] : lr === '0.02' ? ['50'] : [],
        })
      }
    }
  }
  return params
}

/**
 * 选择模型
 * 设置当前选择的模型并重置参数
 * @param modelId 模型ID
 */
const selectModel = (modelId: string) => {
  selectedModel.value = modelId
  // 重置参数
  resetModelParams()
}

/**
 * 重置模型参数
 * 清空当前模型的所有参数选择并加载当前值
 */
const resetModelParams = () => {
  // 清空当前参数
  modelParams.value = {}

  // 如果选择了模型，并且模型有对应的模块
  if (selectedModel.value) {
    const moduleType = modelToModule[selectedModel.value]
    if (moduleType) {
      // 获取模块当前算法
      const currentAlgorithm = algorithmStore.getModuleSelectedAlgorithm(moduleType)

      // 设置当前算法
      modelParams.value.algorithm = currentAlgorithm

      // 获取算法的当前参数并设置到表单
      const currentParams = algorithmStore.getAlgorithmParams(currentAlgorithm)

      // 将算法参数设置到表单（转为字符串以匹配下拉选项）
      Object.entries(currentParams).forEach(([key, value]) => {
        if (key !== 'algorithm') {
          // 避免重复设置算法
          modelParams.value[key] = String(value)
        }
        if (key === 'sensitivity' && selectedModel.value === 'model2') {
          // 处理敏感偏离度，确保为一位小数
          const numValue = typeof value === 'number' ? value : Number(value)
          modelParams.value[key] = String(numValue).includes('.') ? String(numValue) : numValue.toFixed(1)
        }
      })
    }
  }
}

/**
 * 提交模型选择
 * 验证是否完整选择模型和参数，然后提交数据
 */
const submitModelSelection = () => {
  const currentParams = getCurrentModelParams()
  const isComplete = currentParams.every((param) => modelParams.value[param.id])

  // 验证是否完整填写
  if (!selectedModel.value || !isComplete) {
    emit('show-tip', '请完整填写表单')
    return
  }

  // 准备提交数据
  const submitData = {
    模型: selectedModel.value,
    参数: { ...modelParams.value },
  }

  // 获取对应的模块
  const moduleType = modelToModule[selectedModel.value]
  if (moduleType) {
    // 如果有算法字段，处理算法选择
    if (modelParams.value.algorithm) {
      const algorithmType = modelParams.value.algorithm as AlgorithmType

      // 设置模块的当前选中算法
      algorithmStore.setModuleSelectedAlgorithm(moduleType, algorithmType)

      // 准备更新的参数
      const paramsToUpdate: Record<string, any> = {}

      // 收集除algorithm之外的所有参数
      Object.entries(modelParams.value).forEach(([key, value]) => {
        if (key !== 'algorithm') {
          // 尝试将字符串转换为数字
          const numValue = Number(value)
          paramsToUpdate[key] = isNaN(numValue) ? value : numValue
        }
      })

      // 更新算法参数
      algorithmStore.updateAlgorithmParams(algorithmType, paramsToUpdate)
      emit('show-tip', `已更新${algorithmType}算法参数`)
    } else if (selectedModel.value === 'model2') {
      // 模型2只有一个算法：KnowledgeGraph
      const algorithmType = AlgorithmType.KnowledgeGraph

      // 准备更新的参数
      const paramsToUpdate: Record<string, any> = {}

      // 收集所有参数并转换为数字
      Object.entries(modelParams.value).forEach(([key, value]) => {
        const numValue = Number(value)
        paramsToUpdate[key] = isNaN(numValue) ? value : numValue
      })

      // 更新算法参数
      algorithmStore.updateAlgorithmParams(algorithmType, paramsToUpdate)
      emit('show-tip', `已更新${algorithmType}算法参数`)
    }
  }

  // 向父组件发送提交事件和数据
  emit('submit', submitData)
}

/**
 * 关闭窗口
 */
const close = () => {
  emit('close')
}
</script>

<template>
  <!-- 模型选择浮窗 -->
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
          <!-- 模型选择内容 -->
          <div class="model-window">
            <h2 class="window-title">模型选择</h2>
            <div class="title-underline"></div>

            <div class="model-container">
              <div class="model-sidebar">
                <!-- 模型选择按钮组 -->
                <div class="model-buttons">
                  <button
                    v-for="model in models"
                    :key="model.id"
                    class="model-btn"
                    :class="{ active: selectedModel === model.id }"
                    @click="selectModel(model.id)"
                  >
                    <span class="btn-text">{{ model.name }}</span>
                    <span class="btn-glow" v-if="selectedModel === model.id"></span>
                  </button>
                </div>
              </div>

              <div class="model-content">
                <div class="model-params">
                  <!-- 模型参数表单 -->
                  <div v-if="selectedModel" class="param-form">
                    <div v-for="param in getCurrentModelParams()" :key="param.id" class="param-item">
                      <div class="param-label">{{ param.name }}</div>
                      <div class="select-wrapper">
                        <select v-model="modelParams[param.id]" class="param-select">
                          <option value="">请选择参数值</option>
                          <option v-for="option in param.options" :key="option" :value="option">
                            {{ option }}
                          </option>
                        </select>
                        <div class="select-arrow"></div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="no-model-selected">
                    <span class="hint-icon">⚙️</span>
                    <span class="hint-text">请先选择左侧的模型</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 按钮组 -->
            <div class="button-group">
              <button class="submit-btn" @click="submitModelSelection">
                <span class="btn-text">提交</span>
                <span class="btn-shine"></span>
              </button>
              <button class="reset-btn" @click="resetModelParams">
                <span>重置</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style lang="scss" scoped>
@use './styles/common-window.scss';

/* 覆盖浮窗最大宽度 */
.floating-window {
  max-width: 800px;
}

/* 模型选择窗口特定样式 */
.model-window {
  min-height: 450px;
}

/* 模型选择窗口样式 */
.model-container {
  display: flex;
  min-height: 350px;
  margin-bottom: 20px;
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
  position: relative;
  width: 100%;
  padding: 15px 20px;
  text-align: center;
  border: 1px solid rgba(64, 169, 255, 0.2);
  border-radius: 20px;
  background: rgba(20, 40, 70, 0.4);
  cursor: pointer;
  transition: all 0.3s;
  font-size: 16px;
  color: rgba(220, 240, 255, 0.8);
  overflow: hidden;

  &:hover {
    background: rgba(30, 60, 100, 0.4);
    border-color: rgba(64, 169, 255, 0.5);
    box-shadow: 0 0 15px rgba(32, 160, 255, 0.15);
    transform: translateY(-2px);
  }

  &.active {
    background: linear-gradient(135deg, rgba(32, 160, 255, 0.2), rgba(64, 169, 255, 0.4));
    color: rgba(240, 250, 255, 1);
    border-color: rgba(64, 169, 255, 0.6);
    box-shadow:
      0 0 15px rgba(32, 160, 255, 0.3),
      inset 0 0 10px rgba(64, 169, 255, 0.15);
  }
}

.btn-text {
  position: relative;
  z-index: 2;
}

.btn-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, rgba(64, 169, 255, 0.3) 0%, rgba(64, 169, 255, 0) 70%);
  animation: btnGlow 2s infinite alternate;
  z-index: 1;
}

/* 模型参数区域 */
.model-params {
  padding: 20px;
  min-height: 350px;
  background: rgba(15, 25, 45, 0.3);
  border: 1px solid rgba(64, 169, 255, 0.2);
  border-radius: 10px;
  box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.1);
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
  flex: 0 0 90px;
  text-align: right;
  margin-right: 20px;
  font-size: 16px;
  color: rgba(220, 240, 255, 0.85);
  white-space: nowrap;
  min-width: 0;

  @media screen and (max-width: 768px) {
    font-size: 14px; /* 在小屏幕上减小字体大小 */
  }
}

.param-item:hover .param-label {
  overflow: visible;
  z-index: 5;
  padding: 2px 5px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

/* 下拉框容器 */
.select-wrapper {
  flex: 1;
  position: relative;
}

.param-select {
  width: 100%;
  height: 44px;
  background: rgba(20, 40, 70, 0.5);
  border: 1px solid rgba(64, 169, 255, 0.3);
  border-radius: 6px;
  padding: 0 15px;
  font-size: 15px;
  color: rgba(220, 240, 255, 0.9);
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);

  &:focus {
    outline: none;
    border-color: rgba(64, 169, 255, 0.6);
    box-shadow:
      0 0 12px rgba(32, 160, 255, 0.3),
      inset 0 0 5px rgba(0, 0, 0, 0.2);
  }

  &:hover {
    border-color: rgba(64, 169, 255, 0.5);
  }
}

/* 自定义下拉箭头 */
.select-arrow {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  border-right: 2px solid rgba(64, 169, 255, 0.6);
  border-bottom: 2px solid rgba(64, 169, 255, 0.6);
  transform: translateY(-50%) rotate(45deg);
  pointer-events: none;
  transition: all 0.3s;
}

.select-wrapper:hover .select-arrow {
  border-color: rgba(100, 200, 255, 0.8);
}

/* 下拉选项样式 */
.param-select option {
  background-color: rgba(20, 30, 50, 0.95);
  color: rgba(220, 240, 255, 0.9);
  padding: 10px;
}

.no-model-selected {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 250px;
  color: rgba(220, 240, 255, 0.5);
  font-size: 16px;
  border: 1px dashed rgba(64, 169, 255, 0.3);
  border-radius: 8px;
}

.hint-icon {
  font-size: 32px;
  margin-bottom: 15px;
  opacity: 0.7;
}

.hint-text {
  font-size: 18px;
  letter-spacing: 0.5px;
}

/* 按钮组 */
.button-group {
  display: flex;
  justify-content: center;
  gap: 25px;
  margin-top: 40px;
}

.submit-btn,
.reset-btn {
  min-width: 120px;
  padding: 12px 30px;
  border-radius: 25px;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.submit-btn {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: white;
  border: none;
  box-shadow: 0 4px 15px rgba(32, 160, 255, 0.3);
}

.reset-btn {
  background: rgba(20, 40, 70, 0.5);
  color: rgba(220, 240, 255, 0.85);
  border: 1px solid rgba(64, 169, 255, 0.4);
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(32, 160, 255, 0.5);
}

.submit-btn:active {
  transform: translateY(1px);
  box-shadow: 0 2px 10px rgba(32, 160, 255, 0.3);
}

.reset-btn:hover {
  background: rgba(30, 50, 80, 0.6);
  border-color: rgba(64, 169, 255, 0.6);
}

/* 提交按钮光晕 */
.btn-shine {
  position: absolute;
  top: 0;
  left: -120%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: skewX(-25deg);
  animation: btnShine 3s infinite;
}

/* 动画效果 */
@keyframes btnGlow {
  0% {
    opacity: 0.3;
  }
  100% {
    opacity: 0.8;
  }
}

@keyframes btnShine {
  0% {
    left: -120%;
  }
  20% {
    left: 120%;
  }
  100% {
    left: 120%;
  }
}
</style>
