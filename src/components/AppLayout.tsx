'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  Code2,
  FileCode2,
  TrendingUp,
  User,
  LogOut,
  Bell,
  Menu,
  X,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, stats, notifications, unreadCount, markNotificationRead, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  // Close notification popover when clicking anywhere outside or on route change
  useEffect(() => {
    setShowNotifMenu(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  const renderNotificationDropdown = () => (
    <>
      {/* Invisible backdrop to dismiss notifications when tapping anywhere on screen */}
      <div
        className="fixed inset-0 z-40"
        onClick={() => setShowNotifMenu(false)}
        onTouchStart={() => setShowNotifMenu(false)}
      />
      <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Notifications</span>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markNotificationRead()}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-72 overflow-y-auto space-y-2">
          {notifications.length === 0 ? (
            <div className="py-6 text-center text-slate-400">
              <Bell className="w-6 h-6 mx-auto mb-1 opacity-30" />
              <p className="text-xs font-medium">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markNotificationRead(notif.id)}
                className={`p-3 rounded-xl text-xs cursor-pointer transition-all ${
                  notif.read === 0
                    ? 'bg-indigo-50/80 border border-indigo-100 hover:bg-indigo-100/60'
                    : 'bg-slate-50 border border-slate-100 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-slate-800 line-clamp-1">{notif.title}</p>
                  {notif.type === 'urgent' && (
                    <span className="text-[9px] font-extrabold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">Urgent</span>
                  )}
                  {notif.type === 'homework' && (
                    <span className="text-[9px] font-extrabold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">Homework</span>
                  )}
                </div>
                <p className="text-slate-600 mt-1 leading-relaxed text-[11px]">{notif.message}</p>
                <span className="text-[10px] text-slate-400 mt-1.5 block">
                  {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Class Notes', href: '/notes', icon: BookOpen },
    { name: 'Solved Questions', href: '/solved', icon: HelpCircle },
    { name: 'Practice Questions', href: '/practice', icon: Code2 },
    { name: 'Homework', href: '/homework', icon: FileCode2 },
    { name: 'My Progress', href: '/progress', icon: TrendingUp },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  // If user is a teacher, add Teacher Dashboard
  const isTeacher = user?.role === 'teacher';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-xs">
              C
            </div>
            <span className="font-bold text-slate-800 tracking-tight">C Academy</span>
          </div>
        </div>

        {/* Notifications & User on Mobile */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse ring-2 ring-white" />
              )}
            </button>

            {showNotifMenu && renderNotificationDropdown()}
          </div>

          <button
            onClick={() => router.push('/profile')}
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs border border-indigo-200 cursor-pointer active:scale-95 transition-transform"
            title="Open Profile"
            aria-label="Open Profile"
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative bg-white w-72 max-w-[80vw] h-full shadow-2xl flex flex-col z-50">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                  C
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-sm leading-tight">C Academy</h2>
                  <p className="text-xs text-indigo-600 font-medium">30-Day Masterclass</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 bg-indigo-50/50">
              <p className="text-xs text-slate-500 font-medium">Logged in as</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.name || 'Student'}</p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-md text-[11px] font-semibold bg-indigo-100 text-indigo-700">
                {isTeacher ? <ShieldCheck className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
                {isTeacher ? 'Teacher / Admin' : 'Student'}
              </span>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {isTeacher && (
                <button
                  onClick={() => { router.push('/teacher'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    pathname.startsWith('/teacher')
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-purple-700 bg-purple-50 hover:bg-purple-100'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Teacher Portal</span>
                </button>
              )}

              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <button
                    key={item.name}
                    onClick={() => { router.push(item.href); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-3 border-t border-slate-100">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0 sticky top-0 h-screen shadow-xs">
        {/* Brand */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm shadow-indigo-200">
            C
          </div>
          <div>
            <h1 className="font-bold text-slate-900 tracking-tight leading-tight">C Academy</h1>
            <p className="text-[11px] text-indigo-600 font-semibold tracking-wide uppercase">30-Day Masterclass</p>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/50 border border-indigo-100/70 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'Loading...'}</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600">
                {isTeacher ? <ShieldCheck className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
                {isTeacher ? 'Instructor' : 'Day ' + (stats.lessonsCompleted + 1 <= 30 ? stats.lessonsCompleted + 1 : 30) + ' Student'}
              </span>
            </div>
          </div>

          {!isTeacher && (
            <div className="mt-3 pt-2.5 border-t border-indigo-100/60">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-500 font-medium">Overall Course</span>
                <span className="font-bold text-indigo-700">{stats.learningProgress}%</span>
              </div>
              <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${stats.learningProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-1">
          {isTeacher && (
            <button
              onClick={() => router.push('/teacher')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-2 ${
                pathname.startsWith('/teacher')
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-200'
                  : 'text-purple-700 bg-purple-50/70 hover:bg-purple-100 border border-purple-200/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4" />
                <span>Teacher Portal</span>
              </div>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {active && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
              </button>
            );
          })}
        </nav>

        {/* Bottom User Actions */}
        <div className="p-3 border-t border-slate-100 space-y-1">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Header */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-20">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {pathname === '/dashboard' && 'Student Learning Center'}
              {pathname === '/notes' && 'Daily Class Notes & Resources'}
              {pathname === '/solved' && 'Solved Questions & Explanations'}
              {pathname === '/practice' && 'C Programming Practice Arena'}
              {pathname === '/homework' && 'Interactive Homework & Online C Compiler'}
              {pathname === '/progress' && 'Curriculum Progress & Performance'}
              {pathname === '/profile' && 'Student Profile & Settings'}
              {pathname.startsWith('/teacher') && 'Teacher Management Dashboard'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">30-Day Intensive C Language Curriculum</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications Menu on Desktop */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifMenu && renderNotificationDropdown()}
            </div>

            {/* User Quick Info on Desktop */}
            <button
              onClick={() => router.push('/profile')}
              className="flex items-center gap-3 pl-3 border-l border-slate-200 hover:opacity-85 transition-opacity cursor-pointer text-left group"
              title="Open Profile"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{user?.name || 'Guest'}</p>
                <p className="text-[11px] text-slate-400 capitalize">{user?.role || 'student'}</p>
              </div>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
