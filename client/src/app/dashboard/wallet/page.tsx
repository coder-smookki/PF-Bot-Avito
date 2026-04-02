'use client';

import { useEffect, useState } from 'react';
import { walletApi, paymentsApi } from '@/lib/api';
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Plus,
  Minus,
  Loader2,
  Snowflake,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  Filter,
} from 'lucide-react';

interface WalletBalance {
  available: number;
  frozen: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  status?: string;
}

const presetAmounts = [100, 500, 1000, 5000];

const typeLabels: Record<string, { label: string; icon: typeof ArrowDownCircle; color: string }> = {
  credit: { label: 'Зачисление', icon: ArrowDownCircle, color: 'text-emerald-600' },
  topup: { label: 'Пополнение', icon: TrendingUp, color: 'text-emerald-600' },
  debit: { label: 'Списание', icon: ArrowUpCircle, color: 'text-red-500' },
  withdrawal: { label: 'Вывод', icon: TrendingDown, color: 'text-red-500' },
  freeze: { label: 'Заморозка', icon: Snowflake, color: 'text-blue-500' },
};

const statusBadges: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  completed: { label: 'Завершено', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  pending: { label: 'Ожидание', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  failed: { label: 'Ошибка', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

export default function WalletPage() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAction, setActiveAction] = useState<'topup' | 'withdraw' | null>(null);
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [txFilter, setTxFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balRes, txRes] = await Promise.all([
          walletApi.getBalance(),
          walletApi.getTransactions(),
        ]);
        setBalance(balRes.data);
        setTransactions(Array.isArray(txRes.data) ? txRes.data : txRes.data.transactions || []);
      } catch {
        console.error('Failed to fetch wallet data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTopUp = async () => {
    if (!amount || Number(amount) <= 0) return;
    setProcessing(true);
    try {
      const { data } = await paymentsApi.createPayment({ amount: Number(amount) });
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        alert('Платёж создан');
        setActiveAction(null);
        setAmount('');
      }
    } catch {
      alert('Ошибка создания платежа');
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || Number(amount) <= 0) return;
    setProcessing(true);
    try {
      await walletApi.withdraw({
        amount: Number(amount),
        method: 'card',
        details: '',
      });
      alert('Заявка на вывод создана');
      setActiveAction(null);
      setAmount('');
      const { data } = await walletApi.getBalance();
      setBalance(data);
    } catch {
      alert('Ошибка вывода средств');
    } finally {
      setProcessing(false);
    }
  };

  const filteredTx = txFilter === 'all'
    ? transactions
    : transactions.filter((tx) => tx.type === txFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-slate-200" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Кошелёк</h1>
        <p className="mt-1 text-slate-500 text-sm">Управляйте своим балансом</p>
      </div>

      {/* Balance card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 p-8 text-white shadow-2xl shadow-indigo-500/30">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-white/70">Доступный баланс</p>
              <p className="text-4xl font-bold">
                {(balance?.available ?? 0).toFixed(2)} <span className="text-2xl">&#8381;</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-white/60">
            <Snowflake className="h-4 w-4" />
            <span>Заморожено: {(balance?.frozen ?? 0).toFixed(2)} &#8381;</span>
          </div>
        </div>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Top-up card */}
        <div className={`bg-white rounded-2xl shadow-lg shadow-slate-200/50 border transition-all duration-300 ${
          activeAction === 'topup' ? 'border-emerald-300 shadow-emerald-100/50' : 'border-slate-200/50'
        }`}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 shadow-lg shadow-emerald-500/25">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Пополнить</h3>
                <p className="text-xs text-slate-400">Добавьте средства на счёт</p>
              </div>
            </div>

            {activeAction === 'topup' ? (
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pr-10 py-3 pl-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all"
                    placeholder="Сумма"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">&#8381;</span>
                </div>

                <div className="flex gap-2">
                  {presetAmounts.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setAmount(String(preset))}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                        amount === String(preset)
                          ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleTopUp}
                    disabled={processing || !amount}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all"
                  >
                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Пополнить
                  </button>
                  <button
                    onClick={() => { setActiveAction(null); setAmount(''); }}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setActiveAction('topup'); setAmount(''); }}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all"
              >
                Пополнить баланс
              </button>
            )}
          </div>
        </div>

        {/* Withdraw card */}
        <div className={`bg-white rounded-2xl shadow-lg shadow-slate-200/50 border transition-all duration-300 ${
          activeAction === 'withdraw' ? 'border-orange-300 shadow-orange-100/50' : 'border-slate-200/50'
        }`}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25">
                <Minus className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Вывести</h3>
                <p className="text-xs text-slate-400">Выведите средства со счёта</p>
              </div>
            </div>

            {activeAction === 'withdraw' ? (
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pr-10 py-3 pl-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 transition-all"
                    placeholder="Сумма"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">&#8381;</span>
                </div>

                <p className="text-xs text-slate-400">
                  Доступно: {(balance?.available ?? 0).toFixed(2)} &#8381;
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={handleWithdraw}
                    disabled={processing || !amount}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/20 disabled:opacity-50 transition-all"
                  >
                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Minus className="h-4 w-4" />}
                    Вывести
                  </button>
                  <button
                    onClick={() => { setActiveAction(null); setAmount(''); }}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setActiveAction('withdraw'); setAmount(''); }}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 transition-all"
              >
                Вывести средства
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transaction history */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">История операций</h2>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={txFilter}
              onChange={(e) => setTxFilter(e.target.value)}
              className="text-sm bg-slate-50 rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">Все операции</option>
              <option value="topup">Пополнения</option>
              <option value="credit">Зачисления</option>
              <option value="debit">Списания</option>
              <option value="withdrawal">Выводы</option>
            </select>
          </div>
        </div>

        {filteredTx.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-3">
              <Clock className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-sm text-slate-400">Нет операций</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Дата</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Тип</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Сумма</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Описание</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Статус</th>
                </tr>
              </thead>
              <tbody>
                {filteredTx.map((tx) => {
                  const typeInfo = typeLabels[tx.type] || typeLabels.credit;
                  const TypeIcon = typeInfo.icon;
                  const isCredit = tx.type === 'credit' || tx.type === 'topup';
                  const badge = statusBadges[tx.status || 'completed'] || statusBadges.completed;

                  return (
                    <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                        {new Date(tx.createdAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-2">
                          <TypeIcon className={`h-4 w-4 ${typeInfo.color}`} />
                          <span className="text-sm font-medium text-slate-700">{typeInfo.label}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`text-sm font-bold ${isCredit ? 'text-emerald-600' : 'text-red-500'}`}>
                          {isCredit ? '+' : '-'}{tx.amount.toFixed(2)} &#8381;
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-[200px] truncate">
                        {tx.description}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
