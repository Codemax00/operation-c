'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/AppLayout';
import confetti from 'canvas-confetti';
import {
  FileCode2,
  Play,
  RotateCcw,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Star,
  MessageSquare,
  Lock,
  Terminal,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';

interface HomeworkQuestion {
  id: string;
  day_id: string;
  question: string;
  starter_code: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  published: number;
  submission: {
    id: string;
    code: string;
    output: string;
    compilation_status: string;
    submitted_at: string;
    status: string;
    stars: number | null;
    feedback: string | null;
    graded_at: string | null;
  } | null;
}

export default function HomeworkPage() {
  return (
    <React.Suspense fallback={
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    }>
      <HomeworkContent />
    </React.Suspense>
  );
}

function HomeworkContent() {
  const searchParams = useSearchParams();
  const dayParam = searchParams.get('day');
  const { user, refreshStats } = useAuth();

  const [days, setDays] = useState<any[]>([]);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(dayParam ? parseInt(dayParam, 10) : 1);
  const [currentDayDetails, setCurrentDayDetails] = useState<any>(null);
  const [questions, setQuestions] = useState<HomeworkQuestion[]>([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0);

  // Editor and Compiler state
  const [code, setCode] = useState<string>('');
  const [stdinInput, setStdinInput] = useState<string>('');
  const [compilerOutput, setCompilerOutput] = useState<string>('');
  const [compilationError, setCompilationError] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runSuccess, setRunSuccess] = useState<boolean | null>(null);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch all days
  useEffect(() => {
    const fetchAllDays = async () => {
      try {
        const res = await fetch('/api/curriculum');
        if (res.ok) {
          const data = await res.json();
          setDays(data.days || []);
        }
      } catch (err) {
        console.error('Failed to load curriculum', err);
      }
    };
    fetchAllDays();
  }, []);

  // Fetch questions for selected day
  useEffect(() => {
    const fetchDayHomework = async () => {
      setLoading(true);
      setCompilerOutput('');
      setCompilationError('');
      setRunSuccess(null);
      setSubmitMessage(null);

      try {
        const res = await fetch(`/api/days/${selectedDayNumber}`);
        if (res.ok) {
          const data = await res.json();
          setCurrentDayDetails(data.day);
          const hwList = data.homeworkQuestions || [];
          setQuestions(hwList);
          setSelectedQuestionIndex(0);

          if (hwList.length > 0) {
            const firstQ = hwList[0];
            if (firstQ.submission) {
              setCode(firstQ.submission.code);
              setCompilerOutput(firstQ.submission.output || '');
              setRunSuccess(true);
            } else {
              setCode(firstQ.starter_code || '#include <stdio.h>\n\nint main() {\n    printf("Hello World\\n");\n    return 0;\n}');
            }
          }
        }
      } catch (err) {
        console.error('Failed to load homework', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDayHomework();
  }, [selectedDayNumber]);

  // When active question changes
  const activeQuestion = questions[selectedQuestionIndex] || null;

  useEffect(() => {
    if (activeQuestion) {
      if (activeQuestion.submission) {
        setCode(activeQuestion.submission.code);
        setCompilerOutput(activeQuestion.submission.output || '');
        setRunSuccess(true);
      } else {
        setCode(activeQuestion.starter_code || '#include <stdio.h>\n\nint main() {\n    printf("Hello World\\n");\n    return 0;\n}');
        setCompilerOutput('');
        setRunSuccess(null);
      }
      setCompilationError('');
      setSubmitMessage(null);
    }
  }, [selectedQuestionIndex, activeQuestion]);

  // Run C Code in Sandbox
  const handleRunCode = async () => {
    if (!code.trim() || isRunning) return;
    setIsRunning(true);
    setCompilerOutput('');
    setCompilationError('');
    setRunSuccess(null);
    setSubmitMessage(null);

    try {
      const res = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, stdin: stdinInput })
      });

      const data = await res.json();

      if (data.success) {
        setCompilerOutput(data.output || '(Program finished with no stdout output)');
        setRunSuccess(true);
      } else {
        setCompilationError(data.compilationError || data.error || 'Compilation or runtime failed.');
        setRunSuccess(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Execution error';
      setCompilationError(`Failed to reach compilation server: ${msg}`);
      setRunSuccess(false);
    } finally {
      setIsRunning(false);
    }
  };

  // Submit Answer
  const handleSubmitAnswer = async () => {
    if (!activeQuestion || !code.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const res = await fetch('/api/homework/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeworkQuestionId: activeQuestion.id,
          code,
          stdin: stdinInput
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitMessage({
          type: 'success',
          text: '✓ Homework successfully submitted! Waiting for teacher review.'
        });

        // Update local question state
        setQuestions(prev => {
          const updated = [...prev];
          updated[selectedQuestionIndex] = {
            ...updated[selectedQuestionIndex],
            submission: {
              id: data.submissionId,
              code,
              output: data.output || compilerOutput,
              compilation_status: 'success',
              submitted_at: new Date().toISOString(),
              status: 'Submitted',
              stars: null,
              feedback: null,
              graded_at: null
            }
          };
          return updated;
        });

        await refreshStats();

        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        setSubmitMessage({
          type: 'error',
          text: data.error || 'Submission rejected by server'
        });
        if (data.compilationError) {
          setCompilationError(data.compilationError);
          setRunSuccess(false);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setSubmitMessage({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset / Clear code
  const handleReset = () => {
    if (activeQuestion?.starter_code) {
      setCode(activeQuestion.starter_code);
    } else {
      setCode('#include <stdio.h>\n\nint main() {\n    // Type your C program here\n    \n    return 0;\n}');
    }
    setCompilerOutput('');
    setCompilationError('');
    setRunSuccess(null);
    setSubmitMessage(null);
  };

  // Handle Tab key inside textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
  };

  // Helper for Status Badge
  const getStatusBadge = (sub: any) => {
    if (!sub) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>🔵 Not Started</span>
        </span>
      );
    }

    if (sub.status === 'Graded' && sub.stars !== null) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>🟢 Graded ({sub.stars} ★)</span>
        </span>
      );
    }

    if (sub.status === 'Needs Improvement') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>🔴 Needs Improvement</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
        <span className="w-2 h-2 rounded-full bg-purple-500" />
        <span>🟣 Submitted</span>
      </span>
    );
  };

  const isAlreadyGraded = Boolean(activeQuestion?.submission?.stars !== null && activeQuestion?.submission?.stars !== undefined && activeQuestion?.submission?.status === 'Graded');

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>💻</span>
              <span>Homework &amp; Built-in C Compiler</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Solve programming assignments using the isolated online GCC compiler, test stdout, and submit for teacher evaluation.
            </p>
          </div>
        </div>

        {/* 30-Day Quick Selector Pills */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
            <span>Select Curriculum Day</span>
            <span className="text-indigo-600 font-semibold">Day {selectedDayNumber} of 30</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {Array.from({ length: 30 }, (_, i) => i + 1).map((dayNum) => {
              const matching = days.find(d => d.day_number === dayNum);
              const isSelected = selectedDayNumber === dayNum;
              const isPub = matching?.published;
              const hwStatus = matching?.homeworkStatus;

              return (
                <button
                  key={dayNum}
                  onClick={() => setSelectedDayNumber(dayNum)}
                  className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 ring-2 ring-indigo-600 ring-offset-2'
                      : hwStatus === 'Graded'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      : hwStatus === 'Submitted'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                      : isPub
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-slate-50 text-slate-400 border border-dashed border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>Day {dayNum.toString().padStart(2, '0')}</span>
                  {hwStatus === 'Graded' && <span className="text-emerald-500 font-bold">★</span>}
                  {!isPub && <Lock className="w-3 h-3 text-slate-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading homework assignment for Day {selectedDayNumber}...</p>
          </div>
        ) : !currentDayDetails?.published || questions.length === 0 ? (
          <div className="p-8 md:p-12 rounded-2xl bg-slate-50 border border-slate-200 text-center max-w-xl mx-auto space-y-3 my-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-600 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              🔒 Homework coming after lecture
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Homework programming questions for Day {selectedDayNumber} ({currentDayDetails?.title || 'Upcoming'}) will be published by the instructor after class.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Question Details & Questions List (4 cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Question Navigation Tabs if multiple questions */}
              {questions.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {questions.map((q, idx) => (
                    <button
                      key={q.id}
                      onClick={() => setSelectedQuestionIndex(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedQuestionIndex === idx
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Question {idx + 1}
                    </button>
                  ))}
                </div>
              )}

              {/* Question Card */}
              {activeQuestion && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600 uppercase font-mono">
                      Day {currentDayDetails.day_number.toString().padStart(2, '0')} Homework
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {activeQuestion.difficulty}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Problem Statement
                    </h3>
                    <div className="text-sm font-semibold text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/60 font-mono">
                      {activeQuestion.question}
                    </div>
                  </div>

                  {/* Submission Status Indicator */}
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Submission Status
                      </span>
                      {getStatusBadge(activeQuestion.submission)}
                    </div>

                    {activeQuestion.submission ? (
                      <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Submitted on:</span>
                          <span className="font-semibold text-slate-700">
                            {new Date(activeQuestion.submission.submitted_at).toLocaleDateString([], {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>

                        {/* Teacher Grading & Feedback */}
                        {activeQuestion.submission.stars !== null && (
                          <div className="pt-2 border-t border-indigo-100 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700">Teacher Rating:</span>
                              <div className="flex items-center gap-0.5 text-amber-500 font-bold text-sm">
                                {'★'.repeat(activeQuestion.submission.stars)}
                                {'☆'.repeat(5 - activeQuestion.submission.stars)}
                                <span className="ml-1 text-xs text-slate-600">({activeQuestion.submission.stars}/5)</span>
                              </div>
                            </div>
                            {activeQuestion.submission.feedback && (
                              <div className="text-xs bg-white p-2.5 rounded-xl border border-indigo-100 text-slate-700 leading-relaxed">
                                <span className="font-bold text-indigo-900 block mb-0.5">Teacher Feedback:</span>
                                &quot;{activeQuestion.submission.feedback}&quot;
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">
                        Write your code in the compiler on the right, click &quot;Run Code&quot; to test it, then click &quot;Submit Answer&quot;.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Code Editor & Sandboxed Output (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Code Editor Container */}
              <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
                {/* Editor Header Bar */}
                <div className="px-5 py-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 font-mono text-xs text-slate-400">solution.c</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleReset}
                      disabled={isAlreadyGraded}
                      className="px-3 py-1 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                      GCC 13.2 Sandbox
                    </span>
                  </div>
                </div>

                {/* Editor Body */}
                <div className="relative font-mono text-xs p-4 bg-slate-900 text-slate-100 min-h-[300px] flex">
                  <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isAlreadyGraded}
                    rows={15}
                    spellCheck={false}
                    className="w-full h-full bg-transparent font-mono text-xs md:text-sm text-slate-100 resize-none focus:outline-hidden leading-relaxed placeholder-slate-600 disabled:opacity-75"
                    placeholder="// Write your C program here..."
                  />
                </div>

                {/* Editor Actions Toolbar */}
                <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRunCode}
                      disabled={isRunning || !code.trim()}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-950 cursor-pointer disabled:opacity-40"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isRunning ? 'Compiling & Running...' : '▶ Run Code'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setCompilerOutput('');
                        setCompilationError('');
                        setRunSuccess(null);
                      }}
                      className="px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Clear Console
                    </button>
                  </div>

                  <div>
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={isSubmitting || runSuccess !== true || isAlreadyGraded}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-teal-950 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      title={
                        isAlreadyGraded
                          ? 'Already graded by teacher'
                          : runSuccess !== true
                          ? 'Run your code cleanly before submitting'
                          : 'Submit your solution'
                      }
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Verifying & Submitting...' : isAlreadyGraded ? 'Graded (Locked)' : 'Submit Answer'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Message Banner */}
              {submitMessage && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
                    submitMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {submitMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{submitMessage.text}</span>
                </div>
              )}

              {/* Console & Compiler Output Box */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Terminal Output</span>
                  </div>
                  {runSuccess === true && (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      ✓ Execution Succeeded
                    </span>
                  )}
                  {runSuccess === false && (
                    <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      ❌ Compilation Error
                    </span>
                  )}
                </div>

                <div className="p-4 bg-slate-950 font-mono text-xs min-h-[120px] max-h-[220px] overflow-y-auto">
                  {isRunning ? (
                    <div className="flex items-center gap-2 text-indigo-400 py-4">
                      <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                      <span>Sending to isolated sandbox compiler...</span>
                    </div>
                  ) : compilationError ? (
                    <div className="text-rose-400 space-y-1">
                      <p className="font-bold text-rose-300">❌ Compilation / Build Error:</p>
                      <pre className="whitespace-pre-wrap leading-relaxed text-[11px] text-rose-300/90">{compilationError}</pre>
                    </div>
                  ) : compilerOutput ? (
                    <pre className="text-emerald-400 whitespace-pre-wrap leading-relaxed">{compilerOutput}</pre>
                  ) : (
                    <p className="text-slate-500 italic py-2">
                      Click &quot;▶ Run Code&quot; to compile and execute in the secure C sandbox.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
