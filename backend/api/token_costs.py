"""Token cost endpoint — calculates estimated USD costs per model."""

import re
import sqlite3
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter

from backend.collectors.utils import default_hermes_dir

router = APIRouter()

_SONNET = {"input": 3.00, "output": 15.00, "cache_read": 0.30, "cache_write": 3.75, "reasoning": 3.00}
_GPT52 = {"input": 1.75, "output": 14.00, "cache_read": 0.88, "cache_write": 1.75, "reasoning": 1.75}
_O_MINI = {"input": 1.10, "output": 4.40, "cache_read": 0.55, "cache_write": 1.10, "reasoning": 1.10}
_DEEPSEEK_V3 = {"input": 0.27, "output": 1.10, "cache_read": 0.07, "cache_write": 0.27, "reasoning": 0.27}
_GROK_FAST = {"input": 0.30, "output": 0.50, "cache_read": 0.075, "cache_write": 0.30, "reasoning": 0.30}
_GEMINI_FLASH_OLD = {"input": 0.10, "output": 0.40, "cache_read": 0.025, "cache_write": 0.10, "reasoning": 0.10}
_LLAMA = {"input": 0.10, "output": 0.10, "cache_read": 0.025, "cache_write": 0.10, "reasoning": 0.10}
_FREE = {"input": 0.0, "output": 0.0, "cache_read": 0.0, "cache_write": 0.0, "reasoning": 0.0}

MODEL_PRICING: dict[str, dict] = {
    "claude-opus-4-6": {"input": 15.00, "output": 75.00, "cache_read": 1.50, "cache_write": 18.75, "reasoning": 15.00},
    "claude-sonnet-4-6": _SONNET,
    "claude-haiku-3-5": {"input": 0.80, "output": 4.00, "cache_read": 0.08, "cache_write": 1.00, "reasoning": 0.80},
    "claude-4-sonnet": _SONNET,
    "claude-3-7-sonnet": _SONNET,
    "claude-3.7-sonnet": _SONNET,
    "gpt-5.4-pro": {"input": 30.00, "output": 180.00, "cache_read": 15.00, "cache_write": 30.00, "reasoning": 30.00},
    "gpt-5.4": {"input": 2.50, "output": 15.00, "cache_read": 1.25, "cache_write": 2.50, "reasoning": 2.50},
    "gpt-5.2-codex": _GPT52,
    "gpt-5.2": _GPT52,
    "gpt-4o": {"input": 2.50, "output": 10.00, "cache_read": 1.25, "cache_write": 2.50, "reasoning": 2.50},
    "gpt-4o-mini": {"input": 0.15, "output": 0.60, "cache_read": 0.075, "cache_write": 0.15, "reasoning": 0.15},
    "gpt-4.1-mini": {"input": 0.40, "output": 1.60, "cache_read": 0.20, "cache_write": 0.40, "reasoning": 0.40},
    "gpt-4.1": {"input": 2.00, "output": 8.00, "cache_read": 1.00, "cache_write": 2.00, "reasoning": 2.00},
    "o4-mini": _O_MINI,
    "o3-mini": _O_MINI,
    "o1": {"input": 15.00, "output": 60.00, "cache_read": 7.50, "cache_write": 15.00, "reasoning": 15.00},
    "deepseek-v3": _DEEPSEEK_V3,
    "deepseek-chat": _DEEPSEEK_V3,
    "deepseek-r1": {"input": 0.55, "output": 2.19, "cache_read": 0.14, "cache_write": 0.55, "reasoning": 0.55},
    "grok-4": {"input": 2.00, "output": 6.00, "cache_read": 0.50, "cache_write": 2.00, "reasoning": 2.00},
    "grok-3": {"input": 3.00, "output": 15.00, "cache_read": 0.75, "cache_write": 3.00, "reasoning": 3.00},
    "grok-code-fast": _GROK_FAST,
    "grok-3-mini-fast": _GROK_FAST,
    "gemini-3.1-pro": {"input": 2.00, "output": 12.00, "cache_read": 0.50, "cache_write": 2.00, "reasoning": 2.00},
    "gemini-3-flash": {"input": 0.50, "output": 3.00, "cache_read": 0.13, "cache_write": 0.50, "reasoning": 0.50},
    "gemini-2.5-pro": {"input": 1.25, "output": 10.00, "cache_read": 0.31, "cache_write": 4.50, "reasoning": 1.25},
    "gemini-2.5-flash": {"input": 0.15, "output": 0.60, "cache_read": 0.04, "cache_write": 0.15, "reasoning": 0.15},
    "gemini-2.0-flash": _GEMINI_FLASH_OLD,
    "gemini-flash": _GEMINI_FLASH_OLD,
    "mimo-v2-pro": {"input": 1.00, "output": 3.00, "cache_read": 0.20, "cache_write": 1.00, "reasoning": 1.00},
    "minimax-m2.5": {"input": 0.12, "output": 0.99, "cache_read": 0.06, "cache_write": 0.12, "reasoning": 0.12},
    "llama-3.3-70b": _LLAMA,
    "llama-4": _LLAMA,
    "qwen3-coder": {"input": 0.15, "output": 0.80, "cache_read": 0.04, "cache_write": 0.15, "reasoning": 0.15},
    "qwen-3.5-plus": {"input": 0.26, "output": 1.56, "cache_read": 0.065, "cache_write": 0.26, "reasoning": 0.26},
    "qwen-3.5-flash": {"input": 0.065, "output": 0.26, "cache_read": 0.016, "cache_write": 0.065, "reasoning": 0.065},
    "mistral-small": {"input": 0.15, "output": 0.60, "cache_read": 0.04, "cache_write": 0.15, "reasoning": 0.15},
    "devstral": {"input": 0.40, "output": 2.00, "cache_read": 0.10, "cache_write": 0.40, "reasoning": 0.40},
    "local": _FREE,
}

