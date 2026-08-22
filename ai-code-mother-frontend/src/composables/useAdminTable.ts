import { computed, reactive, ref, type Ref } from 'vue'
import { message } from 'ant-design-vue'

interface PageResult<T> {
  records?: T[]
  totalRow?: number
}

type AdminTableResponse<T> = Promise<{
  data: {
    code?: number
    data?: PageResult<T>
    message?: string
  }
}>

/**
 * 管理员分页表格的通用状态与查询逻辑（搜索、分页、表格变化），供各类管理员列表页复用
 */
export function useAdminTable<T, Q extends { pageNum?: number; pageSize?: number }>(
  fetcher: (params: Q) => AdminTableResponse<T>,
  initialParams: Q,
) {
  const data: Ref<T[]> = ref([])
  const total = ref(0)
  const searchParams = reactive(initialParams) as Q

  const fetchData = async () => {
    const res = await fetcher({ ...searchParams })
    if (res.data.data) {
      data.value = res.data.data.records ?? []
      total.value = res.data.data.totalRow ?? 0
    } else {
      message.error('获取数据失败，' + res.data.message)
    }
  }

  const pagination = computed(() => ({
    current: searchParams.pageNum ?? 1,
    pageSize: searchParams.pageSize ?? 10,
    total: total.value,
    showSizeChanger: true,
    showTotal: (t: number) => `共 ${t} 条`,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doTableChange = (page: any) => {
    searchParams.pageNum = page.current
    searchParams.pageSize = page.pageSize
    fetchData()
  }

  const doSearch = () => {
    searchParams.pageNum = 1
    fetchData()
  }

  return { data, total, searchParams, fetchData, pagination, doTableChange, doSearch }
}
