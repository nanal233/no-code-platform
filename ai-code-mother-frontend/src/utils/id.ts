/**
 * 后端 Long 类型的 id（如雪花算法生成的 id）超出 JS Number.MAX_SAFE_INTEGER 时，
 * Number() 转换会丢失精度，因此 id 在前端必须全程以字符串形式传递。
 * 生成的接口类型仍标注为 number，这里仅做类型层面的转换，不做任何运行时数值转换。
 */
export function asId(id: string | number | undefined): number {
  return id as unknown as number
}
