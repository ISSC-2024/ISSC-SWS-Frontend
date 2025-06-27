/**
 * AIInterface 演示配置文件
 *
 * 这个文件包含所有演示问题的配置
 * 可以通过修改 DEMO_ENABLED 来启用/禁用演示功能
 * 可以通过删除或注释此文件来完全移除演示功能
 */

/**
 * 演示功能总开关
 * 设置为 false 可以禁用所有演示功能
 */
export const DEMO_ENABLED = true

/**
 * 演示问题配置接口
 */
export interface DemoQuestionConfig {
  /** 思考过程中显示的消息 */
  thinkingMessage: string
  /** 思考完成后显示的消息 */
  finalThinking: string
  /** 最小延时（毫秒） */
  minDelay: number
  /** 最大延时（毫秒） */
  maxDelay: number
  /** 返回的响应内容（Markdown格式） */
  response: string
}

/**
 * 演示问题配置
 * 添加新的演示问题时，在此对象中添加配置
 */
export const DEMO_QUESTIONS: Record<string, DemoQuestionConfig> = {
  原料储存区最危险的传感器: {
    thinkingMessage: '正在查询原料储存区传感器数据...',
    finalThinking: '已完成传感器风险分析，按风险级别排序完成',
    minDelay: 2000,
    maxDelay: 5000,
    response: `根据原料储存区反馈的查询结果，该区域内最危险的传感器数据如下（按风险级别从高到低排序）：

1. **RMS016**
   - 监测气体类型：NH₃
   - 风险级别分布：警告（100.0%）
   - 最新记录参数：温度 30.8℃，压力 0.398，流量 16.21，NH₃ 浓度 11.07
2. **RMS007**
   - 监测气体类型：H₂S
   - 风险级别分布：警告（98.5%）、安全（1.5%）
   - 最新记录参数：温度 29.92℃，压力 0.228，流量 31.17，H₂S 浓度 3.67
3. **RMS001**
   - 监测气体类型：H₂S
   - 风险级别分布：警告（92.1%）、安全（7.9%）
   - 最新记录参数：温度 29.56℃，压力 0.269，流量 25.76，H₂S 浓度 3.2
4. **RMS006**
   - 监测气体类型：CO
   - 风险级别分布：警告（47.6%）、安全（52.4%）
   - 最新记录参数：温度 30.08℃，压力 0.353，流量 33.43，CO 浓度 24.61
5. **RMS017**
   - 监测气体类型：NH₃
   - 风险级别分布：警告（40.4%）、安全（59.6%）
   - 最新记录参数：温度 26.8℃，压力 0.341，流量 18.04，NH₃ 浓度 6.75

注：数据已按传感器风险警告占比降序排列，其中 RMS016、RMS007 和 RMS001 为当前风险最高的三个传感器。`,
  },

  // 可以在这里添加更多演示问题
  // 示例：
  // '原料存储区当前人力配置情况': {
  //   thinkingMessage: '正在查询人力配置数据...',
  //   finalThinking: '已完成人力配置分析',
  //   minDelay: 1500,
  //   maxDelay: 3000,
  //   response: `当前原料存储区人力配置如下：...`
  // }
}

/**
 * 检查是否为演示问题
 * @param question 用户输入的问题
 * @returns 如果是演示问题返回配置对象，否则返回 null
 */
export const checkDemoQuestion = (question: string): DemoQuestionConfig | null => {
  if (!DEMO_ENABLED) return null
  return DEMO_QUESTIONS[question] || null
}

/**
 * 处理演示问题
 * @param question 用户问题
 * @param demoConfig 演示配置
 * @param updateThinkingCallback 更新思考过程的回调函数
 * @returns 演示响应结果
 */
export const handleDemoQuestion = async (
  _question: string,
  demoConfig: DemoQuestionConfig,
  updateThinkingCallback: (thinking: string) => void,
): Promise<{ thinking: string; response: string }> => {
  // 计算随机延时
  const randomDelay = Math.floor(Math.random() * (demoConfig.maxDelay - demoConfig.minDelay)) + demoConfig.minDelay

  // 更新思考过程为演示状态
  updateThinkingCallback(demoConfig.thinkingMessage)

  // 延时模拟
  await new Promise((resolve) => setTimeout(resolve, randomDelay))

  return {
    thinking: demoConfig.finalThinking,
    response: demoConfig.response,
  }
}

/**
 * 获取所有演示问题列表
 * @returns 演示问题列表
 */
export const getDemoQuestions = (): string[] => {
  if (!DEMO_ENABLED) return []
  return Object.keys(DEMO_QUESTIONS)
}

/**
 * 添加新的演示问题
 * @param question 问题文本
 * @param config 演示配置
 */
export const addDemoQuestion = (question: string, config: DemoQuestionConfig): void => {
  DEMO_QUESTIONS[question] = config
}

/**
 * 移除演示问题
 * @param question 问题文本
 */
export const removeDemoQuestion = (question: string): void => {
  delete DEMO_QUESTIONS[question]
}
