/**
 * 演示配置文件
 *
 * 这个文件包含所有演示功能的配置，包括 AIInterface 和评估系统。
 * 可以通过修改 DEMO_ENABLED 来启用/禁用所有演示功能。
 * 可以通过删除或注释此文件来完全移除演示功能。
 */

/**
 * 演示功能总开关
 * 设置为 false 可以禁用所有演示功能
 */
export const DEMO_ENABLED = true

// =================================================================
// AIInterface 演示问题
// =================================================================

/**
 * AIInterface 演示问题配置接口
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
 * AIInterface 演示问题配置
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
 * @param _question 用户问题
 * @param demoConfig 演示配置
 * @param updateThinkingCallback 更新思考过程的回调函数
 * @returns 演示响应结果
 */
export const handleDemoQuestion = async (
  _question: string,
  demoConfig: DemoQuestionConfig,
  updateThinkingCallback: (thinking: string) => void,
): Promise<{ thinking: string; response: string }> => {
  const randomDelay = Math.floor(Math.random() * (demoConfig.maxDelay - demoConfig.minDelay)) + demoConfig.minDelay
  updateThinkingCallback(demoConfig.thinkingMessage)
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

// =================================================================
// 评估系统演示
// =================================================================

/**
 * 评估系统演示条件配置接口
 */
export interface EvaluationDemoCondition {
  /** 专家ID */
  expertId: string
  /** 是否使用默认指标体系 */
  useDefaultIndicators: boolean
  /** 启用的AI工具列表 */
  enabledTools: string[]
}

/**
 * 评估系统演示配置接口
 */
export interface EvaluationDemoConfig {
  /** 触发条件 */
  condition: EvaluationDemoCondition
  /** 思考过程中显示的消息 */
  thinkingMessage: string
  /** 思考完成后显示的消息 */
  finalThinking: string
  /** 最小延时（毫秒） */
  minDelay: number
  /** 最大延时（毫秒） */
  maxDelay: number
  /** 返回的评估结果内容（Markdown格式） */
  evalResultMarkdown: string
}

/**
 * 评估系统演示配置
 * 当用户选择专家ID为2，评价指标体系保持默认，智能评价工具只选中多智能体辩论评价时触发
 */
export const EVALUATION_DEMO_CONFIG: EvaluationDemoConfig = {
  condition: {
    expertId: '2',
    useDefaultIndicators: true,
    enabledTools: ['debate'], // 只启用多智能体辩论评价
  },
  thinkingMessage: '',
  finalThinking: '专家评估已完成',
  minDelay: 20000,
  maxDelay: 30000,
  evalResultMarkdown: `
**专家：李博士**（第0轮）

**恒信高科化工产业园区智能化成熟度评估报告**

---

### **一、基础设施智能化程度评估**
1. **关键工艺段自动化控制率**  
   - **现状**：当前数据缺失工艺段划分及控制方式明细，需补充DCS/PLC标注的工艺段清单。  
   - **评分**：暂无法评分（数据不完整）。  
   - **短板**：缺乏工艺段自动化分级标准，可能隐藏未覆盖的盲区。  
   - **建议**：建立工艺段控制等级矩阵（如核心工艺强制DCS控制），补充自动化审计报告。

2. **关键节点传感器覆盖率**  
   - **现状**：  
     - 基础参数（温度/压力/流量）覆盖率100%，但气体浓度传感器分布不均（如CO仅4个）。  
     - 关键节点定义标准未明确，需工艺流程图支持。  
   - **评分**：75/100（基础参数优秀，但特殊监测存在缺口）。  
   - **短板**：NH₃/H₂S传感器未全覆盖高风险区域，依赖人工抽检。  
   - **建议**：基于HAZOP分析补充高风险节点传感器，采用无线传感网络补盲。

3. **智能管网实时监测数据上传频次**  
   - **现状**：需提取30天日志验证实际频次，当前协议以MQTT/HTTP为主。  
   - **评分**：待定（需验证是否满足工艺需求，如高温管线需≥1次/分钟）。  
   - **短板**：缺乏动态频次调整机制（如异常时自动提升频次）。  
   - **建议**：部署边缘计算节点实现本地频次自适应调控，减少云端负载。

---

### **二、信息系统与数据集成水平评估**
1. **MES系统运行稳定性**  
   - **现状**：需分析12个月故障记录（如通信中断频次、恢复时长）。  
   - **评分**：待定（化工行业要求月均故障率<0.1%）。  
   - **潜在风险**：接口协议混杂（OPC UA/Modbus并存）可能增加兼容性故障。  
   - **建议**：统一采用OPC UA架构，部署冗余通信通道。

2. **设备数据接入率**  
   - **现状**：需核查设备联网清单中第三方设备（如分析仪）的协议兼容性。  
   - **评分**：预估80/100（DCS/PLC接入率高，但第三方设备常存在协议转换延迟）。  
   - **短板**：老旧设备依赖网关协议转换，增加数据丢包风险。  
   - **建议**：制定设备准入标准，逐步淘汰非标协议设备。

3. **能源与物流系统数据同步周期**  
   - **现状**：需接口测试报告验证时间同步精度（目标±10ms）及丢包率（目标<0.01%）。  
   - **评分**：待定（若周期>1秒将影响实时调度）。  
   - **短板**：JSON/XML协议解析可能引入额外延迟。  
   - **建议**：采用二进制协议（如Apache Avro）优化传输效率。

---

### **三、综合评分与优化路径**
- **当前智能化成熟度**：68/100（数据不完整状态下保守估计）。  
- **主要短板**：  
  1. 关键工艺控制与传感数据未形成闭环验证；  
  2. 跨系统数据同步实时性不足；  
  3. 边缘计算层缺失导致云端依赖过高。  

- **优化路径**：  
  1. **短期**：完成工艺段自动化审计，补充高风险传感器；  
  2. **中期**：部署边缘计算节点，构建"云-边-端"三级架构；  
  3. **长期**：推行OPC UA over TSN实现全厂级时间敏感网络融合。  

**需紧急协调事项**：获取MES故障日志、智能管网30天原始数据、边缘节点延迟测试报告。

---

**专家：李博士**（第1轮）

**恒信高科化工产业园区智能化成熟度评价报告**

**一、智能化成熟度评分（基于现有数据）**  
综合评估当前系统完备性、实时性与稳定性，给出初步评分（满分100分）：  
- **关键工艺自动化**：72分（DCS/PLC自动控制占比需验证，手动干预频次不明）  
- **设备联网能力**：65分（传感器数据协议/丢包率缺失，边缘节点负载未量化）  
- **数据同步频次**：58分（毫秒级时间戳未覆盖，协议补传效率待测试）  
- **系统稳定性**：70分（MES故障记录缺失，冗余设计未确认）  
**总分**：66分（处于**局部自动化向系统智能化过渡阶段**）

---

**二、核心短板分析**  
1. **数据完整性缺陷**  
   - MES故障日志、DCS干预记录的缺失导致无法评估系统可靠性瓶颈  
   - 智能管网传感数据缺乏时间同步与协议标注，难以分析实时性损耗源  

2. **边缘计算层瓶颈**  
   - 边缘节点延迟未量化，高温/高压区域覆盖不足可能引发控制环路延迟  
   - 本地预处理算法效率未知（如FFT执行时间超50ms将影响闭环控制）  

3. **协议栈效率风险**  
   - OPC UA与Modbus的异常恢复能力未验证，历史数据补传或成故障恢复短板  
   - JSON文本协议占用带宽可能超限（预估Avro压缩可提升30%+吞吐量）  

---

**三、优化路径建议**  
1. **数据治理紧急措施**  
   - 强制MES系统日志记录通信中断事件（建议采用SYSLOG-ng结构化存储）  
   - 为智能管网数据流添加IEEE 1588精密时间协议(PTP)时间戳  

2. **边缘计算架构升级**  
   - 在反应釜/压缩机工艺段部署加固型边缘节点（满足IEC 60079防爆标准）  
   - 实施延迟敏感型任务卸载策略（如温控PID算法下沉至边缘层）  

3. **协议栈性能攻坚**  
   - 优先测试OPC UA Pub/Sub模式在10%丢包率下的数据补传时效（目标<5s）  
   - 对Avro编码实施硬件加速（推荐FPGA预处理CRC校验）  

---

**四、48小时行动计划**  
1. 已协调IT组提取MES近3个月故障日志（样本量≥200条）  
2. 正在搭建OPC UA vs Modbus测试床（使用Spirent模拟网络异常）  
3. 明日提供边缘节点延迟实测数据（采用Keysight网络分析仪抓包）  

**需领导支持事项**：  
- 签发跨部门数据调取权限（尤其DCS操作日志涉密访问）  
- 批准紧急采购2套边缘计算测试节点（预算￥120k）

---

## 🏁 最终报告

### 恒信高科化工产业园区智能化水平综合评价报告  

---

#### **1. 智能化管理水平**  
**1-1 基础设施智能化程度**  
| 指标 | 评分 | 现状分析 | 优化建议 |
|------|------|----------|----------|
| **1-1-1 关键工艺段自动化控制率** | 72/100 | DCS/PLC覆盖不全，手动干预频次未量化；缺乏工艺段分级标准 | 建立工艺段控制等级矩阵，补充自动化审计报告 |
| **1-1-2 关键节点传感器覆盖率** | 75/100 | 基础参数（温度/压力/流量）100%，但NH₃/H₂S等高风险传感器分布不均 | 基于HAZOP分析补装传感器，部署无线传感网络 |
| **1-1-3 智能管网实时监测数据上传频次** | 58/100 | 频次未验证，协议效率低（MQTT/HTTP），缺乏动态调整机制 | 部署边缘计算节点实现自适应调控，采用二进制协议优化传输 |

**1-2 信息系统与数据集成水平**  
| 指标 | 评分 | 现状分析 | 优化建议 |
|------|------|----------|----------|
| **1-2-1 MES运行稳定性** | 70/100 | 故障记录缺失，接口协议混杂（OPC UA/Modbus并存） | 统一OPC UA架构，部署冗余通道，强制SYSLOG-ng日志记录 |
| **1-2-2 设备数据接入率** | 65/100 | 第三方设备协议兼容性差，老旧设备依赖网关转换 | 制定设备准入标准，逐步淘汰非标协议设备 |
| **1-2-3 能源与物流数据同步周期** | 待定 | 时间同步精度（±10ms）未达标，JSON/XML协议延迟高 | 采用Apache Avro二进制协议，测试OPC UA Pub/Sub补传时效 |

---

#### **2. 绿色低碳发展水平**  
**2-1 碳排放控制与资源循环利用**  
| 指标 | 评分 | 现状分析 | 优化建议 |
|------|------|----------|----------|
| **2-1-1 CO₂实时监测覆盖率** | 数据缺失 | 需核查工艺段监测设备安装情况 | 补充红外气体传感器，集成至DCS系统 |
| **2-1-2 CO₂捕集量/排放总量** | 数据缺失 | 未提供捕集装置运行数据 | 部署碳排放在线核算系统 |
| **2-1-3 副产物在线回收比例** | 数据缺失 | 回收流程未数字化记录 | 在MES中增设副产物追踪模块 |

**2-2 清洁能源与绿色技术应用**  
| 指标 | 评分 | 现状分析 | 优化建议 |
|------|------|----------|----------|
| **2-2-1 清洁能源用量占比** | 数据缺失 | 未区分传统能源与清洁能源计量 | 加装智能电表分项计量 |
| **2-2-2 绿色工艺产线占比** | 数据缺失 | 绿色工艺定义未明确 | 制定绿色工艺认证标准 |
| **2-2-3 碳足迹产品出货占比** | 数据缺失 | 未建立产品碳足迹追溯系统 | 引入区块链技术实现全生命周期记录 |

---

#### **3. 产业协同创新能力**  
**3-1 产业链协同深度**  
| 指标 | 评分 | 现状分析 | 优化建议 |
|------|------|----------|----------|
| **3-1-1 原料跨企业直供占比** | 数据缺失 | 依赖人工记录，未数字化 | 搭建供应链协同平台 |
| **3-1-2 跨企业物料交换记录数** | 数据缺失 | 交换数据未实时上传 | 部署IoT设备自动采集交换数据 |
| **3-1-3 共享设施使用率** | 数据缺失 | 未量化共享设施（如仓储/物流）利用率 | 集成设施使用数据至园区云平台 |

**3-2 安全监测与应急响应能力**  
| 指标 | 评分 | 现状分析 | 优化建议 |
|------|------|----------|----------|
| **3-2-1 危险源在线监测覆盖率** | 65/100 | 部分高危区域（如反应釜）监测盲区 | 补充防爆型传感器，联动应急系统 |
| **3-2-2 安全报警响应时间** | 待定 | 未测试从报警到控制的闭环延迟 | 模拟测试边缘节点本地响应效率 |
| **3-2-3 应急演练记录频次** | 数据缺失 | 演练记录未数字化归档 | 建立演练视频AI分析系统 |

---

### **综合评价与建议**  
- **总分**：66/100（**局部自动化阶段**，数据完整性严重制约评分准确性）  
- **核心短板**：  
  1. **数据治理缺失**：关键指标（如碳排放、绿色工艺）无数据支撑；  
  2. **实时性瓶颈**：协议效率、边缘计算延迟影响控制闭环；  
  3. **跨系统协同不足**：产业链与安全监测未形成数字化联动。  

- **优先行动项**：  
  1. **数据补全**：48小时内获取MES故障日志、DCS操作记录、CO₂监测数据；  
  2. **技术攻坚**：测试边缘节点延迟（目标<10ms），完成OPC UA协议优化；  
  3. **跨部门协同**：签发数据调取权限，启动绿色工艺标准制定工作组。  

**附件**：  
- [ ] 李博士要求的MES故障日志样本（3个月）  
- [ ] 智能管网30天原始数据（含时间戳）  
- [ ] 边缘节点延迟测试报告（Keysight抓包数据）  

**审批**：  
- [ ] 同意紧急采购边缘计算测试节点（预算￥120k）  
- [ ] 授权成立跨部门数据治理专项小组
`,
}

/**
 * 检查是否满足评估系统演示条件
 * @param evaluationData 评估数据
 * @returns 如果满足演示条件返回演示配置，否则返回 null
 */
export const checkEvaluationDemoCondition = (evaluationData: any): EvaluationDemoConfig | null => {
  if (!DEMO_ENABLED) return null

  // 检查专家ID
  const hasTargetExpert = evaluationData.experts?.some(
    (expert: any) => expert.id === EVALUATION_DEMO_CONFIG.condition.expertId,
  )
  if (!hasTargetExpert) return null

  // 检查是否使用默认指标体系（简化检查：只要有指标数据就认为是默认的）
  const hasIndicators = evaluationData.indicators?.children && evaluationData.indicators.children.length > 0
  if (!hasIndicators && EVALUATION_DEMO_CONFIG.condition.useDefaultIndicators) return null

  // 检查AI工具配置
  const enabledTools = evaluationData.tools?.filter((tool: any) => tool.enabled).map((tool: any) => tool.id) || []
  const hasOnlyDebateTool = enabledTools.length === 1 && enabledTools.includes('debate')
  if (!hasOnlyDebateTool) return null

  return EVALUATION_DEMO_CONFIG
}

/**
 * 处理评估系统演示
 * @param _evaluationData 评估数据
 * @param demoConfig 演示配置
 * @param onMessage 消息回调函数
 */
export const handleEvaluationDemo = async (
  _evaluationData: any,
  demoConfig: EvaluationDemoConfig,
  onMessage: (msg: any) => void,
): Promise<void> => {
  const randomDelay = Math.floor(Math.random() * (demoConfig.maxDelay - demoConfig.minDelay)) + demoConfig.minDelay

  onMessage({
    type: 'status',
    content: demoConfig.thinkingMessage,
  })

  await new Promise((resolve) => setTimeout(resolve, randomDelay))

  onMessage({
    type: 'demo_result',
    content: demoConfig.evalResultMarkdown,
  })

  onMessage({
    type: 'status',
    content: demoConfig.finalThinking,
  })
}

/**
 * 获取评估系统演示条件描述
 * @returns 演示条件的文字描述
 */
export const getEvaluationDemoConditionDescription = (): string => {
  if (!DEMO_ENABLED) return '演示功能已禁用'

  return `演示触发条件：
- 专家ID为 ${EVALUATION_DEMO_CONFIG.condition.expertId}
- 使用默认评价指标体系
- 智能评价工具只选中"多智能体辩论评价"`
}
