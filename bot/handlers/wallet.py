import logging

from aiogram import F, Router
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message

from bot.keyboards.common import back_button, main_menu_customer, main_menu_executor
from bot.keyboards.inline import wallet_kb
from bot.services.api_client import api_client
from bot.states.wallet import WalletState

logger = logging.getLogger(__name__)
router = Router()


def _get_menu(role: str):
    return main_menu_customer() if role == "customer" else main_menu_executor()


@router.message(F.text.contains("Кошелёк"))
async def show_wallet(message: Message, state: FSMContext):
    data = await state.get_data()
    token = data.get("token", "")
    balance = await api_client.get_balance(token)

    if balance:
        amount = balance.get("balance", 0)
        frozen = balance.get("frozen", 0)
        available = amount - frozen

        text = (
            "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"
            "\U0001f4b0 <b>Ваш кошелёк</b>\n"
            "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n"
            f"\U0001f4b5 Баланс:     <b>{amount:.2f} руб.</b>\n"
            f"\U0001f512 Заморожено: <b>{frozen:.2f} руб.</b>\n"
            f"\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"
            f"\u2705 Доступно:   <b>{available:.2f} руб.</b>\n"
            "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"
        )
    else:
        text = (
            "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"
            "\U0001f4b0 <b>Ваш кошелёк</b>\n"
            "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n"
            "\U0001f4b5 Баланс: <b>0.00 руб.</b>\n"
            "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"
        )

    await message.answer(text, reply_markup=wallet_kb(), parse_mode="HTML")


@router.callback_query(F.data == "wallet_deposit")
async def start_deposit(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await state.set_state(WalletState.entering_amount)
    await callback.message.answer(
        "\U0001f4b3 <b>Пополнение баланса</b>\n"
        "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n"
        "Введите сумму пополнения в рублях:\n\n"
        "<i>Минимум: 10 руб.</i>",
        reply_markup=back_button(),
        parse_mode="HTML",
    )


@router.message(WalletState.entering_amount, F.text == "\u2b05 Назад")
async def cancel_deposit(message: Message, state: FSMContext):
    data = await state.get_data()
    await state.set_state(None)
    await message.answer(
        "\u274c Пополнение отменено.",
        reply_markup=_get_menu(data.get("role", "customer")),
    )


@router.message(WalletState.entering_amount)
async def process_deposit(message: Message, state: FSMContext):
    try:
        amount = float(message.text.replace(",", "."))
        if amount <= 0:
            raise ValueError
    except ValueError:
        await message.answer(
            "\u274c <b>Некорректная сумма</b>\n\n"
            "Введите число больше 0 (например: <code>100</code>)",
            parse_mode="HTML",
        )
        return

    data = await state.get_data()
    token = data.get("token", "")
    result = await api_client.create_payment(token, amount)
    await state.set_state(None)

    if result and result.get("paymentUrl"):
        await message.answer(
            "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"
            f"\U0001f4b3 <b>Пополнение на {amount:.0f} руб.</b>\n"
            "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n"
            "\U0001f449 <b>Нажмите на ссылку для оплаты:</b>\n\n"
            f"<a href=\"{result['paymentUrl']}\">\U0001f517 Перейти к оплате</a>\n\n"
            "<i>После оплаты баланс пополнится\nавтоматически.</i>",
            reply_markup=_get_menu(data.get("role", "customer")),
            parse_mode="HTML",
            disable_web_page_preview=True,
        )
    elif result:
        await message.answer(
            f"\u2705 <b>Баланс пополнен!</b>\n\n"
            f"\U0001f4b5 +{amount:.0f} руб.",
            reply_markup=_get_menu(data.get("role", "customer")),
            parse_mode="HTML",
        )
    else:
        await message.answer(
            "\u274c <b>Ошибка пополнения</b>\n\n"
            "Попробуйте позже или обратитесь\n"
            "в поддержку.",
            reply_markup=_get_menu(data.get("role", "customer")),
            parse_mode="HTML",
        )


@router.callback_query(F.data == "wallet_withdraw")
async def start_withdraw(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await state.set_state(WalletState.entering_withdraw_amount)
    await callback.message.answer(
        "\U0001f4e4 <b>Вывод средств</b>\n"
        "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n"
        "Введите сумму вывода в рублях:\n\n"
        "<i>Минимум: 100 руб.\n"
        "Заявка обрабатывается до 24 часов.</i>",
        reply_markup=back_button(),
        parse_mode="HTML",
    )


@router.message(WalletState.entering_withdraw_amount, F.text == "\u2b05 Назад")
async def cancel_withdraw(message: Message, state: FSMContext):
    data = await state.get_data()
    await state.set_state(None)
    await message.answer(
        "\u274c Вывод отменён.",
        reply_markup=_get_menu(data.get("role", "customer")),
    )


@router.message(WalletState.entering_withdraw_amount)
async def process_withdraw(message: Message, state: FSMContext):
    try:
        amount = float(message.text.replace(",", "."))
        if amount <= 0:
            raise ValueError
    except ValueError:
        await message.answer(
            "\u274c <b>Некорректная сумма</b>\n\n"
            "Введите число больше 0",
            parse_mode="HTML",
        )
        return

    data = await state.get_data()
    token = data.get("token", "")
    result = await api_client.withdraw(token, amount)
    await state.set_state(None)

    if result:
        await message.answer(
            "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"
            "\u2705 <b>Заявка на вывод создана!</b>\n"
            "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n"
            f"\U0001f4b5 Сумма: <b>{amount:.0f} руб.</b>\n"
            "\u23f3 Срок обработки: до 24 часов\n\n"
            "<i>Вы получите уведомление, когда\nзаявка будет обработана.</i>",
            reply_markup=_get_menu(data.get("role", "customer")),
            parse_mode="HTML",
        )
    else:
        await message.answer(
            "\u274c <b>Ошибка вывода</b>\n\n"
            "Проверьте доступный баланс\n"
            "и попробуйте снова.",
            reply_markup=_get_menu(data.get("role", "customer")),
            parse_mode="HTML",
        )


@router.callback_query(F.data == "wallet_history")
async def show_history(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    token = data.get("token", "")
    transactions = await api_client.get_transactions(token)
    await callback.answer()

    if not transactions:
        await callback.message.answer(
            "\U0001f4ed <b>История пуста</b>\n\n"
            "Транзакции появятся после первого\n"
            "пополнения или заработка.",
            parse_mode="HTML",
        )
        return

    type_labels = {
        "deposit": ("\U0001f7e2", "Пополнение"),
        "withdraw": ("\U0001f534", "Вывод"),
        "payment": ("\U0001f535", "Оплата"),
        "earning": ("\U0001f7e2", "Заработок"),
        "commission": ("\U0001f7e0", "Комиссия"),
    }

    lines = [
        "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500",
        "\U0001f4c3 <b>Последние транзакции</b>",
        "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500",
        "",
    ]

    for tx in transactions[:15]:
        tx_type = tx.get("type", "unknown")
        amount = tx.get("amount", 0)
        emoji, label = type_labels.get(tx_type, ("\u26ab", tx_type))
        sign = "+" if amount > 0 else ""
        lines.append(f"{emoji} {label}: <b>{sign}{amount:.0f} руб.</b>")

    lines.append("")
    lines.append("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500")

    await callback.message.answer("\n".join(lines), parse_mode="HTML")
