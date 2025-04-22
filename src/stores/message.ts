import { defineStore } from 'pinia'

export const useMessageStore = defineStore('message', {
  state: () => ({
    visible: false,
    currentData: {} as any,
    fieldConfig: {} as any,
    source: '', // 消息来源标识
    title: '信息详情', // 新增标题状态
  }),
  actions: {
    showMessage(data: any, config: any, options?: { source?: string; title?: string }) {
      this.visible = true
      this.currentData = data
      this.fieldConfig = config
      this.source = options?.source || ''
      this.title = options?.title || '信息详情' // 设置标题，默认为"信息详情"
    },
    hideMessage(msgSource?: string) {
      if (!msgSource || msgSource === this.source) {
        this.visible = false
        this.currentData = {}
        this.source = ''
        this.title = '信息详情' // 重置标题
      }
    },
  },
})
