'use client';

import Link from 'next/link';
import { Camera, HelpCircle, UserCheck, TrendingUp } from 'lucide-react';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string;
    pricePerExecution: number;
    status: string;
    verificationType: string;
    completedCount?: number;
    totalBudget?: number;
  };
}

const statusLabels: Record<string, string> = {
  active: 'Активно',
  paused: 'На паузе',
  completed: 'Завершено',
  draft: 'Черновик',
  pending: 'Ожидает',
};

const statusColors: Record<string, { bg: string; text: string; dot: string; stripe: string }> = {
  active: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    stripe: 'from-emerald-400 to-emerald-500',
  },
  paused: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    stripe: 'from-amber-400 to-amber-500',
  },
  completed: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
    stripe: 'from-slate-300 to-slate-400',
  },
  draft: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    stripe: 'from-blue-400 to-blue-500',
  },
  pending: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    stripe: 'from-amber-400 to-amber-500',
  },
};

const verificationIcons: Record<string, React.ReactNode> = {
  screenshot: <Camera className="h-3.5 w-3.5" />,
  question: <HelpCircle className="h-3.5 w-3.5" />,
  manual: <UserCheck className="h-3.5 w-3.5" />,
};

const verificationLabels: Record<string, string> = {
  screenshot: 'Скриншот',
  question: 'Вопрос',
  manual: 'Ручная',
};

export function TaskCard({ task }: TaskCardProps) {
  const colors = statusColors[task.status] || statusColors.pending;
  const maxExecutions = task.totalBudget && task.pricePerExecution
    ? Math.floor(task.totalBudget / task.pricePerExecution)
    : 0;
  const progress = maxExecutions > 0 && task.completedCount !== undefined
    ? Math.min((task.completedCount / maxExecutions) * 100, 100)
    : 0;

  return (
    <Link
      href={`/dashboard/tasks/${task.id}`}
      className="group block rounded-2xl bg-white border border-slate-200/60 shadow-lg shadow-indigo-500/5 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 hover:border-indigo-200/60"
    >
      {/* Top colored stripe */}
      <div className={`h-1 bg-gradient-to-r ${colors.stripe}`} />

      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
              {task.title}
            </h3>
            {task.description && (
              <p className="mt-2 text-sm text-slate-500 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${colors.bg} ${colors.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${colors.dot} ${task.status === 'active' ? 'animate-pulse-dot' : ''}`} />
            {statusLabels[task.status] || task.status}
          </span>
        </div>

        {/* Bottom row */}
        <div className="mt-5 flex items-center gap-3 flex-wrap">
          {/* Price badge */}
          <div className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20">
            {task.pricePerExecution} &#8381;
          </div>

          {/* Verification type */}
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
            {verificationIcons[task.verificationType]}
            {verificationLabels[task.verificationType] || task.verificationType}
          </div>

          {/* Progress */}
          {task.completedCount !== undefined && maxExecutions > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {task.completedCount}/{maxExecutions}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
