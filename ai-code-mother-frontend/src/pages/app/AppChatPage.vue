<template>
  <div id="appChatPage">
    <!-- 顶部栏 -->
    <div class="chat-header">
      <div class="chat-header-left">
        <span class="app-name">{{ appInfo.appName || '应用生成中' }}</span>
      </div>
      <div class="chat-header-right">
        <AppDetailPopover
          :app="appInfo"
          :can-manage="isOwner || isAdmin"
          @edit="handleEdit"
          @delete="handleDelete"
        />
        <a-button
          v-if="isOwner"
          type="primary"
          :icon="h(CloudUploadOutlined)"
          @click="handleDeploy"
        >
          部署
        </a-button>
      </div>
    </div>

    <!-- 核心内容区域 -->
    <div class="chat-body">
      <!-- 左侧：对话区域 -->
      <div class="chat-panel">
        <div ref="messageListRef" class="message-list">
          <div v-if="chatHistory.loadingInitial.value" class="history-loading">
            <a-spin size="small" />
          </div>
          <div v-else-if="chatHistory.hasMore.value" class="load-more">
            <a-button
              type="link"
              size="small"
              :loading="chatHistory.loadingMore.value"
              @click="chatHistory.loadMore"
            >
              加载更多历史消息
            </a-button>
          </div>
          <div
            v-for="msg in chatHistory.messages.value"
            :key="msg.id"
            class="message-row"
            :class="msg.role === 'user' ? 'message-row-user' : 'message-row-ai'"
          >
            <a-avatar v-if="msg.role === 'ai'" class="message-avatar" :icon="h(RobotOutlined)" />
            <div class="message-bubble">
              <div
                v-if="msg.role === 'ai' && msg.content"
                class="markdown-body"
                v-html="renderMarkdown(msg.content)"
              />
              <span v-else-if="msg.content" class="plain-text">{{ msg.content }}</span>
              <a-spin v-else-if="msg.loading" size="small" />
            </div>
            <a-avatar
              v-if="msg.role === 'user'"
              class="message-avatar"
              :src="loginUserStore.loginUser.userAvatar"
              :icon="h(UserOutlined)"
            />
          </div>
        </div>
        <div class="message-input-box">
          <a-textarea
            :key="textareaKey"
            ref="textareaRef"
            v-model:value="userInput"
            :placeholder="
              isOwner ? '请描述你想生成的网站，越详细效果越好哦' : '仅应用创建者可以继续对话生成'
            "
            :auto-size="{ minRows: 2, maxRows: 5 }"
            :disabled="!isOwner || generating"
            @keydown="handleKeydown"
            @compositionstart="isComposing = true"
            @compositionend="isComposing = false"
          />
          <div class="message-input-footer">
            <a-button
              type="primary"
              shape="circle"
              :icon="h(ArrowUpOutlined)"
              :disabled="!isOwner"
              :loading="generating"
              @click="handleSend"
            />
          </div>
        </div>
      </div>

      <!-- 右侧：网页展示区域 -->
      <div class="preview-panel">
        <div v-if="showPreview" class="preview-toolbar">
          <span class="preview-url">{{ previewUrl }}</span>
          <a-space>
            <a-button size="small" :icon="h(ReloadOutlined)" @click="iframeKey++">刷新</a-button>
            <a-button size="small" :icon="h(ExportOutlined)" @click="openInNewTab">
              新窗口打开
            </a-button>
          </a-space>
        </div>
        <div v-if="showPreview" class="preview-frame-wrapper">
          <iframe :key="iframeKey" :src="previewUrl" class="preview-frame" />
        </div>
        <a-empty v-else class="preview-empty" description="生成完成后将在这里展示网站效果" />
      </div>
    </div>

    <!-- 部署成功弹窗 -->
    <a-modal v-model:open="deployModalOpen" title="部署成功" :footer="null">
      <p>应用已成功部署，可通过以下地址访问：</p>
      <a-typography-link :href="deployedUrl" target="_blank">{{ deployedUrl }}</a-typography-link>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { h, nextTick, onMounted, onUnmounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  ArrowUpOutlined,
  CloudUploadOutlined,
  ExportOutlined,
  ReloadOutlined,
  RobotOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import { deleteApp, deployApp, getAppVoById } from '@/api/appController.ts'
import { useLoginUserStore } from '@/stores/loginUser.ts'
import { useIsAdmin } from '@/composables/useIsAdmin.ts'
import { useChatHistory } from '@/composables/useChatHistory.ts'
import { API_BASE_URL } from '@/config/env.ts'
import { asId } from '@/utils/id.ts'
import { getStaticPreviewUrl } from '@/utils/preview.ts'
import { renderMarkdown } from '@/utils/markdown.ts'
import AppDetailPopover from '@/components/AppDetailPopover.vue'

const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()

const appId = computed(() => route.params.id as string)
const appInfo = ref<API.AppVO>({})
const isOwner = computed(
  () => !!loginUserStore.loginUser.id && appInfo.value.userId === loginUserStore.loginUser.id,
)
const isAdmin = useIsAdmin()

const chatHistory = useChatHistory(() => appId.value)
const userInput = ref('')
// 中文等输入法组词过程中按下的确认键也会触发 keydown Enter，此时不应发送消息
const isComposing = ref(false)
// 发送后强制重新挂载输入框，避免自动高度文本域内部状态与外部值不同步导致文本残留
const textareaKey = ref(0)
const textareaRef = ref()
const generating = ref(false)
const showPreview = ref(false)
const iframeKey = ref(0)
const messageListRef = ref<HTMLDivElement>()

const previewUrl = computed(() => getStaticPreviewUrl(appInfo.value.codeGenType, appId.value))

const openInNewTab = () => {
  window.open(previewUrl.value, '_blank')
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

let eventSource: EventSource | null = null

const sendMessage = (content: string) => {
  const trimmed = content.trim()
  if (!trimmed || generating.value || !isOwner.value) {
    return
  }
  const messages = chatHistory.messages
  messages.value.push({ id: crypto.randomUUID(), role: 'user', content: trimmed })
  messages.value.push({ id: crypto.randomUUID(), role: 'ai', content: '', loading: true })
  // 取回数组中的响应式代理对象，而非本地原始对象，逐字追加内容时才能触发视图更新
  const aiMessage = messages.value[messages.value.length - 1]
  scrollToBottom()

  generating.value = true
  showPreview.value = false

  const url = `${API_BASE_URL}/app/chat/gen/code?appId=${appId.value}&message=${encodeURIComponent(trimmed)}`
  eventSource = new EventSource(url, { withCredentials: true })

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.d) {
        aiMessage.content += data.d
        aiMessage.loading = false
        scrollToBottom()
      }
    } catch {
      // 忽略无法解析的心跳数据
    }
  }

  eventSource.addEventListener('done', () => {
    aiMessage.loading = false
    generating.value = false
    eventSource?.close()
    eventSource = null
    showPreview.value = true
    iframeKey.value++
  })

  eventSource.onerror = () => {
    generating.value = false
    aiMessage.loading = false
    if (!aiMessage.content) {
      message.error('生成失败，请重试')
      messages.value.pop()
    }
    eventSource?.close()
    eventSource = null
  }
}

