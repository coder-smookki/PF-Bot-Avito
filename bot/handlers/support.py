import logging

from aiogram import Bot, F, Router
from aiogram.fsm.context import FSMContext
from aiogram.types import Message

from bot.config import config
from bot.keyboards.common import back_button, main_menu_customer, main_menu_executor
from bot.states.support import SupportState

logger = logging.getLogger(__name__)
router = Router()


def _get_menu(role: str):
    return main_menu_customer() if role == "customer" else main_menu_executor()


@router.message(F.text.contains("Поддержка"))
async def start_support(message: Message, state: FSMContext):
    await state.set_state(SupportState.writing_message)
    await message.answer(
        "\U0001f6e0 <b>Поддержка</b>\n\n"
        "Опишите вашу проблему или вопрос, и мы ответим вам в ближайшее время:",
        reply_markup=back_button(),
        parse_mode="HTML",
    )


@router.message(SupportState.writing_message, F.text == "\u2b05 Назад")
async def cancel_support(message: Message, state: FSMContext):
    data = await state.get_data()
    await state.set_state(None)
    await message.answer(
        "Вы вернулись в главное меню.",
        reply_markup=_get_menu(data.get("role", "customer")),
    )


@router.message(SupportState.writing_message)
async def send_support_message(message: Message, state: FSMContext, bot: Bot):
    data = await state.get_data()
    user = message.from_user
    user_info = (
        f"ID: {user.id}\n"
        f"Username: @{user.username or 'нет'}\n"
        f"Имя: {user.first_name or 'нет'}"
    )

    support_text = (
        f"\U0001f6e0 <b>Обращение в поддержку</b>\n\n"
        f"\U0001f464 {user_info}\n\n"
        f"\U0001f4ac Сообщение:\n{message.text}"
    )

    sent = False
    for admin_id in config.admin_ids:
        try:
            await bot.send_message(admin_id, support_text, parse_mode="HTML")
            sent = True
        except Exception as e:
            logger.error("Failed to send support message to admin %s: %s", admin_id, e)

    await state.set_state(None)
    if sent:
        await message.answer(
            "\u2705 Ваше сообщение отправлено в поддержку! Мы ответим вам в ближайшее время.",
            reply_markup=_get_menu(data.get("role", "customer")),
        )
    else:
        await message.answer(
            "\u274c Не удалось отправить сообщение. Попробуйте позже.",
            reply_markup=_get_menu(data.get("role", "customer")),
        )
