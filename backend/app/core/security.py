"""
Password hashing utilities.

Uses `pwdlib` with Argon2 (a modern, actively maintained password hashing
library — the successor to `passlib`, which is no longer maintained).
"""
from pwdlib import PasswordHash

# PasswordHash.recommended() defaults to Argon2id with sane parameters.
password_hasher = PasswordHash.recommended()


def hash_password(plain_password: str) -> str:
    """Hash a plaintext password. Never store plaintext passwords."""
    return password_hasher.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Verify a plaintext password against a stored hash."""
    return password_hasher.verify(plain_password, password_hash)
