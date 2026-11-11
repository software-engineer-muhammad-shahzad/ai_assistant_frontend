"""Shortcut so `uvicorn main:app --reload` works from D:\\ai_assitant.

The real app lives in backend/main.py (same as `uvicorn backend.main:app`).
"""
from backend.main import app  # noqa: F401
