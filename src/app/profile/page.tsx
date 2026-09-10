'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/AppLayout';
import {
  User,
  Mail,
  GraduationCap,
  ShieldCheck,
  Calendar,
  Award,
  LogOut,
  Sparkles,
  BookOpen,
  Code2,
  FileCode2
} from 'lucide-react';

export default function ProfilePage() {
  const { user, stats, logout } = useAuth();

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="pb-2 border-b border-slate-200">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>👤</span>
            <span>Student Profile &amp; Settings</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage your credentials, view academy enrollment status, and inspect course accomplishments.
          </p>
        </div>

        {/* Profile Info Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-extrabold text-3xl shadow-md shadow-indigo-200">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-extrabold text-slate-900 truncate">{user?.name || 'Student Name'}</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {user?.role === 'teacher' ? <ShieldCheck className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
                  {user?.role === 'teacher' ? 'Teacher / Instructor' : 'Enrolled Student'}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 font-mono">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user?.email || 'email@academy.c'}</span>
              </p>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Enrolled: September 2026 Batch</span>
              </p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <BookOpen className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Lessons</span>
              </div>
              <p className="text-xl font-black text-slate-900">{stats.lessonsCompleted} / 30</p>
              <span className="text-[11px] text-blue-600 font-semibold">{stats.learningProgress}% Done</span>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
              <div className="flex items-center gap-2 text-indigo-600 mb-1">
                <Code2 className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Practice</span>
              </div>
              <p className="text-xl font-black text-slate-900">{stats.practiceCompleted} / 30</p>
              <span className="text-[11px] text-indigo-600 font-semibold">{stats.practiceProgress}% Done</span>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <FileCode2 className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Homework</span>
              </div>
              <p className="text-xl font-black text-slate-900">{stats.homeworkCompleted} / {stats.totalHomework}</p>
              <span className="text-[11px] text-purple-600 font-semibold">{stats.homeworkProgress}% Graded</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
              <div className="flex items-center gap-2 text-amber-600 mb-1">
                <Award className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Rating</span>
              </div>
              <p className="text-xl font-black text-slate-900">{stats.avgRating > 0 ? `${stats.avgRating} ★` : '—'}</p>
              <span className="text-[11px] text-amber-600 font-semibold">Teacher Evaluation</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={logout}
              className="px-5 py-2.5 rounded-2xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out of C Academy</span>
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
