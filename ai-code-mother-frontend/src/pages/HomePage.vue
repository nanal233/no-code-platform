<template>
  <div id="homePage">
    <!-- 标题区：全宽科技感渐变背景 -->
    <div class="banner">
      <div class="banner-inner">
        <h1 class="banner-title">一句话 <span class="logo-dot">🐱</span> 呈所想</h1>
        <p class="banner-desc">与 AI 对话轻松创建应用和网站</p>
        <div class="prompt-box">
          <a-textarea
            v-model:value="initPrompt"
            placeholder="创建一个高效的小工具，帮我计算……"
            :auto-size="{ minRows: 3, maxRows: 6 }"
            :maxlength="1000"
            @keydown="handleKeydown"
          />
          <div class="prompt-box-footer">
            <span class="prompt-tip">Enter 发送，Shift + Enter 换行</span>
            <a-button
              type="primary"
              shape="circle"
              :icon="h(ArrowUpOutlined)"
              :loading="creating"
              @click="handleCreateApp"
            />
          </div>
        </div>
        <div class="quick-prompts">
          <a-tag
            v-for="item in quickPrompts"
            :key="item.label"
            class="quick-prompt-tag"
            @click="initPrompt = item.prompt"
          >
            {{ item.label }}
          </a-tag>
        </div>
      </div>
    </div>

    <div class="page-content">
      <!-- 我的应用 -->
      <div v-if="loginUserStore.loginUser.id" class="section">
        <div class="section-header">
          <h2 class="section-title">我的应用</h2>
          <a-input-search
            v-model:value="myApp.searchName.value"
            placeholder="搜索我的应用"
            class="section-search"
            allow-clear
            @search="myApp.doSearch"
          />
        </div>
        <a-empty
          v-if="!myApp.loading.value && myApp.list.value.length === 0"
          description="暂无应用，快去创建一个吧"
        />
        <div v-else class="app-grid">
          <AppCard v-for="app in myApp.list.value" :key="app.id" :app="app" @click="goToApp(app)" />
        </div>
        <a-pagination
          v-if="myApp.total.value > myApp.params.pageSize!"
          class="section-pagination"
          v-model:current="myApp.params.pageNum"
          v-model:page-size="myApp.params.pageSize"
          :total="myApp.total.value"
          show-less-items
          @change="myApp.fetchList"
        />
      </div>

      <!-- 精选应用 -->
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">精选应用</h2>
          <a-input-search
            v-model:value="goodApp.searchName.value"
            placeholder="搜索精选应用"
            class="section-search"
            allow-clear
            @search="goodApp.doSearch"
          />
        </div>
        <a-empty
          v-if="!goodApp.loading.value && goodApp.list.value.length === 0"
          description="暂无精选应用"
        />
        <div v-else class="app-grid">
          <AppCard
            v-for="app in goodApp.list.value"
            :key="app.id"
            :app="app"
            @click="goToApp(app)"
          />
        </div>
        <a-pagination
          v-if="goodApp.total.value > goodApp.params.pageSize!"
          class="section-pagination"
          v-model:current="goodApp.params.pageNum"
          v-model:page-size="goodApp.params.pageSize"
          :total="goodApp.total.value"
          show-less-items
          @change="goodApp.fetchList"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { h, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { ArrowUpOutlined } from '@ant-design/icons-vue'
import { addApp, listGoodAppVoByPage, listMyAppVoByPage } from '@/api/appController.ts'
import { useLoginUserStore } from '@/stores/loginUser.ts'
import { useAppList } from '@/composables/useAppList.ts'
import AppCard from '@/components/AppCard.vue'

const router = useRouter()
const loginUserStore = useLoginUserStore()

// 创建应用
const initPrompt = ref('')
const creating = ref(false)

const quickPrompts = [
  {
    label: '电商网站首页',
    prompt:
      '帮我生成一个电商网站首页，包含轮播图、商品分类导航、热门商品展示区和页脚，配色以蓝白为主，风格清爽专业',
  },
  {
    label: '企业官网',
    prompt:
      '帮我生成一个科技公司官网，包含公司简介、核心业务、成功案例和联系方式，风格简洁大气，配色以深蓝白色为主',
  },
  {
    label: '个人博客',
    prompt:
      '帮我生成一个个人技术博客首页，包含文章列表、分类标签、个人简介卡片，风格简约清新，突出阅读体验',
  },
  {
    label: '后台管理系统',
    prompt:
      '帮我生成一个后台管理系统首页，包含侧边导航栏、数据统计卡片、图表展示区和最近动态列表，风格专业简洁',
  },
]

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleCreateApp()
  }
}

const handleCreateApp = async () => {
  if (!initPrompt.value.trim()) {
    message.warning('请输入你想要创建的应用描述')
    return
  }
  if (!loginUserStore.loginUser.id) {
    message.warning('请先登录')
    router.push(`/user/login?redirect=${router.currentRoute.value.fullPath}`)
    return
  }
  creating.value = true
  try {
    const res = await addApp({ initPrompt: initPrompt.value })
    if (res.data.code === 0 && res.data.data) {
      router.push({ path: `/app/chat/${res.data.data}`, query: { init: '1' } })
    } else {
      message.error('创建应用失败，' + res.data.message)
    }
  } finally {
    creating.value = false
  }
}

const goToApp = (app: API.AppVO) => {
  router.push(`/app/chat/${app.id}`)
}

// 我的应用 / 精选应用
const myApp = useAppList(listMyAppVoByPage, '获取我的应用')
const goodApp = useAppList(listGoodAppVoByPage, '获取精选应用')

onMounted(() => {
  if (loginUserStore.loginUser.id) {
    myApp.fetchList()
  }
  goodApp.fetchList()
})
</script>

<style scoped>
#homePage {
  /* 抵消 BasicLayout .layout-content 的 24px 内边距，让渐变背景铺满整个页面；
     width 必须保持 auto，与负 margin 同时显式设置会导致右侧 margin 被覆盖，留出空白 */
  margin: -24px;
  padding: 0 24px 40px;
  min-height: calc(100vh - 64px - 53px);
  background-image: linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%);
}

.banner {
  position: relative;
  width: 100%;
  padding: 64px 0 56px;
}

.banner-inner {
  position: relative;
  z-index: 1;
  max-width: 720px;
  margin: 0 auto;
  text-align: center;
}

.banner-title {
  font-size: 40px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #1a1a2e;
}

.logo-dot {
  display: inline-block;
}

.banner-desc {
  color: rgba(26, 26, 46, 0.68);
  font-size: 16px;
  margin-bottom: 32px;
}

.prompt-box {
  max-width: 720px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 16px;
  box-shadow: 0 20px 45px rgba(94, 92, 154, 0.25);
  padding: 16px;
}

.prompt-box :deep(textarea) {
  border: none;
  box-shadow: none;
  resize: none;
  padding: 0;
}

.prompt-box :deep(textarea):focus {
  box-shadow: none;
}

.prompt-box-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.prompt-tip {
  color: #bbb;
  font-size: 12px;
}

.quick-prompts {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-prompt-tag {
  cursor: pointer;
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.7);
  color: #1a1a2e;
  transition: background 0.2s;
}

.quick-prompt-tag:hover {
  background: rgba(255, 255, 255, 0.8);
  color: #1a1a2e;
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
}

.section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-size: 22px;
  font-weight: 600;
  margin: 0;
}

.section-search {
  width: 240px;
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.section-pagination {
  margin-top: 20px;
  text-align: center;
  justify-content: center;
}
</style>
