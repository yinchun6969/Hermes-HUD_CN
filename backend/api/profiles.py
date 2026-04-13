"""Profiles endpoint."""

from fastapi import APIRouter

from backend.collectors.profiles import collect_profiles
from .serialize import to_dict

router = APIRouter()


@router.get("/profiles")
async def get_profiles():
    return to_dict(collect_profiles())
