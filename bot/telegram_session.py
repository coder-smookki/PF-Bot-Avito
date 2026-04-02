"""Сессия Telegram для aiogram 3.26+: только параметры AiohttpSession (proxy + timeout float)."""

from __future__ import annotations

import logging
import os
from typing import Optional

from aiogram.client.session.aiohttp import AiohttpSession

logger = logging.getLogger(__name__)


def create_telegram_session(
    *,
    proxy: Optional[str],
    timeout_total: int = 120,
) -> AiohttpSession:
    """
    TELEGRAM_PROXY: http(s)://user:pass@host:port или socks5://... (нужен пакет aiohttp-socks).
    aiogram 3.26 сам поднимает ProxyConnector по URL; нельзя передавать connector/trust_env в AiohttpSession.
    Если TELEGRAM_PROXY пуст — подставляется HTTPS_PROXY / HTTP_PROXY из окружения.
    """
    p = (proxy or "").strip()
    if not p:
        p = (os.getenv("HTTPS_PROXY") or os.getenv("HTTP_PROXY") or "").strip()
    proxy_final = p or None

    t = float(max(30, int(timeout_total)))

    if proxy_final:
        pl = proxy_final.lower()
        if pl.startswith("socks5://") or pl.startswith("socks4://"):
            logger.info("Telegram: SOCKS-прокси (aiohttp-socks)")
        else:
            logger.info("Telegram: HTTP(S)-прокси")
        return AiohttpSession(proxy=proxy_final, timeout=t)

    logger.info(
        "Telegram: прямое подключение к api.telegram.org (или задайте TELEGRAM_PROXY / HTTPS_PROXY)"
    )
    return AiohttpSession(timeout=t)
