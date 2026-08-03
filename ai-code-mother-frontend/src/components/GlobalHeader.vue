<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { MenuProps } from 'ant-design-vue'
import logo from '@/assets/logo.png'

const router = useRouter()
const route = useRoute()

const menuItems: MenuProps['items'] = [
  { key: '/', label: '主页' },
  { key: '/about', label: '关于' },
]

const selectedKeys = computed(() => [route.path])

const handleMenuClick = ({ key }: { key: string }) => {
  router.push(key)
}
</script>

<template>
  <a-layout-header class="global-header">
    <div class="header-left">
      <img :src="logo" alt="logo" class="logo" />
      <span class="title">AI 零代码应用生成平台</span>
    </div>
    <a-menu
      mode="horizontal"
      :items="menuItems"
      :selected-keys="selectedKeys"
      class="header-menu"
      @click="handleMenuClick"
    />
    <div class="header-right">
      <a-button type="primary">登录</a-button>
    </div>
  </a-layout-header>
</template>

<style scoped>
.global-header {
  display: flex;
  align-items: center;
  padding: 0 24px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.logo {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
}

.header-menu {
  flex: 1;
  border-bottom: none;
  background: transparent;
  min-width: 0;
}

.header-right {
  flex-shrink: 0;
  margin-left: 16px;
}
</style>
