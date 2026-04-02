import logging

from aiogram import F, Router
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message

from bot.keyboards.common import back_button, main_menu_customer, skip_button
from bot.keyboards.inline import (
    confirm_kb,
    submission_review,
    task_actions,
    verification_type_kb,
)
from bot.services.api_client import api_client
from bot.states.task_creation import TaskCreationState

logger = logging.getLogger(__name__)
router = Router()

STEP_INDICATORS = {
    "title": ("\U0001f4cc", "1/6", "Название"),
    "description": ("\U0001f4c4", "2/6", "Описание"),
    "instructions": ("\U0001f4cb", "3/6", "Инструкция"),
    "photo": ("\U0001f4f7", "4/6", "Фото"),
    "price": ("\U0001f4b5", "5/6", "Цена"),
    "budget": ("\U0001f4b0", "6/6", "Бюджет"),
}


def _step_header(step: str) -> str:
    emoji, num, name = STEP_INDICATORS.get(step, ("", "", ""))
    bar_len = 6
    filled = int(num.split("/")[0]) if "/" in num else 0
    bar = "\u2588" * filled + "\u2591" * (bar_len - filled)
    return (
        f"{emoji} <b>Создание задания \u2014 Шаг {num}</b>\n"
        f"[{bar}] {name}\n"
        f"\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"
    )


# ── Create Task FSM ──────────────────────────────────────────────────

@router.message(F.text.contains("Создать задание"))
async def start_create_task(message: Message, state: FSMContext):
    data = await state.get_data()
    if data.get("role") != "customer":
        return
    await state.set_state(TaskCreationState.title)
    await state.update_data(task_photos=[])
    await message.answer(
        f"{_step_header('title')}\n\n"
        "\U0001f4dd Введите название задания:\n\n"
        "<i>Краткое и понятное название,\n"
        "которое увидят исполнители</i>",
        reply_markup=back_button(),
        parse_mode="HTML",
    )


@router.message(TaskCreationState.title, F.text == "\u2b05 Назад")
async def cancel_creation(message: Message, state: FSMContext):
    await state.set_state(None)
    await message.answer(
        "\u274c Создание задания отменено.",
        reply_markup=main_menu_customer(),
    )


@router.message(TaskCreationState.title)
async def set_title(message: Message, state: FSMContext):
    await state.update_data(task_title=message.text)
    await state.set_state(TaskCreationState.description)
    await message.answer(
        f"{_step_header('description')}\n\n"
        "\U0001f4c4 Введите описание задания:\n\n"
        "<i>Подробно опишите, что нужно сделать</i>",
        reply_markup=back_button(),
        parse_mode="HTML",
    )


@router.message(TaskCreationState.description, F.text == "\u2b05 Назад")
async def back_to_title(message: Message, state: FSMContext):
    await state.set_state(TaskCreationState.title)
    await message.answer(
        f"{_step_header('title')}\n\n"
        "\U0001f4dd Введите название задания:",
        reply_markup=back_button(),
        parse_mode="HTML",
    )


@router.message(TaskCreationState.description)
async def set_description(message: Message, state: FSMContext):
    await state.update_data(task_description=message.text)
    await state.set_state(TaskCreationState.instructions)
    await message.answer(
        f"{_step_header('instructions')}\n\n"
        "\U0001f4cb Введите инструкцию для исполнителя:\n\n"
        "<i>Пошаговая инструкция, что должен\nсделать исполнитель</i>",
        reply_markup=back_button(),
        parse_mode="HTML",
    )


@router.message(TaskCreationState.instructions, F.text == "\u2b05 Назад")
async def back_to_desc(message: Message, state: FSMContext):
    await state.set_state(TaskCreationState.description)
    await message.answer(
        f"{_step_header('description')}\n\n"
        "\U0001f4c4 Введите описание задания:",
        reply_markup=back_button(),
        parse_mode="HTML",
    )


@router.message(TaskCreationState.instructions)
async def set_instructions(message: Message, state: FSMContext):
    await state.update_data(task_instructions=message.text)
    await state.set_state(TaskCreationState.photo)
    await message.answer(
        f"{_step_header('photo')}\n\n"
        "\U0001f4f7 Отправьте фото к заданию\n"
        "или нажмите <b>\"Пропустить\"</b>\n\n"
        "<i>Фото помогает исполнителю лучше\nпонять задание</i>",
        reply_markup=skip_button(),
        parse_mode="HTML",
    )


