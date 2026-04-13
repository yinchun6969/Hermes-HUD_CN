"""WebSocket manager for real-time HUD updates."""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Set

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class WebSocketManager:
    def __init__(self):
        self._connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections.add(websocket)
        logger.debug(f"WebSocket connected. Total: {len(self._connections)}")

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._connections.discard(websocket)
        logger.debug(f"WebSocket disconnected. Total: {len(self._connections)}")

    async def broadcast(self, message: dict) -> int:
        if not self._connections:
            return 0
        json_msg = json.dumps(message)
        disconnected: list[WebSocket] = []
        sent_count = 0
        async with self._lock:
            connections = list(self._connections)
        for conn in connections:
            try:
                await conn.send_text(json_msg)
                sent_count += 1
            except Exception:
                disconnected.append(conn)
        if disconnected:
            async with self._lock:
                for conn in disconnected:
                    self._connections.discard(conn)
        return sent_count

    async def broadcast_data_changed(self, data_type: str, path: str | None = None) -> int:
        return await self.broadcast({"type": "data_changed", "data_type": data_type, "path": path})

    async def broadcast_cache_invalidation(self, cache_keys: list[str]) -> int:
        return await self.broadcast({"type": "cache_invalidate", "keys": cache_keys})

    def get_connection_count(self) -> int:
        return len(self._connections)


ws_manager = WebSocketManager()
