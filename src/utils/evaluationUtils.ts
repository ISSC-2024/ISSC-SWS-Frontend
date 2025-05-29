/**
 * 评价体系工具函数
 * 用于处理评价数据、验证、指标处理和生成Markdown内容
 */

import { type IndicatorItem } from '@/components/controls/windows/EvaluationSystem/MultiLevelIndicatorTable.vue'
import { type AIToolConfig } from '@/stores/evaluationStore'

/**
 * 评价数据提交接口
 */
export interface EvaluationSubmitData {
  experts: {
    id: string
    name: string
    desc?: string
    prompt?: string
  }[]
  indicators: {
    id: string
    name: string
    children: ProcessedIndicator[]
  }
  tools: AIToolConfig[]
}

/**
 * 处理后的指标数据接口
 */
export interface ProcessedIndicator {
  id: string
  name: string
  value?: string
  children?: ProcessedIndicator[]
}

/**
 * 指标计数接口
 */
export interface IndicatorCounts {
  level1Count: number
  level2Count: number
  level3Count: number
}

/**
 * 递归处理指标数据，提取有值的指标
 * @param indicators 指标数据
 * @returns 处理后的指标数据
 */
export function processIndicators(indicators: IndicatorItem[]): ProcessedIndicator[] {
  return indicators.map((item) => {
    const result: ProcessedIndicator = {
      id: item.id,
      name: item.name,
    }

    // 如果有值，添加值
    if (item.value !== undefined && item.value !== '') {
      result.value = String(item.value)
    }

    // 如果有子指标，递归处理
    if (item.children && item.children.length > 0) {
      result.children = processIndicators(item.children)
    }

    return result
  })
}

/**
 * 验证评价数据结构是否符合基本要求
 * @param evaluationData 要验证的评价数据
 * @returns 验证结果对象，包含是否通过验证及错误信息
 */
export function validateEvaluationData(evaluationData: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // 非常简化的验证逻辑，只检查最基本的结构是否存在

  // 验证专家数据 - 只检查是否存在数组
  if (!evaluationData.experts || !Array.isArray(evaluationData.experts)) {
    errors.push('缺少experts数组字段或格式错误')
  } else if (evaluationData.experts.length === 0) {
    errors.push('请至少选择一位专家')
  }

  // 验证指标数据 - 只检查最基本的根节点结构
  if (!evaluationData.indicators || !evaluationData.indicators.id || evaluationData.indicators.id !== 'root') {
    errors.push('指标数据缺少正确的根节点')
  }

  // 验证工具数据 - 只检查数组是否存在
  if (!evaluationData.tools || !Array.isArray(evaluationData.tools)) {
    errors.push('缺少tools数组字段或格式错误')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * 生成指标表格的Markdown文本
 * @param indicators 指标数据
 * @returns Markdown格式的表格文本
 */
export function generateIndicatorsTableMarkdown(indicators: ProcessedIndicator[]): string {
  if (!indicators || indicators.length === 0) {
    return '暂未配置评价指标\n\n'
  }

  // 定义表格单元格类型
  interface Level3Item {
    name: string
    value: string
    level1Name: string
    level2Name: string
    isEmpty?: boolean
  }

  interface LevelInfo {
    name: string
    startCol: number
    endCol: number
    parentName?: string
  }

  // 收集所有三级指标作为表格的最终列
  const allLevel3Items: Level3Item[] = []
  const level1Info: LevelInfo[] = []
  const level2Info: LevelInfo[] = []

  let currentCol = 0

  indicators.forEach((level1) => {
    const level1StartCol = currentCol

    if (level1.children && level1.children.length > 0) {
      level1.children.forEach((level2) => {
        const level2StartCol = currentCol

        if (level2.children && level2.children.length > 0) {
          level2.children.forEach((level3) => {
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

/**
 * 统计各级指标数量
 * @param indicators 指标数据
 * @returns 各级指标数量统计
 */
export function countIndicatorsByLevel(indicators: ProcessedIndicator[]): IndicatorCounts {
  let level1Count = 0
  let level2Count = 0
  let level3Count = 0

  indicators.forEach((level1) => {
    level1Count++

    if (level1.children && level1.children.length > 0) {
      level1.children.forEach((level2) => {
        level2Count++

        if (level2.children && level2.children.length > 0) {
          level3Count += level2.children.length
        }
      })
    }
  })

  return { level1Count, level2Count, level3Count }
}

/**
 * 生成配置摘要的Markdown
 * @param evaluationData 评价数据
 * @returns Markdown格式的配置摘要
 */
export function generateConfigMarkdown(evaluationData: EvaluationSubmitData): string {
  const currentTime = new Date().toLocaleString('zh-CN')

  let markdown = `# 评价体系配置摘要

> 📅 **生成时间**: ${currentTime}
>
> 🔄 **状态**: 系统正在执行评价流程...

---

## 👥 评价专家团队

`
  if (evaluationData.experts.length > 0) {
    evaluationData.experts.forEach((expert, index: number) => {
      markdown += `${index + 1}. **${expert.name}** \`ID: ${expert.id}\`\n`
      if (expert.desc) {
        markdown += `   - ${expert.desc}\n`
      }
    })
  } else {
    markdown += '暂未选择专家\n'
  }

  markdown += `\n---\n\n## 📊 评价指标体系\n\n`

  if (evaluationData.indicators.children && evaluationData.indicators.children.length > 0) {
    markdown += generateIndicatorsTableMarkdown(evaluationData.indicators.children)
  } else {
    markdown += '暂未配置评价指标\n\n'
  }

  markdown += `---\n\n## 🤖 智能评价工具\n\n`

  if (evaluationData.tools && evaluationData.tools.length > 0) {
    evaluationData.tools.forEach((tool: AIToolConfig, index: number) => {
      const statusIcon = tool.enabled ? '✅' : '❌'
      markdown += `${index + 1}. ${statusIcon} **${tool.name}**\n`
    })
  } else {
    markdown += '暂未启用智能评价工具\n'
  }

  // 统计各级指标数量
  const indicatorCounts = countIndicatorsByLevel(evaluationData.indicators.children || [])

  markdown += `\n---\n\n## 📋 配置统计

| 项目 | 数量 |
|------|------|
| 选择专家 | ${evaluationData.experts.length} 位 |
| 一级指标 | ${indicatorCounts.level1Count} 项 |
| 二级指标 | ${indicatorCounts.level2Count} 项 |
| 三级指标 | ${indicatorCounts.level3Count} 项 |
| 启用工具 | ${evaluationData.tools ? evaluationData.tools.length : 0} 个 |

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
