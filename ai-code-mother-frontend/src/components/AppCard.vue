<template>
  <div class="app-card" @click="emit('click')">
    <div class="app-card-cover">
      <img v-if="app.cover" :src="app.cover" alt="cover" />
      <div v-else class="app-card-cover-placeholder">{{ (app.appName ?? 'A').charAt(0) }}</div>
      <a-tag v-if="(app.priority ?? 0) >= 99" color="gold" class="app-card-priority">精选</a-tag>
      <div class="app-card-overlay">
        <button
          v-if="app.deployKey"
          type="button"
          class="app-card-action app-card-action-primary"
          @click.stop="handleViewWork"
        >
          查看作品
        </button>
        <button
          type="button"
          class="app-card-action app-card-action-secondary"
          @click.stop="emit('click')"
        >
          查看对话
        </button>
      </div>
    </div>
    <div class="app-card-body">
      <a-avatar :src="app.user?.userAvatar" :size="40" class="app-card-avatar">
        {{ (app.user?.userName ?? 'U').charAt(0) }}
      </a-avatar>
      <div class="app-card-info">
        <div class="app-card-name">{{ app.appName || '未命名应用' }}</div>
        <div class="app-card-username">{{ app.user?.userName ?? '' }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { DEPLOYED_APP_BASE_URL } from '@/config/env.ts'

const props = defineProps<{
  app: API.AppVO
}>()

const emit = defineEmits<{
  click: []
}>()

const handleViewWork = () => {
  if (!props.app.deployKey) {
    return
  }
  window.open(`${DEPLOYED_APP_BASE_URL}/${props.app.deployKey}/`, '_blank')
}
</script>

<style scoped>
.app-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.app-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.app-card-cover {
  position: relative;
  height: 140px;
  background: linear-gradient(135deg, #eef1f6, #dbe2ea);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.app-card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.app-card-cover-placeholder {
  font-size: 40px;
  font-weight: 700;
  color: #b3bcc9;
}

.app-card-priority {
  position: absolute;
  top: 8px;
  right: 8px;
}

.app-card-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: rgba(0, 0, 0, 0.45);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

.app-card:hover .app-card-overlay {
  opacity: 1;
  pointer-events: auto;
}

.app-card-action {
  min-width: 104px;
  padding: 8px 20px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  text-align: center;
  cursor: pointer;
  border: none;
}

.app-card-action-primary {
  background: #1a1a1a;
  color: #fff;
}

.app-card-action-primary:hover {
  background: #333;
}

.app-card-action-secondary {
  background: #fff;
  color: #1a1a1a;
}

.app-card-action-secondary:hover {
  background: #f0f0f0;
}

.app-card-body {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
}

.app-card-avatar {
  flex-shrink: 0;
}

.app-card-info {
  min-width: 0;
  flex: 1;
}

.app-card-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-card-username {
  margin-top: 4px;
  color: #999;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
