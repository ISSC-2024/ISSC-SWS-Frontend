<script setup lang="ts">
import { ref, watch } from 'vue';

/**
 * SceneSwitcher.vue - 场景切换组件
 * 
 * 该组件负责行业、场景和应用的选择与提交功能
 * 从主控制组件中拆分出来，使代码结构更加清晰
 */

// 定义组件向外发出的事件
const emit = defineEmits(['close', 'show-tip', 'submit']);

// 场景切换相关数据
const industries = [
  { id: 'chemical', name: '化工' },
  { id: 'steel', name: '钢铁' },
  { id: 'newEnergy', name: '新能源' },
  { id: 'medicine', name: '医药' }
];

const scenes = [
  { id: 'intelligentDecision', name: '智能决策场景' },
  { id: 'leanManufacturing', name: '精益制造场景' },
  { id: 'precisionService', name: '精准服务场景' }
];

// 应用选项，根据行业和场景组合生成
const applications = {
  chemical: {
    intelligentDecision: [
      { id: 'safetyRisk', name: '安全风险智能预警决策' },
      { id: 'environmentalControl', name: '环保管控决策支持' }
    ],
    leanManufacturing: [
      { id: 'placeholder1', name: '化工-精益制造场景-应用-1' },
      { id: 'placeholder2', name: '化工-精益制造场景-应用-2' }
    ],
    precisionService: [
      { id: 'placeholder1', name: '化工-精准服务场景-应用-1' },
      { id: 'placeholder2', name: '化工-精准服务场景-应用-2' }
    ]
  },
  steel: {
    intelligentDecision: [
      { id: 'placeholder1', name: '钢铁-智能决策场景-应用-1' },
      { id: 'placeholder2', name: '钢铁-智能决策场景-应用-2' }
    ],
    leanManufacturing: [
      { id: 'placeholder1', name: '钢铁-精益制造场景-应用-1' },
      { id: 'placeholder2', name: '钢铁-精益制造场景-应用-2' }
    ],
    precisionService: [
      { id: 'placeholder1', name: '钢铁-精准服务场景-应用-1' },
      { id: 'placeholder2', name: '钢铁-精准服务场景-应用-2' }
    ]
  },
  newEnergy: {
    intelligentDecision: [
      { id: 'placeholder1', name: '新能源-智能决策场景-应用-1' },
      { id: 'placeholder2', name: '新能源-智能决策场景-应用-2' }
    ],
    leanManufacturing: [
      { id: 'placeholder1', name: '新能源-精益制造场景-应用-1' },
      { id: 'placeholder2', name: '新能源-精益制造场景-应用-2' }
    ],
    precisionService: [
      { id: 'placeholder1', name: '新能源-精准服务场景-应用-1' },
      { id: 'placeholder2', name: '新能源-精准服务场景-应用-2' }
    ]
  },
  medicine: {
    intelligentDecision: [
      { id: 'placeholder1', name: '医药-智能决策场景-应用-1' },
      { id: 'placeholder2', name: '医药-智能决策场景-应用-2' }
    ],
    leanManufacturing: [
      { id: 'placeholder1', name: '医药-精益制造场景-应用-1' },
      { id: 'placeholder2', name: '医药-精益制造场景-应用-2' }
    ],
    precisionService: [
      { id: 'placeholder1', name: '医药-精准服务场景-应用-1' },
      { id: 'placeholder2', name: '医药-精准服务场景-应用-2' }
    ]
  }
};

// 表单数据
const selectedIndustry = ref('');
const selectedScene = ref('');
const selectedApplication = ref('');

// 监听行业变化，重置场景和应用选择
watch(selectedIndustry, () => {
  selectedScene.value = '';
  selectedApplication.value = '';
});

// 监听场景变化，重置应用选择
watch(selectedScene, () => {
  selectedApplication.value = '';
});

/**
 * 获取当前行业和场景下的应用列表
 * 根据选择的行业和场景，从applications对象中获取对应的应用列表
 */
const getApplications = () => {
  if (!selectedIndustry.value || !selectedScene.value) return [];
  return applications[selectedIndustry.value as keyof typeof applications]?.[selectedScene.value as keyof typeof applications.chemical] || [];
};

/**
 * 重置表单
 * 清空所有选择项
 */
const resetForm = () => {
  selectedIndustry.value = '';
  selectedScene.value = '';
  selectedApplication.value = '';
};

/**
 * 提交表单
 * 验证表单完整性并提交数据
 */
const submitForm = () => {
  // 验证表单是否完整填写
  if (!selectedIndustry.value || !selectedScene.value || !selectedApplication.value) {
    emit('show-tip', '请完整填写表单');
    return;
  }
  
  // 准备提交数据
  const formData = {
    行业: selectedIndustry.value,
    场景: selectedScene.value,
    应用: selectedApplication.value
  };
  
  // 向父组件发送提交事件和数据
  emit('submit', formData);
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
  <!-- 场景切换浮窗 -->
  <transition name="fade">
    <div class="overlay" @click="close">
      <div class="floating-window" @click.stop>
        <button class="close-btn" @click="close">×</button>
        
        <div class="window-content">
          <!-- 场景切换内容 -->
          <div class="scene-window">
            <h2 class="window-title">场景切换</h2>
            
            <div class="form-container">
              <!-- 行业选择 -->
              <div class="form-group">
                <label class="form-label">请选择行业</label>
                <select v-model="selectedIndustry" class="form-select">
                  <option value="">请选择</option>
                  <option v-for="industry in industries" :key="industry.id" :value="industry.id">
                    {{ industry.name }}
                  </option>
                </select>
              </div>
              
              <!-- 场景选择 -->
              <div class="form-group">
                <label class="form-label">请选择场景</label>
                <select v-model="selectedScene" class="form-select" :disabled="!selectedIndustry">
                  <option value="">请选择</option>
                  <option v-for="scene in scenes" :key="scene.id" :value="scene.id">
                    {{ scene.name }}
                  </option>
                </select>
              </div>
              
              <!-- 应用选择 -->
              <div class="form-group">
                <label class="form-label">请选择应用</label>
                <select v-model="selectedApplication" class="form-select" :disabled="!selectedScene">
                  <option value="">请选择</option>
                  <option v-for="app in getApplications()" :key="app.id" :value="app.id">
                    {{ app.name }}
                  </option>
                </select>
              </div>
              
              <!-- 按钮组 -->
              <div class="button-group">
                <button class="submit-btn" @click="submitForm">提交</button>
                <button class="reset-btn" @click="resetForm">重置</button>
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
  margin-top: 60px; /* 场景切换窗口特有的margin-top */
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

/* 场景窗口特定样式 */
.scene-window {
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