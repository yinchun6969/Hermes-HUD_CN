import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import Panel, { CapacityBar } from './Panel'

async function memoryApi(method: string, body: Record<string, string>) {
  const res = await fetch('/api/memory', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || '请求失败')
  }
  return res.json()
}

function MemoryEntry({
  entry,
  target,
  onMutate,
}: {
  entry: any
  target: string
  onMutate: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const startEdit = () => {
    setEditText(entry.text)
    setEditing(true)
    setError('')
  }

  const cancelEdit = () => {
    setEditing(false)
    setError('')
  }

  const saveEdit = async () => {
    const trimmed = editText.trim()
    if (!trimmed || trimmed === entry.text) {
      cancelEdit()
      return
    }
    setBusy(true)
    setError('')
    try {
      await memoryApi('PUT', { target, old_text: entry.text, content: trimmed })
      setEditing(false)
      onMutate()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const deleteEntry = async () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    setBusy(true)
    setError('')
    try {
      await memoryApi('DELETE', { target, old_text: entry.text })
      onMutate()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  return (
    <div
      className="text-[13px] py-1.5 px-2 group"
      style={{ background: 'var(--hud-bg-panel)', borderLeft: '2px solid var(--hud-border)' }}
    >
      <div className="flex justify-between mb-0.5">
        <span className="uppercase tracking-wider text-[13px] font-bold" style={{ color: 'var(--hud-primary)' }}>
          {entry.category}
        </span>
        <span className="flex items-center gap-1.5">
          {!editing && (
            <span className="opacity-0 group-hover:opacity-100 flex gap-1">
              <button
                onClick={startEdit}
                className="text-[11px] cursor-pointer px-1"
                style={{ color: 'var(--hud-primary)' }}
                disabled={busy}
              >
                编辑
              </button>
              <button
                onClick={deleteEntry}
                onMouseLeave={() => setConfirming(false)}
                className="text-[11px] cursor-pointer px-1"
                style={{ color: 'var(--hud-error, #f44)' }}
                disabled={busy}
              >
                {confirming ? '确认？' : '删'}
              </button>
            </span>
          )}
          <span style={{ color: 'var(--hud-text-dim)' }}>{entry.char_count}字</span>
        </span>
      </div>

      {editing ? (
        <div>
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            className="w-full text-[13px] p-1.5 outline-none resize-y"
            style={{
              background: 'var(--hud-bg-deep)',
              border: '1px solid var(--hud-border)',
              color: 'var(--hud-text)',
              minHeight: '60px',
            }}
            autoFocus
          />
          <div className="flex gap-1 mt-1">
            <button
              onClick={saveEdit}
              disabled={busy}
              className="text-[11px] px-2 py-0.5 cursor-pointer"
              style={{ background: 'var(--hud-primary)', color: 'var(--hud-bg-deep)', border: 'none' }}
            >
              {busy ? '保存中...' : '保存'}
            </button>
            <button
              onClick={cancelEdit}
              disabled={busy}
              className="text-[11px] px-2 py-0.5 cursor-pointer"
              style={{ background: 'var(--hud-bg-hover)', color: 'var(--hud-text-dim)', border: '1px solid var(--hud-border)' }}
            >
              取消
            </button>
          </div>
          {error && <div className="text-[11px] mt-1" style={{ color: 'var(--hud-error, #f44)' }}>{error}</div>}
        </div>
      ) : (
        <div style={{ color: 'var(--hud-text)' }}>{entry.text}</div>
      )}
    </div>
  )
}

function AddEntryForm({ target, onMutate }: { target: string; onMutate: () => void }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    const trimmed = text.trim()
    if (!trimmed) return
    setBusy(true)
    setError('')
    try {
      await memoryApi('POST', { target, content: trimmed })
      setText('')
      setOpen(false)
      onMutate()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full text-[11px] py-1 mt-1 cursor-pointer"
        style={{ color: 'var(--hud-text-dim)', border: '1px dashed var(--hud-border)', background: 'transparent' }}
      >
        + 新增条目
      </button>
    )
  }

  return (
    <div className="mt-1">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="输入新的记忆条目..."
        className="w-full text-[13px] p-1.5 outline-none resize-y"
        style={{
          background: 'var(--hud-bg-deep)',
          border: '1px solid var(--hud-border)',
          color: 'var(--hud-text)',
          minHeight: '50px',
        }}
        autoFocus
      />
      <div className="flex gap-1 mt-1">
        <button
          onClick={submit}
          disabled={busy || !text.trim()}
          className="text-[11px] px-2 py-0.5 cursor-pointer disabled:opacity-40"
          style={{ background: 'var(--hud-primary)', color: 'var(--hud-bg-deep)', border: 'none' }}
        >
          {busy ? '添加中...' : '添加'}
        </button>
        <button
          onClick={() => { setOpen(false); setText(''); setError('') }}
          className="text-[11px] px-2 py-0.5 cursor-pointer"
          style={{ background: 'var(--hud-bg-hover)', color: 'var(--hud-text-dim)', border: '1px solid var(--hud-border)' }}
        >
          取消
        </button>
      </div>
      {error && <div className="text-[11px] mt-1" style={{ color: 'var(--hud-error, #f44)' }}>{error}</div>}
    </div>
  )
}

function MemoryEntries({ entries, target, onMutate }: { entries: any[]; target: string; onMutate: () => void }) {
  if (!entries?.length) return <div className="text-[13px]" style={{ color: 'var(--hud-text-dim)' }}>暂无条目</div>

  return (
    <div className="space-y-1.5">
      {entries.map((e: any) => (
        <MemoryEntry key={e.text} entry={e} target={target} onMutate={onMutate} />
      ))}
    </div>
  )
}

export default function MemoryPanel() {
  const { data, isLoading, mutate } = useApi('/memory', 30000)

  if (isLoading && !data) {
    return <Panel title="记忆" className="col-span-full"><div className="glow text-[13px] animate-pulse">加载中...</div></Panel>
  }

  const { memory, user } = data

  return (
    <>
      <Panel title="代理记忆" className="col-span-1">
        <CapacityBar value={memory?.total_chars || 0} max={memory?.max_chars || 2200} label="容量" />
        <div className="text-[13px] my-2" style={{ color: 'var(--hud-text-dim)' }}>
          {memory?.entry_count || 0} 条 · {Object.entries(memory?.count_by_category || {}).map(([k,v]) => `${k}(${v})`).join(' ')}
        </div>
        <MemoryEntries entries={memory?.entries || []} target="memory" onMutate={mutate} />
        <AddEntryForm target="memory" onMutate={mutate} />
      </Panel>

      <Panel title="用户画像" className="col-span-1">
        <CapacityBar value={user?.total_chars || 0} max={user?.max_chars || 1375} label="容量" />
        <div className="text-[13px] my-2" style={{ color: 'var(--hud-text-dim)' }}>
          {user?.entry_count || 0} 条
        </div>
        <MemoryEntries entries={user?.entries || []} target="user" onMutate={mutate} />
        <AddEntryForm target="user" onMutate={mutate} />
      </Panel>
    </>
  )
}
