<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/authStore'

/**
 * SceneSwitcher.vue - 场景切换组件
 *
 * 该组件负责行业、场景和应用的选择与提交功能
 * 从主控制组件中拆分出来，使代码结构更加清晰
 */

// 定义组件向外发出的事件
const emit = defineEmits(['close', 'show-tip', 'submit'])

// 场景切换相关数据
const authStore = useAuthStore()

// 行业选项根据权限过滤
const industries = computed(() => {
  const allIndustries = [
    { id: 'chemical', name: '化工' },
    { id: 'steel', name: '钢铁' },
    { id: 'newEnergy', name: '新能源' },
    { id: 'medicine', name: '医药' },
  ]

  // 管理员显示全部
  if (authStore.role === 'admin') return allIndustries

  // 普通用户过滤对应行业
  const userIndustryMap = {
    user1: 'chemical',
    user2: 'steel',
    user3: 'newEnergy',
    user4: 'medicine',
  }

  return allIndustries.filter(
    (industry) => industry.id === userIndustryMap[authStore.role as keyof typeof userIndustryMap],
  )
})

const scenes = [
  { id: 'intelligentDecision', name: '智能决策场景' },
  { id: 'leanManufacturing', name: '精益制造场景' },
  { id: 'precisionService', name: '精准服务场景' },
]

// 应用选项，根据行业和场景组合生成
const applications = {
  chemical: {
    intelligentDecision: [
      { id: 'safetyRisk', name: '安全风险智能预警决策' },
      { id: 'environmentalControl', name: '环保管控决策支持' },
    ],
    leanManufacturing: [
      { id: 'placeholder1', name: '化工-精益制造场景-应用-1' },
      { id: 'placeholder2', name: '化工-精益制造场景-应用-2' },
    ],
    precisionService: [
      { id: 'placeholder1', name: '化工-精准服务场景-应用-1' },
      { id: 'placeholder2', name: '化工-精准服务场景-应用-2' },
    ],
  },
  steel: {
    intelligentDecision: [
      { id: 'placeholder1', name: '钢铁-智能决策场景-应用-1' },
      { id: 'placeholder2', name: '钢铁-智能决策场景-应用-2' },
    ],
    leanManufacturing: [
      { id: 'placeholder1', name: '钢铁-精益制造场景-应用-1' },
      { id: 'placeholder2', name: '钢铁-精益制造场景-应用-2' },
    ],
    precisionService: [
      { id: 'placeholder1', name: '钢铁-精准服务场景-应用-1' },
      { id: 'placeholder2', name: '钢铁-精准服务场景-应用-2' },
    ],
  },
  newEnergy: {
    intelligentDecision: [
      { id: 'placeholder1', name: '新能源-智能决策场景-应用-1' },
      { id: 'placeholder2', name: '新能源-智能决策场景-应用-2' },
    ],
    leanManufacturing: [
      { id: 'placeholder1', name: '新能源-精益制造场景-应用-1' },
      { id: 'placeholder2', name: '新能源-精益制造场景-应用-2' },
    ],
    precisionService: [
      { id: 'placeholder1', name: '新能源-精准服务场景-应用-1' },
      { id: 'placeholder2', name: '新能源-精准服务场景-应用-2' },
    ],
  },
  medicine: {
    intelligentDecision: [
      { id: 'placeholder1', name: '医药-智能决策场景-应用-1' },
      { id: 'placeholder2', name: '医药-智能决策场景-应用-2' },
    ],
    leanManufacturing: [
      { id: 'placeholder1', name: '医药-精益制造场景-应用-1' },
      { id: 'placeholder2', name: '医药-精益制造场景-应用-2' },
    ],
    precisionService: [
      { id: 'placeholder1', name: '医药-精准服务场景-应用-1' },
      { id: 'placeholder2', name: '医药-精准服务场景-应用-2' },
    ],
  },
}

// 表单数据
const selectedIndustry = ref('')
const selectedScene = ref('')
const selectedApplication = ref('')

// 监听行业变化，重置场景和应用选择
watch(selectedIndustry, () => {
  selectedScene.value = ''
  selectedApplication.value = ''
})

