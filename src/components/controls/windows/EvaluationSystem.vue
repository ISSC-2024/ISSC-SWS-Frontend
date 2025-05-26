<script setup lang="ts">
/**
 * EvaluationSystem.vue - 评价体系组件
 *
 * 该组件负责显示评价体系相关内容
 * 从主控制组件中拆分出来，使代码结构更加清晰
 */
import { ref, nextTick } from 'vue'
import MultiLevelIndicatorTable, { type IndicatorItem } from '@/components/tables/MultiLevelIndicatorTable.vue'
import ExpertCardCarousel from '@/components/cards/ExpertCardCarousel.vue'
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue'
import { useEvaluationStore } from '@/stores/evaluationStore'

// 定义组件向外发出的事件
const emit = defineEmits(['close'])

// 使用评价体系store
const evaluationStore = useEvaluationStore()

// 专家轮播组件引用
const expertCarouselRef = ref<InstanceType<typeof ExpertCardCarousel> | null>(null)

// 多级指标表格引用
const indicatorTableRef = ref<InstanceType<typeof MultiLevelIndicatorTable> | null>(null)

// 视图状态控制
const isTransitioning = ref(false)

// 数据变更处理
const handleDataChange = (newData: IndicatorItem[]) => {
  // 更新store中的指标数据
  evaluationStore.updateIndicatorData(newData)
  console.log('指标数据已更新', newData)
}

// 功能开关切换处理
const toggleFeature = (feature: 'debate' | 'indicators' | 'adversarial') => {
  evaluationStore.toggleAITool(feature)
  const toolName =
    feature === 'debate' ? '多智能体辩论评价生成' : feature === 'indicators' ? '评价指标自生成' : '对抗式评价判别'
  const isEnabled =
    feature === 'debate'
      ? evaluationStore.aiDebateEnabled
      : feature === 'indicators'
        ? evaluationStore.autoIndicatorsEnabled
        : evaluationStore.adversarialEvaluationEnabled
  console.log(`${toolName}:`, isEnabled ? '已开启' : '已关闭')
}

// 格式化专家数据函数已移除，现在直接使用store中的专家数据

// 递归处理指标数据，提取有值的指标
const processIndicators = (indicators: IndicatorItem[]): any[] => {
  return indicators.map((item) => {
    const result: any = {
      id: item.id,
      name: item.name,
    }

    // 如果有值，添加值
    if (item.value !== undefined && item.value !== '') {
      result.value = item.value
    }

    // 如果有子指标，递归处理
    if (item.children && item.children.length > 0) {
      result.children = processIndicators(item.children)
    }

    return result
  })
}

