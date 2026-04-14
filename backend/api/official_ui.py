"""API routes for integrating the official Hermes dashboard."""

from __future__ import annotations

import os
import re
import subprocess
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/official-ui", tags=["official-ui"])

DEFAULT_URL = os.environ.get("HERMES_OFFICIAL_UI_URL", "http://127.0.0.1:9119")
LAUNCH_AGENT_PATH = Path.home() / "Library" / "LaunchAgents" / "ai.hermes.dashboard.plist"
SERVICE_LABEL = "ai.hermes.dashboard"
PID_RE = re.compile(r"\bpid = (\d+)")


def _service_target() -> str:
    return f"gui/{os.getuid()}/{SERVICE_LABEL}"


def _service_loaded() -> tuple[bool, int | None]:
    try:
        result = subprocess.run(
            ["launchctl", "print", _service_target()],
            capture_output=True,
            text=True,
            timeout=3,
        )
    except Exception:
        return False, None

    if result.returncode != 0:
        return False, None

    match = PID_RE.search(result.stdout)
    return True, int(match.group(1)) if match else None


def _url_available(url: str) -> bool:
    try:
        with urllib.request.urlopen(url, timeout=2) as response:
            return 200 <= getattr(response, "status", 200) < 400
    except urllib.error.URLError:
        return False
    except Exception:
        return False


def _status_payload() -> dict[str, Any]:
    loaded, pid = _service_loaded()
    return {
        "available": _url_available(DEFAULT_URL),
        "url": DEFAULT_URL,
        "service_label": SERVICE_LABEL,
        "launch_agent_path": str(LAUNCH_AGENT_PATH),
        "launch_agent_exists": LAUNCH_AGENT_PATH.exists(),
        "service_loaded": loaded,
        "pid": pid,
    }


@router.get("/status")
async def official_ui_status() -> dict[str, Any]:
    """Return the official dashboard status and URL."""
    return _status_payload()


@router.post("/restart")
async def official_ui_restart() -> dict[str, Any]:
    """Restart or bootstrap the official dashboard service."""
    if not LAUNCH_AGENT_PATH.exists():
        raise HTTPException(status_code=404, detail="Official dashboard service is not installed")

    loaded, _ = _service_loaded()
    try:
        if loaded:
            result = subprocess.run(
                ["launchctl", "kickstart", "-k", _service_target()],
                capture_output=True,
                text=True,
                timeout=10,
            )
        else:
            result = subprocess.run(
                ["launchctl", "bootstrap", f"gui/{os.getuid()}", str(LAUNCH_AGENT_PATH)],
                capture_output=True,
                text=True,
                timeout=10,
            )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if result.returncode != 0:
        raise HTTPException(status_code=500, detail=result.stderr.strip() or result.stdout.strip())

    return _status_payload()
