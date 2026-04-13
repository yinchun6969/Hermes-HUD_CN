import { useApi } from '../hooks/useApi'
import Panel from './Panel'

function HourlyHeatmap({ data }: { data: any[] }) {
  if (!data?.length) return null
  const maxSessions = Math.max(...data.map(h => h.sessions), 1)

  return (
    <div className="flex gap-[2px] items-end h-[40px]">
      {data.map((h: any) => {
        const intensity = h.sessions / maxSessions
        return (
          <div
            key={h.hour}
            className="flex-1 min-w-[8px]"
            style={{
              height: `${Math.max(intensity * 100, 4)}%`,
              background: `var(--hud-primary)`,
              opacity: Math.max(intensity, 0.1),
            }}
            title={`${String(h.hour).padStart(2, '0')}:00 — ${h.sessions} 个会话，${h.messages} 条消息`}
          />
        )
      })}
    </div>
  )
}

export default function PatternsPanel() {
  const { data, isLoading } = useApi('/patterns', 60000)

  // Only show loading on initial load
  if (isLoading && !data) {
    return <Panel title="模式" className="col-span-full"><div className="glow text-[13px] animate-pulse">加载中...</div></Panel>
  }

  return (
    <>
      <Panel title="任务聚类" className="col-span-1">
        <div className="space-y-1.5 text-[13px]">
          {(data.clusters || []).map((c: any) => (
            <div key={c.label} className="py-1 px-2" style={{ borderLeft: '2px solid var(--hud-border)' }}>
              <div className="flex justify-between">
                <span style={{ color: 'var(--hud-primary)' }}>{c.label}</span>
                <span>{c.count} 个会话</span>
              </div>
              <div style={{ color: 'var(--hud-text-dim)' }}>
                平均 {c.avg_messages?.toFixed(0)} 条消息 · {c.avg_tool_calls?.toFixed(0)} 次工具调用
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="小时活跃度" className="col-span-1">
        <HourlyHeatmap data={data.hourly_activity || []} />
        <div className="flex justify-between text-[13px] mt-1" style={{ color: 'var(--hud-text-dim)' }}>
          <span>00</span><span>06</span><span>12</span><span>18</span><span>23</span>
        </div>
        {data.peak_hour !== null && (
          <div className="mt-2 text-[13px]">
            峰值：<span style={{ color: 'var(--hud-primary)' }}>{String(data.peak_hour).padStart(2, '0')}:00</span>
          </div>
        )}
      </Panel>

      <Panel title="重复提示" className="col-span-1">
        <div className="space-y-1 text-[13px]">
          {(data.repeated_prompts || []).map((r: any, i: number) => (
            <div key={i} className="flex gap-2 py-0.5">
              <span className="tabular-nums" style={{ color: 'var(--hud-primary)' }}>{r.count}×</span>
              <span className="truncate">{r.pattern}</span>
              {r.could_be_skill && <span style={{ color: 'var(--hud-accent)' }}>⚡</span>}
            </div>
          ))}
        </div>
      </Panel>
    </>
  )
}