// 生成指标表格的Markdown文本
const generateIndicatorsTableMarkdown = (indicators: any[]): string => {
  if (!indicators || indicators.length === 0) {
    return '暂未配置评价指标\n\n'
  }

  // 收集所有三级指标作为表格的最终列
  const allLevel3Items: any[] = []
  const level1Info: { name: string; startCol: number; endCol: number }[] = []
  const level2Info: { name: string; startCol: number; endCol: number; parentName: string }[] = []

  let currentCol = 0

  indicators.forEach((level1) => {
    const level1StartCol = currentCol

    if (level1.children && level1.children.length > 0) {
      level1.children.forEach((level2: any) => {
        const level2StartCol = currentCol

        if (level2.children && level2.children.length > 0) {
          level2.children.forEach((level3: any) => {
            allLevel3Items.push({
              name: level3.name,
              value: level3.value || '',
              level1Name: level1.name,
              level2Name: level2.name,
            })
            currentCol++
          })
        } else {
          // 如果没有三级指标，添加占位符
          allLevel3Items.push({
            name: '未设置',
            value: '',
            level1Name: level1.name,
            level2Name: level2.name,
            isEmpty: true,
          })
          currentCol++
        }

        level2Info.push({
          name: level2.name,
          startCol: level2StartCol,
          endCol: currentCol - 1,
          parentName: level1.name,
        })
      })
    } else {
      // 如果没有二级指标，添加占位符
      allLevel3Items.push({
        name: '未设置',
        value: '',
        level1Name: level1.name,
        level2Name: '未设置',
        isEmpty: true,
      })
      level2Info.push({
        name: '未设置',
        startCol: currentCol,
        endCol: currentCol,
        parentName: level1.name,
      })
      currentCol++
    }

    level1Info.push({
      name: level1.name,
      startCol: level1StartCol,
      endCol: currentCol - 1,
    })
  })

  const totalCols = allLevel3Items.length

  // 生成一级指标行 - 每个一级指标重复填充其跨越的列数
  const level1Cells: string[] = new Array(totalCols)
  level1Info.forEach((info) => {
    for (let i = info.startCol; i <= info.endCol; i++) {
      level1Cells[i] = `**${info.name}**`
    }
  })

  // 生成二级指标行 - 每个二级指标重复填充其跨越的列数
  const level2Cells: string[] = new Array(totalCols)
  level2Info.forEach((info) => {
    const displayName = info.name === '未设置' ? '*未设置*' : `**${info.name}**`
    for (let i = info.startCol; i <= info.endCol; i++) {
      level2Cells[i] = displayName
    }
  })

  // 生成三级指标行
  const level3Cells = allLevel3Items.map((item) => {
    if (item.isEmpty) {
      return '*未设置*'
    }
    const valueText = item.value ? ` (${item.value})` : ''
    return `${item.name}${valueText}`
  })

  // 生成分隔符行
  const separatorRow = new Array(totalCols).fill('---')

  let markdown = ''
  markdown += `| ${level1Cells.join(' | ')} |\n`
  markdown += `| ${separatorRow.join(' | ')} |\n`
  markdown += `| ${level2Cells.join(' | ')} |\n`
  markdown += `| ${level3Cells.join(' | ')} |\n\n`

  return markdown
}

// 统计各级指标数量
const countIndicatorsByLevel = (indicators: any[]) => {
  let level1Count = 0
  let level2Count = 0
  let level3Count = 0

  indicators.forEach((level1) => {
    level1Count++

    if (level1.children && level1.children.length > 0) {
      level1.children.forEach((level2: any) => {
        level2Count++

        if (level2.children && level2.children.length > 0) {
          level3Count += level2.children.length
        }
      })
    }
  })

  return { level1Count, level2Count, level3Count }
}

// 生成配置摘要的Markdown
const generateConfigMarkdown = (evaluationData: any): string => {
  const currentTime = new Date().toLocaleString('zh-CN')

  let markdown = `# 评价体系配置摘要

> 📅 **生成时间**: ${currentTime}
>
> 🔄 **状态**: 系统正在执行评价流程...

---

## 👥 评价专家团队

`
  if (evaluationData.experts.length > 0) {
    evaluationData.experts.forEach((expert: any, index: number) => {
      markdown += `${index + 1}. **${expert.name}** \`ID: ${expert.id}\`\n`
      if (expert.desc) {
        markdown += `   - ${expert.desc}\n`
      }
    })
  } else {
    markdown += '暂未选择专家\n'
  }

  markdown += `\n---\n\n## 📊 评价指标体系\n\n`

  if (evaluationData.indicators.length > 0) {
    markdown += generateIndicatorsTableMarkdown(evaluationData.indicators)
  } else {
    markdown += '暂未配置评价指标\n\n'
  }

  markdown += `---\n\n## 🤖 智能评价工具\n\n`

  if (evaluationData.ai_tools.length > 0) {
    evaluationData.ai_tools.forEach((tool: any, index: number) => {
      const statusIcon = tool.enabled ? '✅' : '❌'
      markdown += `${index + 1}. ${statusIcon} **${tool.name}**\n`
    })
  } else {
    markdown += '暂未启用智能评价工具\n'
  }

  // 统计各级指标数量
  const indicatorCounts = countIndicatorsByLevel(evaluationData.indicators)

  markdown += `\n---\n\n## 📋 配置统计

| 项目 | 数量 |
|------|------|
| 选择专家 | ${evaluationData.experts.length} 位 |
| 一级指标 | ${indicatorCounts.level1Count} 项 |
| 二级指标 | ${indicatorCounts.level2Count} 项 |
| 三级指标 | ${indicatorCounts.level3Count} 项 |
| 启用工具 | ${evaluationData.ai_tools.length} 个 |

---

## 🚀 下一步操作

1. **数据验证**: 系统将验证所有配置项的完整性
2. **专家通知**: 向选定的专家发送评价邀请
3. **指标初始化**: 根据配置的指标体系初始化评价框架
4. **AI工具启动**: 激活选定的智能评价工具
5. **开始评价**: 正式启动评价流程

> 💡 **提示**: 如需修改配置，请点击"返回编辑"按钮重新配置。`

  return markdown
}

