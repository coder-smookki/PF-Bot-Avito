import logging
import math

from aiogram import F, Router
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message

from bot.keyboards.common import back_button, main_menu_executor
from bot.keyboards.inline import pagination, task_detail_executor
from bot.services.api_client import api_client
from bot.states.task_execution import TaskExecutionState

logger = logging.getLogger(__name__)
router = Router()

TASKS_PER_PAGE = 5


# ── Available Tasks ──────────────────────────────────────────────────

@router.message(F.text.contains("Доступные задания"))
async def available_tasks(message: Message, state: FSMContext):
    data = await state.get_data()
    if data.get("role") != "executor":
        return
    token = data.get("token", "")
    tasks = await api_client.get_available_tasks(token)

    if not tasks:
        await message.answer(
            "\U0001f4ed <b>Нет доступных заданий</b>\n\n"
            "Новые задания появляются регулярно.\n"
            "Проверьте позже!",
            reply_markup=main_menu_executor(),
            parse_mode="HTML",
        )
        return

    await state.update_data(available_tasks=tasks)
    await message.answer(
        f"\U0001f50d <b>Доступные задания</b> ({len(tasks)})\n"
        "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500",
        parse_mode="HTML",
    )
    await _show_tasks_page(message, tasks, 1)


async def _show_tasks_page(message: Message, tasks: list, page: int):
    total_pages = max(1, math.ceil(len(tasks) / TASKS_PER_PAGE))
    start = (page - 1) * TASKS_PER_PAGE
    page_tasks = tasks[start : start + TASKS_PER_PAGE]

    for task in page_tasks:
        price = task.get("pricePerExecution", 0)
        vtype_icons = {
            "screenshot": "\U0001f4f8",
            "question": "\u2753",
            "manual": "\U0001f91d",
        }
        vtype = task.get("verificationType", "manual")
        vicon = vtype_icons.get(vtype, "\U0001f91d")

        desc = task.get("description", "")
        desc_preview = (desc[:120] + "...") if len(desc) > 120 else desc

        text = (
            f"\U0001f4cc <b>{task.get('title', 'Без названия')}</b>\n\n"
            f"\U0001f4c4 {desc_preview}\n\n"
            f"\U0001f4b5 Оплата: <b>{price} руб.</b>\n"
            f"{vicon} Проверка: {vtype}"
        )
        await message.answer(
            text,
            reply_markup=task_detail_executor(task["id"]),
            parse_mode="HTML",
        )

    if total_pages > 1:
        await message.answer(
            f"\U0001f4c4 Страница <b>{page}</b> из <b>{total_pages}</b>",
            reply_markup=pagination(page, total_pages, "avail"),
            parse_mode="HTML",
        )


@router.callback_query(F.data.startswith("avail:page:"))
async def paginate_available(callback: CallbackQuery, state: FSMContext):
    page = int(callback.data.split(":")[2])
    data = await state.get_data()
    tasks = data.get("available_tasks", [])
    await callback.answer()
    await _show_tasks_page(callback.message, tasks, page)


# ── Execute Task ─────────────────────────────────────────────────────

