"""Запуск из корня репозитория: python -m bot"""
from pathlib import Path
import sys

_root = Path(__file__).resolve().parent.parent
_rs = str(_root)
if _rs not in sys.path:
    sys.path.insert(0, _rs)

import asyncio

from bot.main import main

if __name__ == "__main__":
    asyncio.run(main())
