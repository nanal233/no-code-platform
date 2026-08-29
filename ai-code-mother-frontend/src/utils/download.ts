import request from '@/request.ts'

/**
 * 下载应用代码。
 * 后端接口直接返回 zip 二进制流；出错时仍是 HTTP 200，但响应体是 JSON 格式的统一错误结构，
 * 此时抛出错误交由调用方提示用户。
 */
export async function downloadAppCode(appId: string) {
  const res = await request<Blob>(`/app/download/${appId}`, {
    method: 'GET',
    responseType: 'blob',
  })
  const blob = res.data
  if (blob.type.includes('json')) {
    const text = await blob.text()
    const errorRes = JSON.parse(text)
    throw new Error(errorRes.message ?? '下载失败')
  }

  const disposition = res.headers?.['content-disposition'] as string | undefined
  const filenameMatch = disposition?.match(/filename="?([^"]+)"?/)
  const filename = filenameMatch?.[1] ?? `${appId}.zip`

  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
