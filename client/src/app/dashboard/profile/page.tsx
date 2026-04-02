'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { userApi, walletApi, submissionsApi, tasksApi } from '@/lib/api';
import {
  Save,
  User,
  Mail,
  Shield,
  Calendar,
  Loader2,
  CheckCircle2,
  XCircle,
  Camera,
  MessageCircle,
  ClipboardList,
  FileCheck,
  TrendingUp,
  Wallet,
} from 'lucide-react';

interface ProfileStats {
  totalTasks: number;
  totalSubmissions: number;
  totalEarned: number;
  totalSpent: number;
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<ProfileStats>({
    totalTasks: 0, totalSubmissions: 0, totalEarned: 0, totalSpent: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (user?.role === 'customer') {
          const { data } = await tasksApi.getMy();
          const tasks = Array.isArray(data) ? data : data.tasks || [];
          const totalSpent = tasks.reduce((sum: number, t: { totalBudget?: number }) => sum + (t.totalBudget || 0), 0);
          setStats((prev) => ({ ...prev, totalTasks: tasks.length, totalSpent }));
        } else {
          const { data } = await submissionsApi.getMy();
          const subs = Array.isArray(data) ? data : data.submissions || [];
          const approved = subs.filter((s: { status: string }) => s.status === 'approved');
          const earned = approved.reduce((sum: number, s: { task?: { pricePerExecution?: number } }) => sum + (s.task?.pricePerExecution || 0), 0);
          setStats((prev) => ({ ...prev, totalSubmissions: subs.length, totalEarned: earned }));
        }
      } catch {
        // ignore stats errors
      }
    };
    if (user) fetchStats();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      await userApi.updateProfile(form);
      await refreshUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Ошибка обновления профиля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Профиль</h1>
        <p className="mt-1 text-slate-500 text-sm">Управляйте вашим аккаунтом</p>
      </div>

      {/* Profile card with avatar */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 overflow-hidden">
        {/* Gradient header */}
        <div className="h-32 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        </div>

        <div className="px-6 lg:px-8 pb-6">
          {/* Avatar */}
          <div className="relative -mt-16 mb-4">
            <div className="relative inline-block">
              <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-400 ring-4 ring-white shadow-xl">
                <span className="text-4xl font-bold text-white">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <button className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                <Camera className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* User info */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">{user?.username}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{user?.email}</p>
            <div className="flex items-center gap-3 mt-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                user?.role === 'customer'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'bg-violet-50 text-violet-700'
              }`}>
                <Shield className="h-3 w-3" />
                {user?.role === 'customer' ? 'Заказчик' : 'Исполнитель'}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Calendar className="h-3 w-3" />
                Участник с 2024
              </span>
            </div>
          </div>

          {/* Telegram status */}
          <div className={`flex items-center gap-3 rounded-xl p-4 mb-2 ${
            user?.telegramId
              ? 'bg-emerald-50 border border-emerald-200/50'
              : 'bg-slate-50 border border-slate-200/50'
          }`}>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              user?.telegramId
                ? 'bg-gradient-to-br from-emerald-500 to-green-500 shadow-lg shadow-emerald-500/25'
                : 'bg-slate-200'
            }`}>
              <MessageCircle className={`h-5 w-5 ${user?.telegramId ? 'text-white' : 'text-slate-400'}`} />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${user?.telegramId ? 'text-emerald-700' : 'text-slate-600'}`}>
                Telegram
              </p>
              <p className="text-xs text-slate-400">
                {user?.telegramId ? 'Подключён' : 'Не подключён'}
              </p>
            </div>
            {user?.telegramId ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            ) : (
              <span className="text-xs text-indigo-600 font-medium">Подключить</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {user?.role === 'customer' ? (
          <>
            <StatBox icon={ClipboardList} label="Всего заданий" value={stats.totalTasks} gradient="from-indigo-500 to-blue-500" shadowColor="shadow-indigo-500/25" />
            <StatBox icon={TrendingUp} label="Потрачено" value={`${stats.totalSpent.toFixed(0)} \u20BD`} gradient="from-emerald-500 to-teal-500" shadowColor="shadow-emerald-500/25" />
          </>
        ) : (
          <>
            <StatBox icon={FileCheck} label="Выполнений" value={stats.totalSubmissions} gradient="from-indigo-500 to-blue-500" shadowColor="shadow-indigo-500/25" />
            <StatBox icon={Wallet} label="Заработано" value={`${stats.totalEarned.toFixed(0)} \u20BD`} gradient="from-emerald-500 to-teal-500" shadowColor="shadow-emerald-500/25" />
          </>
        )}
      </div>

      {/* Edit form */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 p-6 lg:p-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Редактировать профиль</h2>

        {success && (
          <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200/50 p-4 text-sm text-emerald-700 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            Профиль успешно обновлён
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 border border-red-200/50 p-4 text-sm text-red-700 flex items-center gap-3">
            <XCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Имя пользователя</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                name="username"
                required
                value={form.username}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Роль</label>
            <div className="relative">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                disabled
                value={user?.role === 'customer' ? 'Заказчик' : 'Исполнитель'}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-100 rounded-xl border border-slate-200 text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 disabled:opacity-60 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Сохранить изменения
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, label, value, gradient, shadowColor }: {
  icon: typeof ClipboardList;
  label: string;
  value: string | number;
  gradient: string;
  shadowColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg ${shadowColor} mb-3`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}
