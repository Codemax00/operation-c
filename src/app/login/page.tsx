'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Code2, Terminal, ArrowRight, Lock, Mail, ShieldCheck, GraduationCap } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, refreshStats } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to login');
        setLoading(false);
        return;
      }

      setUser(data.user);
      await refreshStats();
      if (data.user.role === 'teacher') {
        router.push('/teacher');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('An unexpected network error occurred');
      setLoading(false);
    }
  };

  const fillCredentials = (type: 'student' | 'teacher') => {
    if (type === 'student') {
      setEmail('student@academy.c');
      setPassword('student123');
    } else {
      setEmail('teacher@academy.c');
      setPassword('teacher123');
    }
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-black text-2xl shadow-lg shadow-indigo-200 mb-4">
          C
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome to C Programming Academy
        </h1>
        <p className="mt-2 text-sm font-semibold text-indigo-600 tracking-wide uppercase">
          Learn • Practice • Code • Improve
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-100 sm:px-10">
          {/* C-Themed Code Visual */}
          <div className="mb-6 rounded-2xl bg-slate-900 text-slate-200 p-4 font-mono text-xs shadow-inner overflow-hidden border border-slate-800">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-[11px] text-slate-400">c_academy_login.c</span>
              </div>
              <span className="text-[10px] text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded">GCC 13.2</span>
            </div>
            <div className="text-slate-400">
              <span className="text-purple-400">#include</span> <span className="text-emerald-400">&lt;stdio.h&gt;</span>
            </div>
            <div className="mt-1">
              <span className="text-blue-400">int</span> <span className="text-amber-300">main</span>() &#123;
            </div>
            <div className="pl-4 text-slate-300">
              <span className="text-blue-400">printf</span>(<span className="text-emerald-300">&quot;Ready to master C in 30 days?\\n&quot;</span>);
            </div>
            <div className="pl-4 text-indigo-300">
              <span className="text-blue-400">return</span> 0;
            </div>
            <div>&#125;</div>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@academy.c"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 focus:ring-4 focus:ring-indigo-200 transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-Click Login Demos */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 text-center uppercase tracking-wider mb-3">
              One-Click Demo Credentials
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => fillCredentials('student')}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/70 text-indigo-700 text-xs font-semibold transition-all cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span>Alex (Student)</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('teacher')}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 text-purple-700 text-xs font-semibold transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Prof. Alan (Teacher)</span>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          30-Day C Programming Learning &amp; Practice Curriculum • Secure Sandboxed Execution
        </p>
      </div>
    </div>
  );
}