const handleSend = () => {
  if (!userInput.value.trim()) {
    return
  }
  sendMessage(userInput.value)
  userInput.value = ''
  // 通过更换 key 强制输入框重新挂载，确保清空后不会残留旧值
  textareaKey.value++
  nextTick(() => {
    textareaRef.value?.focus?.()
  })
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    // 输入法候选词确认（如中文拼音选字）也会触发 Enter，此时应放行给输入法处理，而不是发送
    if (isComposing.value || e.isComposing) {
      return
    }
    e.preventDefault()
    handleSend()
  }
}

// 部署
const deployModalOpen = ref(false)
const deployedUrl = ref('')
const deploying = ref(false)

const handleDeploy = async () => {
  if (deploying.value) {
    return
  }
  deploying.value = true
  try {
    const res = await deployApp({ appId: asId(appId.value) })
    if (res.data.code === 0 && res.data.data) {
      deployedUrl.value = res.data.data
      deployModalOpen.value = true
      message.success('部署成功')
    } else {
      message.error('部署失败，' + res.data.message)
    }
  } finally {
    deploying.value = false
  }
}

// 应用详情操作
const handleEdit = () => {
  router.push(`/app/edit/${appId.value}`)
}

const handleDelete = async () => {
  const res = await deleteApp({ id: asId(appId.value) })
  if (res.data.code === 0 && res.data.data) {
    message.success('删除成功')
    router.push('/')
  } else {
    message.error('删除失败，' + res.data.message)
  }
}

const fetchAppInfo = async () => {
  const res = await getAppVoById({ id: asId(appId.value) })
  if (res.data.code === 0 && res.data.data) {
    appInfo.value = res.data.data
  } else {
    message.error('获取应用信息失败，' + res.data.message)
    router.push('/')
  }
}

onMounted(async () => {
  await fetchAppInfo()
  await chatHistory.loadInitial()
  scrollToBottom()
  // 已有至少 2 条对话记录，说明代码已生成过，直接展示对应网站
  if (chatHistory.totalCount.value >= 2) {
    showPreview.value = true
  }
  if (route.query.init === '1' && appInfo.value.initPrompt) {
    // 应用刚创建，自动发送初始提示词
    router.replace({ query: {} })
    sendMessage(appInfo.value.initPrompt)
  }
})

onUnmounted(() => {
  eventSource?.close()
  eventSource = null
})
</script>

<style scoped>
#appChatPage {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px - 53px);
  margin: -24px;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.app-name {
  font-size: 16px;
  font-weight: 600;
}

.chat-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.chat-panel {
  flex: 2 0 0;
  min-width: 360px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-right: 1px solid #f0f0f0;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.history-loading {
  display: flex;
  justify-content: center;
  padding: 8px 0 16px;
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 0 0 16px;
}

.message-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 16px;
}

.message-row-user {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 85%;
  min-width: 0;
  padding: 8px 12px;
  border-radius: 8px;
  background: #f5f5f5;
  word-break: break-word;
  line-height: 1.6;
}

.plain-text {
  white-space: pre-wrap;
}

.message-row-user .message-bubble {
  background: #1677ff;
  color: #fff;
}

.markdown-body :deep(p) {
  margin: 0 0 8px;
}

.markdown-body :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 0 0 8px;
  padding-left: 20px;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  margin: 12px 0 8px;
  font-weight: 600;
}

.markdown-body :deep(h1:first-child),
.markdown-body :deep(h2:first-child),
.markdown-body :deep(h3:first-child),
.markdown-body :deep(h4:first-child) {
  margin-top: 0;
}

.markdown-body :deep(code) {
  padding: 2px 4px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.06);
  font-size: 13px;
}

.markdown-body :deep(pre) {
  margin: 8px 0;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
}

.markdown-body :deep(pre code) {
  padding: 0;
  background: none;
  font-size: 13px;
}

.markdown-body :deep(a) {
  color: #1677ff;
}

.message-avatar {
  flex-shrink: 0;
}

.message-input-box {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
}

.message-input-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.preview-panel {
  flex: 3 1 0;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
}

.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.preview-url {
  color: #888;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-frame-wrapper {
  flex: 1;
}

.preview-frame {
  width: 100%;
  height: 100%;
  border: none;
}

.preview-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
