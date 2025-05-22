import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { IndicatorItem } from '@/components/tables/MultiLevelIndicatorTable.vue'

// 默认指标数据结构
const DEFAULT_INDICATOR_DATA: IndicatorItem[] = [
  {
    id: '1',
    name: '一级指标1',
    children: [
      {
        id: '1-1',
        name: '二级指标1-1',
        children: [
          { id: '1-1-1', name: '三级指标1-1-1', value: '', editable: true },
          { id: '1-1-2', name: '三级指标1-1-2', value: '', editable: true },
        ],
      },
      {
        id: '1-2',
        name: '二级指标1-2',
        children: [
          { id: '1-2-1', name: '三级指标1-2-1', value: '', editable: true },
          { id: '1-2-2', name: '三级指标1-2-2', value: '', editable: true },
        ],
      },
    ],
  },
  {
    id: '2',
    name: '一级指标2',
    children: [
      {
        id: '2-1',
        name: '二级指标2-1',
        children: [
          { id: '2-1-1', name: '三级指标2-1-1', value: '', editable: true },
          { id: '2-1-2', name: '三级指标2-1-2', value: '', editable: true },
        ],
      },
    ],
  },
]

// 专家信息接口
export interface ExpertInfo {
  id: string
  name: string
}

// AI工具配置接口
export interface AIToolConfig {
  id: string
  name: string
  enabled: boolean
}

// 评价体系状态接口
export interface EvaluationState {
  selectedExperts: ExpertInfo[]
  indicatorData: IndicatorItem[]
  aiTools: {
    aiDebateEnabled: boolean
    autoIndicatorsEnabled: boolean
    adversarialEvaluationEnabled: boolean
  }
  isSubmitted: boolean
  markdownContent: string
}

