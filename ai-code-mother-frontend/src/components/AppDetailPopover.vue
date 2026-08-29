<template>
  <a-popover trigger="click" placement="bottomRight">
    <template #content>
      <div class="app-detail-popover">
        <div class="app-detail-row">
          <a-avatar :src="app.user?.userAvatar" :icon="h(UserOutlined)" :size="32" />
          <div class="app-detail-creator">
            <div class="app-detail-label">创建者</div>
            <div class="app-detail-value">{{ app.user?.userName ?? '未知' }}</div>
          </div>
        </div>
        <div class="app-detail-row">
          <div class="app-detail-label">生成类型</div>
          <a-tag color="blue">{{ getCodeGenTypeLabel(app.codeGenType) }}</a-tag>
        </div>
        <div class="app-detail-row">
          <div class="app-detail-label">创建时间</div>
          <div class="app-detail-value">{{ formatDateTime(app.createTime) }}</div>
        </div>
        <template v-if="canManage">
          <a-divider class="app-detail-divider" />
          <a-space class="app-detail-actions">
            <a-button size="small" @click="emit('edit')">修改</a-button>
            <a-popconfirm title="确定要删除该应用吗？" @confirm="emit('delete')">
              <a-button size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </div>
    </template>
    <a-button :icon="h(InfoCircleOutlined)">应用详情</a-button>
  </a-popover>
</template>

<script lang="ts" setup>
import { h } from 'vue'
import { InfoCircleOutlined, UserOutlined } from '@ant-design/icons-vue'
import { formatDateTime } from '@/utils/datetime.ts'
import { getCodeGenTypeLabel } from '@/constants/codeGenType.ts'

defineProps<{
  app: API.AppVO
  // 操作栏（修改/删除）仅本人或管理员可见
  canManage: boolean
}>()

const emit = defineEmits<{
  edit: []
  delete: []
}>()
</script>

<style scoped>
.app-detail-popover {
  width: 240px;
}

.app-detail-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.app-detail-label {
  color: #999;
  font-size: 12px;
}

.app-detail-value {
  color: #1a1a1a;
  font-size: 14px;
}

.app-detail-divider {
  margin: 8px 0;
}

.app-detail-actions {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}
</style>
