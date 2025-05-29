<script setup lang="ts">
/**
 * MultiLevelIndicatorTable.vue - 多级指标表格组件
 *
 * 该组件用于显示1,2,3级指标的表格，支持用户自定义内容和结构
 * 使用Ant Design Vue实现
 */
import { ref, onMounted, watch, h, computed } from 'vue'
import { Input, Button } from 'ant-design-vue'
import { PlusOutlined, DeleteOutlined, SyncOutlined } from '@ant-design/icons-vue'
import { useEvaluationStore } from '@/stores/evaluationStore'

// 使用评价体系store
const evaluationStore = useEvaluationStore()

// 定义指标项接口
export interface IndicatorItem {
  id: string
  name: string
  children?: IndicatorItem[]
  value?: number | string
  editable?: boolean
  colSpan?: number // 用于计算单元格跨列数
}

// 定义组件向外发出的事件
const emit = defineEmits(['change'])

// 直接使用store中的表格数据
const tableData = computed({
  get: () => {
    return evaluationStore.indicatorData
  },
  set: (newData: IndicatorItem[]) => {
    evaluationStore.updateIndicatorData(newData)
    emit('change', newData)
  },
})

// 当前悬停的单元格ID
const hoveredItemId = ref<string | null>(null)

// 编辑状态
const editingState = ref<{
  key: string | null
  field: 'name' | 'value'
  value: string | number
}>({
  key: null,
  field: 'name',
  value: '',
})

// 处理指标数据结构以适应表格
const processedTableData = ref({
  level1: [] as any[],
  level2: [] as any[],
  level3: [] as any[],
})

// 计算每个级别指标的列跨度
const calculateColSpans = () => {
  // 计算三级指标总数量，用于确定表格总列数
  let totalColumns = 0

  tableData.value.forEach((level1) => {
    let level1ColSpan = 0

    if (level1.children && level1.children.length > 0) {
      level1.children.forEach((level2) => {
        let level2ColSpan = 0

        if (level2.children && level2.children.length > 0) {
          level2ColSpan = level2.children.length
        } else {
          level2ColSpan = 1
        }

        level2.colSpan = level2ColSpan
        level1ColSpan += level2ColSpan
      })
    } else {
      level1ColSpan = 1
    }

    level1.colSpan = level1ColSpan
    totalColumns += level1ColSpan
  })

  return totalColumns
}

// 准备表格数据
const prepareData = () => {
  console.log('prepareData 被调用，tableData:', tableData.value)
  if (!tableData.value || tableData.value.length === 0) {
    console.warn('tableData为空，store应该已经包含默认数据')
    return
  }
  calculateColSpans()

  // 清空现有数据
  processedTableData.value = {
    level1: [],
    level2: [],
    level3: [],
  }

  // 准备一级指标行
  tableData.value.forEach((level1) => {
    processedTableData.value.level1.push({
      id: level1.id,
      item: level1,
      colSpan: level1.colSpan || 1,
    })
  })

  // 准备二级指标行
  tableData.value.forEach((level1) => {
    if (level1.children && level1.children.length > 0) {
      level1.children.forEach((level2) => {
        processedTableData.value.level2.push({
          id: level2.id,
          item: level2,
          colSpan: level2.colSpan || 1,
          parentId: level1.id,
        })
      })
    } else {
      // 如果没有二级指标，添加一个占位空单元格
      processedTableData.value.level2.push({
        id: `empty-${level1.id}`,
        isEmpty: true,
        colSpan: level1.colSpan || 1,
        parentId: level1.id,
      })
    }
  })

  // 准备三级指标行
  tableData.value.forEach((level1) => {
    if (level1.children && level1.children.length > 0) {
      level1.children.forEach((level2) => {
        if (level2.children && level2.children.length > 0) {
          level2.children.forEach((level3) => {
            processedTableData.value.level3.push({
              id: level3.id,
              item: level3,
              colSpan: 1,
              parentId: level2.id,
            })
          })
        } else {
          // 如果没有三级指标，添加一个占位空单元格
          processedTableData.value.level3.push({
            id: `empty-${level2.id}`,
            isEmpty: true,
            colSpan: level2.colSpan || 1,
            parentId: level2.id,
          })
        }
      })
    } else {
      // 当一级指标没有二级指标时，也为三级添加占位空单元格（要保留，不然三级指标会缺少边界线）
      processedTableData.value.level3.push({
        id: `empty-level3-${level1.id}`,
        isEmpty: true,
        colSpan: level1.colSpan || 1,
        parentId: `empty-${level1.id}`,
      })
    }
  })
}

