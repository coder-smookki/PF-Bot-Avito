from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup


def task_actions(task_id: int, is_paused: bool = False) -> InlineKeyboardMarkup:
    pause_btn = (
        InlineKeyboardButton(
            text="\u25b6\ufe0f Возобновить задание",
            callback_data=f"task_resume:{task_id}",
        )
        if is_paused
        else InlineKeyboardButton(
            text="\u23f8\ufe0f Приостановить задание",
            callback_data=f"task_pause:{task_id}",
        )
    )
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="\U0001f4cb Подробности",
                    callback_data=f"task_view:{task_id}",
                ),
                InlineKeyboardButton(
                    text="\U0001f4e8 Отклики",
                    callback_data=f"task_submissions:{task_id}",
                ),
            ],
            [pause_btn],
            [
                InlineKeyboardButton(
                    text="\U0001f5d1\ufe0f Удалить задание",
                    callback_data=f"task_delete:{task_id}",
                )
            ],
        ]
    )


def submission_review(submission_id: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="\u2705 Одобрить выполнение",
                    callback_data=f"sub_approve:{submission_id}",
                ),
            ],
            [
                InlineKeyboardButton(
                    text="\u274c Отклонить выполнение",
                    callback_data=f"sub_reject:{submission_id}",
                ),
            ],
        ]
    )


def task_detail_executor(task_id: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="\U0001f3af Взять задание \u2014 {price} руб.".format(price=""),
                    callback_data=f"exec_task:{task_id}",
                )
            ],
        ]
    )


def verification_type_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="\U0001f4f8 Скриншот \u2014 фото выполнения",
                    callback_data="vtype:screenshot",
                )
            ],
            [
                InlineKeyboardButton(
                    text="\u2753 Контрольный вопрос \u2014 текстовый ответ",
                    callback_data="vtype:question",
                )
            ],
            [
                InlineKeyboardButton(
                    text="\U0001f91d Ручная проверка \u2014 вы сами решаете",
                    callback_data="vtype:manual",
                )
            ],
        ]
    )


def wallet_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="\U0001f4b3 Пополнить баланс",
                    callback_data="wallet_deposit",
                ),
                InlineKeyboardButton(
                    text="\U0001f4e4 Вывести средства",
                    callback_data="wallet_withdraw",
                ),
            ],
            [
                InlineKeyboardButton(
                    text="\U0001f4c3 История транзакций",
                    callback_data="wallet_history",
                )
            ],
        ]
    )


def confirm_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="\u2705 Подтвердить и создать",
                    callback_data="confirm_yes",
                ),
            ],
            [
                InlineKeyboardButton(
                    text="\u274c Отменить создание",
                    callback_data="confirm_no",
                ),
            ],
        ]
    )


def pagination(
    current_page: int, total_pages: int, prefix: str
) -> InlineKeyboardMarkup:
    buttons = []
    if current_page > 1:
        buttons.append(
            InlineKeyboardButton(
                text="\u2b05\ufe0f Назад",
                callback_data=f"{prefix}:page:{current_page - 1}",
            )
        )
    buttons.append(
        InlineKeyboardButton(
            text=f"\u2022 {current_page} / {total_pages} \u2022",
            callback_data="noop",
        )
    )
    if current_page < total_pages:
        buttons.append(
            InlineKeyboardButton(
                text="Вперёд \u27a1\ufe0f",
                callback_data=f"{prefix}:page:{current_page + 1}",
            )
        )
    return InlineKeyboardMarkup(inline_keyboard=[buttons])