// 提交处理函数
const handleSubmit = async () => {
  try {
    // 开始过渡动画
    isTransitioning.value = true

    // 1. 直接从store获取专家数据
    const selectedExperts = evaluationStore.selectedExperts

    // 2. 获取当前表格数据
    const currentTableData = indicatorTableRef.value?.getCurrentData() || []

    // 3. 获取AI工具配置
    const aiTools = evaluationStore.getEnabledAITools()

    // 4. 组装三部分数据JSON
    const evaluationData = {
      experts: selectedExperts, // 直接使用store中的专家数据
      indicators: processIndicators(currentTableData),
      ai_tools: aiTools,
    }

    console.log('提交评价数据:')
    console.log(JSON.stringify(evaluationData, null, 2))

    // 5. 保存专家和指标数据到store
    evaluationStore.setSelectedExperts(evaluationData.experts)
    evaluationStore.updateIndicatorData(currentTableData)

    // 6. 生成Markdown配置摘要
    const markdownContent = generateConfigMarkdown(evaluationData)
    evaluationStore.setMarkdownContent(markdownContent)

    // 模拟提交延迟
    await new Promise((resolve) => setTimeout(resolve, 800))

    // 使用nextTick确保状态更新在正确的时机进行
    await nextTick()

    // 切换到结果视图
    evaluationStore.setSubmitted(true)

    // 等待DOM更新完成后再关闭过渡动画
    await nextTick()
    isTransitioning.value = false

    return evaluationData
  } catch (error) {
    console.error('提交数据时出错:', error)
    alert('提交数据时出错，请查看控制台获取详情')
    // 确保在错误情况下也能正确重置状态
    await nextTick()
    isTransitioning.value = false
    throw error
  }
}

// 返回编辑
const handleBackToEdit = () => {
  evaluationStore.setSubmitted(false)
}

