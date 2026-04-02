'use client';

import { useEffect, useState } from 'react';
import { submissionsApi, resolvePublicAssetUrl } from '@/lib/api';
import { SubmissionCard } from '@/components/SubmissionCard';
import { FileCheck, Inbox } from 'lucide-react';

interface Submission {
  id: string;
  status: string;
  proofUrl?: string;
  answer?: string;
  comment?: string;
  createdAt: string;
  task?: { id: string; title: string };
}

const TABS = [
  { value: 'all', label: 'Все' },
  { value: 'pending', label: 'На проверке' },
  { value: 'approved', label: 'Одобрены' },
  { value: 'rejected', label: 'Отклонены' },
];

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const { data } = await submissionsApi.getMy();
        const list = Array.isArray(data) ? data : data.submissions || [];
        setSubmissions(
          list.map((s: Record<string, unknown>) => ({
            ...s,
            id: String(s.id),
            proofUrl: resolvePublicAssetUrl(
              (s.proofImageUrl || s.proofUrl) as string | undefined
            ),
            answer: (s.answerText || s.answer) as string | undefined,
          }))
        );
      } catch {
        console.error('Failed to fetch submissions');
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  const filtered =
    filter === 'all' ? submissions : submissions.filter((s) => s.status === filter);

  const tabCounts = {
    all: submissions.length,
    pending: submissions.filter((s) => s.status === 'pending').length,
    approved: submissions.filter((s) => s.status === 'approved').length,
    rejected: submissions.filter((s) => s.status === 'rejected').length,
  };

  // Skeleton
  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden animate-pulse">
      <div className="h-44 bg-slate-200" />
      <div className="p-5 space-y-3">
        <div className="flex justify-between">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-5 w-20 bg-slate-200 rounded-full" />
        </div>
        <div className="h-3 w-24 bg-slate-100 rounded" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Мои выполнения</h1>
        <p className="mt-1 text-slate-500 text-sm">Отслеживайте статус ваших выполнений</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              filter === tab.value
                ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-white text-slate-600 border border-slate-200/50 shadow-sm hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            {tab.label}
            <span className={`inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-xs font-semibold ${
              filter === tab.value
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-500'
            }`}>
              {tabCounts[tab.value as keyof typeof tabCounts]}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 mb-4">
            <Inbox className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">Нет выполнений</h3>
          <p className="text-sm text-slate-400">
            {filter !== 'all' ? 'Нет выполнений с таким статусом' : 'Выполненные задания появятся здесь'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((sub) => (
            <SubmissionCard key={sub.id} submission={sub} />
          ))}
        </div>
      )}
    </div>
  );
}
