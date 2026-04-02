import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import List

from dotenv import load_dotenv

_repo_root = Path(__file__).resolve().parent.parent
load_dotenv(_repo_root / ".env")
load_dotenv()


def _public_base_from_api(api_url: str) -> str:
    u = api_url.rstrip("/")
    if u.endswith("/api"):
        return u[:-4]
    return u


@dataclass
class Config:
    bot_token: str = field(
        default_factory=lambda: os.getenv("TELEGRAM_BOT_TOKEN")
        or os.getenv("BOT_TOKEN")
        or ""
    )
    api_url: str = field(
        default_factory=lambda: os.getenv("API_URL", "http://server:3000/api")
    )
    # Явный прокси для Telegram API (http://..., socks5://...). Пусто — aiohttp использует trust_env (HTTPS_PROXY и т.д.).
    telegram_proxy: str = field(
        default_factory=lambda: (os.getenv("TELEGRAM_PROXY") or "").strip()
    )
    telegram_request_timeout: int = field(
        default_factory=lambda: int(os.getenv("TELEGRAM_REQUEST_TIMEOUT") or "120")
    )
    admin_ids: List[int] = field(default_factory=list)

    @property
    def public_base_url(self) -> str:
        return os.getenv("SERVER_URL") or _public_base_from_api(self.api_url)

    def __post_init__(self):
        if not self.bot_token:
            raise ValueError("TELEGRAM_BOT_TOKEN (or BOT_TOKEN) is not set")

        raw_admins = os.getenv("ADMIN_IDS", "")
        if raw_admins:
            self.admin_ids = [
                int(aid.strip()) for aid in raw_admins.split(",") if aid.strip()
            ]


config = Config()