// 组件挂载时初始化数据
onMounted(() => {
  console.log('MultiLevelIndicatorTable onMounted, store数据:', evaluationStore.indicatorData)
  prepareData()
})

// 监听tableData变化
watch(
  tableData,
  () => {
    prepareData()
  },
  { deep: true },
)

// 鼠标悬停处理
const handleMouseEnter = (itemId: string) => {
  hoveredItemId.value = itemId
}

// 鼠标离开处理
const handleMouseLeave = () => {
  hoveredItemId.value = null
}

// 开始编辑
const startEdit = (item: IndicatorItem, field: 'name' | 'value') => {
  editingState.value = {
    key: item.id,
    field,
    value: field === 'name' ? item.name : item.value || '',
  }
}

// 保存编辑
const saveEdit = (item: IndicatorItem) => {
  if (editingState.value.key === item.id) {
    if (editingState.value.field === 'name') {
      item.name = editingState.value.value as string
    } else {
      item.value = editingState.value.value
    }

    editingState.value = {
      key: null,
      field: 'name',
      value: '',
    }

    // 重新处理数据
    prepareData()
  }
}

// 添加指标
const addIndicator = (level: number, parentId: string) => {
  const newId = Date.now().toString()

  if (level === 1) {
    // 添加一级指标
    tableData.value.push({
      id: newId,
      name: `一级指标${tableData.value.length + 1}`,
      children: [],
    })
  } else if (level === 2) {
    // 添加二级指标
    const parent = findItem(tableData.value, parentId)
    if (parent) {
      if (!parent.children) parent.children = []
      parent.children.push({
        id: newId,
        name: `二级指标${parent.children.length + 1}`,
        children: [],
      })
    }
  } else if (level === 3) {
    // 添加三级指标
    for (const level1 of tableData.value) {
      if (!level1.children) continue

      const parent = level1.children.find((item) => item.id === parentId)
      if (parent) {
        if (!parent.children) parent.children = []
        parent.children.push({
          id: newId,
          name: `三级指标${parent.children.length + 1}`,
          value: '',
          editable: true,
        })
        break
      }
    }
  }

  // 重新准备数据
  prepareData()
}

// 删除指标
const removeIndicator = (level: number, id: string) => {
  if (level === 1) {
    // 删除一级指标
    const index = tableData.value.findIndex((item) => item.id === id)
    if (index !== -1) {
      tableData.value.splice(index, 1)
    }
  } else if (level === 2) {
    // 删除二级指标
    for (const level1 of tableData.value) {
      if (!level1.children) continue

      const index = level1.children.findIndex((item) => item.id === id)
      if (index !== -1) {
        level1.children.splice(index, 1)
        break
      }
    }
  } else if (level === 3) {
    // 删除三级指标
    for (const level1 of tableData.value) {
      if (!level1.children) continue

      for (const level2 of level1.children) {
        if (!level2.children) continue

        const index = level2.children.findIndex((item) => item.id === id)
        if (index !== -1) {
          level2.children.splice(index, 1)
          break
        }
      }
    }
  }

  // 重新准备数据
  prepareData()
}