export const useEvaluationStore = defineStore('evaluation', () => {
  // 选中的专家列表
  const selectedExperts = ref<ExpertInfo[]>([])

  // 指标数据 - 使用默认数据初始化
  const indicatorData = ref<IndicatorItem[]>(structuredClone(DEFAULT_INDICATOR_DATA))

  // AI工具开关状态
  const aiDebateEnabled = ref(false)
  const autoIndicatorsEnabled = ref(false)
  const adversarialEvaluationEnabled = ref(false)

  // 提交状态
  const isSubmitted = ref(false)
  const markdownContent = ref('')

  // 设置选中的专家
  const setSelectedExperts = (experts: ExpertInfo[]) => {
    selectedExperts.value = [...experts]
  }

  // 添加专家
  const addExpert = (expert: ExpertInfo) => {
    const exists = selectedExperts.value.find((e) => e.id === expert.id)
    if (!exists) {
      selectedExperts.value.push(expert)
    }
  }

  // 移除专家
  const removeExpert = (expertId: string) => {
    selectedExperts.value = selectedExperts.value.filter((e) => e.id !== expertId)
  }

  // 清空专家选择
  const clearExperts = () => {
    selectedExperts.value = []
  }

  // 设置指标数据
  const setIndicatorData = (data: IndicatorItem[]) => {
    indicatorData.value = JSON.parse(JSON.stringify(data)) // 深拷贝
  }

  // 更新指标数据
  const updateIndicatorData = (data: IndicatorItem[]) => {
    indicatorData.value = JSON.parse(JSON.stringify(data)) // 深拷贝
  }

  // 重置指标数据
  const resetIndicatorData = () => {
    indicatorData.value = structuredClone(DEFAULT_INDICATOR_DATA)
  }

  // 设置AI工具状态
  const setAIDebateEnabled = (enabled: boolean) => {
    aiDebateEnabled.value = enabled
  }

  const setAutoIndicatorsEnabled = (enabled: boolean) => {
    autoIndicatorsEnabled.value = enabled
  }

  const setAdversarialEvaluationEnabled = (enabled: boolean) => {
    adversarialEvaluationEnabled.value = enabled
  }

  // 切换AI工具状态
  const toggleAITool = (tool: 'debate' | 'indicators' | 'adversarial') => {
    switch (tool) {
      case 'debate':
        aiDebateEnabled.value = !aiDebateEnabled.value
        break
      case 'indicators':
        autoIndicatorsEnabled.value = !autoIndicatorsEnabled.value
        break
      case 'adversarial':
        adversarialEvaluationEnabled.value = !adversarialEvaluationEnabled.value
        break
    }
  }

  // 获取启用的AI工具配置
  const getEnabledAITools = (): AIToolConfig[] => {
    const tools: AIToolConfig[] = []

    if (aiDebateEnabled.value) {
      tools.push({
        id: 'debate',
        name: '多智能体辩论评价',
        enabled: true,
      })
    }

    if (autoIndicatorsEnabled.value) {
      tools.push({
        id: 'auto_indicators',
        name: '评价指标自生成',
        enabled: true,
      })
    }

    if (adversarialEvaluationEnabled.value) {
      tools.push({
        id: 'adversarial',
        name: '对抗式评价判别',
        enabled: true,
      })
    }

    return tools
  }

  // 设置提交状态
  const setSubmitted = (submitted: boolean) => {
    isSubmitted.value = submitted
  }

  // 设置markdown内容
  const setMarkdownContent = (content: string) => {
    markdownContent.value = content
  }

  // 重置所有状态
  const resetAll = () => {
    selectedExperts.value = []
    indicatorData.value = structuredClone(DEFAULT_INDICATOR_DATA)
    aiDebateEnabled.value = false
    autoIndicatorsEnabled.value = false
    adversarialEvaluationEnabled.value = false
    isSubmitted.value = false
    markdownContent.value = ''
  }

  // 获取完整的评价数据
  const getEvaluationData = () => {
    return {
      experts: selectedExperts.value,
      indicators: indicatorData.value,
      ai_tools: getEnabledAITools(),
    }
  }

  // 获取当前状态快照
  const getStateSnapshot = (): EvaluationState => {
    return {
      selectedExperts: [...selectedExperts.value],
      indicatorData: JSON.parse(JSON.stringify(indicatorData.value)),
      aiTools: {
        aiDebateEnabled: aiDebateEnabled.value,
        autoIndicatorsEnabled: autoIndicatorsEnabled.value,
        adversarialEvaluationEnabled: adversarialEvaluationEnabled.value,
      },
      isSubmitted: isSubmitted.value,
      markdownContent: markdownContent.value,
    }
  }

  // 恢复状态快照
  const restoreStateSnapshot = (snapshot: EvaluationState) => {
    selectedExperts.value = [...snapshot.selectedExperts]
    indicatorData.value = JSON.parse(JSON.stringify(snapshot.indicatorData))
    aiDebateEnabled.value = snapshot.aiTools.aiDebateEnabled
    autoIndicatorsEnabled.value = snapshot.aiTools.autoIndicatorsEnabled
    adversarialEvaluationEnabled.value = snapshot.aiTools.adversarialEvaluationEnabled
    isSubmitted.value = snapshot.isSubmitted
    markdownContent.value = snapshot.markdownContent
  }

  return {
    // 状态
    selectedExperts,
    indicatorData,
    aiDebateEnabled,
    autoIndicatorsEnabled,
    adversarialEvaluationEnabled,
    isSubmitted,
    markdownContent,

    // 专家管理方法
    setSelectedExperts,
    addExpert,
    removeExpert,
    clearExperts,

    // 指标数据管理方法
    setIndicatorData,
    updateIndicatorData,
    resetIndicatorData,

    // AI工具管理方法
    setAIDebateEnabled,
    setAutoIndicatorsEnabled,
    setAdversarialEvaluationEnabled,
    toggleAITool,
    getEnabledAITools,

    // 提交状态管理
    setSubmitted,
    setMarkdownContent,

    // 综合方法
    resetAll,
    getEvaluationData,
    getStateSnapshot,
    restoreStateSnapshot,
  }
})