// 监听场景变化，重置应用选择
watch(selectedScene, () => {
  selectedApplication.value = ''
})

/**
 * 获取当前行业和场景下的应用列表
 * 根据选择的行业和场景，从applications对象中获取对应的应用列表
 */
const getApplications = () => {
  if (!selectedIndustry.value || !selectedScene.value) return []
  return (
    applications[selectedIndustry.value as keyof typeof applications]?.[
      selectedScene.value as keyof typeof applications.chemical
    ] || []
  )
}

/**
 * 重置表单
 * 清空所有选择项
 */
const resetForm = () => {
  selectedIndustry.value = ''
  selectedScene.value = ''
  selectedApplication.value = ''
}

/**
 * 提交表单
 * 验证表单完整性并提交数据
 */
const submitForm = () => {
  // 验证表单是否完整填写
  if (!selectedIndustry.value || !selectedScene.value || !selectedApplication.value) {
    emit('show-tip', '请完整填写表单')
    return
  }

  // 准备提交数据
  const formData = {
    行业: selectedIndustry.value,
    场景: selectedScene.value,
    应用: selectedApplication.value,
  }

  // 向父组件发送提交事件和数据
  emit('submit', formData)
}

/**
 * 关闭窗口
 * 调用父组件的关闭方法
 */
const close = () => {
  emit('close')
}
</script>

<template>
  <!-- 场景切换浮窗 -->
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
          <!-- 场景切换内容 -->
          <div class="scene-window">
            <h2 class="window-title">场景切换</h2>
            <div class="title-underline"></div>

            <div class="form-container">
              <!-- 行业选择 -->
              <div class="form-group">
                <label class="form-label">请选择行业</label>
                <div class="select-wrapper">
                  <select v-model="selectedIndustry" class="form-select">
                    <option value="">请选择行业类型</option>
                    <option v-for="industry in industries" :key="industry.id" :value="industry.id">
                      {{ industry.name }}
                    </option>
                  </select>
                  <div class="select-arrow"></div>
                </div>
              </div>

              <!-- 场景选择 -->
              <div class="form-group">
                <label class="form-label">请选择场景</label>
                <div class="select-wrapper">
                  <select v-model="selectedScene" class="form-select" :disabled="!selectedIndustry">
                    <option value="">请选择应用场景</option>
                    <option v-for="scene in scenes" :key="scene.id" :value="scene.id">
                      {{ scene.name }}
                    </option>
                  </select>
                  <div class="select-arrow"></div>
                </div>
              </div>

              <!-- 应用选择 -->
              <div class="form-group">
                <label class="form-label">请选择应用</label>
                <div class="select-wrapper">
                  <select v-model="selectedApplication" class="form-select" :disabled="!selectedScene">
                    <option value="">请选择具体应用</option>
                    <option v-for="app in getApplications()" :key="app.id" :value="app.id">
                      {{ app.name }}
                    </option>
                  </select>
                  <div class="select-arrow"></div>
                </div>
              </div>

              <!-- 按钮组 -->
              <div class="button-group">
                <button class="submit-btn" @click="submitForm">
                  <span>提交</span>
                  <span class="btn-glow"></span>
                </button>
                <button class="reset-btn" @click="resetForm">
                  <span>重置</span>
                </button>
              </div>
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
  background-color: rgba(5, 15, 30, 0.7);
  backdrop-filter: blur(4px);
  z-index: 99;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 浮窗样式 */
.floating-window {
  position: relative;
  top: -5%;
  width: 80%;
  max-width: 700px;
  background: linear-gradient(135deg, rgba(20, 30, 50, 0.95), rgba(12, 22, 40, 0.95));
  border: 1px solid rgba(64, 169, 255, 0.3);
  border-radius: 12px;
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(32, 160, 255, 0.2);
  z-index: 100;
  overflow: hidden;
  padding: 45px 25px 30px;
  backdrop-filter: blur(10px);
}

/* 装饰性角落 */
.corner {
  position: absolute;
  width: 25px;
  height: 25px;
  z-index: 2;
}