// 查找指标项
const findItem = (items: IndicatorItem[], id: string): IndicatorItem | null => {
  for (const item of items) {
    if (item.id === id) return item

    if (item.children) {
      const found = findItem(item.children, id)
      if (found) return found
    }
  }

  return null
}

// 获取当前表格数据
const getCurrentData = () => {
  // 返回深拷贝，避免响应式Proxy污染
  return JSON.parse(JSON.stringify(tableData.value))
}

// 设置表格数据（用于从外部恢复状态）
const setData = (data: IndicatorItem[]) => {
  tableData.value = JSON.parse(JSON.stringify(data))
  prepareData()
}

// 重置到默认数据
const resetToDefaultData = () => {
  // 调用store的重置方法，会自动使用默认数据
  evaluationStore.resetIndicatorData()

  // 重新处理数据
  prepareData()

  return true
}

// 构建单元格内容
const renderCell = (item: any, level: number) => {
  if (item.isEmpty) {
    return h('div', { class: 'empty-cell' }, level === 3 ? '未设置三级指标' : '未设置指标')
  }

  const actualItem = item.item

  return h(
    'div',
    {
      class: `indicator-cell level${level}-cell`,
      onMouseenter: () => handleMouseEnter(actualItem.id),
      onMouseleave: () => handleMouseLeave(),
      onClick: (e: Event) => e.stopPropagation(),
    },
    [
      h('div', { class: 'cell-content' }, [
        editingState.value.key === actualItem.id && editingState.value.field === 'name'
          ? h(Input, {
              value: editingState.value.value,
              'onUpdate:value': (val: any) => {
                editingState.value.value = val
              },
              onPressEnter: () => saveEdit(actualItem),
              onBlur: () => saveEdit(actualItem),
              onKeydown: (e: KeyboardEvent) => {
                // 允许退格键和删除键正常工作
                e.stopPropagation()
              },
              autoFocus: true,
              class: 'edit-input',
              onClick: (e: Event) => e.stopPropagation(),
            })
          : h(
              'span',
              {
                class: 'indicator-name',
                onDblclick: (e: Event) => {
                  e.stopPropagation()
                  startEdit(actualItem, 'name')
                },
              },
              actualItem.name,
            ),
      ]),

      // 鼠标悬停时才渲染按钮
      actualItem.id === hoveredItemId.value &&
        h(
          'div',
          {
            class: 'action-buttons',
          },
          [
            level < 3 &&
              h(
                Button,
                {
                  type: 'primary',
                  size: 'small',
                  onClick: (e: Event) => {
                    e.stopPropagation()
                    addIndicator(level + 1, actualItem.id)
                  },
                  class: 'action-btn',
                },
                { icon: () => h(PlusOutlined) },
              ),

            h(
              Button,
              {
                type: 'primary',
                danger: true,
                size: 'small',
                onClick: (e: Event) => {
                  e.stopPropagation()
                  removeIndicator(level, actualItem.id)
                },
                class: 'action-btn',
              },
              { icon: () => h(DeleteOutlined) },
            ),
          ].filter(Boolean),
        ),
    ].filter(Boolean),
  )
}

// 暴露方法给父组件
defineExpose({
  getCurrentData,
  setData,
  resetToDefaultData,
})
</script>

