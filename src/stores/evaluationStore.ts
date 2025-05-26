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
  desc?: string
  prompt?: string
}

// 完整专家信息接口（包含头像）
export interface FullExpertInfo extends ExpertInfo {
  avatar: string
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
  // 基础专家数据
  const defaultExpertsData: FullExpertInfo[] = [
    {
      id: '1',
      name: '张教授',
      avatar: '/images/experts/default-avatar.png',
      desc: '环境科学专家，在海洋污染治理领域有20年研究经验',
      prompt: '你是一位环境科学专家，在海洋污染治理领域有20年研究经验。请基于你的专业知识进行评价。',
    },
    {
      id: '2',
      name: '李博士',
      avatar: '/images/experts/default-avatar.png',
      desc: '工业智能化系统专家，擅长DCS/PLC系统架构、MES/SCADA应用部署与OT-IT融合',
      prompt:
        '你是一位在化工流程工业领域深耕20年的工业智能化系统专家，擅长 DCS/PLC 系统架构、MES/SCADA 应用部署与 OT-IT 融合。你对园区级别的传感网络、工业边缘计算与智能管网有深入理解，尤其关注生产全流程的数字化闭环与数据互通性。从"智能化管理水平"出发，结合化工流程控制与数据系统集成原理，请评价该产业园在关键工艺自动化、设备联网、数据同步频次等方面的智能运行能力。请依据指标反映的系统完备性、实时性与稳定性，为其智能化成熟度打分，并指出可能的短板与优化路径。',
    },
    {
      id: '3',
      name: '王工程师',
      avatar: '/images/experts/default-avatar.png',
      desc: '设备安全专家，具有丰富的工业设备安全检测经验',
      prompt: '你是一位设备安全专家，具有丰富的工业设备安全检测经验。请基于你的专业知识进行评价。',
    },
    {
      id: '4',
      name: '陈研究员',
      avatar: '/images/experts/default-avatar.png',
      desc: '风险评估专家，参与制定多项国家安全标准',
      prompt: '你是一位风险评估专家，参与制定多项国家安全标准。请基于你的专业知识进行评价。',
    },
    {
      id: '5',
      name: '刘顾问',
      avatar: '/images/experts/default-avatar.png',
      desc: '应急管理专家，曾参与多起重大事故的应急处置工作',
      prompt: '你是一位应急管理专家，曾参与多起重大事故的应急处置工作。请基于你的专业知识进行评价。',
    },
    {
      id: '6',
      name: '赵研究员',
      avatar: '/images/experts/default-avatar.png',
      desc: '环境科学专家，在海洋污染治理领域有20年研究经验',
      prompt: '你是一位环境科学专家，在海洋污染治理领域有20年研究经验。请基于你的专业知识进行评价。',
    },
  ]

  // 从localStorage加载专家基础数据
  const loadExpertsFromStorage = (): FullExpertInfo[] => {
    try {
      const stored = localStorage.getItem('expertBaseData')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load experts from localStorage:', error)
    }
    return [...defaultExpertsData]
  }

  // 保存专家基础数据到localStorage
  const saveExpertsToStorage = (experts: FullExpertInfo[]) => {
    try {
      localStorage.setItem('expertBaseData', JSON.stringify(experts))
    } catch (error) {
      console.warn('Failed to save experts to localStorage:', error)
    }
  }

  // 基础专家数据
  const baseExpertsData = ref<FullExpertInfo[]>(loadExpertsFromStorage())

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
  // 更新专家信息
  const updateExpert = (expertId: string, expertData: ExpertInfo) => {
    const index = selectedExperts.value.findIndex((e) => e.id === expertId)
    if (index !== -1) {
      selectedExperts.value[index] = { ...expertData }
    }
  }

  // 更新基础专家数据
  const updateBaseExpert = (expertId: string, expertData: Partial<FullExpertInfo>) => {
    const index = baseExpertsData.value.findIndex((e) => e.id === expertId)
    if (index !== -1) {
      baseExpertsData.value[index] = { ...baseExpertsData.value[index], ...expertData }
      saveExpertsToStorage(baseExpertsData.value)

      // 如果该专家已被选中，同时更新选中专家列表
      const selectedIndex = selectedExperts.value.findIndex((e) => e.id === expertId)
      if (selectedIndex !== -1) {
        selectedExperts.value[selectedIndex] = {
          id: expertData.id || selectedExperts.value[selectedIndex].id,
          name: expertData.name || selectedExperts.value[selectedIndex].name,
          desc: expertData.desc || selectedExperts.value[selectedIndex].desc,
          prompt: expertData.prompt || selectedExperts.value[selectedIndex].prompt,
        }
      }
    }
  }

  // 获取基础专家数据
  const getBaseExperts = () => {
    return baseExpertsData.value
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
    updateExpert,
    updateBaseExpert,
    getBaseExperts,
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
