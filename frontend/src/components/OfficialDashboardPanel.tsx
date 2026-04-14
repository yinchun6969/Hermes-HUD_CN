import { useCallback, useEffect, useState } from 'react'
import Panel from './Panel'

interface OfficialUiStatus {
  available: boolean
  url: string
  service_label: string
  launch_agent_path: string
  launch_agent_exists: boolean
  service_loaded: boolean
  pid: number | null
}

export default function OfficialDashboardPanel() {
  const [status, setStatus] = useState<OfficialUiStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [frameKey, setFrameKey] = useState(0)
  const [restarting, setRestarting] = useState(false)

  const loadStatus = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/official-ui/status')
      if (!response.ok) {
        throw new Error('无法读取官方新版状态')
      }
      const data = await response.json()
      setStatus(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '读取官方新版状态失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStatus()
    const timer = setInterval(loadStatus, 15000)
    return () => clearInterval(timer)
  }, [loadStatus])

  const handleRestart = useCallback(async () => {
    try {
      setRestarting(true)
      setError(null)
      const response = await fetch('/api/official-ui/restart', { method: 'POST' })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.detail || '重启官方新版失败')
      }
      const data = await response.json()
      setStatus(data)
      setFrameKey((value) => value + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : '重启官方新版失败')
    } finally {
      setRestarting(false)
    }
  }, [])

  const handleOpen = useCallback(() => {
    if (status?.url) {
      window.open(status.url, '_blank', 'noopener,noreferrer')
    }
  }, [status?.url])

  return (
    <Panel title="官方新版" className="h-full col-span-full" noPadding>
      <div className="flex flex-col h-full min-h-0">
        <div
          className="px-3 py-2 border-b flex items-center justify-between gap-3 text-[12px]"
          style={{ borderColor: 'var(--hud-border)', background: 'var(--hud-bg-surface)' }}
        >
          <div className="min-w-0">
            <div style={{ color: 'var(--hud-text)' }}>
              官方 Hermes Dashboard
              <span className="ml-2" style={{ color: status?.available ? 'var(--hud-success)' : 'var(--hud-warning)' }}>
                {loading ? '检测中' : status?.available ? '在线' : '未连接'}
              </span>
            </div>
            <div className="truncate" style={{ color: 'var(--hud-text-dim)' }}>
              {status?.url || 'http://127.0.0.1:9119'}
              {status?.pid ? ` · PID ${status.pid}` : ''}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setFrameKey((value) => value + 1)
                void loadStatus()
              }}
              className="px-3 py-1.5 text-[12px] cursor-pointer"
              style={{ background: 'var(--hud-bg-hover)', color: 'var(--hud-text)' }}
            >
              刷新
            </button>
            <button
              onClick={handleRestart}
              disabled={restarting}
              className="px-3 py-1.5 text-[12px] cursor-pointer disabled:opacity-50"
              style={{ background: 'var(--hud-bg-hover)', color: 'var(--hud-text)' }}
            >
              {restarting ? '重启中...' : '重启官方版'}
            </button>
            <button
              onClick={handleOpen}
              className="px-3 py-1.5 text-[12px] cursor-pointer"
              style={{ background: 'var(--hud-primary)', color: 'var(--hud-bg-deep)' }}
            >
              新窗口打开
            </button>
          </div>
        </div>

        {error && (
          <div className="px-3 py-2 text-[12px]" style={{ color: 'var(--hud-error)' }}>
            {error}
          </div>
        )}

        {status?.available ? (
          <iframe
            key={frameKey}
            title="Hermes 官方新版 Dashboard"
            src={status.url}
            className="w-full flex-1 min-h-0"
            style={{ border: 'none', background: 'var(--hud-bg-deep)' }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-lg text-center">
              <div className="text-[14px] mb-2" style={{ color: 'var(--hud-warning)' }}>
                官方新版尚未就绪
              </div>
              <div className="text-[13px]" style={{ color: 'var(--hud-text-dim)' }}>
                这里会直接内嵌官方 Hermes Dashboard。当前服务未启动或还在加载中，
                你可以先点上面的“重启官方版”，或者直接在新窗口里打开独立页面。
              </div>
              {status?.launch_agent_exists === false && (
                <div className="mt-3 text-[12px]" style={{ color: 'var(--hud-error)' }}>
                  未检测到官方新版 launchd 服务：{status.launch_agent_path}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Panel>
  )
}