<template>
  <div class="multi-level-indicator-table">
    <div class="table-controls">
      <a-button type="primary" @click="addIndicator(1, '')">
        <template #icon><PlusOutlined /></template>
        添加一级指标
      </a-button>
      <a-button type="primary" danger @click="resetToDefaultData" class="reset-btn">
        <template #icon><SyncOutlined /></template>
        重置表格
      </a-button>
    </div>

    <div class="hierarchical-table">
      <!-- 一级指标行 -->
      <div class="table-row level1-row">
        <div
          v-for="item in processedTableData.level1"
          :key="item.id"
          class="table-cell"
          :style="{
            width: `${(item.colSpan / processedTableData.level1.reduce((sum, i) => sum + i.colSpan, 0)) * 100}%`,
          }"
        >
          <component :is="renderCell(item, 1)" />
        </div>
      </div>

      <!-- 二级指标行 -->
      <div class="table-row level2-row">
        <div
          v-for="item in processedTableData.level2"
          :key="item.id"
          class="table-cell"
          :style="{
            width: `${(item.colSpan / processedTableData.level1.reduce((sum, i) => sum + i.colSpan, 0)) * 100}%`,
          }"
        >
          <component :is="renderCell(item, 2)" />
        </div>
      </div>

      <!-- 三级指标行 -->
      <div class="table-row level3-row">
        <div
          v-for="item in processedTableData.level3"
          :key="item.id"
          class="table-cell"
          :style="{
            width: `${(item.colSpan / processedTableData.level1.reduce((sum, i) => sum + i.colSpan, 0)) * 100}%`,
          }"
        >
          <component :is="renderCell(item, 3)" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$text-color: rgba(220, 240, 255, 0.95);
$border-color: rgba(64, 169, 255, 0.3);
$accent-color: rgba(64, 169, 255, 0.6);
$bg-gradient-start: rgba(20, 30, 50, 0.95);
$bg-gradient-end: rgba(12, 22, 40, 0.95);

.multi-level-indicator-table {
  .table-controls {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 15px;
    gap: 10px;
    align-items: center;

    .reset-btn {
      background: rgba(30, 40, 60, 0.7);
      border-color: rgba(100, 120, 150, 0.5);
      color: rgba(220, 240, 255, 0.9);

      &:hover {
        background: rgba(40, 50, 70, 0.8);
        border-color: rgba(100, 120, 150, 0.7);
      }
    }
  }

  .hierarchical-table {
    border: 1px solid $border-color;
    border-radius: 4px;
    overflow: hidden;
    background: rgba(20, 30, 50, 0.2);
    display: flex;
    flex-direction: column;

    .table-row {
      display: flex;

      &.level1-row {
        background: rgba(40, 50, 70, 0.5);
        min-height: 70px;
      }

      &.level2-row {
        background: rgba(30, 40, 60, 0.5);
        border-top: 1px solid $border-color;
        min-height: 70px;
      }

      &.level3-row {
        background: rgba(20, 30, 50, 0.5);
        border-top: 1px solid $border-color;
        min-height: 80px;
      }

      .table-cell {
        border-right: 1px solid $border-color;
        padding: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;

        &:last-child {
          border-right: none;
        }
      }
    }
  }

  .empty-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(220, 240, 255, 0.5);
    font-style: italic;
    font-size: 13px;
    width: 100%;
    background-color: rgba(20, 30, 50, 0.2);
    min-height: 100%;
    border-radius: 4px;
  }

  .indicator-cell {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100%;
    justify-content: center;
    align-items: center;

    .cell-content {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      width: 100%;
      height: 100%;
      padding: 8px;

      .indicator-name {
        font-weight: 500;
        padding: 4px;
        cursor: pointer;
        border-radius: 4px;
        transition: background-color 0.2s;
        text-align: center;
        width: 100%;

        &:hover {
          background-color: rgba(64, 169, 255, 0.1);
        }
      }
    }

    .edit-input {
      width: 100%;
      max-width: 160px;
      text-align: center;
      background: rgba(30, 40, 60, 0.8);
      border-color: $accent-color;
      color: $text-color;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
      justify-content: center;
    }

    .action-btn {
      transition: transform 0.2s;

      &:hover {
        transform: translateY(-2px);
      }
    }
  }

  .level1-cell {
    font-size: 16px;
  }

  .level2-cell {
    font-size: 14px;
  }

  .level3-cell {
    font-size: 14px;
    .indicator-name {
      word-wrap: break-word;
      word-break: break-all;
      white-space: normal;
    }
  }
}
</style>
