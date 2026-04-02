"""Сессия Telegram для aiogram 3.26+: только параметры AiohttpSession (proxy + timeout float)."""

from __future__ import annotations

import logging
import os
import ssl
from pathlib import Path
from typing import Optional

import certifi
from aiogram.client.session.aiohttp import AiohttpSession

logger = logging.getLogger(__name__)


def _env_truthy(name: str) -> bool:
    v = (os.getenv(name) or "").strip().lower()
    return v in ("1", "true", "yes", "on")


def _ssl_verify_enabled() -> bool:
    v = (os.getenv("TELEGRAM_SSL_VERIFY") or "true").strip().lower()
    return v not in ("0", "false", "no", "off")


def _apply_telegram_ssl_overrides(session: AiohttpSession) -> None:
    """
    Прокси/MITM с корпоративным CA: либо TELEGRAM_SSL_CA_BUNDLE=путь к .pem,
    либо TELEGRAM_PROXY_SSL_INSECURE=1 (или TELEGRAM_SSL_VERIFY=false) — отключить проверку TLS.
    Патчит _connector_init до первого create_session (внутреннее API aiogram).
    """
    ca_path = (os.getenv("TELEGRAM_SSL_CA_BUNDLE") or "").strip()
    insecure = _env_truthy("TELEGRAM_PROXY_SSL_INSECURE") or not _ssl_verify_enabled()

    if ca_path:
        p = Path(ca_path).expanduser()
        if p.is_file():
            ctx = ssl.create_default_context(cafile=certifi.where())
            ctx.load_verify_locations(cafile=str(p.resolve()))
            session._connector_init["ssl"] = ctx
            session._should_reset_connector = True
            logger.info("TLS: добавлен доверенный CA из TELEGRAM_SSL_CA_BUNDLE")
            return
        logger.warning("TELEGRAM_SSL_CA_BUNDLE не найден или не файл: %s", ca_path)

    if insecure:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        session._connector_init["ssl"] = ctx
        session._should_reset_connector = True
        logger.warning(
            "Проверка TLS отключена (TELEGRAM_PROXY_SSL_INSECURE / TELEGRAM_SSL_VERIFY=off). "
            "Используйте только за доверенным прокси."
        )


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
        session = AiohttpSession(proxy=proxy_final, timeout=t)
        _apply_telegram_ssl_overrides(session)
        return session

    logger.info(
        "Telegram: прямое подключение к api.telegram.org (или задайте TELEGRAM_PROXY / HTTPS_PROXY)"
    )
    session = AiohttpSession(timeout=t)
    _apply_telegram_ssl_overrides(session)
    return session