@router.message(TaskCreationState.photo, F.text == "\u2b05 Назад")
async def back_to_instructions(message: Message, state: FSMContext):
    await state.set_state(TaskCreationState.instructions)
    await message.answer(
        f"{_step_header('instructions')}\n\n"
        "\U0001f4cb Введите инструкцию для исполнителя:",
        reply_markup=back_button(),
        parse_mode="HTML",
    )


@router.message(TaskCreationState.photo, F.text.contains("Пропустить"))
async def skip_photo(message: Message, state: FSMContext):
    await state.set_state(TaskCreationState.price)
    await message.answer(
        f"{_step_header('price')}\n\n"
        "\U0001f4b5 Введите цену за одно выполнение:\n\n"
        "<i>Сумма в рублях, которую получит\nисполнитель за выполнение</i>",
        reply_markup=back_button(),
        parse_mode="HTML",
    )


@router.message(TaskCreationState.photo, F.photo)
async def add_photo(message: Message, state: FSMContext):
    data = await state.get_data()
    token = data.get("token", "")
    photo = message.photo[-1]
    file = await message.bot.get_file(photo.file_id)
    file_bytes = await message.bot.download_file(file.file_path)
    content = file_bytes.read()

    url = await api_client.upload_file(token, content, f"{photo.file_id}.jpg")
    if url:
        photos = data.get("task_photos", [])
        photos.append(url)
        await state.update_data(task_photos=photos)
        await message.answer(
            f"\u2705 Фото добавлено! (<b>{len(photos)}</b> шт.)\n\n"
            "\U0001f4f7 Отправьте ещё фото\n"
            "или нажмите <b>\"Пропустить\"</b>",
            parse_mode="HTML",
        )
    else:
        await message.answer(
            "\u274c Ошибка загрузки фото.\n"
            "Попробуйте отправить ещё раз."
        )


@router.message(TaskCreationState.price, F.text == "\u2b05 Назад")
async def back_to_photo(message: Message, state: FSMContext):
    await state.set_state(TaskCreationState.photo)
    await message.answer(
        f"{_step_header('photo')}\n\n"
        "\U0001f4f7 Отправьте фото или нажмите \"Пропустить\":",
        reply_markup=skip_button(),
        parse_mode="HTML",
    )


@router.message(TaskCreationState.price)
async def set_price(message: Message, state: FSMContext):
    try:
        price = float(message.text.replace(",", "."))
        if price <= 0:
            raise ValueError
    except ValueError:
        await message.answer(
            "\u274c <b>Некорректная сумма</b>\n\n"
            "Введите число больше 0 (например: <code>50</code>)",
            parse_mode="HTML",
        )
        return
    await state.update_data(task_price=price)
    await state.set_state(TaskCreationState.total_budget)
    await message.answer(
        f"{_step_header('budget')}\n\n"
        "\U0001f4b0 Введите общий бюджет задания:\n\n"
        f"<i>При цене {price:.0f} руб. за выполнение\n"
        f"бюджет 500 руб. = ~{int(500 / price)} выполнений</i>",
        reply_markup=back_button(),
        parse_mode="HTML",
    )


@router.message(TaskCreationState.total_budget, F.text == "\u2b05 Назад")
async def back_to_price(message: Message, state: FSMContext):
    await state.set_state(TaskCreationState.price)
    await message.answer(
        f"{_step_header('price')}\n\n"
        "\U0001f4b5 Введите цену за одно выполнение:",
        reply_markup=back_button(),
        parse_mode="HTML",
    )


@router.message(TaskCreationState.total_budget)
async def set_budget(message: Message, state: FSMContext):
    try:
        budget = float(message.text.replace(",", "."))
        if budget <= 0:
            raise ValueError
    except ValueError:
        await message.answer(
            "\u274c <b>Некорректная сумма</b>\n\n"
            "Введите число больше 0",
            parse_mode="HTML",
        )
        return
    await state.update_data(task_budget=budget)
    await state.set_state(TaskCreationState.verification_type)
    await message.answer(
        "\U0001f50d <b>Тип проверки выполнения</b>\n"
        "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n"
        "Как вы хотите проверять выполнение?",
        reply_markup=verification_type_kb(),
        parse_mode="HTML",
    )


