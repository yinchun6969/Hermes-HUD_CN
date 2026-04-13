"""Snapshot history endpoint for growth delta."""

from fastapi import APIRouter

from backend.collectors.snapshot import load_snapshots

router = APIRouter()


@router.get("/snapshots")
async def get_snapshots():
    snapshots = load_snapshots()
    return {"snapshots": snapshots, "total": len(snapshots)}
