// 与后端 CodeGenTypeEnum 保持一致
export enum CodeGenTypeEnum {
  HTML = 'html',
  MULTI_FILE = 'multi_file',
  VUE_PROJECT = 'vue_project',
}

export const CODE_GEN_TYPE_OPTIONS = [
  { label: '原生 HTML 模式', value: CodeGenTypeEnum.HTML },
  { label: '原生多文件模式', value: CodeGenTypeEnum.MULTI_FILE },
  { label: 'Vue 工程模式', value: CodeGenTypeEnum.VUE_PROJECT },
]

export function getCodeGenTypeLabel(value?: string): string {
  return CODE_GEN_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value ?? ''
}
