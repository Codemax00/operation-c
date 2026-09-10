'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/AppLayout';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  FileText,
  Presentation,
  CheckCircle2,
  Lock,
  Download,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  X,
  HardDrive,
  FolderDown
} from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  file_url: string;
  resource_type: string;
  uploaded_at: string;
}

interface DayData {
  id: string;
  day_number: number;
  title: string;
  description: string;
  published: boolean;
  lessonCompleted: boolean;
}

export default function NotesPage() {
  return (
    <React.Suspense fallback={
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    }>
      <NotesContent />
    </React.Suspense>
  );
}

function NotesContent() {
  const searchParams = useSearchParams();
  const dayParam = searchParams.get('day');
  const { refreshStats } = useAuth();

  const [days, setDays] = useState<any[]>([]);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(dayParam ? parseInt(dayParam, 10) : 1);
  const [currentDayDetails, setCurrentDayDetails] = useState<DayData | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);

  // Fetch all days list
  useEffect(() => {
    const fetchAllDays = async () => {
      try {
        const res = await fetch('/api/curriculum');
        if (res.ok) {
          const data = await res.json();
          setDays(data.days || []);
        }
      } catch (err) {
        console.error('Failed to load days list', err);
      }
    };
    fetchAllDays();
  }, []);

  // Fetch specific day details
  useEffect(() => {
    const fetchDay = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/days/${selectedDayNumber}`);
        if (res.ok) {
          const data = await res.json();
          setCurrentDayDetails(data.day);
          setResources(data.resources || []);
        }
      } catch (err) {
        console.error('Failed to fetch day details', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDay();
  }, [selectedDayNumber]);

  const toggleComplete = async () => {
    if (!currentDayDetails || toggling) return;
    setToggling(true);

    const nextCompleted = !currentDayDetails.lessonCompleted;

    try {
      const res = await fetch('/api/progress/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayId: currentDayDetails.id,
          completed: nextCompleted
        })
      });

      if (res.ok) {
        setCurrentDayDetails(prev => prev ? { ...prev, lessonCompleted: nextCompleted } : null);
        setDays(prev => prev.map(d => d.id === currentDayDetails.id ? { ...d, lessonCompleted: nextCompleted } : d));
        await refreshStats();

        if (nextCompleted) {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.7 }
          });
        }
      }
    } catch (err) {
      console.error('Failed to toggle completion', err);
    } finally {
      setToggling(false);
    }
  };

  const getFileIcon = (type: string, url: string = '') => {
    if (type === 'drive' || url.includes('drive.google.com')) {
      return <FolderDown className="w-6 h-6 text-amber-500" />;
    }
    switch (type.toLowerCase()) {
      case 'ppt':
      case 'pptx':
        return <Presentation className="w-6 h-6 text-orange-500" />;
      case 'pdf':
        return <FileText className="w-6 h-6 text-rose-500" />;
      default:
        return <FileText className="w-6 h-6 text-indigo-500" />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>📚</span>
              <span>Class Notes &amp; Study Materials</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Read daily lecture slides, notes and documentation to advance your C Learning Progress.
            </p>
          </div>

          {currentDayDetails?.published && (
            <button
              onClick={toggleComplete}
              disabled={toggling}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                currentDayDetails.lessonCompleted
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{currentDayDetails.lessonCompleted ? '✓ Completed (Click to undo)' : 'Mark as Completed'}</span>
            </button>
          )}
        </div>

        {/* 30-Day Quick Selector Pills */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
            <span>Select Day (1 — 30)</span>
            <span className="text-indigo-600 font-semibold">{days.filter(d => d.lessonCompleted).length} / 30 Finished</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {Array.from({ length: 30 }, (_, i) => i + 1).map((dayNum) => {
              const matching = days.find(d => d.day_number === dayNum);
              const isSelected = selectedDayNumber === dayNum;
              const isDone = matching?.lessonCompleted;
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

        {/* Day Detail Card */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading Day {selectedDayNumber} notes...</p>
          </div>
        ) : currentDayDetails ? (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
            {/* Header for Day */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold mb-2">
                  <span>Day {currentDayDetails.day_number.toString().padStart(2, '0')}</span>
                  <span>•</span>
                  <span>{currentDayDetails.published ? 'Available' : 'Coming Soon'}</span>
                </div>
                <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
                  {currentDayDetails.title}
                </h2>
                <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-3xl">
                  {currentDayDetails.description}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {currentDayDetails.lessonCompleted && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Completed</span>
                  </span>
                )}
              </div>
            </div>

            {/* Resources Content */}
            {!currentDayDetails.published || resources.length === 0 ? (
              /* Resource Not Available Yet State */
              <div className="p-8 md:p-12 rounded-2xl bg-slate-50 border border-slate-200 text-center max-w-xl mx-auto space-y-3 my-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-600 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  🔒 Resources not available yet
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Study materials will be updated after the lecture by your teacher. Please check back soon or complete earlier days.
                </p>
              </div>
            ) : (
              /* Resources Available State */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Study Resources ({resources.length})
                  </h3>
                  <span className="text-xs text-slate-400">Click &quot;Open Resource&quot; to review slides or PDF</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resources.map((res) => {
                    const isExternal = res.file_url.startsWith('http://') || res.file_url.startsWith('https://');
                    const isDrive = res.file_url.includes('drive.google.com') || res.resource_type === 'drive';

                    return (
                      <div
                        key={res.id}
                        className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex items-center justify-between gap-4 bg-slate-50/50"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs shrink-0">
                            {getFileIcon(res.resource_type, res.file_url)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate" title={res.title}>{res.title}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                {isDrive ? 'Google Drive' : res.resource_type.toUpperCase()}
                              </span>
                              {isExternal && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                                  Drive Link
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isExternal ? (
                            <a
                              href={res.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>{isDrive ? 'Open Drive' : 'Open Resource'}</span>
                            </a>
                          ) : (
                            <button
                              onClick={() => setPreviewResource(res)}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Open Resource</span>
                            </button>
                          )}

                          <a
                            href={res.file_url}
                            target={isExternal ? '_blank' : undefined}
                            rel={isExternal ? 'noopener noreferrer' : undefined}
                            download={!isExternal}
                            className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors flex items-center justify-center cursor-pointer"
                            title={isExternal ? 'Open Drive link to download' : 'Download Resource'}
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mark as Completed CTA */}
                <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-blue-50 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Done reading the study materials?</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Mark this lesson as completed to update your C Learning Progress percentage.
                    </p>
                  </div>
                  <button
                    onClick={toggleComplete}
                    disabled={toggling}
                    className={`shrink-0 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                      currentDayDetails.lessonCompleted
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-200'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{currentDayDetails.lessonCompleted ? '✓ Marked as Completed' : '✓ Mark as Completed'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Resource Preview Modal */}
        {previewResource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  {getFileIcon(previewResource.resource_type)}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{previewResource.title}</h3>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">{previewResource.resource_type} Viewer</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewResource.file_url}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                  <button
                    onClick={() => setPreviewResource(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 flex-1 overflow-y-auto font-sans">
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <h4 className="text-base font-extrabold text-slate-900">{previewResource.title}</h4>
                  <div className="text-xs text-slate-700 leading-relaxed space-y-3">
                    <p>
                      <strong>Course Lecture Module:</strong> Day {selectedDayNumber} - {currentDayDetails?.title}
                    </p>
                    <p>
                      This study document includes Dennis Ritchie&apos;s architectural definitions, token structures, compilation stages (Preprocessor, Compiler, Assembler, Linker), and key memory representations.
                    </p>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 font-mono text-[11px] text-slate-800">
                      #include &lt;stdio.h&gt;<br />
                      int main() &#123;<br />
                      &nbsp;&nbsp;printf(&quot;C Programming Masterclass Day {selectedDayNumber}\\n&quot;);<br />
                      &nbsp;&nbsp;return 0;<br />
                      &#125;
                    </div>
                    <p className="text-[11px] text-slate-500">
                      You can also download this document directly to your device for offline reading using the download button above.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  onClick={() => setPreviewResource(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold"
                >
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