@router.callback_query(TaskCreationState.verification_type, F.data.startswith("vtype:"))
async def set_verification(callback: CallbackQuery, state: FSMContext):
    vtype = callback.data.split(":")[1]
    await state.update_data(task_verification=vtype)
    await callback.answer()

    if vtype == "question":
        await state.set_state(TaskCreationState.control_question)
        await callback.message.answer(
            "\u2753 <b>Контрольный вопрос</b>\n"
            "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n"
            "Введите вопрос, на который должен\n"
            "ответить исполнитель:\n\n"
            "<i>Вопрос поможет убедиться, что\nзадание действительно выполнено</i>",
            reply_markup=back_button(),
            parse_mode="HTML",
        )
    else:
        await _show_confirm(callback.message, state)


@router.message(TaskCreationState.control_question, F.text == "\u2b05 Назад")
async def back_to_vtype(message: Message, state: FSMContext):
    await state.set_state(TaskCreationState.verification_type)
    await message.answer(
        "\U0001f50d <b>Тип проверки выполнения</b>\n"
        "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n"
        "Как вы хотите проверять выполнение?",
        reply_markup=verification_type_kb(),
        parse_mode="HTML",
    )


@router.message(TaskCreationState.control_question)
async def set_question(message: Message, state: FSMContext):
    await state.update_data(task_question=message.text)
    await state.set_state(TaskCreationState.control_answer)
    await message.answer(
        "\u2705 <b>Правильный ответ</b>\n"
        "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n"
        "Введите правильный ответ на вопрос:\n\n"
        "<i>Ответ исполнителя будет сравниваться\nс этим значением</i>",
        reply_markup=back_button(),
        parse_mode="HTML",
    )


@router.message(TaskCreationState.control_answer, F.text == "\u2b05 Назад")
async def back_to_question(message: Message, state: FSMContext):
    await state.set_state(TaskCreationState.control_question)
    await message.answer(
        "\u2753 Введите контрольный вопрос:",
        reply_markup=back_button(),
    )


@router.message(TaskCreationState.control_answer)
async def set_answer(message: Message, state: FSMContext):
    await state.update_data(task_answer=message.text)
    await _show_confirm(message, state)


async def _show_confirm(message: Message, state: FSMContext):
    data = await state.get_data()
    await state.set_state(TaskCreationState.confirm)

    vtype_labels = {
        "screenshot": "\U0001f4f8 Скриншот",
        "question": "\u2753 Контрольный вопрос",
        "manual": "\U0001f91d Ручная проверка",
    }
    vtype = data.get("task_verification", "manual")
    price = data.get("task_price", 0)
    budget = data.get("task_budget", 0)
    max_exec = int(budget / price) if price > 0 else 0
    photos_count = len(data.get("task_photos", []))

    text = (
        "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"
        "\U0001f4cb <b>Подтвердите задание</b>\n"
        "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n"
        f"\U0001f4cc <b>Название:</b>\n{data.get('task_title')}\n\n"
        f"\U0001f4c4 <b>Описание:</b>\n{data.get('task_description')}\n\n"
        f"\U0001f4cb <b>Инструкция:</b>\n{data.get('task_instructions')}\n\n"
        f"\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"
        f"\U0001f4f7 Фото: {photos_count} шт.\n"
        f"\U0001f4b5 Цена за выполнение: <b>{price:.0f} руб.</b>\n"
        f"\U0001f4b0 Общий бюджет: <b>{budget:.0f} руб.</b>\n"
        f"\U0001f4ca Макс. выполнений: ~{max_exec}\n"
        f"\U0001f50d Проверка: {vtype_labels.get(vtype, vtype)}\n"
    )
    if vtype == "question":
        text += f"\u2753 Вопрос: {data.get('task_question')}\n"

    text += "\n\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"
    text += "\u2b07\ufe0f <b>Подтвердите или отмените создание</b>"

    await message.answer(text, reply_markup=confirm_kb(), parse_mode="HTML")


