"""Full HUD state endpoint."""

from fastapi import APIRouter

from backend.collectors.collect import collect_all
from .serialize import to_dict

router = APIRouter()


@router.get("/state")
async def get_state():
    state = collect_all()
    return to_dict(state)
