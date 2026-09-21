/**
 * 后端 Long 类型的 id（如雪花算法生成的 id）超出 JS Number.MAX_SAFE_INTEGER 时，
 * Number() 转换会丢失精度，因此 id 在前端必须全程以字符串形式传递。
 * 生成的接口类型仍标注为 number，这里仅做类型层面的转换，不做任何运行时数值转换。
 */
export function asId(id: string | number | undefined): number {
  return id as unknown as number
}

/**
 * 生成一个本地临时唯一 id（仅用于前端本地状态，如消息列表的 key，不涉及任何安全场景，也不会传给后端）。
 *
 * crypto.randomUUID() 按规范只在"安全上下文"（HTTPS 或 localhost）下才存在，
 * 当前是纯 HTTP 部署，会导致 "crypto.randomUUID is not a function"。
 * 这里做降级兼容：优先用 randomUUID，其次用同样广泛可用、但不受安全上下文限制的
 * crypto.getRandomValues 手动拼出一个 UUID v4，两者都不可用时再退化为 Math.random 兜底。
 */
export function generateLocalId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    // 按 UUID v4 规范设置版本号（4）与 variant 位
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}
