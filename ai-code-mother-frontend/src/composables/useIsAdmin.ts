import { computed } from 'vue'
import { useLoginUserStore } from '@/stores/loginUser.ts'

export function useIsAdmin() {
  const loginUserStore = useLoginUserStore()
  return computed(() => loginUserStore.loginUser.userRole === 'admin')
}