.top-left {
  top: 0;
  left: 0;
  border-top: 2px solid rgba(64, 169, 255, 0.6);
  border-left: 2px solid rgba(64, 169, 255, 0.6);
  border-top-left-radius: 8px;
}

.top-right {
  top: 0;
  right: 0;
  border-top: 2px solid rgba(64, 169, 255, 0.6);
  border-right: 2px solid rgba(64, 169, 255, 0.6);
  border-top-right-radius: 8px;
}

.bottom-left {
  bottom: 0;
  left: 0;
  border-bottom: 2px solid rgba(64, 169, 255, 0.6);
  border-left: 2px solid rgba(64, 169, 255, 0.6);
  border-bottom-left-radius: 8px;
}

.bottom-right {
  bottom: 0;
  right: 0;
  border-bottom: 2px solid rgba(64, 169, 255, 0.6);
  border-right: 2px solid rgba(64, 169, 255, 0.6);
  border-bottom-right-radius: 8px;
}

/* 关闭按钮 */
.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(32, 160, 255, 0.15);
  border: 1px solid rgba(64, 169, 255, 0.3);
  color: rgba(220, 240, 255, 0.9);
  font-size: 18px;
  cursor: pointer;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  z-index: 3;
}

.close-btn:hover {
  background: rgba(32, 160, 255, 0.3);
  transform: rotate(90deg);
  box-shadow: 0 0 10px rgba(32, 160, 255, 0.4);
}

.close-icon {
  display: block;
  line-height: 0.8;
}

.window-content {
  max-height: 70vh;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(64, 169, 255, 0.5) rgba(20, 30, 50, 0.2);
}

.window-content::-webkit-scrollbar {
  width: 6px;
}

.window-content::-webkit-scrollbar-track {
  background: rgba(20, 30, 50, 0.2);
  border-radius: 3px;
}

.window-content::-webkit-scrollbar-thumb {
  background-color: rgba(64, 169, 255, 0.5);
  border-radius: 3px;
}

/* 窗口标题 */
.window-title {
  text-align: center;
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 26px;
  font-weight: 500;
  color: rgba(220, 240, 255, 0.95);
  letter-spacing: 1px;
  text-shadow: 0 0 10px rgba(64, 169, 255, 0.5);
}

.title-underline {
  width: 120px;
  height: 2px;
  margin: 0 auto 40px;
  background: linear-gradient(to right, rgba(32, 160, 255, 0), rgba(64, 169, 255, 0.7) 50%, rgba(32, 160, 255, 0) 100%);
  position: relative;
}

.title-underline::after {
  content: '';
  position: absolute;
  width: 40%;
  height: 2px;
  left: 30%;
  bottom: -3px;
  background: rgba(64, 169, 255, 0.3);
  filter: blur(1px);
}

/* 表单样式 */
.form-container {
  max-width: 520px;
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
  color: rgba(220, 240, 255, 0.85);
  font-weight: 400;
}

/* 下拉框容器 */
.select-wrapper {
  flex: 1;
  position: relative;
}

.form-select {
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
}

.form-select:focus {
  outline: none;
  border-color: rgba(64, 169, 255, 0.6);
  box-shadow:
    0 0 12px rgba(32, 160, 255, 0.3),
    inset 0 0 5px rgba(0, 0, 0, 0.2);
}

.form-select:hover:not(:disabled) {
  border-color: rgba(64, 169, 255, 0.5);
}

.form-select:disabled {
  background-color: rgba(20, 30, 50, 0.6);
  color: rgba(220, 240, 255, 0.5);
  cursor: not-allowed;
  border-color: rgba(64, 169, 255, 0.15);
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
.form-select option {
  background-color: rgba(20, 30, 50, 0.95);
  color: rgba(220, 240, 255, 0.9);
  padding: 10px;
}

/* 按钮组 */
.button-group {
  display: flex;
  justify-content: center;
  gap: 25px;
  margin-top: 60px;
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
.btn-glow {
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

/* 场景窗口特定样式 */
.scene-window {
  min-height: 450px;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.4s,
    transform 0.4s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-from .floating-window,
.fade-leave-to .floating-window {
  transform: scale(0.95) translateY(20px);
}

/* 按钮光晕动画 */
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
