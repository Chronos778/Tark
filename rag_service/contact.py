"""
Contact form endpoint.

The browser posts to /contact. We validate, rate limit, store the message in Supabase using the
server-side secret key (the table has no public policies, so nothing can read or write it from the
browser) and, when SMTP is configured, email the site owner. Without SMTP the message is still
stored and a line is logged.

Environment:
  SUPABASE_URL, SUPABASE_SECRET_KEY            required to store messages
  CONTACT_NOTIFY_TO                            where alerts go (comma-separated)
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM    optional; enables the email alert
"""
import os
import re
import smtplib
import time
from collections import defaultdict, deque
from email.message import EmailMessage
from typing import Deque, Dict, Optional

import requests
from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from pydantic import BaseModel, field_validator

router = APIRouter()

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
RATE_LIMIT = 5          # messages ...
RATE_WINDOW = 60 * 60   # ... per hour, per client
_hits: Dict[str, Deque[float]] = defaultdict(deque)


class ContactRequest(BaseModel):
    name: str
    email: str
    message: str
    consent: bool = False
    website: str = ""  # honeypot: real users never see or fill this

    @field_validator("name")
    @classmethod
    def _name(cls, v: str) -> str:
        v = v.strip()
        if not 1 <= len(v) <= 120:
            raise ValueError("Please enter your name")
        return v

    @field_validator("email")
    @classmethod
    def _email(cls, v: str) -> str:
        v = v.strip()
        if len(v) > 254 or not EMAIL_RE.match(v):
            raise ValueError("Please enter a valid email address")
        return v

    @field_validator("message")
    @classmethod
    def _message(cls, v: str) -> str:
        v = v.strip()
        if not 10 <= len(v) <= 2000:
            raise ValueError("Message must be between 10 and 2000 characters")
        return v


def client_key(request: Request) -> str:
    """Best-effort client id; behind the gateway the real address arrives in X-Forwarded-For."""
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limited(key: str, now: Optional[float] = None) -> bool:
    """Record a hit and report whether this client is over the limit."""
    now = time.time() if now is None else now
    hits = _hits[key]
    while hits and now - hits[0] > RATE_WINDOW:
        hits.popleft()
    if len(hits) >= RATE_LIMIT:
        return True
    hits.append(now)
    return False


def store_message(data: ContactRequest) -> None:
    """Insert into Supabase with the secret key. Raises RuntimeError if it cannot."""
    url = os.getenv("SUPABASE_URL", "").rstrip("/")
    key = os.getenv("SUPABASE_SECRET_KEY", "")
    if not url or not key:
        raise RuntimeError("Supabase is not configured")
    response = requests.post(
        f"{url}/rest/v1/contact_messages",
        headers={"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json={"name": data.name, "email": data.email, "message": data.message, "consent": data.consent},
        timeout=15,
    )
    if response.status_code not in (200, 201, 204):
        raise RuntimeError(f"Supabase insert failed ({response.status_code}): {response.text[:200]}")


def build_email(data: ContactRequest, sender: str, recipients: str) -> EmailMessage:
    msg = EmailMessage()
    msg["Subject"] = f"[Nyaya] New contact message from {data.name}"
    msg["From"] = sender
    msg["To"] = recipients
    msg["Reply-To"] = data.email
    msg.set_content(f"From: {data.name} <{data.email}>\n\n{data.message}\n")
    return msg


def notify_owner(data: ContactRequest) -> None:
    """Email the owner. Never raises: a mail problem must not lose or fail the message."""
    recipients = os.getenv("CONTACT_NOTIFY_TO", "").strip()
    host = os.getenv("SMTP_HOST", "").strip()
    if not recipients or not host:
        print(f"[Contact] New message from {data.name} <{data.email}> (no SMTP configured, not emailed)", flush=True)
        return
    user = os.getenv("SMTP_USER", "")
    password = os.getenv("SMTP_PASSWORD", "")
    sender = os.getenv("SMTP_FROM") or user or recipients.split(",")[0]
    try:
        with smtplib.SMTP(host, int(os.getenv("SMTP_PORT", "587")), timeout=20) as smtp:
            smtp.starttls()
            if user:
                smtp.login(user, password)
            smtp.send_message(build_email(data, sender, recipients))
        print(f"[Contact] Notified {recipients}", flush=True)
    except Exception as exc:  # noqa: BLE001
        print(f"[Contact] Email notification failed: {exc}", flush=True)


@router.post("/contact")
async def submit_contact(payload: ContactRequest, request: Request, background: BackgroundTasks):
    if payload.website:  # honeypot tripped: pretend success, store nothing
        return {"status": "ok"}
    if not payload.consent:
        raise HTTPException(status_code=422, detail="Please tick the consent box so we can store your message")
    if rate_limited(client_key(request)):
        raise HTTPException(status_code=429, detail="Too many messages. Please try again later.")
    try:
        store_message(payload)
    except RuntimeError as exc:
        print(f"[Contact] {exc}", flush=True)
        raise HTTPException(status_code=503, detail="We could not save your message right now. Please try again later.")
    background.add_task(notify_owner, payload)
    return {"status": "ok"}
