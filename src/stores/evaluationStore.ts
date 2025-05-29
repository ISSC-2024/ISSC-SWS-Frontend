import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { IndicatorItem } from '@/components/controls/windows/EvaluationSystem/MultiLevelIndicatorTable.vue'

// 默认指标数据结构
const DEFAULT_INDICATOR_DATA: IndicatorItem[] = [
  {
    id: '1',
    name: '智能化管理水平',
    children: [
      {
        id: '1-1',
        name: '基础设施智能化程度',
        children: [
          { id: '1-1-1', name: '关键工艺段自动化控制率(%)', value: '', editable: true },
          { id: '1-1-2', name: '关键节点传感器覆盖率(%)', value: '', editable: true },
          { id: '1-1-3', name: '智能管网实时监测数据上传频次(次/天)', value: '', editable: true },
        ],
      },
      {
        id: '1-2',
        name: '信息系统与数据集成水平',
        children: [
          { id: '1-2-1', name: '生产调度系统(MES)运行稳定性(月均故障率)', value: '', editable: true },
          { id: '1-2-2', name: '设备数据接入率(%联网设备占比)', value: '', editable: true },
          { id: '1-2-3', name: '能源与物流调度系统数据同步周期(秒)', value: '', editable: true },
        ],
      },
    ],
  },
  {
    id: '2',
    name: '绿色低碳发展水平',
    children: [
      {
        id: '2-1',
        name: '碳排放控制与资源循环利用',
        children: [
          { id: '2-1-1', name: '二氧化碳排放实时监测覆盖率(%工段)', value: '', editable: true },
          { id: '2-1-2', name: 'CO₂捕集量/排放总量(%)', value: '', editable: true },
          { id: '2-1-3', name: '副产物在线回收利用比例(%)', value: '', editable: true },
        ],
      },
      {
        id: '2-2',
        name: '清洁能源与绿色技术应用',
        children: [
          { id: '2-2-1', name: '清洁能源实时用量占比(%)', value: '', editable: true },
          { id: '2-2-2', name: '绿色工艺产线数/总产线数(%)', value: '', editable: true },
          { id: '2-2-3', name: '碳足迹标识产品出货占比(%)', value: '', editable: true },
        ],
      },
    ],
  },
  {
    id: '3',
    name: '产业协同创新能力',
    children: [
      {
        id: '3-1',
        name: '产业链协同深度',
        children: [
          { id: '3-1-1', name: '原料跨企业直供流量占比(%)', value: '', editable: true },
          { id: '3-1-2', name: '跨企业物料交换实时记录数(条/日)', value: '', editable: true },
          { id: '3-1-3', name: '共享设施使用率(%)', value: '', editable: true },
        ],
      },
      {
        id: '3-2',
        name: '安全监测与应急响应能力',
        children: [
          { id: '3-2-1', name: '关键危险源在线监测覆盖率(%)', value: '', editable: true },
          { id: '3-2-2', name: '安全报警响应平均时间(秒)', value: '', editable: true },
          { id: '3-2-3', name: '应急演练数据记录频次(次/季度)', value: '', editable: true },
        ],
      },
    ],
  },
]

