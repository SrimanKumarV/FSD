"""Password hashing helpers using the Python standard library only."""
from __future__ import annotations
import hashlib
import hmac
import os

_ALGORITHM = "pbkdf2_sha256"
_ITERATIONS = 310_000


def hash_password(password: str, *, salt: bytes | None = None, iterations: int = _ITERATIONS) -> str:
    salt = salt or os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return f"{_ALGORITHM}${iterations}${salt.hex()}${digest.hex()}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, rounds_text, salt_text, digest_text = encoded.split("$", 3)
        if algorithm != _ALGORITHM:
            return False
        rounds = int(rounds_text)
        if rounds < 1 or rounds > 2_000_000:
            return False
        candidate = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt_text), rounds).hex()
        return hmac.compare_digest(candidate, digest_text)
    except (ValueError, TypeError, AttributeError):
        return False
