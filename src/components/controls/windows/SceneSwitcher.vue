<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthService from '@/services/AuthService'

/**
 * SceneSwitcher.vue - 行业选择跳转页面
 *
 * 该组件负责行业选择和跳转功能
 * 支持四个行业：化工、钢铁、新能源、制药
 */

// 定义组件向外发出的事件
const emit = defineEmits(['close', 'show-tip'])

// 路由实例
const router = useRouter()

// 行业选项数据
const industries = [
  {
    id: 'chemical',
    name: '化工',
    description: '化工行业智能监控与决策系统',
    icon: '🧪',
    route: '/dashboard/chemical',
  },
  {
    id: 'steel',
    name: '钢铁',
    description: '钢铁行业生产管理与优化系统',
    icon: '🏭',
    route: 'http://150.158.82.42:5174/dashboard/steel', // 外部跳转
  },
  {
    id: 'newEnergy',
    name: '新能源',
    description: '新能源发电监控与管理系统',
    icon: '⚡',
    route: '/dashboard/newEnergy',
  },
  {
    id: 'pharmaceutical',
    name: '制药',
    description: '制药行业质量控制与生产管理系统',
    icon: '💊',
    route: '/dashboard/pharmaceutical',
  },
]

// 表单数据
const selectedIndustry = ref('')
const isLoading = ref(false)

/**
 * 选择行业
 * @param industryId 行业ID
 */
const selectIndustry = (industryId: string) => {
  selectedIndustry.value = industryId
}

/**
 * 提交表单并跳转
 * 验证选择并执行跳转逻辑
 */
const submitForm = async () => {
  // 验证是否已选择行业
  if (!selectedIndustry.value) {
    emit('show-tip', '请选择一个行业')
    return
  }

  // 检查登录状态
  const isLoggedIn = AuthService.isLoggedIn()
  if (!isLoggedIn) {
    emit('show-tip', '用户未登录，请先登录')
    router.push('/login')
    return
  }

  isLoading.value = true

  try {
    // 查找选中的行业信息
    const selectedIndustryInfo = industries.find((industry) => industry.id === selectedIndustry.value)

    if (!selectedIndustryInfo) {
      emit('show-tip', '无效的行业选择')
      return
    }

    // 保存选择到会话存储
    sessionStorage.setItem('selectedIndustry', selectedIndustry.value)

    // 根据行业类型执行不同的跳转逻辑
    if (selectedIndustry.value === 'steel') {
      // 钢铁行业跳转到外部地址
      console.log(`跳转到钢铁行业外部系统: ${selectedIndustryInfo.route}`)
      window.location.href = selectedIndustryInfo.route
    } else {
      // 其他行业使用内部路由跳转
      console.log(`跳转到${selectedIndustryInfo.name}行业仪表板: ${selectedIndustryInfo.route}`)
      await router.push(selectedIndustryInfo.route)

      // 关闭当前窗口
      emit('close')
    }
  } catch (error) {
    console.error('跳转失败:', error)
    emit('show-tip', '跳转失败，请重试')
  } finally {
    isLoading.value = false
  }
}

/**
 * 重置表单
 * 清空选择项
 */
const resetForm = () => {
  selectedIndustry.value = ''
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
  <!-- 行业选择浮窗 -->
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
          <!-- 行业选择内容 -->
          <div class="industry-selection-window">
            <h2 class="window-title">行业选择</h2>
            <div class="title-underline"></div>

            <div class="form-container">
              <!-- 行业选择说明 -->
              <div class="selection-description">
                <p>请选择您要进入的行业系统：</p>
              </div>

              <!-- 行业卡片选择 -->
              <div class="industry-cards">
                <div
                  v-for="industry in industries"
                  :key="industry.id"
                  class="industry-card"
                  :class="{ selected: selectedIndustry === industry.id }"
                  @click="selectIndustry(industry.id)"
                >
                  <div class="card-icon">{{ industry.icon }}</div>
                  <div class="card-content">
                    <h3 class="card-title">{{ industry.name }}</h3>
                    <p class="card-description">{{ industry.description }}</p>
                  </div>
                  <div class="card-radio">
                    <input
                      type="radio"
                      :id="industry.id"
                      :value="industry.id"
                      v-model="selectedIndustry"
                      class="radio-input"
                    />
                    <label :for="industry.id" class="radio-label"></label>
                  </div>
                </div>
              </div>

              <!-- 按钮组 -->
              <div class="button-group">
                <button class="submit-btn" @click="submitForm" :disabled="!selectedIndustry || isLoading">
                  <span v-if="isLoading">跳转中...</span>
                  <span v-else>进入系统</span>
                  <span class="btn-glow" v-if="!isLoading"></span>
                </button>
                <button class="reset-btn" @click="resetForm" :disabled="isLoading">
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

<style lang="scss" scoped>
@use './styles/common-window.scss';

/* 行业选择窗口特定样式 */
.industry-selection-window {
  min-height: 500px;
}

/* 选择说明文字 */
.selection-description {
  text-align: center;
  margin-bottom: 30px;

  p {
    font-size: 16px;
    color: rgba(220, 240, 255, 0.85);
    margin: 0;
  }
}

/* 行业卡片容器 */
.industry-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 40px;
}

/* 行业卡片样式 */
.industry-card {
  position: relative;
  background: rgba(20, 40, 70, 0.4);
  border: 2px solid rgba(64, 169, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 15px;
  min-height: 80px;

  &:hover {
    border-color: rgba(64, 169, 255, 0.4);
    background: rgba(20, 40, 70, 0.6);
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(32, 160, 255, 0.2);
  }

  &.selected {
    border-color: rgba(64, 169, 255, 0.8);
    background: rgba(32, 160, 255, 0.1);
    box-shadow: 0 0 20px rgba(32, 160, 255, 0.3);

    .card-icon {
      transform: scale(1.1);
    }

    .card-title {
      color: rgba(64, 169, 255, 1);
    }
  }
}

/* 卡片图标 */
.card-icon {
  font-size: 32px;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

/* 卡片内容 */
.card-content {
  flex: 1;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: rgba(220, 240, 255, 0.95);
  margin: 0 0 8px 0;
  transition: color 0.3s ease;
}

.card-description {
  font-size: 14px;
  color: rgba(220, 240, 255, 0.7);
  margin: 0;
  line-height: 1.4;
}

/* 单选按钮容器 */
.card-radio {
  position: relative;
  flex-shrink: 0;
}

/* 隐藏原生单选按钮 */
.radio-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

/* 自定义单选按钮样式 */
.radio-label {
  display: block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(64, 169, 255, 0.4);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(64, 169, 255, 1);
    transition: transform 0.2s ease;
  }
}

/* 选中状态的单选按钮 */
.radio-input:checked + .radio-label {
  border-color: rgba(64, 169, 255, 1);
  background: rgba(64, 169, 255, 0.1);

  &::after {
    transform: translate(-50%, -50%) scale(1);
  }
}

/* 按钮禁用状态 */
.submit-btn:disabled,
.reset-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;

  &:hover {
    transform: none;
    box-shadow: none;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .industry-cards {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .industry-card {
    padding: 15px;
    min-height: 70px;
  }

  .card-icon {
    font-size: 28px;
  }

  .card-title {
    font-size: 16px;
  }

  .card-description {
    font-size: 13px;
  }
}
</style>
