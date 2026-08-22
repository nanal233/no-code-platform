<template>
  <div id="appEditPage">
    <a-card title="编辑应用信息" :loading="loading">
      <a-form
        v-if="app.id"
        :model="formState"
        layout="vertical"
        style="max-width: 480px"
        @finish="handleSubmit"
      >
        <a-form-item
          label="应用名称"
          name="appName"
          :rules="[{ required: true, message: '请输入应用名称' }]"
        >
          <a-input v-model:value="formState.appName" placeholder="请输入应用名称" />
        </a-form-item>
        <template v-if="isAdmin">
          <a-form-item label="应用封面" name="cover">
            <a-input v-model:value="formState.cover" placeholder="请输入封面图片地址" />
          </a-form-item>
          <a-form-item label="优先级" name="priority">
            <a-input-number v-model:value="formState.priority" style="width: 100%" :min="0" />
          </a-form-item>
        </template>
        <a-form-item>
          <a-space>
            <a-button type="primary" html-type="submit" :loading="submitting">保存</a-button>
            <a-button @click="router.back()">取消</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getAppVoById, updateApp, updateAppByAdmin } from '@/api/appController.ts'
import { useLoginUserStore } from '@/stores/loginUser.ts'
import { useIsAdmin } from '@/composables/useIsAdmin.ts'
import { asId } from '@/utils/id.ts'

const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()

const appId = computed(() => route.params.id as string)
const app = ref<API.AppVO>({})
const loading = ref(true)
const submitting = ref(false)

const isAdmin = useIsAdmin()

const formState = reactive<{ appName?: string; cover?: string; priority?: number }>({
  appName: '',
  cover: '',
  priority: 0,
})

const fetchApp = async () => {
  loading.value = true
  try {
    const res = await getAppVoById({ id: asId(appId.value) })
    if (res.data.code === 0 && res.data.data) {
      app.value = res.data.data
      // 权限校验：仅本人或管理员可编辑
      const isOwner = app.value.userId === loginUserStore.loginUser.id
      if (!isOwner && !isAdmin.value) {
        message.error('无权限编辑该应用')
        router.back()
        return
      }
      formState.appName = app.value.appName
      formState.cover = app.value.cover
      formState.priority = app.value.priority ?? 0
    } else {
      message.error('获取应用信息失败，' + res.data.message)
      router.back()
    }
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    const res = isAdmin.value
      ? await updateAppByAdmin({
          id: asId(appId.value),
          appName: formState.appName,
          cover: formState.cover,
          priority: formState.priority,
        })
      : await updateApp({
          id: asId(appId.value),
          appName: formState.appName,
        })
    if (res.data.code === 0 && res.data.data) {
      message.success('保存成功')
      router.back()
    } else {
      message.error('保存失败，' + res.data.message)
    }
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchApp()
})
</script>

<style scoped>
#appEditPage {
  max-width: 640px;
  margin: 0 auto;
}
</style>
