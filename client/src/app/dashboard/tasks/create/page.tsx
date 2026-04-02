'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { tasksApi, uploadsApi } from '@/lib/api';
import {
  Upload,
  X,
  Send,
  FileText,
  Image as ImageIcon,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  Camera,
  HelpCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Loader2,
  Zap,
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Основное', icon: FileText },
  { id: 2, label: 'Медиа', icon: ImageIcon },
  { id: 3, label: 'Оплата', icon: DollarSign },
  { id: 4, label: 'Верификация', icon: ShieldCheck },
  { id: 5, label: 'Подтверждение', icon: CheckCircle2 },
];

const VERIFICATION_TYPES = [
  { value: 'screenshot', label: 'Скриншот', description: 'Исполнитель прикрепляет скриншот', icon: Camera },
  { value: 'question', label: 'Контрольный вопрос', description: 'Ответ на контрольный вопрос', icon: HelpCircle },
  { value: 'manual', label: 'Ручная проверка', description: 'Вы проверяете вручную', icon: Eye },
];

export default function CreateTaskPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: '',
    description: '',
    instructions: '',
    pricePerExecution: '',
    totalBudget: '',
    verificationType: 'screenshot',
    controlQuestion: '',
    controlAnswer: '',
  });
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addFiles = useCallback((files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    setImages((prev) => [...prev, ...imageFiles]);
    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files || []));
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles]
  );

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const imageUrls: string[] = [];
      for (const img of images) {
        const { data } = await uploadsApi.uploadFile(img);
        if (data?.url) imageUrls.push(data.url as string);
      }

      const pricePerExecution = Number(form.pricePerExecution);
      const totalBudget = Number(form.totalBudget);
      await tasksApi.create({
        title: form.title,
        description: form.description,
        instructions: form.instructions || undefined,
        pricePerExecution,
        totalBudget,
        verificationType: form.verificationType,
        controlQuestion:
          form.verificationType === 'question' ? form.controlQuestion : undefined,
        controlAnswer:
          form.verificationType === 'question' ? form.controlAnswer : undefined,
        imageUrls: imageUrls.length ? imageUrls : undefined,
      });
      router.push('/dashboard/tasks');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string | string[] } } };
      const msg = axiosErr.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Ошибка создания задания');
    } finally {
      setLoading(false);
    }
  };

  const canNext = () => {
    switch (step) {
      case 1: return form.title && form.description && form.instructions;
      case 2: return true;
      case 3: return form.pricePerExecution && form.totalBudget;
      case 4:
        if (form.verificationType === 'question') return form.controlQuestion && form.controlAnswer;
        return true;
      default: return true;
    }
  };

  const execCount = form.pricePerExecution && form.totalBudget
    ? Math.floor(Number(form.totalBudget) / Number(form.pricePerExecution))
    : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Создать задание</h1>
        <p className="mt-1 text-slate-500 text-sm">Заполните информацию о задании</p>
      </div>

      {/* Step progress indicator */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 p-6">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isCompleted = step > s.id;
            const isCurrent = step === s.id;
            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <button
                  onClick={() => s.id < step && setStep(s.id)}
                  className={`flex flex-col items-center gap-2 ${s.id <= step ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 ${
                      isCompleted
                        ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25'
                        : isCurrent
                        ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25 ring-4 ring-indigo-500/20'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${isCurrent ? 'text-indigo-600' : isCompleted ? 'text-slate-600' : 'text-slate-400'}`}>
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 rounded-full transition-colors duration-300 ${step > s.id ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200/50 p-4 text-sm text-red-700 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 shrink-0">
            <X className="h-4 w-4 text-red-600" />
          </div>
          {error}
        </div>
      )}

      {/* Step content */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 p-6 lg:p-8">
        {/* Step 1: Basic info */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Название задания</label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 focus:bg-white transition-all"
                  placeholder="Краткое название задания"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Описание</label>
              <textarea
                name="description"
                rows={4}
                value={form.description}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 focus:bg-white transition-all resize-none"
                placeholder="Подробное описание задания"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Инструкции для исполнителя</label>
              <textarea
                name="instructions"
                rows={5}
                value={form.instructions}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 focus:bg-white transition-all resize-none"
                placeholder="Пошаговые инструкции для исполнителя"
              />
            </div>
          </div>
        )}

        {/* Step 2: Media */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Изображения</label>
              <p className="text-sm text-slate-400 mb-4">Добавьте изображения для наглядности задания</p>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                  dragActive
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25">
                    <Upload className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Перетащите изображения сюда
                    </p>
                    <p className="text-xs text-slate-400 mt-1">или нажмите для выбора файлов</p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageAdd}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              {/* Preview grid */}
              {previews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mt-6">
                  {previews.map((src, i) => (
                    <div key={i} className="relative group aspect-square rounded-xl overflow-hidden ring-1 ring-slate-200 shadow-sm">
                      <img src={src} alt="" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Цена за выполнение</label>
              <div className="relative">
                <Zap className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  name="pricePerExecution"
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.pricePerExecution}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 focus:bg-white transition-all"
                  placeholder="0.00"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">&#8381;</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Общий бюджет</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  name="totalBudget"
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.totalBudget}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 focus:bg-white transition-all"
                  placeholder="0.00"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">&#8381;</span>
              </div>
            </div>

            {/* Auto-calculated executions count */}
            {execCount > 0 && (
              <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-indigo-600 font-medium">Количество выполнений</p>
                    <p className="text-2xl font-bold text-indigo-700">{execCount}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Verification */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-4">Тип верификации</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {VERIFICATION_TYPES.map((v) => {
                  const Icon = v.icon;
                  const isSelected = form.verificationType === v.value;
                  return (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => setForm({ ...form, verificationType: v.value })}
                      className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-500/10'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all ${
                        isSelected
                          ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25'
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="text-center">
                        <p className={`text-sm font-semibold ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>{v.label}</p>
                        <p className="text-xs text-slate-400 mt-1">{v.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {form.verificationType === 'question' && (
              <div className="space-y-4 rounded-2xl bg-slate-50 border border-slate-200/50 p-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Контрольный вопрос</label>
                  <div className="relative">
                    <HelpCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      name="controlQuestion"
                      value={form.controlQuestion}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                      placeholder="Вопрос для проверки выполнения"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Правильный ответ</label>
                  <div className="relative">
                    <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      name="controlAnswer"
                      value={form.controlAnswer}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                      placeholder="Ожидаемый ответ"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Confirmation */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">Проверьте данные</h2>

            <div className="space-y-4">
              {/* Basic info summary */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200/50 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">Основное</h3>
                  <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700">
                    <Pencil className="h-3 w-3" /> Изменить
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="text-slate-400">Название:</span> <span className="text-slate-700 font-medium">{form.title}</span></p>
                  <p><span className="text-slate-400">Описание:</span> <span className="text-slate-700">{form.description}</span></p>
                  <p><span className="text-slate-400">Инструкции:</span> <span className="text-slate-700">{form.instructions}</span></p>
                </div>
              </div>

              {/* Media summary */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200/50 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">Медиа</h3>
                  <button onClick={() => setStep(2)} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700">
                    <Pencil className="h-3 w-3" /> Изменить
                  </button>
                </div>
                <p className="text-sm text-slate-600">Изображений: {images.length}</p>
                {previews.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {previews.slice(0, 4).map((src, i) => (
                      <img key={i} src={src} alt="" className="h-16 w-16 rounded-lg object-cover ring-1 ring-slate-200" />
                    ))}
                    {previews.length > 4 && (
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-200 text-xs font-medium text-slate-500">
                        +{previews.length - 4}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Payment summary */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200/50 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">Оплата</h3>
                  <button onClick={() => setStep(3)} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700">
                    <Pencil className="h-3 w-3" /> Изменить
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="text-slate-400">Цена:</span> <span className="text-slate-700 font-medium">{form.pricePerExecution} &#8381;</span></p>
                  <p><span className="text-slate-400">Бюджет:</span> <span className="text-slate-700 font-medium">{form.totalBudget} &#8381;</span></p>
                  <p><span className="text-slate-400">Выполнений:</span> <span className="text-indigo-600 font-semibold">{execCount}</span></p>
                </div>
              </div>

              {/* Verification summary */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200/50 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">Верификация</h3>
                  <button onClick={() => setStep(4)} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700">
                    <Pencil className="h-3 w-3" /> Изменить
                  </button>
                </div>
                <p className="text-sm text-slate-600">
                  {VERIFICATION_TYPES.find((v) => v.value === form.verificationType)?.label}
                </p>
                {form.verificationType === 'question' && (
                  <div className="mt-2 space-y-1 text-sm">
                    <p><span className="text-slate-400">Вопрос:</span> <span className="text-slate-700">{form.controlQuestion}</span></p>
                    <p><span className="text-slate-400">Ответ:</span> <span className="text-slate-700">{form.controlAnswer}</span></p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-200/50 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
          Назад
        </button>

        {step < 5 ? (
          <button
            onClick={() => setStep((s) => Math.min(5, s + 1))}
            disabled={!canNext()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Далее
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 disabled:opacity-60 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Создание...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Создать задание
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
