from aiogram.fsm.state import State, StatesGroup


class TaskCreationState(StatesGroup):
    title = State()
    description = State()
    instructions = State()
    photo = State()
    price = State()
    total_budget = State()
    verification_type = State()
    control_question = State()
    control_answer = State()
    confirm = State()
