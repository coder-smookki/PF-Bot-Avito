'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/Sidebar';
import { LogOut, Bell, Menu, ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

const breadcrumbLabels: Record<string, string> = {
  dashboard: 'Главная',
  tasks: 'Задания',
  create: 'Создать',
  submissions: 'Выполнения',
  wallet: 'Кошелёк',
  profile: 'Профиль',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-slate-200" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          </div>
          <span className="text-sm font-medium text-slate-400">Загрузка...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Build breadcrumbs
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/');
    const label = breadcrumbLabels[seg] || seg;
    return { href, label, isLast: i === segments.length - 1 };
  });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top header bar */}
        <header className="flex h-[72px] items-center justify-between border-b border-slate-200/50 bg-white/80 backdrop-blur-xl px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <Menu className="h-5 w-5 text-slate-600" />
            </button>

            {/* Breadcrumbs */}
            <nav className="hidden sm:flex items-center gap-1 text-sm">
              <Link href="/dashboard" className="text-slate-400 hover:text-indigo-600 transition-colors">
                <Home className="h-4 w-4" />
              </Link>
              {breadcrumbs.map((crumb, i) => (
                <div key={crumb.href} className="flex items-center gap-1">
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                  {crumb.isLast ? (
                    <span className="font-medium text-slate-700">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="text-slate-400 hover:text-indigo-600 transition-colors">
                      {crumb.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <button className="relative p-2.5 rounded-xl hover:bg-slate-100 transition-colors">
              <Bell className="h-5 w-5 text-slate-500" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            {/* User dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-100 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 shadow-md shadow-indigo-500/20">
                  <span className="text-sm font-semibold text-white">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-slate-700">{user.username}</p>
                  <p className="text-xs text-slate-400">
                    {user.role === 'customer' ? 'Заказчик' : 'Исполнитель'}
                  </p>
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white shadow-xl shadow-slate-200/50 border border-slate-200/50 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-900">{user.username}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Профиль
                  </Link>
                  <Link
                    href="/dashboard/wallet"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Кошелёк
                  </Link>
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Выйти
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content with fade-in animation */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="animate-in fade-in duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
