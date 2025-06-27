/**
 * 现代PDF导出工具
 * 使用 jsPDF + markdown-it 实现直接的 Markdown 到 PDF 转换
 */

import { jsPDF } from 'jspdf'
import MarkdownIt from 'markdown-it'

/**
 * PDF导出配置
 */
export interface PDFExportOptions {
  filename?: string
  title?: string
  orientation?: 'portrait' | 'landscape'
  format?: 'a4' | 'a3' | 'letter'
  margin?: number
  fontSize?: number
  lineHeight?: number
}

/**
 * 默认配置
 */
const DEFAULT_OPTIONS: Required<PDFExportOptions> = {
  filename: 'document',
  title: '文档',
  orientation: 'portrait',
  format: 'a4',
  margin: 20,
  fontSize: 12,
  lineHeight: 1.5,
}

/**
 * 现代PDF导出器
 */
export class ModernPDFExporter {
  private md: MarkdownIt
  private options: Required<PDFExportOptions>

  constructor(options: PDFExportOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }

    // 初始化 markdown-it
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      breaks: true,
    })
  }

  /**
   * 导出Markdown为PDF
   */
  async exportToPDF(markdownContent: string, options: PDFExportOptions = {}): Promise<void> {
    const finalOptions = { ...this.options, ...options }

    try {
      // 创建PDF文档
      const pdf = new jsPDF({
        orientation: finalOptions.orientation,
        unit: 'mm',
        format: finalOptions.format,
      })

      // 获取页面尺寸
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = finalOptions.margin
      const contentWidth = pageWidth - margin * 2

      let currentY = margin + 10

      // 添加标题
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.text(finalOptions.title, pageWidth / 2, currentY, { align: 'center' })
      currentY += 20

      // 添加分割线
      pdf.setLineWidth(0.5)
      pdf.line(margin, currentY, pageWidth - margin, currentY)
      currentY += 15

      // 解析Markdown
      const html = this.md.render(markdownContent)

      // 简化的HTML到PDF渲染
      currentY = this.renderHTMLToPDF(pdf, html, margin, currentY, contentWidth, pageHeight, finalOptions)

      // 添加页脚
      this.addFooter(pdf, pageWidth, pageHeight, margin)

      // 生成文件名并下载
      const date = new Date()
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      const filename = `${finalOptions.filename}-${dateStr}.pdf`

      pdf.save(filename)
    } catch (error) {
      console.error('PDF导出失败:', error)
      throw new Error('PDF导出失败，请重试')
    }
  }

  /**
   * 简化的HTML到PDF渲染
   */
  private renderHTMLToPDF(
    pdf: any,
    html: string,
    margin: number,
    startY: number,
    contentWidth: number,
    pageHeight: number,
    options: Required<PDFExportOptions>,
  ): number {
    let currentY = startY
    const lineHeight = options.fontSize * options.lineHeight

    // 移除HTML标签，提取纯文本内容
    const textContent = this.extractTextFromHTML(html)

    // 按段落分割
    const paragraphs = textContent.split('\n\n').filter((p) => p.trim())

    pdf.setFontSize(options.fontSize)
    pdf.setFont('helvetica', 'normal')

    for (const paragraph of paragraphs) {
      // 检查是否需要新页面
      if (currentY > pageHeight - margin - 50) {
        pdf.addPage()
        currentY = margin + 20
      }

      // 处理标题
      if (paragraph.startsWith('#')) {
        const level = paragraph.match(/^#+/)?.[0].length || 1
        const titleText = paragraph.replace(/^#+\s*/, '')
        const titleSize = Math.max(options.fontSize + (4 - level) * 2, options.fontSize)

        pdf.setFontSize(titleSize)
        pdf.setFont('helvetica', 'bold')

        currentY += titleSize * 0.5
        pdf.text(titleText, margin, currentY)
        currentY += titleSize * 1.5

        // 重置字体
        pdf.setFontSize(options.fontSize)
        pdf.setFont('helvetica', 'normal')
        continue
      }

      // 处理表格
      if (paragraph.includes('|')) {
        currentY = this.renderSimpleTable(pdf, paragraph, margin, currentY, contentWidth, options)
        continue
      }

      // 处理普通段落
      const lines = pdf.splitTextToSize(paragraph, contentWidth)
      for (const line of lines) {
        if (currentY > pageHeight - margin - 20) {
          pdf.addPage()
          currentY = margin + 20
        }
        pdf.text(line, margin, currentY)
        currentY += lineHeight
      }

      currentY += lineHeight * 0.5 // 段落间距
    }

    return currentY
  }

  /**
   * 提取HTML中的文本内容
   */
  private extractTextFromHTML(html: string): string {
    return (
      html
        // 保留标题标记
        .replace(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi, (_, level, content) => {
          const hashes = '#'.repeat(parseInt(level))
          return `${hashes} ${content}\n\n`
        })
        // 保留表格结构
        .replace(/<table[^>]*>(.*?)<\/table>/gis, (match) => {
          return this.extractTableText(match) + '\n\n'
        })
        // 移除其他HTML标签
        .replace(/<[^>]+>/g, '')
        // 处理HTML实体
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        // 清理多余空白
        .replace(/\n\s*\n/g, '\n\n')
        .trim()
    )
  }

  /**
   * 提取表格文本
   */
  private extractTableText(tableHTML: string): string {
    const rows = tableHTML.match(/<tr[^>]*>(.*?)<\/tr>/gis) || []
    return rows
      .map((row) => {
        const cells = row.match(/<t[hd][^>]*>(.*?)<\/t[hd]>/gis) || []
        return cells.map((cell) => cell.replace(/<[^>]+>/g, '').trim()).join(' | ')
      })
      .join('\n')
  }

  /**
   * 渲染简单表格
   */
  private renderSimpleTable(
    pdf: any,
    tableText: string,
    margin: number,
    currentY: number,
    contentWidth: number,
    options: Required<PDFExportOptions>,
  ): number {
    const lines = tableText.split('\n').filter((line) => line.includes('|'))
    const cellPadding = 5
    const rowHeight = options.fontSize * 1.8

    // 计算列宽
    const maxCols = Math.max(...lines.map((line) => line.split('|').length))
    const colWidth = (contentWidth - cellPadding * 2 * maxCols) / maxCols

    pdf.setFontSize(options.fontSize - 1)

    for (let i = 0; i < lines.length; i++) {
      const cells = lines[i]
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell) => cell)

      // 绘制表格边框
      pdf.setLineWidth(0.3)
      pdf.rect(margin, currentY, contentWidth, rowHeight)

      // 绘制单元格
      for (let j = 0; j < cells.length && j < maxCols; j++) {
        const cellX = margin + j * (colWidth + cellPadding * 2)
        const cellY = currentY + rowHeight * 0.7

        // 绘制垂直分割线
        if (j > 0) {
          pdf.line(cellX, currentY, cellX, currentY + rowHeight)
        }

        // 添加文本
        const cellText = pdf.splitTextToSize(cells[j], colWidth)
        pdf.text(cellText[0] || '', cellX + cellPadding, cellY)
      }

      currentY += rowHeight
    }

    return currentY + options.fontSize
  }

  /**
   * 添加页脚
   */
  private addFooter(pdf: any, pageWidth: number, pageHeight: number, margin: number): void {
    const pageCount = pdf.getNumberOfPages()

    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')

      // 添加页码
      pdf.text(`第 ${i} 页，共 ${pageCount} 页`, pageWidth - margin, pageHeight - margin + 5, { align: 'right' })

      // 添加生成时间
      const now = new Date().toLocaleString('zh-CN')
      pdf.text(`生成时间: ${now}`, margin, pageHeight - margin + 5)

      // 添加分割线
      pdf.setLineWidth(0.3)
      pdf.line(margin, pageHeight - margin, pageWidth - margin, pageHeight - margin)
    }
  }
}

/**
 * 默认导出器实例
 */
export const modernPDFExporter = new ModernPDFExporter()

/**
 * 快速导出函数
 */
export const exportMarkdownToPDF = async (
  markdownContent: string,
  filename: string = 'document',
  title: string = '文档',
): Promise<void> => {
  await modernPDFExporter.exportToPDF(markdownContent, {
    filename,
    title,
  })
}
