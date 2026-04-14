"""Shared utilities for Hermes HUD collectors."""

import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional


def default_hermes_dir(hermes_dir: str | None = None) -> str:
    """Return the hermes directory.

    Priority: explicit arg > HERMES_HOME env var > ~/.hermes
    """
    if hermes_dir:
        return hermes_dir
    return os.environ.get("HERMES_HOME", os.path.expanduser("~/.hermes"))


def default_hermes_repo_dir(hermes_dir: str | None = None) -> Path:
    """Return the installed Hermes source directory."""
    return Path(default_hermes_dir(hermes_dir)).expanduser() / "hermes-agent"


def find_hermes_cli(hermes_dir: str | None = None) -> str | None:
    """Locate the Hermes CLI in common install locations."""
    candidate_values = [
        os.environ.get("HERMES_CLI_PATH"),
        shutil.which("hermes"),
        str(Path.home() / ".local" / "bin" / "hermes"),
        str(default_hermes_repo_dir(hermes_dir) / "venv" / "bin" / "hermes"),
    ]

    seen: set[str] = set()
    for raw_value in candidate_values:
        if not raw_value:
            continue
        candidate = str(Path(raw_value).expanduser())
        if candidate in seen:
            continue
        seen.add(candidate)
        if os.path.isfile(candidate) and os.access(candidate, os.X_OK):
            return candidate

    return None


def default_projects_dir(projects_dir: str | None = None) -> str:
    """Return the projects directory.

    Priority: explicit arg > HERMES_HUD_PROJECTS_DIR env var > ~/projects
    """
    if projects_dir:
        return projects_dir
    return os.environ.get("HERMES_HUD_PROJECTS_DIR", os.path.expanduser("~/projects"))


def safe_get(row, key, default=None):
    """Safely access a column from a sqlite3.Row or tuple.

    Returns default if the column is missing, access fails, or value is None.
    """
    try:
        val = row[key]
        return val if val is not None else default
    except (IndexError, KeyError):
        return default


def parse_timestamp(value) -> Optional[datetime]:
    """Parse a timestamp from various formats (unix int/float, ISO string).

    Returns None if parsing fails.
    """
    if value is None:
        return None
    try:
        if isinstance(value, (int, float)):
            return datetime.fromtimestamp(value)
        if isinstance(value, str):
            try:
                return datetime.fromtimestamp(float(value))
            except ValueError:
                return datetime.fromisoformat(value)
    except (ValueError, TypeError, OSError):
        pass
    return None
