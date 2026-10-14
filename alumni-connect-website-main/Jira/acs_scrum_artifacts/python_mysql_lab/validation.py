"""Pure validation helpers for the ACS student-registration lab."""
from __future__ import annotations
import re

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def normalize_email(email: str) -> str:
    return (email or "").strip().lower()


def validate_registration(full_name: str, email: str, password: str) -> list[str]:
    errors: list[str] = []
    if not (full_name or "").strip():
        errors.append("full_name is required")
    normalized = normalize_email(email)
    if not normalized or not EMAIL_RE.fullmatch(normalized):
        errors.append("valid email is required")
    if not password or len(password) < 8:
        errors.append("password must be at least 8 characters")
    if password and len(password) > 256:
        errors.append("password must be at most 256 characters")
    return errors
