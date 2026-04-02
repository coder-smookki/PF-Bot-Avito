from aiogram.types import KeyboardButton, ReplyKeyboardMarkup


def main_menu_customer() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text="\U0001f4dd Создать задание"),
                KeyboardButton(text="\U0001f4cb Мои задания"),
            ],
            [
                KeyboardButton(text="\U0001f4b0 Кошелёк"),
                KeyboardButton(text="\U0001f6e0 Поддержка"),
            ],
        ],
        resize_keyboard=True,
    )


def main_menu_executor() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text="\U0001f50d Доступные задания"),
                KeyboardButton(text="\U0001f4e6 Мои выполнения"),
            ],
            [
                KeyboardButton(text="\U0001f4b0 Кошелёк"),
                KeyboardButton(text="\U0001f6e0 Поддержка"),
            ],
        ],
        resize_keyboard=True,
    )


def role_selection() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text="\U0001f4bc Заказчик"),
                KeyboardButton(text="\u2692 Исполнитель"),
            ],
        ],
        resize_keyboard=True,
        one_time_keyboard=True,
    )


def back_button() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="\u2b05 Назад")]],
        resize_keyboard=True,
    )


def skip_button() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="\u23ed Пропустить")],
            [KeyboardButton(text="\u2b05 Назад")],
        ],
        resize_keyboard=True,
    )
