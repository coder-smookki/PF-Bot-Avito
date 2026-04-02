'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { LogOut, LayoutDashboard, Menu, X, Sparkles } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-lg shadow-indigo-500/5'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25 transition-transform duration-300 group-hover:scale-110">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">PF Avito</span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {['Как это работает', 'Для заказчиков', 'Для исполнителей'].map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase().replace(/\s/g, '-')}`}
                className="relative px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-indigo-600 group"
              >
                {label}
                <span className="absolute bottom-0 left-1/2 h-0.5 w-0 bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 group-hover:left-4 group-hover:w-[calc(100%-2rem)]" />
              </a>
            ))}
          </nav>

          {/* Auth Buttons Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link href="/dashboard" className="btn-secondary text-sm gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Кабинет
                </Link>
                <button onClick={logout} className="btn-secondary text-sm gap-2">
                  <LogOut className="h-4 w-4" />
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 rounded-xl border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-all duration-300"
                >
                  Войти
                </Link>
                <Link href="/auth/register" className="btn-primary text-sm">
                  Регистрация
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in" />
        </div>
      )}

      {/* Mobile Slide-in Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-out md:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <span className="text-lg font-bold gradient-text">PF Avito</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-6 space-y-2">
          {['Как это работает', 'Для заказчиков', 'Для исполнителей'].map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase().replace(/\s/g, '-')}`}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 text-sm font-medium text-slate-600 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="p-6 space-y-3 border-t border-slate-100">
          {user ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="btn-primary w-full gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Кабинет
              </Link>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
                className="btn-secondary w-full gap-2"
              >
                <LogOut className="h-4 w-4" />
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                onClick={() => setMobileOpen(false)}
                className="btn-secondary w-full"
              >
                Войти
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileOpen(false)}
                className="btn-primary w-full"
              >
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
