from aiogram.fsm.state import State, StatesGroup


class RegistrationState(StatesGroup):
    choosing_role = State()