const DEFAULT_EXPERT_DATA: FullExpertInfo[] = [
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
    desc: '低碳过程工程与碳管理专家，专注于煤气化、焦炉煤气制氢、碳捕集与资源梯级利用技术',
    prompt:
      '你是一位低碳过程工程与碳管理专家，专注于煤气化、焦炉煤气制氢、碳捕集与资源梯级利用技术。在园区绿色转型与碳资产监控平台建设方面具有深厚的工程与政策研究基础，熟悉碳排放实时监测、绿色产线认证与碳足迹核算机制。以"绿色低碳发展水平"为切入点，请评价该园区在碳排放控制、清洁能源利用及副产物回收方面的系统智能化能力。请参考实时监测覆盖率、CCUS 效率、绿色产线与产品标识占比等指标，判断该园区在低碳高值路径中的智能化支撑程度与改进方向。',
  },
  {
    id: '4',
    name: '陈研究员',
    avatar: '/images/experts/default-avatar.png',
    desc: '化工园区运营安全与产业协同机制专家，拥有跨园区应急联动机制设计和安全数据实时接入体系建设经验',
    prompt:
      '你是一名化工园区运营安全与产业协同机制专家，拥有跨园区应急联动机制设计、安全数据实时接入体系建设以及共生网络的运营优化经验。擅长从产业流通与安全监控的融合视角分析工业互联网络的风险与协同效率。请基于"产业协同创新能力"视角，重点评估园区在原料直供、共享设施使用、危险源在线监控与应急响应机制方面的智能化水平。结合物料交换数据频度、安全数据覆盖率与响应速度等指标，判断该园区在高密度化工协同系统中的安全可控性与协同效率。',
  },
  {
    id: '5',
    name: '李博士',
    avatar: '/images/experts/default-avatar.png',
    desc: '工业智能化系统专家，擅长DCS/PLC系统架构、MES/SCADA应用部署与OT-IT融合',
    prompt:
      '你是一位在化工流程工业领域深耕20年的工业智能化系统专家，擅长 DCS/PLC 系统架构、MES/SCADA 应用部署与 OT-IT 融合。你对园区级别的传感网络、工业边缘计算与智能管网有深入理解，尤其关注生产全流程的数字化闭环与数据互通性。从"智能化管理水平"出发，结合化工流程控制与数据系统集成原理，请评价该产业园在关键工艺自动化、设备联网、数据同步频次等方面的智能运行能力。请依据指标反映的系统完备性、实时性与稳定性，为其智能化成熟度打分，并指出可能的短板与优化路径。',
  },
  {
    id: '6',
    name: '王工程师',
    avatar: '/images/experts/default-avatar.png',
    desc: '低碳过程工程与碳管理专家，专注于煤气化、焦炉煤气制氢、碳捕集与资源梯级利用技术',
    prompt:
      '你是一位低碳过程工程与碳管理专家，专注于煤气化、焦炉煤气制氢、碳捕集与资源梯级利用技术。在园区绿色转型与碳资产监控平台建设方面具有深厚的工程与政策研究基础，熟悉碳排放实时监测、绿色产线认证与碳足迹核算机制。以"绿色低碳发展水平"为切入点，请评价该园区在碳排放控制、清洁能源利用及副产物回收方面的系统智能化能力。请参考实时监测覆盖率、CCUS 效率、绿色产线与产品标识占比等指标，判断该园区在低碳高值路径中的智能化支撑程度与改进方向。',
  },
  {
    id: '1',
    name: '陈研究员',
    avatar: '/images/experts/default-avatar.png',
    desc: '化工园区运营安全与产业协同机制专家，拥有跨园区应急联动机制设计和安全数据实时接入体系建设经验',
    prompt:
      '你是一名化工园区运营安全与产业协同机制专家，拥有跨园区应急联动机制设计、安全数据实时接入体系建设以及共生网络的运营优化经验。擅长从产业流通与安全监控的融合视角分析工业互联网络的风险与协同效率。请基于"产业协同创新能力"视角，重点评估园区在原料直供、共享设施使用、危险源在线监控与应急响应机制方面的智能化水平。结合物料交换数据频度、安全数据覆盖率与响应速度等指标，判断该园区在高密度化工协同系统中的安全可控性与协同效率。',
  },
]

// 专家信息接口
export interface ExpertInfo {
  id: string
  name: string
  desc?: string
  prompt?: string
}

// 完整专家信息接口(包含头像)
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
  const defaultExpertsData: FullExpertInfo[] = DEFAULT_EXPERT_DATA
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
  const aiDebateEnabled = ref(true)
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

  // 移除选中的专家
  const removeSelectedExpert = (expertId: string) => {
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
    } else {
      // 这是一个新专家，添加到基础数据中
      const newExpert: FullExpertInfo = {
        id: expertId,
        name: expertData.name || '新专家',
        desc: expertData.desc || '',
        prompt: expertData.prompt || '',
        avatar: expertData.avatar || defaultExpertsData[0].avatar,
      }

      baseExpertsData.value.push(newExpert)
      saveExpertsToStorage(baseExpertsData.value)
    }
  }

  //删除专家
  const removeBaseExpert = (expertId: string) => {
    const index = baseExpertsData.value.findIndex((e) => e.id === expertId)
    if (index !== -1) {
      baseExpertsData.value.splice(index, 1)
      saveExpertsToStorage(baseExpertsData.value)
      // 同步移除选中专家
      selectedExperts.value = selectedExperts.value.filter((e) => e.id !== expertId)
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
    indicatorData.value = structuredClone(data)
  }

  // 更新指标数据
  const updateIndicatorData = (data: IndicatorItem[]) => {
    indicatorData.value = structuredClone(data)
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

  // 获取所有AI工具配置(包括未启用的工具)
  const getEnabledAITools = (): AIToolConfig[] => {
    const tools: AIToolConfig[] = [
      {
        id: 'debate',
        name: '多智能体辩论评价',
        enabled: aiDebateEnabled.value,
      },
      {
        id: 'auto_indicators',
        name: '评价指标自生成',
        enabled: autoIndicatorsEnabled.value,
      },
      {
        id: 'adversarial',
        name: '对抗式评价判别',
        enabled: adversarialEvaluationEnabled.value,
      },
    ]

    // 返回所有工具
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
    removeSelectedExpert,
    updateExpert,
    updateBaseExpert,
    getBaseExperts,
    clearExperts,
    removeBaseExpert,

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
