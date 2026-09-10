'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/AppLayout';
import {
  BookOpen,
  HelpCircle,
  Code2,
  ArrowRight,
  CheckCircle2,
  Lock,
  Sparkles,
  Award,
  ChevronRight,
  Clock,
  PlayCircle
} from 'lucide-react';

interface DayItem {
  id: string;
  day_number: number;
  title: string;
  description: string;
  published: boolean;
  lessonCompleted: boolean;
  practiceCompleted: boolean;
  homeworkStatus: string;
  resources_count: number;
  solved_count: number;
  homework_count: number;
}

export default function DashboardPage() {
  const { user, stats, loading: authLoading, refreshStats } = useAuth();
  const router = useRouter();
  const [days, setDays] = useState<DayItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    const fetchCurriculum = async () => {
      try {
        const res = await fetch('/api/curriculum');
        if (res.ok) {
          const data = await res.json();
          setDays(data.days || []);
        }
      } catch (err) {
        console.error('Failed to load curriculum', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCurriculum();
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading your C curriculum...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-indigo-100">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>30-Day C Programming Challenge</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Student'} 👋
            </h1>
            <p className="mt-2 text-sm md:text-base text-indigo-100 font-medium">
              Continue your C Programming journey. Master syntax, pointers, data structures, and memory management.
            </p>
          </div>

          <div className="absolute right-4 bottom-0 opacity-15 hidden lg:block select-none pointer-events-none text-9xl font-black font-mono">
            &lt;/&gt;
          </div>
        </div>

        {/* Top Overall Progress Section: 3 Horizontal Progress Bars */}
        <div className="bg-white rounded-3xl p-6 md:p-7 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Overall Progress</h2>
              <p className="text-xs text-slate-500 font-medium">Real-time completion based on your completed lessons, practice, and graded homework</p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>Average Rating: {stats.avgRating > 0 ? `${stats.avgRating} / 5 ★` : 'Pending'}</span>
            </div>
          </div>

          <div className="space-y-5">
            {/* Progress 1: C Learning Progress */}
            <div>
              <div className="flex items-center justify-between text-sm font-semibold mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span className="text-slate-700">C Learning Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-normal">{stats.lessonsCompleted} / 30 Days</span>
                  <span className="font-bold text-blue-600">{stats.learningProgress}%</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700 shadow-xs"
                  style={{ width: `${Math.max(stats.learningProgress, 2)}%` }}
                />
              </div>
            </div>

            {/* Progress 2: Practice Questions */}
            <div>
              <div className="flex items-center justify-between text-sm font-semibold mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  <span className="text-slate-700">Practice Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-normal">{stats.practiceCompleted} / 30 Days</span>
                  <span className="font-bold text-indigo-600">{stats.practiceProgress}%</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-700 shadow-xs"
                  style={{ width: `${Math.max(stats.practiceProgress, 2)}%` }}
                />
              </div>
            </div>

            {/* Progress 3: Homework Questions */}
            <div>
              <div className="flex items-center justify-between text-sm font-semibold mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                  <span className="text-slate-700">Homework Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-normal">{stats.homeworkCompleted} / {stats.totalHomework} Questions Graded</span>
                  <span className="font-bold text-purple-600">{stats.homeworkProgress}%</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-700 shadow-xs"
                  style={{ width: `${Math.max(stats.homeworkProgress, 2)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3 Main Primary Cards */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-4">Core Learning Hub</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Class Notes */}
            <div
              onClick={() => router.push('/notes')}
              className="group bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                  📚
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Class Notes
                </h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  Access your daily C programming lessons, presentations and study materials.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700">{stats.lessonsCompleted} / 30 Days</span>
                  <p className="text-[11px] text-blue-600 font-semibold">{stats.learningProgress}% Completed</p>
                </div>
                <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Card 2: Solved Questions */}
            <div
              onClick={() => router.push('/solved')}
              className="group bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-50 transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                  💡
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Solved Questions
                </h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  Learn from questions and understand their solutions with line-by-line explanations.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700">{stats.practiceCompleted} / 30 Days</span>
                  <p className="text-[11px] text-indigo-600 font-semibold">{stats.practiceProgress}% Completed</p>
                </div>
                <span className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Card 3: Homework Questions */}
            <div
              onClick={() => router.push('/homework')}
              className="group bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-50 transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                  💻
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                  Homework Questions
                </h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  Solve programming problems using the built-in C compiler and submit your solutions.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700">{stats.homeworkCompleted} / {stats.totalHomework} Completed</span>
                  <p className="text-[11px] text-purple-600 font-semibold">{stats.homeworkProgress}% Graded</p>
                </div>
                <span className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 30-Day C Programming Curriculum Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">30-Day C Programming Curriculum</h2>
              <p className="text-xs text-slate-500 font-medium">All 30 structured lessons from basic tokens to full mini-project</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
              30 Days Total
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {days.map((item) => {
              const formattedDay = `Day ${item.day_number.toString().padStart(2, '0')}`;
              const isCompleted = item.lessonCompleted && item.practiceCompleted;
              const isPartiallyDone = item.lessonCompleted || item.practiceCompleted;

              let statusText = '🔒 Coming after lecture';
              let statusBadgeClass = 'bg-slate-100 text-slate-500 border border-slate-200/60';

              if (item.published) {
                if (isCompleted) {
                  statusText = '✓ Completed';
                  statusBadgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold';
                } else if (isPartiallyDone) {
                  statusText = '🟡 In Progress';
                  statusBadgeClass = 'bg-amber-50 text-amber-700 border border-amber-200 font-semibold';
                } else {
                  statusText = 'Available — Start Learning';
                  statusBadgeClass = 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold';
                }
              }

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.published) {
                      router.push(`/notes?day=${item.day_number}`);
                    }
                  }}
                  className={`relative p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                    item.published
                      ? 'bg-white border-slate-200/90 hover:border-indigo-400 hover:shadow-md cursor-pointer'
                      : 'bg-slate-50/70 border-slate-200/60 opacity-80 cursor-default'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold text-indigo-600 tracking-wider uppercase font-mono">
                        {formattedDay}
                      </span>
                      {item.published ? (
                        <span className="text-[10px] text-slate-400 font-medium">
                          {item.resources_count} resources
                        </span>
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 leading-snug line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.description || 'Comprehensive lecture materials, solved exercises, and hands-on C homework code.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] ${statusBadgeClass}`}>
                      {statusText}
                    </span>

                    {item.published && (
                      <span className="text-xs font-semibold text-indigo-600 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        <span>Open</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
