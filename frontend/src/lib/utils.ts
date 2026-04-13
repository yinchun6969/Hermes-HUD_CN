/** Shared formatting utilities */

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '从未'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '从未'
  const now = new Date()
  const secs = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (secs < 0) return '刚刚'
  if (secs < 60) return `${secs}秒前`
  if (secs < 3600) return `${Math.floor(secs / 60)}分钟前`
  if (secs < 86400) {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    return m ? `${h}小时${m}分钟前` : `${h}小时前`
  }
  const days = Math.floor(secs / 86400)
  if (days < 30) return `${days}天前`
  return `${Math.floor(days / 30)}个月前`
}

export function formatDur(mins: number | null | undefined): string {
  if (!mins) return ''
  if (mins < 1) return '<1分钟'
  if (mins < 60) return `${Math.floor(mins)}分`
  const h = Math.floor(mins / 60)
  const m = Math.floor(mins % 60)
  return m ? `${h}小时${m}分` : `${h}小时`
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / 1048576).toFixed(1)}MB`
}

export function truncate(str: string, len: number): string {
  if (!str) return ''
  return str.length > len ? str.slice(0, len - 3) + '...' : str
}
