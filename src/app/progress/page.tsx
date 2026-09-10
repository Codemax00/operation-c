'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/AppLayout';
import {
  TrendingUp,
  Award,
  BookOpen,
  HelpCircle,
  FileCode2,
  CheckCircle2,
  Circle,
  Lock,
  ChevronRight,
  Star
} from 'lucide-react';

export default function ProgressPage() {
  const { user, stats, loading: authLoading } = useAuth();
  const router = useRouter();
  const [days, setDays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        const res = await fetch('/api/curriculum');
        if (res.ok) {
          const data = await res.json();
          setDays(data.days || []);
        }
      } catch (err) {
        console.error('Failed to load progress', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, []);

  // Circular progress SVG renderer
  const CircularIndicator = ({ percent, color, label, detail }: { percent: number; color: string; label: string; detail: string }) => {
    const radius = 54;
    const stroke = 10;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col items-center text-center">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg height={radius * 2.5} width={radius * 2.5} className="-rotate-90">
            <circle
              stroke="#e2e8f0"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius * 1.25}
              cy={radius * 1.25}
            />
            <circle
              stroke={color}
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease' }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius * 1.25}
              cy={radius * 1.25}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-slate-900">{percent}%</span>
          </div>
        </div>

        <h3 className="mt-3 text-sm font-bold text-slate-800">{label}</h3>
        <p className="text-xs text-slate-500 font-medium mt-0.5">{detail}</p>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="pb-2 border-b border-slate-200">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>📈</span>
            <span>My Learning Progress</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Detailed performance tracking across class notes, solved question practice, homework assignments, and teacher grades.
          </p>
        </div>

        {/* 4 Performance Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <CircularIndicator
            percent={stats.learningProgress}
            color="#2563eb"
            label="C Learning Progress"
            detail={`${stats.lessonsCompleted} / 30 lessons completed`}
          />

          <CircularIndicator
            percent={stats.practiceProgress}
            color="#4f46e5"
            label="Solved Questions Progress"
            detail={`${stats.practiceCompleted} / 30 days completed`}
          />

          <CircularIndicator
            percent={stats.homeworkProgress}
            color="#9333ea"
            label="Homework Progress"
            detail={`${stats.homeworkCompleted} / ${stats.totalHomework} completed`}
          />

          {/* Average Rating Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Star className="w-8 h-8 fill-amber-400 text-amber-400" />
            </div>
            <div className="flex items-center gap-1 text-amber-400 text-lg mb-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s}>
                  {s <= Math.round(stats.avgRating) ? '★' : '☆'}
                </span>
              ))}
            </div>
            <h3 className="text-xl font-black text-slate-900">
              {stats.avgRating > 0 ? `${stats.avgRating} / 5` : 'No Grades Yet'}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Average Homework Rating
            </p>
          </div>
        </div>

        {/* 30-Day Progress Timeline Matrix */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">30-Day Curriculum Timeline</h2>
              <p className="text-xs text-slate-500">Visual status tracker for lessons, practice, and assignments</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>Completed (✓)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Circle className="w-4 h-4" />
                <span>Pending (○)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {days.map((d) => {
              const formattedDay = `Day ${d.day_number.toString().padStart(2, '0')}`;
              const isAllDone = d.lessonCompleted && d.practiceCompleted;

              return (
                <div
                  key={d.id}
                  onClick={() => router.push(`/notes?day=${d.day_number}`)}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    isAllDone
                      ? 'bg-emerald-50/40 border-emerald-200/80 hover:bg-emerald-50'
                      : d.published
                      ? 'bg-white border-slate-200 hover:border-indigo-300'
                      : 'bg-slate-50 border-slate-200/60 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs font-bold text-indigo-600 shrink-0">
                      {formattedDay}
                    </span>
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {d.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Lesson indicator */}
                    <span
                      title={`Lesson: ${d.lessonCompleted ? 'Completed' : 'Pending'}`}
                      className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                        d.lessonCompleted ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {d.lessonCompleted ? '✓' : '○'}
                    </span>

                    {/* Practice indicator */}
                    <span
                      title={`Practice: ${d.practiceCompleted ? 'Completed' : 'Pending'}`}
                      className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                        d.practiceCompleted ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {d.practiceCompleted ? '✓' : '○'}
                    </span>
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
