"""Сессия aiohttp для Telegram: прокси, trust_env, увеличенный ssl_handshake_timeout (Python 3.14 / «висящий» SSL)."""

from __future__ import annotations

import logging
from typing import Optional

import aiohttp
from aiohttp import ClientTimeout, TCPConnector
from aiogram.client.session.aiohttp import AiohttpSession

logger = logging.getLogger(__name__)


def _tcp_connector(ssl_handshake_timeout: float) -> TCPConnector:
    try:
        return TCPConnector(ssl_handshake_timeout=ssl_handshake_timeout)
    except TypeError:
        return TCPConnector()


def create_telegram_session(
    *,
    proxy: Optional[str],
    timeout_total: int = 120,
) -> AiohttpSession:
    """
    TELEGRAM_PROXY: http://user:pass@host:port, https://..., socks5://host:port (нужен пакет aiohttp-socks).
    Без прокси: учитываются переменные окружения HTTP_PROXY / HTTPS_PROXY (trust_env=True).
    """
    proxy = (proxy or "").strip() or None
    t = max(30, int(timeout_total))
    timeout = ClientTimeout(
        total=t,
        connect=min(60, t),
        sock_connect=min(90, t),
        sock_read=t,
    )
    ssl_hs = float(min(120, t))

    common_kw: dict = {
        "timeout": timeout,
        "trust_env": True,
    }

    if proxy:
        pl = proxy.lower()
        if pl.startswith("socks5://") or pl.startswith("socks4://"):
            try:
                from aiohttp_socks import ProxyConnector
            except ImportError as e:
                raise ImportError(
                    "Для SOCKS-прокси установите: pip install aiohttp-socks"
                ) from e
            # from_url: параметры зависят от версии aiohttp-socks; при необходимости расширьте вручную.
            connector = ProxyConnector.from_url(proxy)
            logger.info("Telegram: используется SOCKS-прокси")
            return AiohttpSession(connector=connector, **common_kw)

        logger.info("Telegram: используется HTTP(S)-прокси из TELEGRAM_PROXY")
        connector = _tcp_connector(ssl_hs)
        return AiohttpSession(connector=connector, proxy=proxy, **common_kw)

    connector = _tcp_connector(ssl_hs)
    logger.info(
        "Telegram: прямое подключение (если api.telegram.org недоступен — задайте TELEGRAM_PROXY или HTTPS_PROXY)"
    )
    return AiohttpSession(connector=connector, **common_kw)
