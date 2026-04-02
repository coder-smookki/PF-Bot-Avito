from aiogram.fsm.state import State, StatesGroup


class WalletState(StatesGroup):
    entering_amount = State()
    entering_withdraw_amount = State()
