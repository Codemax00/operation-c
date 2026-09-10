'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, Lock, User, Sparkles, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginFormContent />
    </React.Suspense>
  );
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  const { setUser, refreshStats } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reason === 'concurrent_session' || reason === 'session_expired') {
      setError('You have been logged out because your account was logged in from another device.');
    }
  }, [reason]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-black text-2xl shadow-lg shadow-indigo-200 mb-4">
          C
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome to C Programming Academy by Umesh
        </h1>
        <p className="mt-2 text-sm font-semibold text-indigo-600 tracking-wide uppercase">
          Student Portal • Learn • Practice • Code • Improve
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
                <span className="ml-2 text-[11px] text-slate-400">c_student_portal.c</span>
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
              <span className="text-blue-400">printf</span>(<span className="text-emerald-300">&quot;Welcome to your 30-Day C Journey!\\n&quot;</span>);
            </div>
            <div className="pl-4 text-indigo-300">
              <span className="text-blue-400">return</span> 0;
            </div>
            <div>&#125;</div>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Student Name or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter your student name or email"
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
              <span>{loading ? 'Authenticating...' : 'Sign In to Student Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          30-Day C Programming Learning &amp; Practice Curriculum • Single Device Active Session Enforced
        </p>
      </div>
    </div>
  );
}
