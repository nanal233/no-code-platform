import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { listAppChatHistory } from '@/api/chatHistoryController.ts'
import { asId } from '@/utils/id.ts'

export interface ChatMessage {
  // 历史消息为后端记录 id，流式产生的新消息为本地临时 id
  id: number | string
  role: 'user' | 'ai'
  content: string
  loading?: boolean
}

const PAGE_SIZE = 10

const toChatMessage = (item: API.ChatHistory): ChatMessage => ({
  id: item.id!,
  role: item.messageType === 'user' ? 'user' : 'ai',
  content: item.message ?? '',
})

/**
 * 应用对话历史的游标分页加载：首次加载最近一页，之后可通过 loadMore 向上翻页加载更早的消息
 */
export function useChatHistory(getAppId: () => string) {
  const messages = ref<ChatMessage[]>([])
  const totalCount = ref(0)
  const hasMore = ref(false)
  const loadingInitial = ref(false)
  const loadingMore = ref(false)
  // 游标：当前已加载消息中最早一条的创建时间
  let oldestCreateTime: string | undefined

  const loadInitial = async () => {
    loadingInitial.value = true
    try {
      const res = await listAppChatHistory({ appId: asId(getAppId()), pageSize: PAGE_SIZE })
      if (res.data.code === 0 && res.data.data) {
        // 后端按创建时间降序返回（最新的在前），翻转为升序用于聊天区展示
        const records = res.data.data.records ?? []
        totalCount.value = res.data.data.totalRow ?? 0
        messages.value = records.map(toChatMessage).reverse()
        oldestCreateTime = records[records.length - 1]?.createTime
        hasMore.value = messages.value.length < totalCount.value
      } else {
        message.error('获取对话历史失败，' + res.data.message)
      }
    } finally {
      loadingInitial.value = false
    }
  }

  const loadMore = async () => {
    if (!hasMore.value || loadingMore.value) {
      return
    }
    loadingMore.value = true
    try {
      const res = await listAppChatHistory({
        appId: asId(getAppId()),
        pageSize: PAGE_SIZE,
        lastCreateTime: oldestCreateTime,
      })
      if (res.data.code === 0 && res.data.data) {
        const records = res.data.data.records ?? []
        messages.value = [...records.map(toChatMessage).reverse(), ...messages.value]
        if (records.length > 0) {
          oldestCreateTime = records[records.length - 1]?.createTime
        }
        hasMore.value = messages.value.length < totalCount.value
      } else {
        message.error('加载更多历史消息失败，' + res.data.message)
      }
    } finally {
      loadingMore.value = false
    }
  }

  return { messages, totalCount, hasMore, loadingInitial, loadingMore, loadInitial, loadMore }
}