@router.callback_query(F.data.startswith("exec_task:"))
async def start_execution(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    token = data.get("token", "")
    task_id = int(callback.data.split(":")[1])
    await callback.answer()

    task = await api_client.get_task(token, task_id)
    if not task:
        await callback.message.answer(
            "\u274c <b>Задание недоступно</b>\n\n"
            "Возможно, оно уже завершено\n"
            "или удалено заказчиком.",
            parse_mode="HTML",
        )
        return

    await state.update_data(current_task=task)

    text = (
        "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"
        f"\U0001f3af <b>{task.get('title')}</b>\n"
        "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n"
        f"\U0001f4c4 <b>Описание:</b>\n{task.get('description', '')}\n\n"
        f"\U0001f4dd <b>Инструкция:</b>\n{task.get('instructions', '')}\n\n"
        "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"
        f"\U0001f4b5 Оплата: <b>{task.get('pricePerExecution', 0)} руб.</b>"
    )
    await callback.message.answer(text, parse_mode="HTML")

    images = task.get("images") or task.get("photos") or []
    photo_urls = [
        (img.get("imageUrl") if isinstance(img, dict) else str(img)) for img in images
    ]
    if photo_urls:
        for photo_url in photo_urls[:5]:
            try:
                await callback.message.answer_photo(photo_url)
            except Exception:
                await callback.message.answer(f"\U0001f4f7 Фото: {photo_url}")

    vtype = task.get("verificationType", "manual")
    if vtype == "screenshot":
        await state.set_state(TaskExecutionState.submitting_proof)
        await callback.message.answer(
            "\U0001f4f8 <b>Отправьте доказательство</b>\n"
            "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n"
            "Сделайте скриншот выполненного\n"
            "задания и отправьте его сюда.\n\n"
            "<i>Принимаются только фото</i>",
            reply_markup=back_button(),
            parse_mode="HTML",
        )
    elif vtype == "question":
        question = task.get("controlQuestion", "Вопрос не задан")
        await state.set_state(TaskExecutionState.answering_question)
        await callback.message.answer(
            "\u2753 <b>Контрольный вопрос</b>\n"
            "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n"
            f"<b>{question}</b>\n\n"
            "<i>Введите ответ текстовым сообщением</i>",
            reply_markup=back_button(),
            parse_mode="HTML",
        )
    else:
        await _submit_manual(callback.message, state)


@router.message(TaskExecutionState.submitting_proof, F.text == "\u2b05 Назад")
async def cancel_proof(message: Message, state: FSMContext):
    await state.set_state(None)
    await message.answer(
        "\u274c Выполнение отменено.",
        reply_markup=main_menu_executor(),
    )


@router.message(TaskExecutionState.submitting_proof, F.photo)
async def submit_proof(message: Message, state: FSMContext):
    data = await state.get_data()
    token = data.get("token", "")
    task = data.get("current_task", {})

    photo = message.photo[-1]
    file = await message.bot.get_file(photo.file_id)
    file_bytes = await message.bot.download_file(file.file_path)
    content = file_bytes.read()

    url = await api_client.upload_file(token, content, f"proof_{photo.file_id}.jpg")
    if not url:
        await message.answer(
            "\u274c Ошибка загрузки фото.\n"
            "Попробуйте отправить ещё раз."
        )
        return

    result = await api_client.create_submission(
        token,
        {
            "taskId": task.get("id"),
            "proofUrl": url,
        },
    )
    await state.set_state(None)
    if result:
        await message.answer(
            "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"
            "\u2705 <b>Отправлено на проверку!</b>\n"
            "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n"
            "Заказчик проверит ваше выполнение.\n"
            "Вы получите уведомление о результате.\n\n"
            "\U0001f4b5 Оплата поступит на баланс\n"
            "   после одобрения.",
            reply_markup=main_menu_executor(),
            parse_mode="HTML",
        )
    else:
        await message.answer(
            "\u274c Ошибка отправки. Попробуйте снова.",
            reply_markup=main_menu_executor(),
        )


@router.message(TaskExecutionState.submitting_proof)
async def proof_not_photo(message: Message, state: FSMContext):
    await message.answer(
        "\U0001f4f8 Пожалуйста, отправьте именно <b>фото</b>\n"
        "(скриншот выполнения).",
        parse_mode="HTML",
    )


@router.message(TaskExecutionState.answering_question, F.text == "\u2b05 Назад")
async def cancel_answer(message: Message, state: FSMContext):
    await state.set_state(None)
    await message.answer(
        "\u274c Выполнение отменено.",
        reply_markup=main_menu_executor(),
    )


@router.message(TaskExecutionState.answering_question)
async def submit_answer(message: Message, state: FSMContext):
    data = await state.get_data()
    token = data.get("token", "")
    task = data.get("current_task", {})

    result = await api_client.create_submission(
        token,
        {
            "taskId": task.get("id"),
            "answer": message.text,
        },
    )
    await state.set_state(None)
    if result:
        await message.answer(
            "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"
            "\u2705 <b>Ответ отправлен!</b>\n"
            "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n"
            "Ожидайте проверку заказчиком.\n"
            "Результат придёт в уведомлении.",
            reply_markup=main_menu_executor(),
            parse_mode="HTML",
        )
    else:
        await message.answer(
            "\u274c Ошибка отправки ответа.\n"
            "Попробуйте ещё раз.",
            reply_markup=main_menu_executor(),
        )


async def _submit_manual(message: Message, state: FSMContext):
    data = await state.get_data()
    token = data.get("token", "")
    task = data.get("current_task", {})

    result = await api_client.create_submission(
        token,
        {"taskId": task.get("id")},
    )
    await state.set_state(None)
    if result:
        await message.answer(
            "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"
            "\u2705 <b>Выполнение отправлено!</b>\n"
            "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n"
            "Заказчик проверит выполнение вручную.\n"
            "Результат придёт в уведомлении.",
            reply_markup=main_menu_executor(),
            parse_mode="HTML",
        )
    else:
        await message.answer(
            "\u274c Ошибка отправки.",
            reply_markup=main_menu_executor(),
        )


# ── My Submissions ───────────────────────────────────────────────────

@router.message(F.text.contains("Мои выполнения"))
async def my_submissions(message: Message, state: FSMContext):
    data = await state.get_data()
    if data.get("role") != "executor":
        return
    token = data.get("token", "")
    submissions = await api_client.get_my_submissions(token)

    if not submissions:
        await message.answer(
            "\U0001f4ed <b>Нет выполнений</b>\n\n"
            "Вы пока не выполнили ни одного задания.\n"
            "Найдите задание в \"\U0001f50d Доступные задания\".",
            reply_markup=main_menu_executor(),
            parse_mode="HTML",
        )
        return

    pending = len([s for s in submissions if s.get("status") == "pending"])
    approved = len([s for s in submissions if s.get("status") == "approved"])
    rejected = len([s for s in submissions if s.get("status") == "rejected"])

    await message.answer(
        f"\U0001f4e6 <b>Ваши выполнения</b> ({len(submissions)})\n"
        f"\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n"
        f"\U0001f7e1 На проверке: {pending}\n"
        f"\u2705 Принято: {approved}\n"
        f"\u274c Отклонено: {rejected}",
        parse_mode="HTML",
    )

    for sub in submissions[:20]:
        status_map = {
            "pending": ("\U0001f7e1", "На проверке"),
            "approved": ("\u2705", "Одобрено"),
            "rejected": ("\u274c", "Отклонено"),
        }
        emoji, label = status_map.get(sub.get("status", ""), ("\U0001f7e1", "Неизвестно"))
        task_title = sub.get("task", {}).get("title", f"Задание #{sub.get('taskId', '?')}")
        price = sub.get("task", {}).get("pricePerExecution", "")

        text = (
            f"{emoji} <b>{task_title}</b>\n"
            f"Статус: {label}"
        )
        if price:
            text += f" | \U0001f4b5 {price} руб."
        await message.answer(text, parse_mode="HTML")
