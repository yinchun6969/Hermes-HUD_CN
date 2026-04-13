import { useEffect, useRef, useCallback, useState } from 'react'
import { mutate } from 'swr'

interface WebSocketMessage {
  type: 'data_changed' | 'cache_invalidate' | 'connected' | 'disconnected'
  data_types?: string[]
  keys?: string[]
  paths?: string[]
}

type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface UseWebSocketReturn {
  status: WebSocketStatus
  lastMessage: WebSocketMessage | null
  sendMessage: (data: string) => void
}

const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`

export function useWebSocket(): UseWebSocketReturn {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected')
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptsRef = useRef(0)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    setStatus('connecting')
    
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setStatus('connected')
      reconnectAttemptsRef.current = 0
    }

    ws.onmessage = (event) => {
      try {
        // Handle plain text messages (like "pong") - skip them
        if (!event.data.startsWith('{')) {
          return
        }
        const data: WebSocketMessage = JSON.parse(event.data)
        setLastMessage(data)

        // Handle data change notifications
        if (data.type === 'data_changed' && data.data_types) {
          // Map data types to API paths and trigger SWR revalidation
          const typeToPath: Record<string, string> = {
            sessions: '/sessions',
            skills: '/skills',
            memory: '/state',
            user: '/state',
            patterns: '/patterns',
            profiles: '/profiles',
            cron: '/cron',
            projects: '/projects',
            health: '/health',
            corrections: '/corrections',
            state: '/state',
            timeline: '/timeline',
            snapshots: '/snapshots',
          }

          // Silently revalidate matching SWR keys (keep stale data, update in background)
          data.data_types.forEach((dataType) => {
            const path = typeToPath[dataType]
            if (path) {
              mutate(
                (key) => typeof key === 'string' && key.startsWith(`/api${path}`),
                undefined,
                { 
                  revalidate: true,
                  rollbackOnError: true,
                  populateCache: true,
                }
              )
            }
          })

          // Also revalidate dashboard silently
          mutate(
            (key) => typeof key === 'string' && key.startsWith('/api/dashboard'),
            undefined,
            { 
              revalidate: true,
              rollbackOnError: true,
              populateCache: true,
            }
          )
        }
      } catch (err) {
        console.warn('[WS] Failed to parse message:', err)
      }
    }

    ws.onclose = () => {
      setStatus('disconnected')
      wsRef.current = null

      // Exponential backoff reconnect
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
      reconnectAttemptsRef.current++
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect()
      }, delay)
    }

    ws.onerror = () => {
      setStatus('error')
    }
  }, [])

  const sendMessage = useCallback((data: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data)
    }
  }, [])

  useEffect(() => {
    connect()

    // Heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send('ping')
      }
    }, 30000)

    return () => {
      clearInterval(heartbeat)
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      wsRef.current?.close()
    }
  }, [connect])

  return { status, lastMessage, sendMessage }
}
