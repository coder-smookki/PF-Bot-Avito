import logging
from typing import Any, Awaitable, Callable, Dict

from aiogram import BaseMiddleware
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message, TelegramObject

from bot.services.api_client import api_client
from bot.states.registration import RegistrationState

logger = logging.getLogger(__name__)

SKIP_COMMANDS = {"/start"}


class AuthMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any],
    ) -> Any:
        # Determine user and message text
        user = None
        text = ""
        if isinstance(event, Message):
            user = event.from_user
            text = event.text or ""
        elif isinstance(event, CallbackQuery):
            user = event.from_user

        if not user:
            return await handler(event, data)

        # Allow /start to pass through always
        if text.strip() in SKIP_COMMANDS:
            return await handler(event, data)

        # Check FSM state - allow registration flow
        state: FSMContext = data.get("state")
        if state:
            current_state = await state.get_state()
            if current_state and current_state.startswith("RegistrationState"):
                return await handler(event, data)

            # Check if token already in state data
            state_data = await state.get_data()
            if state_data.get("token"):
                data["token"] = state_data["token"]
                data["role"] = state_data.get("role", "customer")
                return await handler(event, data)

        # Try to login
        result = await api_client.login(user.id)
        if result and result.get("token"):
            token = result["token"]
            user_data = result.get("user", {})
            role = user_data.get("role", "customer")

            if state:
                await state.update_data(token=token, role=role, user=user_data)

            data["token"] = token
            data["role"] = role
            return await handler(event, data)

        # Not registered - redirect to /start
        if isinstance(event, Message):
            await event.answer(
                "\u2757 Вы не зарегистрированы. Используйте /start для начала."
            )
        elif isinstance(event, CallbackQuery):
            await event.answer(
                "Вы не зарегистрированы. Используйте /start", show_alert=True
            )

        return None
