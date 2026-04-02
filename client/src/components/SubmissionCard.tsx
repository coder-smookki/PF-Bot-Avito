'use client';

import { Clock, CheckCircle2, XCircle, Image, MessageSquare } from 'lucide-react';

interface SubmissionCardProps {
  submission: {
    id: string;
    status: string;
    proofUrl?: string;
    answer?: string;
    comment?: string;
    createdAt: string;
    task?: {
      id: string;
      title: string;
    };
  };
}

const statusConfig: Record<string, {
  label: string;
  icon: React.ReactNode;
  bg: string;
  text: string;
  dot: string;
  dotPulse: boolean;
}> = {
  pending: {
    label: 'На проверке',
    icon: <Clock className="h-3.5 w-3.5" />,
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    dotPulse: true,
  },
  approved: {
    label: 'Одобрено',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    dotPulse: true,
  },
  rejected: {
    label: 'Отклонено',
    icon: <XCircle className="h-3.5 w-3.5" />,
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
    dotPulse: false,
  },
};

export function SubmissionCard({ submission }: SubmissionCardProps) {
  const config = statusConfig[submission.status] || statusConfig.pending;

  return (
    <div className="group rounded-2xl bg-white/70 backdrop-blur-xl border border-slate-200/60 shadow-lg shadow-indigo-500/5 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200/60">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {submission.task && (
              <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                {submission.task.title}
              </h3>
            )}
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="h-3 w-3" />
              {new Date(submission.createdAt).toLocaleString('ru-RU')}
            </p>
          </div>

          {/* Status badge with dot indicator */}
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${config.bg} ${config.text}`}>
            <span className="relative flex h-2 w-2">
              {config.dotPulse && (
                <span className={`absolute inline-flex h-full w-full rounded-full ${config.dot} opacity-75 animate-ping`} />
              )}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${config.dot}`} />
            </span>
            {config.label}
          </span>
        </div>

        {/* Proof Image */}
        {submission.proofUrl && (
          <div className="mt-4 relative group/img cursor-pointer overflow-hidden rounded-xl">
            <img
              src={submission.proofUrl}
              alt="Доказательство"
              className="h-44 w-full rounded-xl object-cover ring-1 ring-slate-200/50 transition-transform duration-500 group-hover/img:scale-105"
            />
            {/* Lightbox hint overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/img:bg-black/30 transition-all duration-300 rounded-xl">
              <div className="opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg">
                <Image className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium text-slate-700">Открыть</span>
              </div>
            </div>
          </div>
        )}

        {/* Answer */}
        {submission.answer && (
          <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <MessageSquare className="h-3.5 w-3.5" />
              Ответ
            </div>
            <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">
              {submission.answer}
            </p>
          </div>
        )}

        {/* Comment */}
        {submission.comment && (
          <div className="mt-3 flex items-start gap-2 text-sm text-slate-500">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 flex-shrink-0 mt-0.5">
              <MessageSquare className="h-3 w-3 text-slate-400" />
            </div>
            <p className="leading-relaxed">
              <span className="font-semibold text-slate-600">Комментарий:</span>{' '}
              {submission.comment}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
