from pathlib import Path
import sys

# Запуск из папки bot/: python main.py — пакет bot должен быть в PYTHONPATH (родитель каталога).
_repo_root = Path(__file__).resolve().parent.parent
_rs = str(_repo_root)
if _rs not in sys.path:
    sys.path.insert(0, _rs)

import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage

from bot.config import config
from bot.handlers import customer, executor, start, support, wallet
from bot.middlewares.auth import AuthMiddleware
from bot.services.api_client import api_client

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


async def main():
    bot = Bot(
        token=config.bot_token,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    storage = MemoryStorage()
    dp = Dispatcher(storage=storage)

    # Register middleware
    dp.message.middleware(AuthMiddleware())
    dp.callback_query.middleware(AuthMiddleware())

    # Register routers (order matters - start first)
    dp.include_router(start.router)
    dp.include_router(customer.router)
    dp.include_router(executor.router)
    dp.include_router(wallet.router)
    dp.include_router(support.router)

    logger.info("Bot starting...")
    try:
        await dp.start_polling(bot)
    finally:
        await api_client.close()
        await bot.session.close()
        logger.info("Bot stopped.")


if __name__ == "__main__":
    asyncio.run(main())
