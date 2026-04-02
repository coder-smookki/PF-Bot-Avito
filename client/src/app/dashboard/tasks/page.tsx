'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { tasksApi } from '@/lib/api';
import { TaskCard } from '@/components/TaskCard';
import {
  PlusCircle,
  Search,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  pricePerExecution: number;
  status: string;
  verificationType: string;
  completedCount?: number;
  currentExecutions?: number;
  totalBudget?: number;
}

const TABS = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'paused', label: 'Приостановлены' },
  { value: 'completed', label: 'Завершены' },
];

const ITEMS_PER_PAGE = 9;

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data } = user?.role === 'customer'
          ? await tasksApi.getMy()
          : await tasksApi.getAvailable();
        const raw = Array.isArray(data) ? data : data.tasks || data.data || [];
        setTasks(
          raw.map((t: Task & { currentExecutions?: number }) => ({
            ...t,
            completedCount: t.completedCount ?? t.currentExecutions,
          }))
        );
      } catch {
        console.error('Failed to fetch tasks');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [user]);

  const filtered = tasks
    .filter((t) =>
      activeTab === 'all' ? true : t.status === activeTab
    )
    .filter(
      (t) =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase())
    );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const tabCounts = {
    all: tasks.length,
    active: tasks.filter((t) => t.status === 'active').length,
    paused: tasks.filter((t) => t.status === 'paused').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };

  // Skeleton cards for loading state
  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-6 animate-pulse">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="h-5 w-40 bg-slate-200 rounded" />
        <div className="h-6 w-20 bg-slate-200 rounded-full" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 w-full bg-slate-100 rounded" />
        <div className="h-4 w-2/3 bg-slate-100 rounded" />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-4 w-16 bg-slate-200 rounded" />
        <div className="h-4 w-20 bg-slate-100 rounded" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
            {user?.role === 'customer' ? 'Мои задания' : 'Доступные задания'}
          </h1>
          <p className="mt-1 text-slate-500 text-sm">
            {user?.role === 'customer' ? 'Управляйте созданными заданиями' : 'Находите задания и зарабатывайте'}
          </p>
        </div>
        {user?.role === 'customer' && (
          <Link
            href="/dashboard/tasks/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl font-medium text-sm shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-300"
          >
            <PlusCircle className="h-4 w-4" />
            Создать задание
          </Link>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setActiveTab(tab.value); setPage(1); }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === tab.value
                ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-white text-slate-600 border border-slate-200/50 shadow-sm hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            {tab.label}
            <span className={`inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-xs font-semibold ${
              activeTab === tab.value
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-500'
            }`}>
              {tabCounts[tab.value as keyof typeof tabCounts]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Поиск заданий..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-slate-200/50 shadow-sm text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : paged.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 mb-4">
            <ClipboardList className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">
            {search ? 'Задания не найдены' : 'Нет заданий'}
          </h3>
          <p className="text-sm text-slate-400 mb-6">
            {search
              ? 'Попробуйте изменить поисковый запрос'
              : user?.role === 'customer'
              ? 'Создайте своё первое задание'
              : 'Новые задания скоро появятся'}
          </p>
          {user?.role === 'customer' && !search && (
            <Link
              href="/dashboard/tasks/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl font-medium text-sm shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all duration-300"
            >
              <PlusCircle className="h-4 w-4" />
              Создать первое задание
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paged.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center justify-center h-10 w-10 rounded-xl bg-white border border-slate-200/50 shadow-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`flex items-center justify-center h-10 w-10 rounded-xl text-sm font-medium transition-all ${
                    page === p
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25'
                      : 'bg-white border border-slate-200/50 shadow-sm text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center justify-center h-10 w-10 rounded-xl bg-white border border-slate-200/50 shadow-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
