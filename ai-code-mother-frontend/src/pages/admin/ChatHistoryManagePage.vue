<template>
  <div id="chatHistoryManagePage">
    <!-- 搜索表单 -->
    <a-form layout="inline" :model="searchParams" @finish="doSearch">
      <a-form-item label="id">
        <a-input v-model:value="searchParams.id" placeholder="输入 id" />
      </a-form-item>
      <a-form-item label="消息内容">
        <a-input v-model:value="searchParams.message" placeholder="输入消息内容" />
      </a-form-item>
      <a-form-item label="消息类型">
        <a-select
          v-model:value="searchParams.messageType"
          placeholder="选择消息类型"
          allow-clear
          style="width: 140px"
          :options="messageTypeOptions"
        />
      </a-form-item>
      <a-form-item label="应用 id">
        <a-input v-model:value="searchParams.appId" placeholder="输入应用 id" />
      </a-form-item>
      <a-form-item label="创建用户 id">
        <a-input v-model:value="searchParams.userId" placeholder="输入用户 id" />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" html-type="submit">搜索</a-button>
      </a-form-item>
    </a-form>
    <a-divider />
    <!-- 表格 -->
    <a-table
      :columns="columns"
      :data-source="data"
      :pagination="pagination"
      row-key="id"
      @change="doTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'message'">
          <span class="message-preview">{{ previewMessage(record.message) }}</span>
        </template>
        <template v-else-if="column.dataIndex === 'messageType'">
          <a-tag :color="record.messageType === 'user' ? 'blue' : 'green'">
            {{ record.messageType === 'user' ? '用户' : 'AI' }}
          </a-tag>
        </template>
        <template v-else-if="column.dataIndex === 'createTime'">
          {{ formatDateTime(record.createTime) }}
        </template>
        <template v-else-if="column.dataIndex === 'updateTime'">
          {{ formatDateTime(record.updateTime) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button size="small" @click="doView(record)">查看</a-button>
        </template>
      </template>
    </a-table>

    <!-- 消息详情弹窗 -->
    <a-modal v-model:open="viewModalOpen" title="消息详情" :footer="null">
      <div class="message-meta">
        <a-tag :color="viewingRecord?.messageType === 'user' ? 'blue' : 'green'">
          {{ viewingRecord?.messageType === 'user' ? '用户' : 'AI' }}
        </a-tag>
        <span>应用 id：{{ viewingRecord?.appId }}</span>
        <span>创建时间：{{ formatDateTime(viewingRecord?.createTime) }}</span>
      </div>
      <div class="message-full">{{ viewingRecord?.message }}</div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { listAllChatHistoryByPageForAdmin } from '@/api/chatHistoryController.ts'
import { formatDateTime } from '@/utils/datetime.ts'
import { useAdminTable } from '@/composables/useAdminTable.ts'

const columns = [
  {
    title: 'id',
    dataIndex: 'id',
  },
  {
    title: '消息内容',
    dataIndex: 'message',
  },
  {
    title: '消息类型',
    dataIndex: 'messageType',
  },
  {
    title: '应用 id',
    dataIndex: 'appId',
  },
  {
    title: '创建用户 id',
    dataIndex: 'userId',
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
  },
  {
    title: '更新时间',
    dataIndex: 'updateTime',
  },
  {
    title: '操作',
    key: 'action',
  },
]

const messageTypeOptions = [
  { label: '用户', value: 'user' },
  { label: 'AI', value: 'ai' },
]

const { data, searchParams, fetchData, pagination, doTableChange, doSearch } = useAdminTable<
  API.ChatHistory,
  API.ChatHistoryQueryRequest
>(listAllChatHistoryByPageForAdmin, {
  pageNum: 1,
  pageSize: 10,
})

// 表格内仅展示消息摘要，避免过长消息撑破布局
const previewMessage = (msg?: string) => {
  if (!msg) {
    return ''
  }
  return msg.length > 20 ? msg.slice(0, 20) + '...' : msg
}

// 查看完整消息内容
const viewModalOpen = ref(false)
const viewingRecord = ref<API.ChatHistory>()

const doView = (record: API.ChatHistory) => {
  viewingRecord.value = record
  viewModalOpen.value = true
}

// 页面加载时请求一次
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.message-preview {
  color: #666;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  color: #999;
  font-size: 13px;
}

.message-full {
  max-height: 60vh;
  overflow-y: auto;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
}
</style>