DEFAULT_PRICING = _FREE
_SORTED_KEYS = sorted(MODEL_PRICING, key=len, reverse=True)
_SMALL_MODEL_RE = re.compile(r'[-_](?:1\.?[58]b|3b|4b|7b|8b|9b|13b|14b)\b')


def _get_pricing(model: str | None) -> tuple[dict, str]:
    if not model:
        return DEFAULT_PRICING, "unpriced (unknown)"
    if model in MODEL_PRICING:
        return MODEL_PRICING[model], model
    base = model.split("/")[-1] if "/" in model else model
    for key in _SORTED_KEYS:
        if base.startswith(key):
            return MODEL_PRICING[key], key
    lower = model.lower()
    if any(kw in lower for kw in ("local", "localhost", ":free", "gemma", "nemotron")):
        return _FREE, "local (free)"
    if _SMALL_MODEL_RE.search(lower):
        return _FREE, "local (free)"
    return DEFAULT_PRICING, f"unpriced ({model})"


def _calc_cost(tokens: dict, pricing: dict) -> float:
    return sum((tokens.get(k, 0) / 1_000_000) * pricing.get(k, 0) for k in ("input", "output", "cache_read", "cache_write", "reasoning"))


@router.get("/token-costs")
async def get_token_costs():
    hermes_dir = default_hermes_dir()
    db_path = str(Path(hermes_dir) / "state.db")
    if not Path(db_path).exists():
        return {"error": "state.db not found"}

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    today = datetime.now().strftime("%Y-%m-%d")

    cur.execute("""
        SELECT id, source, started_at, model,
               message_count, tool_call_count,
               input_tokens, output_tokens,
               cache_read_tokens, cache_write_tokens,
               reasoning_tokens
        FROM sessions
        ORDER BY started_at ASC
    """)

    by_model: dict[str, dict] = {}
    today_data = {"session_count": 0, "message_count": 0, "input_tokens": 0, "output_tokens": 0, "cache_read_tokens": 0, "cache_write_tokens": 0, "reasoning_tokens": 0, "cost": 0.0}
    all_input = all_output = all_cache_r = all_cache_w = all_reasoning = 0
    all_messages = all_tool_calls = 0
    all_cost = 0.0
    total_sessions = 0
    daily: dict[str, dict] = {}

    for row in cur.fetchall():
        model = row["model"] or "unknown"
        started_ts = row["started_at"]
        started = datetime.fromtimestamp(started_ts) if started_ts else None
        day = started.strftime("%Y-%m-%d") if started else "unknown"
        is_today = day == today
        tokens = {
            "input": row["input_tokens"] or 0,
            "output": row["output_tokens"] or 0,
            "cache_read": row["cache_read_tokens"] or 0,
            "cache_write": row["cache_write_tokens"] or 0,
            "reasoning": row["reasoning_tokens"] or 0,
        }
        pricing, matched = _get_pricing(model)
        cost = _calc_cost(tokens, pricing)

        if model not in by_model:
            by_model[model] = {"model": model, "matched_pricing": matched, "session_count": 0, "message_count": 0, "input_tokens": 0, "output_tokens": 0, "cache_read_tokens": 0, "cache_write_tokens": 0, "reasoning_tokens": 0, "cost": 0.0}
        m = by_model[model]
        m["session_count"] += 1
        m["message_count"] += row["message_count"] or 0
        m["input_tokens"] += tokens["input"]
        m["output_tokens"] += tokens["output"]
        m["cache_read_tokens"] += tokens["cache_read"]
        m["cache_write_tokens"] += tokens["cache_write"]
        m["reasoning_tokens"] += tokens["reasoning"]
        m["cost"] += cost

        if is_today:
            today_data["session_count"] += 1
            today_data["message_count"] += row["message_count"] or 0
            today_data["input_tokens"] += tokens["input"]
            today_data["output_tokens"] += tokens["output"]
            today_data["cache_read_tokens"] += tokens["cache_read"]
            today_data["cache_write_tokens"] += tokens["cache_write"]
            today_data["reasoning_tokens"] += tokens["reasoning"]
            today_data["cost"] += cost

        total_sessions += 1
        all_messages += row["message_count"] or 0
        all_tool_calls += row["tool_call_count"] or 0
        all_input += tokens["input"]
        all_output += tokens["output"]
        all_cache_r += tokens["cache_read"]
        all_cache_w += tokens["cache_write"]
        all_reasoning += tokens["reasoning"]
        all_cost += cost

        if day not in daily:
            daily[day] = {"cost": 0.0, "tokens": 0, "sessions": 0}
        daily[day]["cost"] += cost
        daily[day]["tokens"] += tokens["input"] + tokens["output"]
        daily[day]["sessions"] += 1

    conn.close()
    model_list = sorted(by_model.values(), key=lambda m: -m["cost"])
    for m in model_list:
        m["cost"] = round(m["cost"], 2)
    today_data["cost"] = round(today_data["cost"], 2)
    sorted_days = sorted(daily.keys())

    return {
        "today": {"date": today, **today_data, "total_tokens": today_data["input_tokens"] + today_data["output_tokens"], "estimated_cost_usd": today_data["cost"]},
        "all_time": {"session_count": total_sessions, "message_count": all_messages, "tool_call_count": all_tool_calls, "input_tokens": all_input, "output_tokens": all_output, "cache_read_tokens": all_cache_r, "cache_write_tokens": all_cache_w, "reasoning_tokens": all_reasoning, "total_tokens": all_input + all_output, "estimated_cost_usd": round(all_cost, 2)},
        "by_model": model_list,
        "daily_trend": [{"date": day, "cost": round(daily[day]["cost"], 2), "tokens": daily[day]["tokens"], "sessions": daily[day]["sessions"]} for day in sorted_days],
        "pricing_table": {k: {kk: vv for kk, vv in v.items()} for k, v in MODEL_PRICING.items()},
    }
