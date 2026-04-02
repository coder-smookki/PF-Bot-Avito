'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Briefcase,
  Wrench,
  CheckCircle2,
} from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();
  const [form, setForm] = useState({
    email: '',
    password: '',
    username: '',
    role: searchParams.get('role') || 'customer',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError('Необходимо принять условия использования');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(form);
      router.push('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Ошибка регистрации. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Gradient Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden gradient-bg">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-20 left-[10%] w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-[10%] w-96 h-96 bg-violet-500/15 rounded-full blur-3xl animate-float-delayed" />

        <div className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full border border-white/10 animate-spin-slow" />
        <div className="absolute bottom-1/3 left-1/4 w-48 h-48 rounded-full border border-white/5 animate-spin-slow" style={{ animationDirection: 'reverse' }} />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">PF Avito</span>
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-6">
            Начните зарабатывать{' '}
            <span className="bg-gradient-to-r from-indigo-300 to-amber-300 bg-clip-text text-transparent">
              прямо сейчас
            </span>
          </h2>

          <p className="text-lg text-slate-300 leading-relaxed max-w-md">
            Создайте аккаунт за минуту и получите доступ ко всем возможностям платформы.
          </p>

          <div className="mt-12 space-y-4">
            {[
              'Бесплатная регистрация',
              'Моментальный старт',
              'Полный контроль заданий',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-slate-300">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/30">
                  <CheckCircle2 className="h-3 w-3 text-emerald-300" />
                </div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex flex-1 items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">PF Avito</span>
            </Link>
          </div>

          <div className="card-hover p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-slate-900">Регистрация</h1>
              <p className="mt-2 text-sm text-slate-500">
                Уже есть аккаунт?{' '}
                <Link href="/auth/login" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                  Войдите
                </Link>
              </p>
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700 animate-slide-up">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 flex-shrink-0">
                  <span className="text-red-500 text-lg">!</span>
                </div>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Выберите роль
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, role: 'customer' })}
                    className={`relative flex flex-col items-center gap-2 rounded-xl p-4 border-2 transition-all duration-300 ${
                      form.role === 'customer'
                        ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-500/10'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {form.role === 'customer' && (
                      <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 ${
                      form.role === 'customer'
                        ? 'bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25'
                        : 'bg-slate-100'
                    }`}>
                      <Briefcase className={`h-6 w-6 ${form.role === 'customer' ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                    <span className={`text-sm font-semibold ${form.role === 'customer' ? 'text-indigo-700' : 'text-slate-600'}`}>
                      Заказчик
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, role: 'executor' })}
                    className={`relative flex flex-col items-center gap-2 rounded-xl p-4 border-2 transition-all duration-300 ${
                      form.role === 'executor'
                        ? 'border-violet-500 bg-violet-50 shadow-lg shadow-violet-500/10'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {form.role === 'executor' && (
                      <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-violet-500">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 ${
                      form.role === 'executor'
                        ? 'bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg shadow-violet-500/25'
                        : 'bg-slate-100'
                    }`}>
                      <Wrench className={`h-6 w-6 ${form.role === 'executor' ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                    <span className={`text-sm font-semibold ${form.role === 'executor' ? 'text-violet-700' : 'text-slate-600'}`}>
                      Исполнитель
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
                  Имя пользователя
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={form.username}
                    onChange={handleChange}
                    className="input-field pl-11"
                    placeholder="Ваш ник"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="input-field pl-11"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Пароль
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={form.password}
                    onChange={handleChange}
                    className="input-field pl-11 pr-11"
                    placeholder="Минимум 6 символов"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-colors"
                />
                <span className="text-sm text-slate-600 leading-relaxed group-hover:text-slate-900 transition-colors">
                  Я принимаю{' '}
                  <a href="#" className="text-indigo-600 hover:text-indigo-500 font-medium">
                    условия использования
                  </a>{' '}
                  и{' '}
                  <a href="#" className="text-indigo-600 hover:text-indigo-500 font-medium">
                    политику конфиденциальности
                  </a>
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-base py-3.5"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Регистрация...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Зарегистрироваться
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
          Загрузка…
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
