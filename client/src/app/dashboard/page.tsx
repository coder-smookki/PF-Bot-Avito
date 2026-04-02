'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { tasksApi, walletApi, submissionsApi } from '@/lib/api';
import {
  ClipboardList,
  DollarSign,
  Clock,
  Wallet,
  CheckCircle2,
  TrendingUp,
  Plus,
  Search,
  ArrowRight,
  Zap,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';

interface StatCard {
  label: string;
  value: string | number;
  icon: typeof ClipboardList;
  gradient: string;
  shadowColor: string;
}

interface Task {
  id: string;
  title: string;
  pricePerExecution: number;
  status: string;
  verificationType: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatCard[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balRes] = await Promise.all([walletApi.getBalance()]);
        const balance = balRes.data;

        if (user?.role === 'customer') {
          const { data } = await tasksApi.getMy();
          const tasks = Array.isArray(data) ? data : data.tasks || [];
          const active = tasks.filter((t: Task) => t.status === 'active').length;
          const totalSpent = tasks.reduce((sum: number, t: Task & { totalBudget?: number }) => sum + (t.totalBudget || 0), 0);

          setStats([
            { label: 'Активные задания', value: active, icon: ClipboardList, gradient: 'from-indigo-500 to-blue-500', shadowColor: 'shadow-indigo-500/25' },
            { label: 'Всего потрачено', value: `${totalSpent.toFixed(0)} \u20BD`, icon: DollarSign, gradient: 'from-emerald-500 to-teal-500', shadowColor: 'shadow-emerald-500/25' },
            { label: 'Ожидают проверки', value: 0, icon: Clock, gradient: 'from-amber-500 to-orange-500', shadowColor: 'shadow-amber-500/25' },
            { label: 'Баланс', value: `${(balance?.available ?? 0).toFixed(0)} \u20BD`, icon: Wallet, gradient: 'from-violet-500 to-purple-500', shadowColor: 'shadow-violet-500/25' },
          ]);
          setRecentTasks(tasks.slice(0, 5));
        } else {
          const { data: subData } = await submissionsApi.getMy();
          const subs = Array.isArray(subData) ? subData : subData.submissions || [];
          const approved = subs.filter((s: { status: string }) => s.status === 'approved').length;
          const pending = subs.filter((s: { status: string }) => s.status === 'pending').length;
          const earned = subs
            .filter((s: { status: string }) => s.status === 'approved')
            .reduce((sum: number, s: { task?: { pricePerExecution?: number } }) => sum + (s.task?.pricePerExecution || 0), 0);

          setStats([
            { label: 'Выполнено заданий', value: approved, icon: CheckCircle2, gradient: 'from-indigo-500 to-blue-500', shadowColor: 'shadow-indigo-500/25' },
            { label: 'Заработано', value: `${earned.toFixed(0)} \u20BD`, icon: TrendingUp, gradient: 'from-emerald-500 to-teal-500', shadowColor: 'shadow-emerald-500/25' },
            { label: 'На проверке', value: pending, icon: Clock, gradient: 'from-amber-500 to-orange-500', shadowColor: 'shadow-amber-500/25' },
            { label: 'Баланс', value: `${(balance?.available ?? 0).toFixed(0)} \u20BD`, icon: Wallet, gradient: 'from-violet-500 to-purple-500', shadowColor: 'shadow-violet-500/25' },
          ]);

          try {
            const { data: taskData } = await tasksApi.getAvailable();
            const tasks = Array.isArray(taskData) ? taskData : taskData.tasks || [];
            setRecentTasks(tasks.slice(0, 3));
          } catch {
            // ignore
          }
        }
      } catch {
        console.error('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton header */}
        <div className="h-10 w-72 bg-slate-200 rounded-xl animate-pulse" />
        {/* Skeleton stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-slate-200" />
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-slate-200 rounded" />
                  <div className="h-6 w-16 bg-slate-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
          Привет, {user?.username}!{' '}
          <span className="inline-block animate-bounce">&#128075;</span>
        </h1>
        <p className="mt-1 text-slate-500">
          {user?.role === 'customer'
            ? 'Управляйте своими заданиями и отслеживайте результаты'
            : 'Находите задания и зарабатывайте'}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg ${stat.shadowColor}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-400 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent tasks */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              {user?.role === 'customer' ? 'Последние задания' : 'Доступные задания'}
            </h2>
            <Link
              href="/dashboard/tasks"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
            >
              Все <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentTasks.length === 0 ? (
            <div className="text-center py-10">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mx-auto mb-3">
                <ClipboardList className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-sm text-slate-400">Пока нет заданий</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/dashboard/tasks/${task.id}`}
                  className="flex items-center justify-between rounded-xl px-4 py-3 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 shrink-0">
                      <Zap className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate group-hover:text-indigo-600 transition-colors">
                        {task.title}
                      </p>
                      <p className="text-xs text-slate-400">{task.pricePerExecution} &#8381; / выполнение</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 shrink-0 transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="space-y-6">
          {user?.role === 'customer' ? (
            <>
              <Link
                href="/dashboard/tasks/create"
                className="block bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl p-6 text-white shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm mb-4">
                  <Plus className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">Создать задание</h3>
                <p className="text-sm text-white/70 mt-1">Разместите новое задание для исполнителей</p>
              </Link>
              <Link
                href="/dashboard/wallet"
                className="block bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25 mb-4">
                  <ArrowDownRight className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Пополнить баланс</h3>
                <p className="text-sm text-slate-500 mt-1">Добавьте средства для создания заданий</p>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard/tasks"
                className="block bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl p-6 text-white shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm mb-4">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">Найти задание</h3>
                <p className="text-sm text-white/70 mt-1">Просмотрите доступные задания</p>
              </Link>
              <Link
                href="/dashboard/wallet"
                className="block bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25 mb-4">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Вывести средства</h3>
                <p className="text-sm text-slate-500 mt-1">Выведите заработанные средства</p>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