// 重置处理函数
const handleReset = () => {
  console.log('重置评价数据')

  // 重置store中的所有状态
  evaluationStore.resetAll()

  console.log('已重置所有状态')
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
  <!-- 评价体系浮窗 -->
  <transition name="fade">
    <div class="overlay" @click="close">
      <div class="floating-window evaluation-window-container" @click.stop>
        <div class="corner top-left"></div>
        <div class="corner top-right"></div>
        <div class="corner bottom-left"></div>
        <div class="corner bottom-right"></div>

        <button class="close-btn" @click="close">
          <span class="close-icon">×</span>
        </button>

        <div class="window-content">
          <!-- 评价体系内容 -->
          <div class="evaluation-window">
            <h2 class="window-title">评价体系</h2>
            <div class="title-underline"></div>

            <!-- 过渡动画遮罩 -->
            <transition name="loading">
              <div v-if="isTransitioning" class="loading-overlay">
                <div class="loading-spinner"></div>
                <div class="loading-text">正在处理配置数据...</div>
              </div>
            </transition>

            <!-- 表单容器 -->
            <transition name="slide-fade" mode="out-in">
              <!-- 配置表单视图 -->
              <div v-if="!evaluationStore.isSubmitted" key="form" class="form-container">
                <!-- 专家卡片轮播 -->
                <div class="experts-section">
                  <h3 class="section-title">评价专家团队</h3>
                  <div class="experts-carousel-wrapper">
                    <ExpertCardCarousel ref="expertCarouselRef" />
                  </div>
                </div>

                <!-- 多级指标表格部分 -->
                <div class="indicators-section">
                  <h3 class="section-title">评价指标体系</h3>
                  <MultiLevelIndicatorTable @change="handleDataChange" ref="indicatorTableRef" />
                </div>

                <!-- 智能评价功能开关 -->
                <div class="ai-features-section">
                  <h3 class="section-title">智能评价工具</h3>
                  <div class="feature-buttons">
                    <button
                      class="feature-button"
                      :class="{ active: evaluationStore.aiDebateEnabled }"
                      @click="toggleFeature('debate')"
                    >
                      <span class="button-icon">🔄</span>
                      <span class="button-text">多智能体辩论评价</span>
                    </button>

                    <button
                      class="feature-button"
                      :class="{ active: evaluationStore.autoIndicatorsEnabled }"
                      @click="toggleFeature('indicators')"
                    >
                      <span class="button-icon">📊</span>
                      <span class="button-text">评价指标自生成</span>
                    </button>

                    <button
                      class="feature-button"
                      :class="{ active: evaluationStore.adversarialEvaluationEnabled }"
                      @click="toggleFeature('adversarial')"
                    >
                      <span class="button-icon">⚖️</span>
                      <span class="button-text">对抗式评价判别</span>
                    </button>
                  </div>
                </div>

                <!-- 操作按钮 -->
                <div class="action-buttons">
                  <button
                    class="submit-button"
                    @click="() => handleSubmit().catch(console.error)"
                    :disabled="isTransitioning"
                  >
                    <span class="button-icon">✓</span>
                    提交
                  </button>
                  <button class="reset-button" @click="handleReset" :disabled="isTransitioning">
                    <span class="button-icon">↺</span>
                    重置
                  </button>
                </div>
              </div>

              <!-- 配置摘要视图 -->
              <div v-else key="summary" class="summary-container">
                <div class="summary-header">
                  <div class="title-with-status">
                    <h3 class="summary-title">配置摘要</h3>
                    <div class="execution-status">
                      <div class="status-spinner"></div>
                      <span class="status-text">正在执行</span>
                    </div>
                  </div>
                  <button class="back-edit-button" @click="handleBackToEdit">
                    <span class="button-icon">←</span> 返回编辑
                  </button>
                </div>

                <div class="markdown-content">
                  <MarkdownRenderer :content="evaluationStore.markdownContent" />
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style lang="scss" scoped>
@use './styles/common-window.scss';

/* 评价体系窗口特定样式 */
.floating-window {
  top: 2%;
}

.evaluation-window-container {
  width: 90%;
  max-width: 1200px;
  height: 900px;
  display: flex;
  flex-direction: column;
}

.evaluation-window {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;

  .window-title {
    margin-bottom: 10px;
  }

  .title-underline {
    margin-bottom: 20px;
  }

  .form-container {
    overflow-y: auto;
    padding: 0 15px 15px;
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 1100px;
    margin: 0 auto;
    position: relative;

    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(20, 30, 50, 0.2);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(64, 169, 255, 0.5);
      border-radius: 3px;
    }
  }

  .experts-section,
  .indicators-section,
  .ai-features-section {
    width: 100%;
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;

    .section-title {
      font-size: 16px;
      color: rgba(220, 240, 255, 0.95);
      margin-bottom: 6px;
      position: relative;
      padding-left: 15px;

      &:before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 4px;
        height: 16px;
        background: rgba(64, 169, 255, 0.8);
        border-radius: 2px;
      }
    }
  }

  .experts-section {
    flex: 0.8;
    min-height: 220px;

    .experts-carousel-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
  }

  .ai-features-section {
    margin-top: 10px;

    .feature-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      justify-content: center;
      margin-top: 10px;

      .feature-button {
        display: flex;
        align-items: center;
        padding: 8px 16px;
        background: rgba(20, 30, 50, 0.7);
        border: 1px solid rgba(64, 169, 255, 0.3);
        border-radius: 6px;
        color: rgba(220, 240, 255, 0.9);
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 180px;

        &:hover {
          background: rgba(30, 40, 60, 0.8);
          border-color: rgba(64, 169, 255, 0.5);
          transform: translateY(-2px);
        }

        &.active {
          background: rgba(20, 60, 100, 0.7);
          border-color: rgba(64, 169, 255, 0.8);
          box-shadow: 0 0 10px rgba(64, 169, 255, 0.3);
        }

        .button-icon {
          margin-right: 8px;
          font-size: 18px;
        }

        .button-text {
          font-size: 14px;
        }
      }
    }
  }

  .action-buttons {
    width: 100%;
    display: flex;
    justify-content: center;
    gap: 30px;
    margin-top: 25px;
    padding-bottom: 20px;

    button {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px 30px;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      .button-icon {
        margin-right: 8px;
      }

      &:hover:not(:disabled) {
        transform: translateY(-2px);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .submit-button {
      background: rgba(0, 120, 212, 0.8);
      color: white;
      border: 1px solid rgba(0, 150, 255, 0.5);

      &:hover:not(:disabled) {
        background: rgba(0, 140, 230, 0.9);
        box-shadow: 0 4px 12px rgba(0, 120, 212, 0.3);
      }
    }

    .reset-button {
      background: rgba(40, 50, 70, 0.7);
      color: rgba(220, 240, 255, 0.9);
      border: 1px solid rgba(100, 120, 150, 0.5);

      &:hover:not(:disabled) {
        background: rgba(50, 60, 80, 0.8);
        box-shadow: 0 4px 12px rgba(20, 30, 50, 0.3);
      }
    }
  }

  // 配置摘要视图样式
  .summary-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0 15px 15px;
    overflow: hidden;

    .summary-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding: 0 10px;

      .title-with-status {
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .summary-title {
        font-size: 18px;
        color: rgba(220, 240, 255, 0.95);
        margin: 0;
      }

      .execution-status {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        background: rgba(20, 60, 100, 0.6);
        border: 1px solid rgba(64, 169, 255, 0.4);
        border-radius: 20px;
        font-size: 12px;
        color: rgba(220, 240, 255, 0.9);

        .status-spinner {
          width: 12px;
          height: 12px;
          border: 2px solid rgba(64, 169, 255, 0.3);
          border-top: 2px solid rgba(64, 169, 255, 0.8);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .status-text {
          font-weight: 500;
        }
      }

      .back-edit-button {
        display: flex;
        align-items: center;
        padding: 8px 16px;
        background: rgba(40, 50, 70, 0.7);
        color: rgba(220, 240, 255, 0.9);
        border: 1px solid rgba(100, 120, 150, 0.5);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;

        .button-icon {
          margin-right: 6px;
        }

        &:hover {
          background: rgba(50, 60, 80, 0.8);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(20, 30, 50, 0.3);
        }
      }
    }

    .markdown-content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      background: rgba(10, 15, 25, 0.3);
      border-radius: 8px;
      border: 1px solid rgba(64, 169, 255, 0.15);

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: rgba(20, 30, 50, 0.2);
        border-radius: 3px;
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(64, 169, 255, 0.5);
        border-radius: 3px;
      }
    }
  }

  // 加载动画样式
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(10, 15, 25, 0.9);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(4px);

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(64, 169, 255, 0.3);
      border-top: 3px solid rgba(64, 169, 255, 0.8);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    .loading-text {
      color: rgba(220, 240, 255, 0.9);
      font-size: 16px;
    }
  }
}

// 动画定义
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

// 过渡动画
.loading-enter-active,
.loading-leave-active {
  transition: opacity 0.3s ease;
}

.loading-enter-from,
.loading-leave-to {
  opacity: 0;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.5s ease;
}

.slide-fade-enter-from {
  transform: translateX(30px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-30px);
  opacity: 0;
} /* 旋转动画 */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
} /* 旋转动画 */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
