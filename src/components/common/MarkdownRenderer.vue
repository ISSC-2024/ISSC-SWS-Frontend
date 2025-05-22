<script setup lang="ts">
/**
 * MarkdownRenderer.vue - Markdown内容渲染组件
 * 1. 该组件负责渲染Markdown格式的文本内容
 * 2. 支持代码高亮、表格、列表等丰富格式
 * 3. 采用暗色科技风格设计
 */
import { computed } from 'vue'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'

// 定义组件props
interface Props {
  /** Markdown文本内容 */
  content: string
}

const props = defineProps<Props>()

// 配置marked实例
const marked = new Marked(
  markedHighlight({
    async: false,
    langPrefix: 'language-',
    emptyLangClass: 'no-lang',
    highlight: (code, lang) => {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value
      }
      return hljs.highlightAuto(code).value
    },
  }),
)

// 渲染Markdown函数
const renderedContent = computed((): string => {
  if (!props.content) return ''
  const html = marked.parse(props.content)
  return DOMPurify.sanitize(html as string)
})
</script>

<template>
  <div class="markdown-renderer" v-html="renderedContent"></div>
</template>

<style lang="scss" scoped>
// 颜色变量
$markdown-accent: #61dafb;
$markdown-bg-dark: #121826;
$markdown-bg-medium: #1a2234;
$markdown-text-primary: #ffffff;

// 颜色函数
@function markdown-accent-alpha($alpha) {
  @return rgba($markdown-accent, $alpha);
}

@function markdown-text-alpha($alpha) {
  @return rgba($markdown-text-primary, $alpha);
}

.markdown-renderer {
  color: $markdown-text-primary;
  line-height: 1.6;
  word-wrap: break-word;

  // 段落样式
  :deep(p) {
    margin: 12px 0;
    line-height: 1.6;
  }

  // 列表样式
  :deep(ul),
  :deep(ol) {
    padding-left: 2em !important;
    margin: 12px 0 !important;
    list-style-position: outside !important;
  }

  :deep(li) {
    margin-bottom: 8px !important;
    line-height: 1.5 !important;
  }

  :deep(ul) {
    list-style-type: disc !important;
  }

  :deep(ol) {
    list-style-type: decimal !important;
  }

  :deep(li p) {
    display: inline !important;
    margin: 0 !important;
  }

  // 代码块样式
  :deep(pre) {
    background-color: rgba(0, 0, 0, 0.3) !important;
    border-radius: 8px !important;
    border: 1px solid markdown-accent-alpha(0.15) !important;
    margin: 14px 0 !important;
    padding: 16px !important;
    overflow-x: auto !important;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2) !important;
  }

  :deep(code) {
    font-family: 'Courier New', monospace !important;
    font-size: 0.9em !important;
  }

  // 行内代码样式
  :deep(p code),
  :deep(li code),
  :deep(h1 code),
  :deep(h2 code),
  :deep(h3 code) {
    background-color: markdown-accent-alpha(0.1) !important;
    color: $markdown-accent !important;
    padding: 0.2em 0.4em !important;
    border-radius: 3px !important;
    font-size: 0.85em !important;
    border: 1px solid markdown-accent-alpha(0.2) !important;
    margin: 0 2px !important;
  }

  // 确保代码块中的代码不受行内代码样式影响
  :deep(pre code) {
    background-color: transparent !important;
    padding: 0 !important;
    border: none !important;
    color: inherit !important;
    margin: 0 !important;
  }

  // 标题样式
  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    color: $markdown-accent !important;
    margin-top: 20px !important;
    margin-bottom: 12px !important;
    font-weight: 500 !important;
    letter-spacing: 0.5px !important;
  }

  :deep(h1) {
    font-size: 1.8em !important;
    border-bottom: 1px solid markdown-accent-alpha(0.2) !important;
    padding-bottom: 8px !important;
  }

  :deep(h2) {
    font-size: 1.4em !important;
    border-bottom: 1px solid markdown-accent-alpha(0.1) !important;
    padding-bottom: 6px !important;
  }

  :deep(h3) {
    font-size: 1.2em !important;
  }

  :deep(h4) {
    font-size: 1.1em !important;
  }

  :deep(h5) {
    font-size: 1.05em !important;
  }

  :deep(h6) {
    font-size: 1em !important;
  }

  // 表格样式
  :deep(table) {
    border-collapse: collapse !important;
    width: 100% !important;
    margin: 16px 0 !important;
    background-color: rgba($markdown-bg-medium, 0.5) !important;
    border-radius: 6px !important;
    overflow: hidden !important;
  }

  :deep(th),
  :deep(td) {
    border: 1px solid markdown-accent-alpha(0.15) !important;
    padding: 8px 12px !important;
    text-align: left !important;
  }

  :deep(th) {
    background-color: markdown-accent-alpha(0.08) !important;
    color: $markdown-accent !important;
    font-weight: 500 !important;
  }

  :deep(tr:nth-child(even)) {
    background-color: markdown-accent-alpha(0.02) !important;
  }

  // 块引用样式
  :deep(blockquote) {
    border-left: 3px solid markdown-accent-alpha(0.4) !important;
    padding: 0.5em 1em !important;
    margin: 1em 0 !important;
    background-color: markdown-accent-alpha(0.05) !important;
    border-radius: 0 4px 4px 0 !important;
    color: markdown-text-alpha(0.8) !important;
  }

  :deep(blockquote p:last-child) {
    margin-bottom: 0 !important;
  }

  // 链接样式
  :deep(a) {
    color: $markdown-accent !important;
    text-decoration: none !important;
    border-bottom: 1px solid markdown-accent-alpha(0.3) !important;
    transition: all 0.2s ease !important;

    &:hover {
      border-bottom-color: $markdown-accent !important;
      text-shadow: 0 0 8px markdown-accent-alpha(0.5) !important;
    }
  }

  // 水平线样式
  :deep(hr) {
    border: none !important;
    height: 1px !important;
    background: linear-gradient(90deg, transparent, markdown-accent-alpha(0.3), transparent) !important;
    margin: 24px 0 !important;
  }

  // 图片样式
  :deep(img) {
    max-width: 100% !important;
    height: auto !important;
    border-radius: 8px !important;
    margin: 12px 0 !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
  }

  // 强调文本样式
  :deep(strong) {
    color: $markdown-accent !important;
    font-weight: 600 !important;
  }

  :deep(em) {
    color: markdown-text-alpha(0.9) !important;
    font-style: italic !important;
  }

  // 删除线样式
  :deep(del) {
    color: markdown-text-alpha(0.6) !important;
    text-decoration: line-through !important;
  }

  // 标记文本样式
  :deep(mark) {
    background-color: markdown-accent-alpha(0.2) !important;
    color: $markdown-text-primary !important;
    padding: 0.1em 0.3em !important;
    border-radius: 3px !important;
  }
}
</style>
