// 后端 API 根地址（不含 /api 之外的路径），用于拼接静态预览地址、SSE 请求地址、axios baseURL 等
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// 应用部署后的访问根地址（Nginx 转发），与 AI 生成代码的静态预览地址不同，对应后端 AppConstant.CODE_DEPLOY_HOST
export const DEPLOYED_APP_BASE_URL = import.meta.env.VITE_DEPLOY_BASE_URL
