from aiogram.fsm.state import State, StatesGroup


class TaskExecutionState(StatesGroup):
    viewing_task = State()
    submitting_proof = State()
    answering_question = State()
