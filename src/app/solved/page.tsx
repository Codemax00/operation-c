'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/AppLayout';
import confetti from 'canvas-confetti';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Lock,
  Code2,
  Terminal,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';

interface SolvedQuestion {
  id: string;
  question: string;
  explanation: string;
  solution_code: string;
  expected_output: string;
  order_index: number;
}

export default function SolvedQuestionsPage() {
  return (
    <React.Suspense fallback={
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    }>
      <SolvedQuestionsContent />
    </React.Suspense>
  );
}

function SolvedQuestionsContent() {
  const searchParams = useSearchParams();
  const dayParam = searchParams.get('day');
  const { refreshStats } = useAuth();

  const [days, setDays] = useState<any[]>([]);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(dayParam ? parseInt(dayParam, 10) : 1);
  const [currentDayDetails, setCurrentDayDetails] = useState<any>(null);
  const [questions, setQuestions] = useState<SolvedQuestion[]>([]);
  const [openAccordion, setOpenAccordion] = useState<Record<string, boolean>>({});
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

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

  useEffect(() => {
    const fetchDayQuestions = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/days/${selectedDayNumber}`);
        if (res.ok) {
          const data = await res.json();
          setCurrentDayDetails(data.day);
          const sqList = data.solvedQuestions || [];
          setQuestions(sqList);
          // By default, expand first question if available
          if (sqList.length > 0) {
            setOpenAccordion({ [sqList[0].id]: true });
          } else {
            setOpenAccordion({});
          }
        }
      } catch (err) {
        console.error('Failed to load questions', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDayQuestions();
  }, [selectedDayNumber]);

  const toggleAccordion = (id: string) => {
    setOpenAccordion(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const togglePracticeComplete = async () => {
    if (!currentDayDetails || toggling) return;
    setToggling(true);

    const nextCompleted = !currentDayDetails.practiceCompleted;

    try {
      const res = await fetch('/api/progress/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayId: currentDayDetails.id,
          completed: nextCompleted
        })
      });

      if (res.ok) {
        setCurrentDayDetails((prev: any) => prev ? { ...prev, practiceCompleted: nextCompleted } : null);
        setDays(prev => prev.map(d => d.id === currentDayDetails.id ? { ...d, practiceCompleted: nextCompleted } : d));
        await refreshStats();

        if (nextCompleted) {
          confetti({
            particleCount: 75,
            spread: 70,
            origin: { y: 0.7 }
          });
        }
      }
    } catch (err) {
      console.error('Failed to toggle practice progress', err);
    } finally {
      setToggling(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>💡</span>
              <span>Solved Questions &amp; Explanations</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Study step-by-step problem solutions, code implementations, and expected terminal outputs.
            </p>
          </div>

          {currentDayDetails?.published && (
            <button
              onClick={togglePracticeComplete}
              disabled={toggling}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                currentDayDetails.practiceCompleted
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{currentDayDetails.practiceCompleted ? '✓ Practice Completed (Click to undo)' : 'Mark Day as Completed'}</span>
            </button>
          )}
        </div>

        {/* 30-Day Quick Selector Pills */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
            <span>Select Curriculum Day</span>
            <span className="text-indigo-600 font-semibold">{days.filter(d => d.practiceCompleted).length} / 30 Practiced</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {Array.from({ length: 30 }, (_, i) => i + 1).map((dayNum) => {
              const matching = days.find(d => d.day_number === dayNum);
              const isSelected = selectedDayNumber === dayNum;
              const isDone = matching?.practiceCompleted;
              const isPub = matching?.published;

              return (
                <button
                  key={dayNum}
                  onClick={() => setSelectedDayNumber(dayNum)}
                  className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 ring-2 ring-indigo-600 ring-offset-2'
                      : isDone
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      : isPub
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-slate-50 text-slate-400 border border-dashed border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>Day {dayNum.toString().padStart(2, '0')}</span>
                  {isDone && <span className="text-emerald-500 font-bold">✓</span>}
                  {!isPub && <Lock className="w-3 h-3 text-slate-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Header Info */}
        {currentDayDetails && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase font-mono tracking-wider">
                Day {currentDayDetails.day_number.toString().padStart(2, '0')}
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">{currentDayDetails.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{currentDayDetails.description}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-600 rounded-xl">
                {questions.length} Solved Questions
              </span>
            </div>
          </div>
        )}

        {/* Solved Questions Accordion List */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading solved questions for Day {selectedDayNumber}...</p>
          </div>
        ) : !currentDayDetails?.published || questions.length === 0 ? (
          <div className="p-8 md:p-12 rounded-2xl bg-slate-50 border border-slate-200 text-center max-w-xl mx-auto space-y-3 my-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-600 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              🔒 Solved questions coming after lecture
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Study questions and step-by-step C solutions for Day {selectedDayNumber} will be unlocked following the live lecture session.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const isOpen = openAccordion[q.id];

              return (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-200"
                >
                  {/* Accordion Trigger */}
                  <button
                    onClick={() => toggleAccordion(q.id)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 pr-4">
                      <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 font-extrabold text-xs flex items-center justify-center shrink-0 border border-indigo-100">
                        Q{idx + 1}
                      </span>
                      <span className="font-bold text-slate-800 text-sm md:text-base leading-snug">
                        {q.question}
                      </span>
                    </div>
                    <div className="p-1 rounded-lg text-slate-400 shrink-0">
                      {isOpen ? <ChevronUp className="w-5 h-5 text-indigo-600" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>

                  {/* Expanded Solution View */}
                  {isOpen && (
                    <div className="px-6 pb-6 pt-2 border-t border-slate-100 space-y-4">
                      {/* Explanation */}
                      {q.explanation && (
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>Explanation</span>
                          </h4>
                          <p className="text-xs md:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                            {q.explanation}
                          </p>
                        </div>
                      )}

                      {/* C Code Solution */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Code2 className="w-3.5 h-3.5 text-blue-500" />
                            <span>C Code Solution</span>
                          </h4>
                          <button
                            onClick={() => copyCode(q.id, q.solution_code)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 px-2.5 py-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            {copiedCodeId === q.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Code</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-800 text-slate-100 p-4 font-mono text-xs leading-relaxed overflow-x-auto shadow-inner">
                          <pre>
                            <code>{q.solution_code}</code>
                          </pre>
                        </div>
                      </div>

                      {/* Expected Output */}
                      {q.expected_output && (
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Expected Terminal Output</span>
                          </h4>
                          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 font-mono text-xs text-emerald-400 overflow-x-auto">
                            <pre className="whitespace-pre-wrap">{q.expected_output}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Complete Practice Banner */}
            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-blue-50 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Finished reviewing all solved questions for Day {selectedDayNumber}?</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mark this day&apos;s practice as completed to advance your Practice Progress bar on your dashboard.
                </p>
              </div>
              <button
                onClick={togglePracticeComplete}
                disabled={toggling}
                className={`shrink-0 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                  currentDayDetails.practiceCompleted
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{currentDayDetails.practiceCompleted ? '✓ Practice Completed' : '✓ Mark Day as Completed'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
