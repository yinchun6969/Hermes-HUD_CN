"""API routes for Agent Chat feature."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..chat import ChatNotAvailableError, chat_engine
from ..collectors.sessions import collect_sessions

router = APIRouter(prefix="/chat", tags=["chat"])


class CreateSessionRequest(BaseModel):
    profile: str | None = None
    model: str | None = None


class SendMessageRequest(BaseModel):
    content: str


class SessionResponse(BaseModel):
    id: str
    profile: str | None
    model: str | None
    title: str
    backend_type: str
    is_active: bool
    message_count: int


class ComposerStateResponse(BaseModel):
    model: str
    is_streaming: bool
    context_tokens: int


@router.post("/sessions", response_model=SessionResponse)
async def create_session(request: CreateSessionRequest) -> SessionResponse:
    try:
        session = chat_engine.create_session(profile=request.profile, model=request.model)
        return SessionResponse(
            id=session.id,
            profile=session.profile,
            model=session.model,
            title=session.title,
            backend_type=session.backend_type,
            is_active=session.is_active,
            message_count=session.message_count,
        )
    except ChatNotAvailableError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/sessions", response_model=list[SessionResponse])
async def list_sessions() -> list[SessionResponse]:
    sessions = chat_engine.list_sessions()
    return [
        SessionResponse(
            id=s.id,
            profile=s.profile,
            model=s.model,
            title=s.title,
            backend_type=s.backend_type,
            is_active=s.is_active,
            message_count=s.message_count,
        )
        for s in sessions
    ]


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str) -> SessionResponse:
    session = chat_engine.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionResponse(
        id=session.id,
        profile=session.profile,
        model=session.model,
        title=session.title,
        backend_type=session.backend_type,
        is_active=session.is_active,
        message_count=session.message_count,
    )


@router.delete("/sessions/{session_id}")
async def end_session(session_id: str) -> dict[str, str]:
    if chat_engine.end_session(session_id):
        return {"status": "ended", "session_id": session_id}
    raise HTTPException(status_code=404, detail="Session not found")


@router.post("/sessions/{session_id}/send")
async def send_message(session_id: str, request: SendMessageRequest) -> dict[str, str]:
    session = chat_engine.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if not session.is_active:
        raise HTTPException(status_code=409, detail="Session is inactive")
    try:
        chat_engine.send_message(session_id, request.content)
        return {"status": "accepted", "session_id": session_id}
    except ChatNotAvailableError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}/stream")
async def stream_response(session_id: str) -> StreamingResponse:
    session = chat_engine.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if not session.is_active:
        raise HTTPException(status_code=409, detail="Session is inactive")
    try:
        streamer = chat_engine._streamers.get(session_id)
        if not streamer:
            raise HTTPException(status_code=400, detail="No active message stream. Send message first.")

        def event_generator():
            for event in streamer.iter_events():
                yield streamer.to_sse(event)

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )
    except ChatNotAvailableError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/sessions/{session_id}/cancel")
async def cancel_stream(session_id: str) -> dict[str, str]:
    session = chat_engine.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    chat_engine.cancel_stream(session_id)
    return {"status": "cancelled", "session_id": session_id}


@router.get("/sessions/{session_id}/history")
async def get_history(session_id: str, limit: int = 50) -> list[dict[str, Any]]:
    sessions_state = collect_sessions()
    for session in sessions_state.recent_sessions:
        if session.session_id == session_id:
            return []
    return []


@router.get("/sessions/{session_id}/composer", response_model=ComposerStateResponse)
async def get_composer_state(session_id: str) -> ComposerStateResponse:
    try:
        state = chat_engine.get_composer_state(session_id)
        return ComposerStateResponse(
            model=state.model,
            is_streaming=state.is_streaming,
            context_tokens=state.context_tokens,
        )
    except Exception:
        return ComposerStateResponse(model="unknown", is_streaming=False, context_tokens=0)


@router.get("/available")
async def check_availability() -> dict[str, Any]:
    from ..chat import TmuxChatFallback

    cli_available = chat_engine.is_available()
    direct_import = False
    try:
        from run_agent import AIAgent
        direct_import = True
    except ImportError:
        pass

    tmux_available = TmuxChatFallback.is_available()
    tmux_pane = TmuxChatFallback.find_hermes_pane() if tmux_available else None

    return {
        "available": cli_available or direct_import or (tmux_available and tmux_pane is not None),
        "cli_available": cli_available,
        "direct_import": direct_import,
        "tmux_available": tmux_available,
        "tmux_pane_found": tmux_pane is not None,
        "tmux_pane_id": tmux_pane,
    }
