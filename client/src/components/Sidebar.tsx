'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  ClipboardList,
  PlusCircle,
  Wallet,
  User,
  Search,
  FileCheck,
  LayoutDashboard,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Briefcase,
  Wrench,
} from 'lucide-react';

const customerLinks = [
  { href: '/dashboard', label: 'Главная', icon: LayoutDashboard },
  { href: '/dashboard/tasks', label: 'Мои задания', icon: ClipboardList },
  { href: '/dashboard/tasks/create', label: 'Создать задание', icon: PlusCircle },
  { href: '/dashboard/wallet', label: 'Кошелёк', icon: Wallet },
];

const executorLinks = [
  { href: '/dashboard', label: 'Главная', icon: LayoutDashboard },
  { href: '/dashboard/tasks', label: 'Доступные задания', icon: Search },
  { href: '/dashboard/submissions', label: 'Мои выполнения', icon: FileCheck },
  { href: '/dashboard/wallet', label: 'Кошелёк', icon: Wallet },
];

const commonLinks = [
  { href: '/dashboard/profile', label: 'Профиль', icon: User },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const roleLinks = user?.role === 'executor' ? executorLinks : customerLinks;
  const links = [...roleLinks, ...commonLinks];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-slate-900 relative">
      {/* Gradient accent line on left */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 via-violet-500 to-indigo-500" />

      {/* Logo */}
      <div className="flex h-[72px] items-center justify-between px-5 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-xl font-bold text-white whitespace-nowrap transition-opacity duration-200">
              PF Avito
            </span>
          )}
        </Link>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Role Badge */}
      {!collapsed && user && (
        <div className="px-5 pt-4 pb-2">
          <div className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold ${
            user.role === 'customer'
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
          }`}>
            {user.role === 'customer' ? (
              <Briefcase className="h-3 w-3" />
            ) : (
              <Wrench className="h-3 w-3" />
            )}
            {user.role === 'customer' ? 'Заказчик' : 'Исполнитель'}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {links.map((link) => {
          const active = isActive(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              title={collapsed ? link.label : undefined}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/10 text-white border-l-2 border-indigo-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 transition-all duration-200 group-hover:scale-110 ${
                active ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
              }`} />
              {!collapsed && <span className="truncate">{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Balance Display */}
      {!collapsed && (
        <div className="px-4 py-3 mx-3 mb-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Wallet className="h-3.5 w-3.5" />
            Баланс
          </div>
          <div className="text-lg font-bold text-white">0.00 &#8381;</div>
        </div>
      )}

      {/* Profile + Logout */}
      {user && (
        <div className="border-t border-slate-800 p-3">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-indigo-500/20">
              <span className="text-sm font-bold text-indigo-300">
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.username}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={logout}
                className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-all duration-200"
                title="Выйти"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Collapse Toggle (desktop only) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex absolute -right-3 top-20 h-6 w-6 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white transition-all duration-200 shadow-lg z-10"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col transition-all duration-300 ease-out ${collapsed ? 'w-20' : 'w-[272px]'}`}>
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-fade-in"
            onClick={onClose}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[272px] shadow-2xl lg:hidden animate-slide-in-left">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
