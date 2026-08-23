<template>
  <div id="appManagePage">
    <!-- 搜索表单 -->
    <a-form layout="inline" :model="searchParams" @finish="doSearch">
      <a-form-item label="id">
        <a-input v-model:value="searchParams.id" placeholder="输入 id" />
      </a-form-item>
      <a-form-item label="应用名称">
        <a-input v-model:value="searchParams.appName" placeholder="输入应用名称" />
      </a-form-item>
      <a-form-item label="生成类型">
        <a-select
          v-model:value="searchParams.codeGenType"
          placeholder="选择生成类型"
          allow-clear
          style="width: 160px"
          :options="codeGenTypeOptions"
        />
      </a-form-item>
      <a-form-item label="部署标识">
        <a-input v-model:value="searchParams.deployKey" placeholder="输入部署标识" />
      </a-form-item>
      <a-form-item label="优先级">
        <a-input-number v-model:value="searchParams.priority" placeholder="输入优先级" />
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
        <template v-if="column.dataIndex === 'cover'">
          <a-image v-if="record.cover" :src="record.cover" :width="80" />
        </template>
        <template v-else-if="column.dataIndex === 'initPrompt'">
          <a-typography-text :ellipsis="{ tooltip: record.initPrompt }" style="max-width: 100%">
            {{ record.initPrompt }}
          </a-typography-text>
        </template>
        <template v-else-if="column.dataIndex === 'codeGenType'">
          <a-tag color="blue">{{ record.codeGenType }}</a-tag>
        </template>
        <template v-else-if="column.dataIndex === 'priority'">
          <a-tag v-if="record.priority >= 99" color="gold">精选</a-tag>
          <span v-else>{{ record.priority }}</span>
        </template>
        <template v-else-if="column.dataIndex === 'user'">
          {{ record.user?.userName ?? record.userId }}
        </template>
        <template v-else-if="column.dataIndex === 'createTime'">
          {{ formatDateTime(record.createTime) }}
        </template>
        <template v-else-if="column.dataIndex === 'updateTime'">
          {{ formatDateTime(record.updateTime) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button @click="doEdit(record.id)">编辑</a-button>
            <a-button v-if="record.priority < 99" @click="doSetGood(record)">精选</a-button>
            <a-button danger @click="doDelete(record.id)">删除</a-button>
          </a-space>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { deleteAppByAdmin, listAppVoByPageByAdmin, updateAppByAdmin } from '@/api/appController.ts'
import { message } from 'ant-design-vue'
import { formatDateTime } from '@/utils/datetime.ts'
import { useAdminTable } from '@/composables/useAdminTable.ts'

const columns = [
  {
    title: 'id',
    dataIndex: 'id',
  },
  {
    title: '应用名称',
    dataIndex: 'appName',
  },
  {
    title: '封面',
    dataIndex: 'cover',
  },
  {
    title: '初始 prompt',
    dataIndex: 'initPrompt',
    width: 280,
  },
  {
    title: '生成类型',
    dataIndex: 'codeGenType',
  },
  {
    title: '优先级',
    dataIndex: 'priority',
  },
  {
    title: '创建用户',
    dataIndex: 'user',
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

const codeGenTypeOptions = [
  { label: '原生 HTML 模式', value: 'html' },
  { label: '原生多文件模式', value: 'multi_file' },
]

const { data, searchParams, fetchData, pagination, doTableChange, doSearch } = useAdminTable<
  API.AppVO,
  API.AppQueryRequest
>(listAppVoByPageByAdmin, {
  pageNum: 1,
  pageSize: 10,
})

// 编辑数据（新开页面）
const doEdit = (id: number) => {
  window.open(`/app/edit/${id}`, '_blank')
}

// 设置精选
const doSetGood = async (record: API.AppVO) => {
  const res = await updateAppByAdmin({
    id: record.id,
    appName: record.appName,
    cover: record.cover,
    priority: 99,
  })
  if (res.data.code === 0 && res.data.data) {
    message.success('设置精选成功')
    fetchData()
  } else {
    message.error('设置精选失败，' + res.data.message)
  }
}

// 删除数据
const doDelete = async (id: number) => {
  if (!id) {
    return
  }
  const res = await deleteAppByAdmin({ id })
  if (res.data.code === 0) {
    message.success('删除成功')
    // 刷新数据
    fetchData()
  } else {
    message.error('删除失败')
  }
}

// 页面加载时请求一次
onMounted(() => {
  fetchData()
})
</script>
