# 导出功能变更记录

## 变更说明

根据用户需求，暂时将PDF导出功能恢复为原来的Markdown文件导出。

## 变更内容

### 修改文件
- `src/components/controls/windows/EvaluationSystem/EvalReport.vue`

### 具体变更

#### 1. 移除PDF导出相关导入
```typescript
// 移除
import { exportMarkdownToPDF } from '@/utils/modernPdfExporter'
import { ref } from 'vue'

// 保留
import { defineProps, defineEmits } from 'vue'
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue'
```

#### 2. 恢复Markdown导出函数
```typescript
// 恢复原来的Markdown导出逻辑
const exportMarkdown = () => {
  if (!props.markdown || props.isEvaluating) return

  const blob = new Blob([props.markdown], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  const date = new Date()
  const fileName = `evaluation-result-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.md`

  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
```

#### 3. 更新按钮模板
```vue
<!-- 从 -->
<button class="export-button" @click="exportToPDF" :disabled="isEvaluating || !!evalError || isExporting">
  <span class="button-icon">{{ isExporting ? '📄' : '⬇️' }}</span>
  {{ isExporting ? '导出中...' : '导出PDF' }}
</button>

<!-- 改为 -->
<button class="export-button" @click="exportMarkdown" :disabled="isEvaluating || !!evalError">
  <span class="button-icon">⬇️</span> 导出结果
</button>
```

## 保留的PDF工具

PDF导出相关工具文件已保留，可在需要时重新启用：

### 保留文件
- `src/utils/pdfExporter.ts` - 原始PDF导出工具（基于html2canvas）
- `src/utils/modernPdfExporter.ts` - 现代PDF导出工具（基于markdown-it）
- `src/utils/pdfExporter.example.ts` - PDF导出使用示例
- `src/utils/modernPdfExporter.README.md` - 现代PDF导出工具文档

### 重新启用PDF导出的步骤

如果将来需要重新启用PDF导出功能，只需：

1. 在 `EvalReport.vue` 中导入PDF导出工具：
```typescript
import { exportMarkdownToPDF } from '@/utils/modernPdfExporter'
import { ref } from 'vue'
```

2. 添加导出状态：
```typescript
const isExporting = ref(false)
```

3. 替换导出函数：
```typescript
const exportToPDF = async () => {
  // PDF导出逻辑
}
```

4. 更新按钮模板：
```vue
<button class="export-button" @click="exportToPDF" :disabled="isEvaluating || !!evalError || isExporting">
  <span class="button-icon">{{ isExporting ? '📄' : '⬇️' }}</span>
  {{ isExporting ? '导出中...' : '导出PDF' }}
</button>
```

## 当前功能

### 导出格式
- ✅ Markdown文件 (.md)
- 🔄 PDF文件 (已保留工具，暂时禁用)

### 文件命名
- 格式：`evaluation-result-YYYY-MM-DD.md`
- 示例：`evaluation-result-2024-01-15.md`

### 导出内容
- 完整的评估报告Markdown内容
- 包含所有专家评价和最终报告
- 保持原始格式和结构

## 技术说明

### 当前实现
- 使用浏览器原生 `Blob` API 创建文件
- 通过动态创建 `<a>` 标签实现下载
- 自动生成带日期的文件名
- 简单、可靠、无外部依赖

### PDF工具对比
| 工具 | 依赖 | 特点 | 状态 |
|------|------|------|------|
| pdfExporter.ts | jsPDF + html2canvas | 图片式PDF | 已保留 |
| modernPdfExporter.ts | jsPDF + markdown-it | 矢量文本PDF | 已保留 |

## 更新时间
2024年1月（具体日期根据实际修改时间）

## 备注
- PDF导出工具已完全开发完成，功能完善
- 可根据需要随时切换回PDF导出
- 建议在正式部署前确定最终的导出格式需求
