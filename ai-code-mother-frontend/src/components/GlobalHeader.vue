<script setup lang="ts">
import { computed, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { type MenuProps, message } from 'ant-design-vue'
import logo from '@/assets/logo.png'
import { useLoginUserStore } from '@/stores/loginUser.ts'
import { LogoutOutlined } from '@ant-design/icons-vue'
import { userLogout } from '@/api/userController.ts'

// 获取登录用户状态
const loginUserStore = useLoginUserStore()

const router = useRouter()
const route = useRoute()

// 菜单配置项
const originItems = [
  {
    key: '/',
    label: '主页',
    title: '主页',
  },
  {
    key: 'others',
    label: h('a', {href: 'https://github.com/nanal233', target: '_blank'}, '关于作者'),
    title: '主页',
  },
  {
    key: '/admin/userManage',
    label: '用户管理',
    title: '用户管理',
  },
]

// 过滤菜单项
const filterMenus = (menus = [] as MenuProps['items']) => {
  return menus?.filter((menu) => {
    const menuKey = menu?.key as string
    if (menuKey?.startsWith('/admin')) {
      const loginUser = loginUserStore.loginUser
      if (!loginUser || loginUser.userRole !== 'admin') {
        return false
      }
    }
    return true
  })
}

// 展示在菜单的路由数组
const menuItems = computed<MenuProps['items']>(() => filterMenus(originItems))

const selectedKeys = computed(() => [route.path])

const handleMenuClick = ({ key }: { key: string }) => {
  router.push(key)
}

// 用户注销
const doLogout = async () => {
  const res = await userLogout()
  if (res.data.code === 0) {
    loginUserStore.setLoginUser({
      userName: '未登录',
    })
    message.success('退出登录成功')
    await router.push('/user/login')
  } else {
    message.error('退出登录失败，' + res.data.message)
  }
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
    <div class="user-login-status">
      <div v-if="loginUserStore.loginUser.id">
        <a-dropdown>
          <a-space>
            <a-avatar :src="loginUserStore.loginUser.userAvatar" />
            {{ loginUserStore.loginUser.userName ?? '无名' }}
          </a-space>
          <template #overlay>
            <a-menu>
              <a-menu-item @click="doLogout">
                <LogoutOutlined />
                退出登录
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
      <div v-else>
        <a-button type="primary" href="/user/login">登录</a-button>
      </div>
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

.user-login-status {
  flex-shrink: 0;
  margin-left: 16px;
}
</style>
