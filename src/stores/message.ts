// defineStore 是 Pinia 提供的一个函数，用于定义一个新的 store
// 接受两个主要参数：store 的唯一标识符和一个配置对象。
import { defineStore } from 'pinia'

// useMessageStore是这个store的名称，用于在组件中通过useMessageStore()来使用这个store
// 'message' 是这个store的唯一标识符，用于在Pinia的全局状态管理中区分不同的 tore
export const useMessageStore = defineStore('message', {
  // state定义store的初始状态
  state: () => ({
    visible: false,
    currentData: {} as any, // 存储当前消息的数据
    fieldConfig: {} as any, // 存储字段配置信息
    source: '', // 消息来源标识
    title: '信息详情', // 新增标题状态
  }),
  // actions定义了store的行为和方法
  actions: {
    // 显示消息框并初始化相关数据,options（可选）:如果提供了source或title，则更新对应的状态，否则使用默认值
    showMessage(data: any, config: any, options?: { source?: string; title?: string }) {
      this.visible = true
      this.currentData = data
      this.fieldConfig = config
      this.source = options?.source || ''
      this.title = options?.title || '信息详情' // 设置标题，默认为"信息详情"
    },
    // 隐藏消息框并重置相关数据:主要用于鼠标悬浮显示，离开关闭以及双击关闭文本框
    // 这里不重置fieldConfig可以方便后续再次显示时可以快速使用
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
