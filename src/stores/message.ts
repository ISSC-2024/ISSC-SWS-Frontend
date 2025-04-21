// stores/message.ts
import { defineStore } from 'pinia'

export const useMessageStore = defineStore('message', {
  state: () => ({
    visible: false,
    currentData: {} as any,
    fieldConfig: {} as any,
    source: '', // 添加消息来源标识
  }),
  actions: {
    showMessage(data: any, config: any, msgSource?: string) {
      this.visible = true
      this.currentData = data
      this.fieldConfig = config
      this.source = msgSource || ''
    },
    hideMessage(msgSource?: string) {
      if (!msgSource || msgSource === this.source) {
        this.visible = false
        this.currentData = {}
        this.source = ''
      }
    },
  },
})