@router.callback_query(TaskCreationState.confirm, F.data == "confirm_yes")
async def confirm_task(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    token = data.get("token", "")

    task_data = {
        "title": data.get("task_title"),
        "description": data.get("task_description"),
        "instructions": data.get("task_instructions"),
        "photos": data.get("task_photos", []),
        "pricePerExecution": data.get("task_price"),
        "totalBudget": data.get("task_budget"),
        "verificationType": data.get("task_verification"),
    }
    if data.get("task_verification") == "question":
        task_data["controlQuestion"] = data.get("task_question")
        task_data["controlAnswer"] = data.get("task_answer")

    result = await api_client.create_task(token, task_data)
    await callback.answer()

    if result:
        await state.set_state(None)
        await callback.message.answer(
            "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"
            "\U0001f389 <b>Задание создано!</b>\n"
            "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n"
            "Задание опубликовано и доступно\n"
            "исполнителям.\n\n"
            "\U0001f50e Отслеживайте статус\n"
            "   в разделе \"\U0001f4cb Мои задания\"",
            reply_markup=main_menu_customer(),
            parse_mode="HTML",
        )
    else:
        await callback.message.answer(
            "\u274c <b>Ошибка создания задания</b>\n\n"
            "Проверьте баланс и попробуйте снова.",
            reply_markup=main_menu_customer(),
            parse_mode="HTML",
        )
        await state.set_state(None)


@router.callback_query(TaskCreationState.confirm, F.data == "confirm_no")
async def cancel_confirm(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await state.set_state(None)
    await callback.message.answer(
        "\u274c Создание задания отменено.",
        reply_markup=main_menu_customer(),
    )


# ── My Tasks ─────────────────────────────────────────────────────────

@router.message(F.text.contains("Мои задания"))
async def my_tasks(message: Message, state: FSMContext):
    data = await state.get_data()
    if data.get("role") != "customer":
        return
    token = data.get("token", "")
    tasks = await api_client.get_my_tasks(token)

    if not tasks:
        await message.answer(
            "\U0001f4ed <b>Нет заданий</b>\n\n"
            "Вы пока не создали ни одного задания.\n"
            "Нажмите \"\U0001f4dd Создать задание\" чтобы начать.",
            reply_markup=main_menu_customer(),
            parse_mode="HTML",
        )
        return

    await message.answer(
        f"\U0001f4cb <b>Ваши задания</b> ({len(tasks)})\n"
        "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500",
        parse_mode="HTML",
    )

    for task in tasks[:20]:
        status_map = {
            "active": ("\U0001f7e2", "Активно"),
            "paused": ("\u23f8\ufe0f", "На паузе"),
            "completed": ("\u2705", "Завершено"),
            "cancelled": ("\u274c", "Отменено"),
        }
        emoji, label = status_map.get(task.get("status", ""), ("\U0001f7e1", "Ожидание"))
        price = task.get("pricePerExecution", 0)
        budget = task.get("totalBudget", 0)

        text = (
            f"{emoji} <b>{task.get('title', 'Без названия')}</b>\n\n"
            f"\U0001f4b5 Цена: {price} руб.\n"
            f"\U0001f4b0 Бюджет: {budget} руб.\n"
            f"\U0001f4ca Статус: {label}"
        )
        is_paused = task.get("status") == "paused"
        await message.answer(
            text,
            reply_markup=task_actions(task["id"], is_paused),
            parse_mode="HTML",
        )


# ── Task Actions (callbacks) ─────────────────────────────────────────

@router.callback_query(F.data.startswith("task_view:"))
async def view_task(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    token = data.get("token", "")
    task_id = int(callback.data.split(":")[1])

    task = await api_client.get_task(token, task_id)
    await callback.answer()
    if not task:
        await callback.message.answer("\u274c Задание не найдено.")
        return

    submissions = await api_client.get_task_submissions(token, task_id)
    sub_count = len(submissions) if submissions else 0
    pending_count = len([s for s in (submissions or []) if s.get("status") == "pending"])

    vtype_labels = {
        "screenshot": "\U0001f4f8 Скриншот",
        "question": "\u2753 Контрольный вопрос",
        "manual": "\U0001f91d Ручная",
    }

    text = (
        "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"
        f"\U0001f4cb <b>{task.get('title')}</b>\n"
        "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n"
        f"\U0001f4c4 {task.get('description', '')}\n\n"
        f"\U0001f4b5 Цена: <b>{task.get('pricePerExecution', 0)} руб.</b>\n"
        f"\U0001f4b0 Бюджет: <b>{task.get('totalBudget', 0)} руб.</b>\n"
        f"\U0001f4e8 Откликов: {sub_count}"
    )
    if pending_count > 0:
        text += f" (<b>{pending_count} ждут проверки</b>)"
    text += (
        f"\n\U0001f50d Проверка: {vtype_labels.get(task.get('verificationType', ''), 'Не задана')}"
    )
    await callback.message.answer(text, parse_mode="HTML")


@router.callback_query(F.data.startswith("task_pause:"))
async def pause_task(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    token = data.get("token", "")
    task_id = int(callback.data.split(":")[1])
    result = await api_client.pause_task(token, task_id)
    await callback.answer()
    if result:
        await callback.message.answer(
            "\u23f8\ufe0f <b>Задание приостановлено</b>\n\n"
            "Исполнители не смогут его видеть,\n"
            "пока вы не возобновите.",
            parse_mode="HTML",
        )
    else:
        await callback.message.answer("\u274c Ошибка при приостановке.")


@router.callback_query(F.data.startswith("task_resume:"))
async def resume_task(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    token = data.get("token", "")
    task_id = int(callback.data.split(":")[1])
    result = await api_client.resume_task(token, task_id)
    await callback.answer()
    if result:
        await callback.message.answer(
            "\u25b6\ufe0f <b>Задание возобновлено</b>\n\n"
            "Теперь исполнители снова видят\n"
            "ваше задание.",
            parse_mode="HTML",
        )
    else:
        await callback.message.answer("\u274c Ошибка при возобновлении.")


@router.callback_query(F.data.startswith("task_delete:"))
async def delete_task(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    token = data.get("token", "")
    task_id = int(callback.data.split(":")[1])
    result = await api_client.delete_task(token, task_id)
    await callback.answer()
    if result is not None:
        await callback.message.answer(
            "\U0001f5d1\ufe0f <b>Задание удалено</b>\n\n"
            "Неиспользованные средства возвращены\n"
            "на ваш баланс.",
            parse_mode="HTML",
        )
    else:
        await callback.message.answer("\u274c Ошибка при удалении.")


@router.callback_query(F.data.startswith("task_submissions:"))
async def show_submissions(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    token = data.get("token", "")
    task_id = int(callback.data.split(":")[1])

    submissions = await api_client.get_task_submissions(token, task_id)
    await callback.answer()

    if not submissions:
        await callback.message.answer(
            "\U0001f4ed <b>Откликов пока нет</b>\n\n"
            "Когда исполнители выполнят задание,\n"
            "вы увидите их отклики здесь.",
            parse_mode="HTML",
        )
        return

    pending = [s for s in submissions if s.get("status") == "pending"]
    approved = [s for s in submissions if s.get("status") == "approved"]
    rejected = [s for s in submissions if s.get("status") == "rejected"]

    await callback.message.answer(
        f"\U0001f4e8 <b>Отклики на задание</b>\n"
        f"\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"
        f"\U0001f7e1 Ожидают: {len(pending)} | "
        f"\u2705 Принято: {len(approved)} | "
        f"\u274c Отклонено: {len(rejected)}",
        parse_mode="HTML",
    )

    for sub in submissions[:20]:
        status_emoji = {
            "pending": "\U0001f7e1",
            "approved": "\u2705",
            "rejected": "\u274c",
        }.get(sub.get("status", ""), "\U0001f7e1")

        status_label = {
            "pending": "Ожидает проверки",
            "approved": "Одобрено",
            "rejected": "Отклонено",
        }.get(sub.get("status", ""), "Неизвестно")

        text = (
            f"{status_emoji} <b>Отклик #{sub['id']}</b>\n"
            f"Статус: {status_label}\n"
        )
        proof = sub.get("proofImageUrl") or sub.get("proofUrl")
        if proof:
            text += f"\U0001f4f8 <a href=\"{proof}\">Просмотреть доказательство</a>\n"
        answer = sub.get("answerText") or sub.get("answer")
        if answer:
            text += f"\U0001f4ac Ответ: <code>{answer}</code>\n"

        markup = None
        if sub.get("status") == "pending":
            markup = submission_review(sub["id"])

        await callback.message.answer(text, reply_markup=markup, parse_mode="HTML")


# ── Review Submissions ───────────────────────────────────────────────

@router.callback_query(F.data.startswith("sub_approve:"))
async def approve_submission(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    token = data.get("token", "")
    sub_id = int(callback.data.split(":")[1])
    result = await api_client.review_submission(token, sub_id, approved=True)
    await callback.answer()
    if result:
        await callback.message.answer(
            "\u2705 <b>Отклик одобрен!</b>\n\n"
            "\U0001f4b8 Средства переведены исполнителю.",
            parse_mode="HTML",
        )
    else:
        await callback.message.answer("\u274c Ошибка при одобрении.")


@router.callback_query(F.data.startswith("sub_reject:"))
async def reject_submission(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    token = data.get("token", "")
    sub_id = int(callback.data.split(":")[1])
    result = await api_client.review_submission(token, sub_id, approved=False)
    await callback.answer()
    if result:
        await callback.message.answer(
            "\u274c <b>Отклик отклонён</b>\n\n"
            "Исполнитель получит уведомление.",
            parse_mode="HTML",
        )
    else:
        await callback.message.answer("\u274c Ошибка при отклонении.")
