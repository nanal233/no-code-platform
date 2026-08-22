import { reactive, ref } from 'vue'
import { message } from 'ant-design-vue'

type AppListResponse = Promise<{
  data: {
    code?: number
    data?: API.PageAppVO
    message?: string
  }
}>

/**
 * 应用分页列表的通用状态与查询逻辑，供“我的应用”“精选应用”等按名称搜索的应用列表复用
 */
export function useAppList(
  fetcher: (params: API.AppQueryRequest) => AppListResponse,
  errorLabel: string,
) {
  const list = ref<API.AppVO[]>([])
  const total = ref(0)
  const loading = ref(false)
  const searchName = ref('')
  const params = reactive<API.AppQueryRequest>({
    pageNum: 1,
    pageSize: 20,
  })

  const fetchList = async () => {
    loading.value = true
    try {
      const res = await fetcher({
        ...params,
        appName: searchName.value || undefined,
      })
      if (res.data.code === 0 && res.data.data) {
        list.value = res.data.data.records ?? []
        total.value = res.data.data.totalRow ?? 0
      } else {
        message.error(errorLabel + '失败，' + res.data.message)
      }
    } finally {
      loading.value = false
    }
  }

  const doSearch = () => {
    params.pageNum = 1
    fetchList()
  }

  return { list, total, loading, searchName, params, fetchList, doSearch }
}
