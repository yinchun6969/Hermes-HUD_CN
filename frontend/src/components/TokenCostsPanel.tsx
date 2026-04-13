import { useApi } from '../hooks/useApi'
import Panel, { Sparkline } from './Panel'
import { formatTokens } from '../lib/utils'

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="text-center p-2" style={{ background: 'var(--hud-bg-panel)' }}>
      <div className="stat-value text-[18px]">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function ModelCard({ m }: { m: any }) {
  const isFree = m.matched_pricing?.includes('local') || m.matched_pricing?.includes('free')
  const pricingColor = isFree ? 'var(--hud-success)' : 'var(--hud-accent)'

  return (
    <div className="p-3" style={{ background: 'var(--hud-bg-panel)', border: '1px solid var(--hud-border)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-[13px]" style={{ color: 'var(--hud-primary)' }}>{m.model}</span>
        <span className="text-[13px] px-1.5 py-0.5" style={{ background: 'var(--hud-bg-hover)', color: pricingColor }}>
          {isFree ? '免费' : `$${m.cost.toFixed(2)}`}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[13px] mb-2">
        <div><span style={{ color: 'var(--hud-primary)' }}>{m.session_count}</span> <span style={{ color: 'var(--hud-text-dim)' }}>会话</span></div>
        <div><span style={{ color: 'var(--hud-primary)' }}>{m.message_count.toLocaleString()}</span> <span style={{ color: 'var(--hud-text-dim)' }}>消息</span></div>
        <div><span style={{ color: 'var(--hud-primary)' }}>{formatTokens(m.input_tokens + m.output_tokens)}</span> <span style={{ color: 'var(--hud-text-dim)' }}>Tok</span></div>
      </div>
      <div className="text-[13px] space-y-0.5" style={{ color: 'var(--hud-text-dim)' }}>
        <div className="flex justify-between">
          <span>输入</span><span>{formatTokens(m.input_tokens)}</span>
        </div>
        <div className="flex justify-between">
          <span>输出</span><span>{formatTokens(m.output_tokens)}</span>
        </div>
        {m.cache_read_tokens > 0 && (
          <div className="flex justify-between">
            <span>缓存读取</span><span>{formatTokens(m.cache_read_tokens)}</span>
          </div>
        )}
      </div>
      {!isFree && (
        <div className="mt-2 pt-2 text-[13px] font-bold flex justify-between" style={{ borderTop: '1px solid var(--hud-border)' }}>
          <span>成本</span>
          <span style={{ color: 'var(--hud-accent)' }}>${m.cost.toFixed(2)}</span>
        </div>
      )}
      {isFree && (
        <div className="mt-2 pt-2 text-[13px]" style={{ borderTop: '1px solid var(--hud-border)', color: 'var(--hud-success)' }}>
          本地模型 — $0.00
        </div>
      )}
      <div className="text-[13px] mt-1" style={{ color: 'var(--hud-text-dim)' }}>
        计价：{m.matched_pricing}
      </div>
    </div>
  )
}

export default function TokenCostsPanel() {
  const { data, isLoading } = useApi('/token-costs', 60000)

  // Only show loading on initial load
  if (isLoading && !data) {
    return <Panel title="Token 成本" className="col-span-full"><div className="glow text-[13px] animate-pulse">正在计算成本...</div></Panel>
  }

  const { today, all_time: allTime, by_model: byModel, daily_trend: dailyTrend } = data
  const costValues = dailyTrend.map((d: any) => d.cost)

  // Compute cost breakdown across all models
  let totalInputCost = 0, totalOutputCost = 0, totalCacheRCost = 0, totalCacheWCost = 0
  for (const m of byModel) {
    const p = data.pricing_table?.[m.model] || data.pricing_table?.[m.matched_pricing?.split(' ')[0]]
    if (p) {
      totalInputCost += (m.input_tokens / 1_000_000) * p.input
      totalOutputCost += (m.output_tokens / 1_000_000) * p.output
      totalCacheRCost += (m.cache_read_tokens / 1_000_000) * p.cache_read
      totalCacheWCost += (m.cache_write_tokens / 1_000_000) * p.cache_write
    }
  }

  return (
    <>
      {/* Today */}
      <Panel title={`今日 — $${today.estimated_cost_usd.toFixed(2)}`}>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <StatCard value={today.session_count} label="会话" />
          <StatCard value={today.message_count} label="消息" />
        </div>
        <div className="text-[13px] space-y-1">
          <div className="flex justify-between"><span style={{ color: 'var(--hud-text-dim)' }}>输入</span><span>{formatTokens(today.input_tokens)}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--hud-text-dim)' }}>输出</span><span>{formatTokens(today.output_tokens)}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--hud-text-dim)' }}>缓存读取</span><span>{formatTokens(today.cache_read_tokens)}</span></div>
          <div className="flex justify-between font-bold pt-1" style={{ borderTop: '1px solid var(--hud-border)' }}>
            <span>总计</span><span>{formatTokens(today.total_tokens)}</span>
          </div>
        </div>
        <div className="mt-3 text-[20px] font-bold text-center" style={{ color: 'var(--hud-accent)' }}>
          ${today.estimated_cost_usd.toFixed(2)}
        </div>
        <div className="text-[13px] text-center" style={{ color: 'var(--hud-text-dim)' }}>今日预估</div>
      </Panel>

      {/* All time */}
      <Panel title={`累计 — $${allTime.estimated_cost_usd.toFixed(2)}`}>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <StatCard value={allTime.session_count} label="会话" />
          <StatCard value={(allTime.message_count || 0).toLocaleString()} label="消息" />
          <StatCard value={formatTokens(allTime.total_tokens)} label="总 Token" />
          <StatCard value={(allTime.tool_call_count || 0).toLocaleString()} label="工具调用" />
        </div>

        {/* Cost by type */}
        <div className="text-[13px] space-y-0.5 mt-2 pt-2" style={{ borderTop: '1px solid var(--hud-border)' }}>
          <div className="flex justify-between"><span style={{ color: 'var(--hud-text-dim)' }}>输入成本</span><span style={{ color: 'var(--hud-primary)' }}>${totalInputCost.toFixed(2)}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--hud-text-dim)' }}>输出成本</span><span style={{ color: 'var(--hud-accent)' }}>${totalOutputCost.toFixed(2)}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--hud-text-dim)' }}>缓存读取</span><span style={{ color: 'var(--hud-success)' }}>${totalCacheRCost.toFixed(2)}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--hud-text-dim)' }}>缓存写入</span><span style={{ color: 'var(--hud-warning)' }}>${totalCacheWCost.toFixed(2)}</span></div>
        </div>

        <div className="mt-3 text-[20px] font-bold text-center" style={{ color: 'var(--hud-accent)' }}>
          ${allTime.estimated_cost_usd.toFixed(2)}
        </div>
        <div className="text-[13px] text-center" style={{ color: 'var(--hud-text-dim)' }}>
          累计预估（{byModel.length} 个模型）
        </div>
      </Panel>

      {/* Per-model breakdown */}
      {byModel.length > 0 && (
        <Panel title={`按模型统计 — ${byModel.length} 个模型`} className="col-span-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {byModel.map((m: any) => (
              <ModelCard key={m.model} m={m} />
            ))}
          </div>
        </Panel>
      )}

      {/* Daily trend */}
      {dailyTrend.length > 0 && (
        <Panel title="每日成本趋势" className="col-span-full">
          <div className="mb-3">
            <div className="text-[13px] uppercase tracking-wider mb-1" style={{ color: 'var(--hud-text-dim)' }}>
              日成本（USD）
            </div>
            <Sparkline values={costValues} width={800} height={50} />
          </div>
          <div className="text-[13px] grid grid-cols-5 gap-1">
            {dailyTrend.slice(-10).map((d: any) => (
              <div key={d.date} className="text-center py-1" style={{ background: 'var(--hud-bg-panel)' }}>
                <div style={{ color: 'var(--hud-text-dim)' }}>{d.date.slice(5)}</div>
                <div style={{ color: 'var(--hud-accent)' }}>${d.cost.toFixed(2)}</div>
                <div className="text-[13px]">{formatTokens(d.tokens)}</div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </>
  )
}
