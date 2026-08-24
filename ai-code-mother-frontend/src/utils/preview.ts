import { API_BASE_URL } from '@/config/env.ts'
import { CodeGenTypeEnum } from '@/constants/codeGenType.ts'

const STATIC_BASE_URL = `${API_BASE_URL}/static`

/**
 * 获取静态资源预览 URL
 */
export const getStaticPreviewUrl = (codeGenType?: string, appId?: string): string => {
  if (!codeGenType || !appId) {
    return ''
  }
  const baseUrl = `${STATIC_BASE_URL}/${codeGenType}_${appId}/`
  // 如果是 Vue 项目，浏览地址需要添加 dist 后缀（构建产物目录）
  if (codeGenType === CodeGenTypeEnum.VUE_PROJECT) {
    return `${baseUrl}dist/index.html`
  }
  return baseUrl
}
