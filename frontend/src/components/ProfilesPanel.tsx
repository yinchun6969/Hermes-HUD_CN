import { useApi } from '../hooks/useApi'
import Panel, { CapacityBar } from './Panel'
import { timeAgo, formatTokens } from '../lib/utils'

function StatusDot({ status }: { status: string }) {
  const color = status === 'active' || status === 'running'
    ? 'var(--hud-success)'
    : status === 'inactive' || status === 'stopped'
    ? 'var(--hud-error)'
    : status === 'n/a'
    ? 'var(--hud-text-dim)'
    : 'var(--hud-warning)'

  return <span style={{ color }}>●</span>
}

function translateStatus(status: string) {
  switch (status) {
    case 'active':
      return '在线'
    case 'running':
      return '运行中'
    case 'inactive':
      return '离线'
    case 'stopped':
      return '已停止'
    case 'n/a':
      return '不可用'
    default:
      return status
  }
}

function ProfileCard({ p }: { p: any }) {
  return (
    <div className="p-4" style={{ background: 'var(--hud-bg-panel)', border: '1px solid var(--hud-border)' }}>
      {/* Header: name + badge + status */}
      <div className="flex items-center gap-2 mb-3">
        <StatusDot status={p.gateway_status} />
        <span className="font-bold text-[14px]" style={{ color: 'var(--hud-primary)' }}>
          {p.name}
        </span>
        {p.is_default && <span className="text-[13px]" style={{ color: 'var(--hud-text-dim)' }}>（默认）</span>}
        <span className="text-[13px] px-1.5 py-0.5 ml-auto"
          style={{ background: 'var(--hud-bg-hover)', color: p.is_local ? 'var(--hud-secondary)' : 'var(--hud-accent)' }}>
          {p.is_local ? '本地' : p.provider}
        </span>
        {p.gateway_status === 'active' && (
          <span className="text-[13px]" style={{ color: 'var(--hud-success)' }}>网关在线</span>
        )}
        {p.server_status === 'running' && (
          <span className="text-[13px]" style={{ color: 'var(--hud-success)' }}>服务在线</span>
        )}
      </div>

      {/* Model & Backend */}
      <div className="space-y-1 text-[13px] mb-3">
        <div className="grid grid-cols-[80px_1fr] gap-1">
          <span style={{ color: 'var(--hud-text-dim)' }}>模型</span>
          <span>
            <span className="font-bold">{p.model || '未设置'}</span>
            {p.provider && <span style={{ color: 'var(--hud-text-dim)' }}> 来自 {p.provider}</span>}
          </span>
        </div>

        {p.base_url && (
          <div className="grid grid-cols-[80px_1fr] gap-1">
            <span style={{ color: 'var(--hud-text-dim)' }}>后端</span>
            <span>
              <span style={{ color: 'var(--hud-text-dim)' }}>{p.base_url}</span>
              {' '}<StatusDot status={p.server_status} />
            </span>
          </div>
        )}

        {p.context_length > 0 && (
          <div className="grid grid-cols-[80px_1fr] gap-1">
            <span style={{ color: 'var(--hud-text-dim)' }}>上下文</span>
            <span style={{ color: 'var(--hud-text-dim)' }}>{p.context_length.toLocaleString()} Token</span>
          </div>
        )}

        {p.skin && (
          <div className="grid grid-cols-[80px_1fr] gap-1">
            <span style={{ color: 'var(--hud-text-dim)' }}>皮肤</span>
            <span style={{ color: 'var(--hud-text-dim)' }}>{p.skin}</span>
          </div>
        )}

        {p.soul_summary && (
          <div className="grid grid-cols-[80px_1fr] gap-1">
            <span style={{ color: 'var(--hud-text-dim)' }}>灵魂</span>
            <span className="italic" style={{ color: 'var(--hud-text)' }}>{p.soul_summary.slice(0, 80)}{p.soul_summary.length > 80 ? '...' : ''}</span>
          </div>
        )}
      </div>

      {/* Usage stats */}
      <div className="text-[13px] mb-3 py-2" style={{ borderTop: '1px solid var(--hud-border)', borderBottom: '1px solid var(--hud-border)' }}>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div>
            <span style={{ color: 'var(--hud-primary)' }} className="font-bold">{p.session_count}</span>
            <span style={{ color: 'var(--hud-text-dim)' }}> 个会话</span>
          </div>
          <div>
            <span style={{ color: 'var(--hud-primary)' }} className="font-bold">{p.message_count.toLocaleString()}</span>
            <span style={{ color: 'var(--hud-text-dim)' }}> 条消息</span>
          </div>
          <div>
            <span style={{ color: 'var(--hud-primary)' }} className="font-bold">{p.tool_call_count.toLocaleString()}</span>
            <span style={{ color: 'var(--hud-text-dim)' }}> 次工具</span>
          </div>
        </div>
        <div className="grid grid-cols-[80px_1fr] gap-1">
          <span style={{ color: 'var(--hud-text-dim)' }}>Token</span>
          <span style={{ color: 'var(--hud-text-dim)' }}>
            {formatTokens(p.total_tokens)} 总计（输入 {formatTokens(p.total_input_tokens)} / 输出 {formatTokens(p.total_output_tokens)}）
          </span>
        </div>
        <div className="grid grid-cols-[80px_1fr] gap-1">
          <span style={{ color: 'var(--hud-text-dim)' }}>最近活跃</span>
          <span style={{ color: 'var(--hud-text-dim)' }}>{timeAgo(p.last_active)}</span>
        </div>
      </div>

      {/* Memory */}
      <div className="mb-3">
        <CapacityBar value={p.memory_chars || 0} max={p.memory_max_chars || 2200} label="记忆" />
        <div className="text-[13px] mb-1" style={{ color: 'var(--hud-text-dim)' }}>
          {p.memory_entries} 条，{p.memory_chars}/{p.memory_max_chars} 字符
        </div>
        <CapacityBar value={p.user_chars || 0} max={p.user_max_chars || 1375} label="用户" />
        <div className="text-[13px]" style={{ color: 'var(--hud-text-dim)' }}>
          {p.user_entries} 条，{p.user_chars}/{p.user_max_chars} 字符
        </div>
      </div>

      {/* Skills, Cron, Toolsets */}
      <div className="space-y-1 text-[13px]">
        <div className="grid grid-cols-[80px_1fr] gap-1">
          <span style={{ color: 'var(--hud-text-dim)' }}>技能</span>
          <span>
            <span className="font-bold">{p.skill_count}</span>
            <span style={{ color: 'var(--hud-text-dim)' }}> · 定时任务 </span>
            <span className="font-bold">{p.cron_job_count}</span>
          </span>
        </div>

        {p.toolsets?.length > 0 && (
          <div className="grid grid-cols-[80px_1fr] gap-1">
            <span style={{ color: 'var(--hud-text-dim)' }}>工具集</span>
            <span style={{ color: 'var(--hud-text-dim)' }}>{p.toolsets.join(', ')}</span>
          </div>
        )}

        {p.compression_enabled && (
          <div className="grid grid-cols-[80px_1fr] gap-1">
            <span style={{ color: 'var(--hud-text-dim)' }}>压缩</span>
            <span>
              <span style={{ color: 'var(--hud-success)' }}>已启用</span>
              {p.compression_model && <span style={{ color: 'var(--hud-text-dim)' }}> · {p.compression_model}</span>}
            </span>
          </div>
        )}

        {/* Services */}
        <div className="grid grid-cols-[80px_1fr] gap-1">
          <span style={{ color: 'var(--hud-text-dim)' }}>网关</span>
          <span><StatusDot status={p.gateway_status} /> {translateStatus(p.gateway_status)}
            <span className="ml-3">服务 <StatusDot status={p.server_status} /> {translateStatus(p.server_status)}</span>
          </span>
        </div>

        {/* API Keys */}
        {p.api_keys?.length > 0 && (
          <div className="grid grid-cols-[80px_1fr] gap-1">
            <span style={{ color: 'var(--hud-text-dim)' }}>密钥</span>
            <span style={{ color: 'var(--hud-text-dim)' }}>{p.api_keys.join(', ')}</span>
          </div>
        )}

        {/* Alias */}
        {p.has_alias && (
          <div className="grid grid-cols-[80px_1fr] gap-1">
            <span style={{ color: 'var(--hud-text-dim)' }}>别名</span>
            <span>
              <span style={{ color: 'var(--hud-success)' }}>{p.name}</span>
              <span style={{ color: 'var(--hud-text-dim)' }}>（已在 PATH）</span>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProfilesPanel() {
  const { data, isLoading } = useApi('/profiles', 30000)

  // Only show loading on initial load
  if (isLoading && !data) {
    return <Panel title="画像" className="col-span-full"><div className="glow text-[13px] animate-pulse">加载中...</div></Panel>
  }

  const profiles = data.profiles || []

  return (
    <Panel title={`代理画像 — 共 ${data.total || 0} 个，启用 ${data.active_count || 0} 个`} className="col-span-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {profiles.map((p: any) => (
          <ProfileCard key={p.name} p={p} />
        ))}
      </div>
    </Panel>
  )
}
