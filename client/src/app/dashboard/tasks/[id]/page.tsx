'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { tasksApi, submissionsApi, resolvePublicAssetUrl } from '@/lib/api';
import { SubmissionCard } from '@/components/SubmissionCard';
import {
  ArrowLeft,
  Camera,
  HelpCircle,
  UserCheck,
  CheckCircle2,
  XCircle,
  Upload,
  Loader2,
  Calendar,
  Zap,
  Target,
  ShieldCheck,
  Image as ImageIcon,
  X,
  Send,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  description: string;
  instructions: string;
  pricePerExecution: number;
  totalBudget: number;
  status: string;
  verificationType: string;
  controlQuestion?: string;
  images?: string[];
  completedCount?: number;
  currentExecutions?: number;
  createdAt?: string;
}

interface Submission {
  id: string;
  status: string;
  proofUrl?: string;
  answer?: string;
  comment?: string;
  createdAt: string;
  user?: { username: string };
  task?: { id: string; title: string };
}

const statusConfig: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  active: { label: 'Активно', dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  paused: { label: 'На паузе', dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
  completed: { label: 'Завершено', dot: 'bg-slate-400', bg: 'bg-slate-100', text: 'text-slate-600' },
  pending: { label: 'Ожидает', dot: 'bg-orange-400', bg: 'bg-orange-50', text: 'text-orange-700' },
};

const verificationInfo: Record<string, { icon: typeof Camera; label: string; description: string }> = {
  screenshot: { icon: Camera, label: 'Скриншот', description: 'Требуется скриншот выполнения' },
  question: { icon: HelpCircle, label: 'Контрольный вопрос', description: 'Ответ на контрольный вопрос' },
  manual: { icon: UserCheck, label: 'Ручная проверка', description: 'Проверяется вручную' },
};

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [subFilter, setSubFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: rawTask } = await tasksApi.getById(id);
        const imgs = (rawTask.images as { imageUrl?: string }[] | undefined) || [];
        const taskData: Task = {
          ...rawTask,
          images: imgs.map((i) => resolvePublicAssetUrl(i.imageUrl)),
          completedCount: rawTask.currentExecutions ?? rawTask.completedCount,
        };
        setTask(taskData);
        if (user?.role === 'customer') {
          const { data: subData } = await submissionsApi.getByTask(id);
          const list = Array.isArray(subData) ? subData : subData.submissions || [];
          setSubmissions(
            list.map((s: Record<string, unknown>) => ({
              ...s,
              id: String(s.id),
              proofUrl: resolvePublicAssetUrl(
                (s.proofImageUrl || s.proofUrl) as string | undefined
              ),
              answer: (s.answerText || s.answer) as string | undefined,
              user:
                (s.user as { username?: string } | undefined) ||
                (s.executor
                  ? {
                      username:
                        (s.executor as { username?: string }).username || 'Исполнитель',
                    }
                  : undefined),
            }))
          );
        }
      } catch {
        console.error('Failed to fetch task');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  const handleFileSelect = (file: File | null) => {
    setProofFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProofPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setProofPreview(null);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      await submissionsApi.create(id, {
        proofFile: proofFile || undefined,
        answerText: answer || undefined,
      });
      alert('Выполнение отправлено на проверку!');
      setProofFile(null);
      setProofPreview(null);
      setAnswer('');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setSubmitError(axiosErr.response?.data?.message || 'Ошибка отправки');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (submissionId: string, status: string) => {
    try {
      await submissionsApi.review(submissionId, { status });
      const next =
        status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : status;
      setSubmissions((prev) =>
        prev.map((s) => (s.id === submissionId ? { ...s, status: next } : s))
      );
    } catch {
      alert('Ошибка при проверке');
    }
  };

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

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 mb-4">
          <XCircle className="h-10 w-10 text-slate-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700">Задание не найдено</h3>
        <Link href="/dashboard/tasks" className="mt-4 text-sm text-indigo-600 hover:text-indigo-700">
          Вернуться к заданиям
        </Link>
      </div>
    );
  }

  const status = statusConfig[task.status] || statusConfig.pending;
  const verification = verificationInfo[task.verificationType];
  const VerifIcon = verification?.icon || HelpCircle;
  const maxExec = task.totalBudget && task.pricePerExecution
    ? Math.floor(task.totalBudget / task.pricePerExecution)
    : 0;
  const progress = maxExec > 0 && task.completedCount !== undefined
    ? Math.min((task.completedCount / maxExec) * 100, 100)
    : 0;

  const filteredSubs = subFilter === 'all'
    ? submissions
    : submissions.filter((s) => s.status === subFilter);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        href="/dashboard/tasks"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к заданиям
      </Link>

      {/* Task header */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900">{task.title}</h1>
            {task.createdAt && (
              <div className="flex items-center gap-1.5 mt-2 text-sm text-slate-400">
                <Calendar className="h-4 w-4" />
                {new Date(task.createdAt).toLocaleDateString('ru-RU')}
              </div>
            )}
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${status.bg} ${status.text} shrink-0`}>
            <span className={`h-2 w-2 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-3">Описание</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{task.description}</p>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-3">Инструкции</h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{task.instructions}</p>
          </div>

          {/* Image gallery */}
          {task.images && task.images.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="h-5 w-5 text-slate-400" />
                <h2 className="text-base font-semibold text-slate-900">Изображения</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {task.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxImage(img)}
                    className="aspect-square rounded-xl overflow-hidden ring-1 ring-slate-200 hover:ring-indigo-300 hover:shadow-lg transition-all group"
                  >
                    <img
                      src={img}
                      alt={`Изображение ${i + 1}`}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column - stats & verification */}
        <div className="space-y-6">
          {/* Stats card */}
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Информация</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Zap className="h-4 w-4 text-indigo-500" />
                  Цена
                </div>
                <span className="text-sm font-semibold text-slate-900">{task.pricePerExecution} &#8381;</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Target className="h-4 w-4 text-violet-500" />
                  Бюджет
                </div>
                <span className="text-sm font-semibold text-slate-900">{task.totalBudget} &#8381;</span>
              </div>

              {maxExec > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-500">Прогресс</span>
                    <span className="text-sm font-semibold text-slate-900">{task.completedCount || 0}/{maxExec}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Verification info */}
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 p-6">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="h-5 w-5 text-indigo-500" />
              <h2 className="text-base font-semibold text-slate-900">Верификация</h2>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-indigo-50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25 shrink-0">
                <VerifIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-indigo-700">{verification?.label}</p>
                <p className="text-xs text-indigo-500">{verification?.description}</p>
              </div>
            </div>
            {task.controlQuestion && (
              <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-400 mb-1">Контрольный вопрос</p>
                <p className="text-sm text-slate-700">{task.controlQuestion}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Executor: submit proof */}
      {user?.role === 'executor' && task.status === 'active' && (
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 p-6 lg:p-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Отправить выполнение</h2>

          {submitError && (
            <div className="mb-6 rounded-2xl bg-red-50 border border-red-200/50 p-4 text-sm text-red-700 flex items-center gap-3">
              <XCircle className="h-5 w-5 shrink-0" />
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmitProof} className="space-y-6">
            {(task.verificationType === 'screenshot' || task.verificationType === 'manual') && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Доказательство</label>
                {proofPreview ? (
                  <div className="relative inline-block">
                    <img src={proofPreview} alt="" className="h-48 rounded-xl object-cover ring-1 ring-slate-200" />
                    <button
                      type="button"
                      onClick={() => handleFileSelect(null)}
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-red-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 p-8 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25">
                        <Upload className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-sm font-medium text-slate-600">Загрузите скриншот</span>
                      <span className="text-xs text-slate-400">или перетащите файл сюда</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}

            {task.verificationType === 'question' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {task.controlQuestion}
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 focus:bg-white transition-all"
                    placeholder="Ваш ответ"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 disabled:opacity-60 transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Отправка...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Отправить на проверку
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Customer: submissions list */}
      {user?.role === 'customer' && submissions.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Выполнения ({submissions.length})
            </h2>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'Все' },
                { value: 'pending', label: 'На проверке' },
                { value: 'approved', label: 'Одобрены' },
                { value: 'rejected', label: 'Отклонены' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setSubFilter(tab.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    subFilter === tab.value
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredSubs.map((sub) => (
              <div key={sub.id} className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {sub.user && (
                      <p className="text-sm font-medium text-slate-700">{sub.user.username}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(sub.createdAt).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    sub.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                    sub.status === 'rejected' ? 'bg-red-50 text-red-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      sub.status === 'approved' ? 'bg-emerald-500' :
                      sub.status === 'rejected' ? 'bg-red-500' :
                      'bg-amber-500 animate-pulse'
                    }`} />
                    {sub.status === 'approved' ? 'Одобрено' : sub.status === 'rejected' ? 'Отклонено' : 'На проверке'}
                  </span>
                </div>

                {sub.proofUrl && (
                  <button
                    onClick={() => setLightboxImage(sub.proofUrl!)}
                    className="mt-3 block w-full"
                  >
                    <img
                      src={sub.proofUrl}
                      alt="Доказательство"
                      className="h-44 w-full rounded-xl object-cover ring-1 ring-slate-200 hover:ring-indigo-300 transition-all"
                    />
                  </button>
                )}

                {sub.answer && (
                  <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                    <span className="font-medium text-slate-700">Ответ:</span> {sub.answer}
                  </div>
                )}

                {sub.status === 'pending' && (
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleReview(sub.id, 'approved')}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg shadow-emerald-500/20 hover:shadow-xl transition-all"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Одобрить
                    </button>
                    <button
                      onClick={() => handleReview(sub.id, 'rejected')}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-red-500 to-rose-500 shadow-lg shadow-red-500/20 hover:shadow-xl transition-all"
                    >
                      <XCircle className="h-4 w-4" />
                      Отклонить
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            onClick={() => setLightboxImage(null)}
          >
            <X className="h-5 w-5 text-white" />
          </button>
          <img
            src={lightboxImage}
            alt="Просмотр"
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
