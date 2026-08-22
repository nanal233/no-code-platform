import dayjs from 'dayjs'

export function formatDateTime(time?: string): string {
  if (!time) {
    return ''
  }
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}
