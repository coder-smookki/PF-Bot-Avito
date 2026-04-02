import logging

from aiogram import F, Router
from aiogram.filters import CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.types import Message

from bot.keyboards.common import main_menu_customer, main_menu_executor, role_selection
from bot.services.api_client import api_client
from bot.states.registration import RegistrationState

logger = logging.getLogger(__name__)
router = Router()


def _menu_for_role(role: str):
    if role == "customer":
        return main_menu_customer()
    return main_menu_executor()


@router.message(CommandStart())
async def cmd_start(message: Message, state: FSMContext):
    await state.clear()
    telegram_id = message.from_user.id

    result = await api_client.login(telegram_id)
    if result and result.get("token"):
        token = result["token"]
        user = result.get("user", {})
        role = user.get("role", "customer")
        await state.update_data(token=token, role=role, user=user)

        name = user.get("firstName", "")
        role_label = "\U0001f4bc Заказчик" if role == "customer" else "\u2692\ufe0f Исполнитель"

        await message.answer(
            f"\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"
            f"\U0001f44b <b>C возвращением, {name}!</b>\n"
            f"\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n"
            f"\U0001f464 Ваш профиль: {role_label}\n"
            f"\U0001f4b0 Баланс: <i>загрузка...</i>\n\n"
            f"Выберите действие в меню ниже \u2b07\ufe0f",
            reply_markup=_menu_for_role(role),
            parse_mode="HTML",
        )
    else:
        await message.answer(
            f"\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"
            f"\U0001f31f <b>Добро пожаловать в TaskMarket!</b>\n"
            f"\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n"
            f"Платформа для заработка и размещения заданий.\n\n"
            f"\U0001f4bc <b>Заказчик</b> \u2014 создавайте задания\n"
            f"   и находите исполнителей\n\n"
            f"\u2692\ufe0f <b>Исполнитель</b> \u2014 выполняйте задания\n"
            f"   и зарабатывайте\n\n"
            f"\u2b07\ufe0f <b>Выберите вашу роль:</b>",
            reply_markup=role_selection(),
            parse_mode="HTML",
        )
        await state.set_state(RegistrationState.choosing_role)


@router.message(RegistrationState.choosing_role, F.text.contains("Заказчик"))
async def choose_customer(message: Message, state: FSMContext):
    await _register_user(message, state, "customer")


@router.message(RegistrationState.choosing_role, F.text.contains("Исполнитель"))
async def choose_executor(message: Message, state: FSMContext):
    await _register_user(message, state, "executor")


async def _register_user(message: Message, state: FSMContext, role: str):
    user = message.from_user
    result = await api_client.register(
        telegram_id=user.id,
        username=user.username or "",
        first_name=user.first_name or "",
        role=role,
    )
    if not result or not result.get("token"):
        await message.answer(
            "\u274c <b>Ошибка регистрации</b>\n\n"
            "Попробуйте позже или обратитесь в поддержку /support",
            parse_mode="HTML",
        )
        await state.clear()
        return

    token = result["token"]
    user_data = result.get("user", {})
    await state.update_data(token=token, role=role, user=user_data)
    await state.set_state(None)

    role_emoji = "\U0001f4bc" if role == "customer" else "\u2692\ufe0f"
    role_label = "Заказчик" if role == "customer" else "Исполнитель"

    await message.answer(
        f"\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"
        f"\u2705 <b>Регистрация завершена!</b>\n"
        f"\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n"
        f"{role_emoji} Роль: <b>{role_label}</b>\n"
        f"\U0001f464 Имя: {user.first_name or 'Пользователь'}\n\n"
        f"\U0001f389 Теперь вы можете приступить к работе!\n"
        f"Выберите действие в меню ниже \u2b07\ufe0f",
        reply_markup=_menu_for_role(role),
        parse_mode="HTML",
    )
