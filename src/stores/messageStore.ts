import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMessageStore = defineStore('message', () => {
  const visible = ref(false)
  const currentData = ref<any>({}) // 存储当前消息的数据
  const fieldConfig = ref<any>({}) // 存储字段配置信息
  const source = ref('') // 消息来源标识
  const title = ref('信息详情') // 新增标题状态

  // 显示消息框并初始化相关数据,options（可选）:如果提供了source或title，则更新对应的状态，否则使用默认值
  function showMessage(data: any, config: any, options?: { source?: string; title?: string }) {
    visible.value = true
    currentData.value = data
    fieldConfig.value = config
    source.value = options?.source || ''
    title.value = options?.title || '信息详情' // 设置标题，默认为"信息详情"
  }

  // 隐藏消息框并重置相关数据:主要用于鼠标悬浮显示，离开关闭以及双击关闭文本框
  // 这里不重置fieldConfig可以方便后续再次显示时可以快速使用
  function hideMessage(msgSource?: string) {
    if (!msgSource || msgSource === source.value) {
      visible.value = false
      currentData.value = {}
      source.value = ''
      title.value = '信息详情' // 重置标题
    }
  }

  // 返回状态和方法
  return {
    visible,
    currentData,
    fieldConfig,
    source,
    title,
    showMessage,
    hideMessage,
  }
})
