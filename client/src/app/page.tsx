'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/Navbar';
import {
  ClipboardList,
  Users,
  Wallet,
  Shield,
  Zap,
  CheckCircle2,
  ArrowRight,
  Briefcase,
  Wrench,
  Eye,
  CreditCard,
  Headphones,
  ChevronDown,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react';

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          const duration = 2000;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <div ref={ref}>{count.toLocaleString('ru-RU')}{suffix}</div>;
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200/60 rounded-2xl overflow-hidden transition-all duration-300 hover:border-indigo-200">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full p-6 text-left"
      >
        <span className="text-base font-semibold text-slate-900 pr-4">{question}</span>
        <ChevronDown
          className={`h-5 w-5 text-indigo-500 flex-shrink-0 transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="px-6 pb-6 text-sm text-slate-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 gradient-bg" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/50 via-transparent to-transparent" />

        {/* Floating orbs */}
        <div className="absolute top-20 left-[10%] w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-[15%] w-96 h-96 bg-violet-500/15 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl animate-pulse-glow" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative mx-auto max-w-7xl px-6 py-28 sm:py-40 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 text-sm text-indigo-200 animate-fade-in">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Платформа нового поколения</span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl animate-slide-up">
              Платформа заданий{' '}
              <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-amber-300 bg-clip-text text-transparent animate-gradient">
                нового поколения
              </span>
            </h1>

            <p className="mt-8 text-lg sm:text-xl leading-8 text-slate-300 max-w-2xl mx-auto animate-slide-up animation-delay-200">
              Размещайте задания и находите исполнителей. Автоматическая проверка,
              моментальные выплаты, прозрачные условия.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up animation-delay-400">
              {user ? (
                <Link
                  href="/dashboard"
                  className="btn-primary text-base px-8 py-4 gap-2 animate-pulse-glow"
                >
                  Перейти в кабинет
                  <ArrowRight className="h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/register?role=customer"
                    className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-indigo-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/50 hover:scale-105"
                  >
                    <Briefcase className="h-5 w-5" />
                    Стать заказчиком
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/auth/register?role=executor"
                    className="group inline-flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-8 py-4 text-base font-semibold text-white transition-all duration-300 hover:bg-white/20 hover:scale-105"
                  >
                    <Wrench className="h-5 w-5" />
                    Стать исполнителем
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Stats Bar */}
      <section className="relative -mt-12 z-10">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { value: 1000, suffix: '+', label: 'Заданий создано', icon: ClipboardList },
              { value: 500, suffix: '+', label: 'Исполнителей', icon: Users },
              { value: 99, suffix: '%', label: 'Успешных выплат', icon: TrendingUp },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`card-hover p-6 flex items-center gap-4 animate-slide-up animation-delay-${(i + 1) * 200}`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/20">
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="как-это-работает" className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 mb-4">
              <Zap className="h-4 w-4" />
              Просто и быстро
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Как это работает
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Три простых шага для начала работы на платформе
            </p>
          </div>

          <div className="mx-auto max-w-4xl">
            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-12 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-0.5 bg-gradient-to-r from-indigo-200 via-violet-200 to-indigo-200" />

              {[
                {
                  step: '01',
                  title: 'Регистрация',
                  description: 'Создайте аккаунт за минуту. Выберите роль заказчика или исполнителя.',
                  icon: Users,
                },
                {
                  step: '02',
                  title: 'Создайте или найдите задание',
                  description: 'Заказчики публикуют задания, исполнители выбирают подходящие.',
                  icon: ClipboardList,
                },
                {
                  step: '03',
                  title: 'Получите результат',
                  description: 'Автоматическая проверка и моментальные выплаты после одобрения.',
                  icon: CheckCircle2,
                },
              ].map((item, i) => (
                <div key={item.step} className="relative text-center group">
                  <div className="relative inline-flex mb-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-xl shadow-indigo-500/25 transition-transform duration-300 group-hover:scale-110">
                      <item.icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-slate-900 shadow-md">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features for Customers */}
      <section id="для-заказчиков" className="py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 mb-4">
              <Briefcase className="h-4 w-4" />
              Для заказчиков
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Все инструменты для управления заданиями
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Размещайте задания и получайте результат в кратчайшие сроки
            </p>
          </div>

          <div className="mx-auto max-w-5xl grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: ClipboardList,
                title: 'Создавайте задания',
                description: 'Удобный конструктор заданий. Укажите описание, инструкции и бюджет за пару минут.',
                color: 'from-indigo-500 to-blue-500',
              },
              {
                icon: Shield,
                title: 'Контроль качества',
                description: 'Скриншоты, контрольные вопросы или ручная проверка -- выбирайте подходящий способ.',
                color: 'from-violet-500 to-purple-500',
              },
              {
                icon: CreditCard,
                title: 'Гибкая оплата',
                description: 'Средства замораживаются до подтверждения. Полная прозрачность всех транзакций.',
                color: 'from-amber-500 to-orange-500',
              },
            ].map((feature) => (
              <div key={feature.title} className="group card-hover p-8">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} shadow-lg shadow-indigo-500/10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="mt-6 text-lg font-bold text-slate-900">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features for Executors */}
      <section id="для-исполнителей" className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-600 mb-4">
              <Wrench className="h-4 w-4" />
              Для исполнителей
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Зарабатывайте на своих навыках
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Выполняйте задания и получайте оплату мгновенно
            </p>
          </div>

          <div className="mx-auto max-w-5xl grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Eye,
                title: 'Выбирайте задания',
                description: 'Широкий каталог заданий различной сложности. Фильтры и сортировка для удобного поиска.',
                color: 'from-emerald-500 to-teal-500',
              },
              {
                icon: Zap,
                title: 'Быстрые выплаты',
                description: 'Получайте оплату сразу после одобрения. Никаких задержек и скрытых комиссий.',
                color: 'from-amber-500 to-yellow-500',
              },
              {
                icon: Star,
                title: 'Удобный кабинет',
                description: 'Отслеживайте статистику, историю выплат и управляйте профилем в одном месте.',
                color: 'from-violet-500 to-indigo-500',
              },
            ].map((feature) => (
              <div key={feature.title} className="group card-hover p-8">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} shadow-lg shadow-indigo-500/10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="mt-6 text-lg font-bold text-slate-900">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / Commission */}
      <section className="py-24 gradient-bg relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-800/30 via-transparent to-transparent" />
        <div className="absolute top-10 left-[20%] w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-[20%] w-48 h-48 bg-violet-500/10 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 text-sm text-indigo-200 mb-6">
            <Wallet className="h-4 w-4" />
            Прозрачные условия
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Комиссия платформы
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            Минимальная комиссия для максимальной выгоды
          </p>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="glass rounded-2xl p-8 text-center group hover:bg-white/15 transition-all duration-300">
              <Briefcase className="h-10 w-10 text-indigo-300 mx-auto mb-4" />
              <div className="text-4xl font-bold text-white mb-2">5%</div>
              <div className="text-indigo-200 font-medium">Для заказчиков</div>
              <p className="mt-3 text-sm text-slate-400">Комиссия от суммы задания при создании</p>
            </div>
            <div className="glass rounded-2xl p-8 text-center group hover:bg-white/15 transition-all duration-300">
              <Wrench className="h-10 w-10 text-violet-300 mx-auto mb-4" />
              <div className="text-4xl font-bold text-white mb-2">10%</div>
              <div className="text-violet-200 font-medium">Для исполнителей</div>
              <p className="mt-3 text-sm text-slate-400">Комиссия от оплаты при выводе средств</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 mb-4">
              <Headphones className="h-4 w-4" />
              Поддержка
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Частые вопросы
            </h2>
          </div>

          <div className="space-y-3">
            <FAQItem
              question="Как начать работу на платформе?"
              answer="Зарегистрируйтесь, выберите роль (заказчик или исполнитель) и начните работу. Заказчики могут сразу создавать задания, а исполнители -- выбирать из доступных."
            />
            <FAQItem
              question="Как происходит проверка выполнения?"
              answer="Платформа поддерживает три типа верификации: скриншот, контрольный вопрос и ручная проверка. Заказчик выбирает подходящий тип при создании задания."
            />
            <FAQItem
              question="Как выводить заработанные средства?"
              answer="Перейдите в раздел «Кошелёк» в личном кабинете. Выберите сумму и способ вывода. Средства поступают в течение 24 часов."
            />
            <FAQItem
              question="Какие гарантии безопасности?"
              answer="Средства заказчика замораживаются при создании задания и передаются исполнителю только после подтверждения выполнения. Мы обеспечиваем безопасность всех транзакций."
            />
            <FAQItem
              question="Можно ли отменить задание?"
              answer="Да, заказчик может приостановить или отменить задание. Неиспользованные средства возвращаются на баланс кошелька."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-slate-900 pt-16 pb-8">
        {/* Gradient top border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">PF Avito</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Платформа заданий нового поколения. Быстро, удобно и безопасно.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Платформа</h4>
              <ul className="space-y-3">
                {['Как это работает', 'Для заказчиков', 'Для исполнителей', 'Комиссия'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Поддержка</h4>
              <ul className="space-y-3">
                {['Частые вопросы', 'Связаться с нами', 'Telegram бот', 'Документация'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Правовая информация</h4>
              <ul className="space-y-3">
                {['Пользовательское соглашение', 'Политика конфиденциальности', 'Оферта'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-slate-800 pt-8">
            <p className="text-center text-sm text-slate-500">
              &copy; {new Date().getFullYear()} PF Avito. Все права защищены.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
