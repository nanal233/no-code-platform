<template>
  <div class="auth-card">
    <h2 class="title">{{ title }}</h2>
    <div class="desc">{{ desc }}</div>
    <slot />
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  title: string
  desc?: string
}>()
</script>

<style scoped>
.auth-card {
  max-width: 360px;
  margin: 0 auto;
}

.title {
  text-align: center;
  margin-bottom: 16px;
}

.desc {
  text-align: center;
  color: #bbb;
  margin-bottom: 16px;
}

/* 供插槽内容（登录/注册表单）中的 .tips 复用，避免各页面重复定义 */
:slotted(.tips) {
  margin-bottom: 16px;
  color: #bbb;
  font-size: 13px;
  text-align: right;
}
</style>
