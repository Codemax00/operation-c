'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/AppLayout';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  Calendar,
  BookOpen,
  FileCode2,
  HelpCircle,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  Eye,
  Star,
  Upload,
  Send,
  X,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface SubmissionItem {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  day_number: number;
  day_title: string;
  question_id: string;
  question: string;
  code: string;
  output: string;
  compilation_status: string;
  submitted_at: string;
  status: string;
  stars: number | null;
  feedback: string | null;
  graded_at: string | null;
}

export default function TeacherDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'submissions' | 'days' | 'solved' | 'homework'>('submissions');
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [days, setDays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Grading modal state
  const [selectedSub, setSelectedSub] = useState<SubmissionItem | null>(null);
  const [gradeStars, setGradeStars] = useState<number>(5);
  const [gradeFeedback, setGradeFeedback] = useState<string>('Excellent solution! Clean and compiles without warnings.');
  const [isSavingGrade, setIsSavingGrade] = useState(false);

  // Edit Day modal state
  const [editingDay, setEditingDay] = useState<any | null>(null);
  const [newResourceDayId, setNewResourceDayId] = useState<string | null>(null);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceType, setResourceType] = useState('pdf');

  // Question modal state
  const [newQuestionType, setNewQuestionType] = useState<'solved' | 'homework' | null>(null);
  const [questionDayId, setQuestionDayId] = useState('day-1');
  const [questionText, setQuestionText] = useState('');
  const [explanationText, setExplanationText] = useState('');
  const [solutionCodeText, setSolutionCodeText] = useState('');
  const [expectedOutputText, setExpectedOutputText] = useState('');
  const [difficultyText, setDifficultyText] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');

  // Auth verification
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'teacher') {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subRes, daysRes] = await Promise.all([
        fetch('/api/teacher/submissions'),
        fetch('/api/teacher/days')
      ]);

      if (subRes.ok) {
        const d = await subRes.json();
        setSubmissions(d.submissions || []);
      }

      if (daysRes.ok) {
        const d = await daysRes.json();
        setDays(d.days || []);
      }
    } catch (err) {
      console.error('Failed to load teacher data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'teacher') {
      loadData();
    }
  }, [user]);

  // Handle Grade Submission
  const handleSaveGrade = async () => {
    if (!selectedSub || isSavingGrade) return;
    setIsSavingGrade(true);

    try {
      const res = await fetch('/api/teacher/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSub.id,
          stars: gradeStars,
          feedback: gradeFeedback,
          status: gradeStars >= 3 ? 'Graded' : 'Needs Improvement'
        })
      });

      if (res.ok) {
        await loadData();
        setSelectedSub(null);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error('Failed to save grade', err);
    } finally {
      setIsSavingGrade(false);
    }
  };

  // Toggle Day Publish
  const handleTogglePublish = async (day: any) => {
    try {
      await fetch('/api/teacher/days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayId: day.id,
          published: !day.published
        })
      });
      await loadData();
    } catch (err) {
      console.error('Failed to update day publish status', err);
    }
  };

  // Add Resource to Day
  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResourceDayId || !resourceTitle) return;

    try {
      await fetch('/api/teacher/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayId: newResourceDayId,
          title: resourceTitle,
          resourceType
        })
      });
      setNewResourceDayId(null);
      setResourceTitle('');
      await loadData();
    } catch (err) {
      console.error('Failed to add resource', err);
    }
  };

  // Save new Question
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionType || !questionText) return;

    try {
      await fetch('/api/teacher/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newQuestionType,
          dayId: questionDayId,
          question: questionText,
          explanation: explanationText,
          solutionCode: solutionCodeText,
          expectedOutput: expectedOutputText,
          starterCode: solutionCodeText,
          difficulty: difficultyText,
          published: 1
        })
      });

      setNewQuestionType(null);
      setQuestionText('');
      setExplanationText('');
      setSolutionCodeText('');
      setExpectedOutputText('');
      await loadData();
    } catch (err) {
      console.error('Failed to save question', err);
    }
  };

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading Instructor Portal...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Instructor Banner */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-purple-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-200" />
              <span>Teacher / Admin Dashboard</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Course Management &amp; Grading Portal
            </h1>
            <p className="mt-1 text-xs md:text-sm text-purple-100 font-medium">
              Manage all 30 curriculum days, publish lecture materials, add questions, and evaluate student C homework submissions.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl text-xs font-bold border border-white/20">
              {submissions.length} Total Submissions
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'submissions'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Homework Submissions ({submissions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('days')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'days'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Manage 30 Days &amp; Resources</span>
          </button>

          <button
            onClick={() => {
              setNewQuestionType('solved');
              setQuestionDayId('day-1');
            }}
            className="ml-auto px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Solved Question</span>
          </button>

          <button
            onClick={() => {
              setNewQuestionType('homework');
              setQuestionDayId('day-1');
            }}
            className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Homework Question</span>
          </button>
        </div>

        {/* TAB 1: Submissions Review Table */}
        {activeTab === 'submissions' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Student Homework Submissions</h2>
                <p className="text-xs text-slate-500">Review compiled C source code and assign star ratings and feedback</p>
              </div>
            </div>

            {submissions.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <FileCode2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">No homework submissions yet</p>
                <p className="text-xs text-slate-400 mt-1">Student submissions will appear here for grading.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Student</th>
                      <th className="px-6 py-3.5">Day &amp; Topic</th>
                      <th className="px-6 py-3.5">Question</th>
                      <th className="px-6 py-3.5">Submitted</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Marks / Rating</th>
                      <th className="px-6 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{sub.student_name}</p>
                          <p className="text-[11px] text-slate-400">{sub.student_email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono font-bold text-indigo-600 block">Day {sub.day_number}</span>
                          <span className="text-slate-600 truncate max-w-[140px] block">{sub.day_title}</span>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <p className="text-slate-700 font-mono truncate">{sub.question}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                          {new Date(sub.submitted_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              sub.status === 'Graded'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : sub.status === 'Needs Improvement'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {sub.stars !== null ? (
                            <span className="text-amber-500 font-bold text-sm">
                              {'★'.repeat(sub.stars)}
                              {'☆'.repeat(5 - sub.stars)}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">Pending Review</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedSub(sub);
                              setGradeStars(sub.stars ?? 5);
                              setGradeFeedback(sub.feedback || 'Good solution. Clean code and accurate output.');
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{sub.stars !== null ? 'Re-Grade' : 'Review & Grade'}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Manage Days & Resources */}
        {activeTab === 'days' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Curriculum Days Management (Days 1 — 30)</h2>
                <p className="text-xs text-slate-500">Toggle publishing status and attach lecture PDFs, slides, and study guides</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {days.map((d) => (
                <div
                  key={d.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                    d.published ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-50/70 border-slate-200/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-purple-600 uppercase">
                        Day {d.day_number.toString().padStart(2, '0')}
                      </span>
                      <button
                        onClick={() => handleTogglePublish(d)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                          d.published
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        {d.published ? '✓ Published' : '🔒 Draft / Coming Soon'}
                      </button>
                    </div>

                    <h3 className="text-sm font-bold text-slate-800">{d.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{d.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">
                      {d.resources_count} files • {d.solved_count} solved • {d.homework_count} hw
                    </span>

                    <button
                      onClick={() => setNewResourceDayId(d.id)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Attach File</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal: Review & Grade Submission */}
        {selectedSub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Grading Homework — {selectedSub.student_name}
                  </h3>
                  <p className="text-xs text-indigo-600 font-medium font-mono">
                    Day {selectedSub.day_number}: {selectedSub.day_title}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSub(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-5">
                {/* Question Statement */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Problem
                  </h4>
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-800">
                    {selectedSub.question}
                  </p>
                </div>

                {/* Student's Code */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Student&apos;s Submitted C Code
                  </h4>
                  <div className="bg-slate-900 rounded-2xl p-4 font-mono text-xs text-slate-100 overflow-x-auto border border-slate-800 shadow-inner">
                    <pre>
                      <code>{selectedSub.code}</code>
                    </pre>
                  </div>
                </div>

                {/* Terminal Output */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Compiler &amp; Program Output
                  </h4>
                  <div className="bg-slate-950 rounded-xl p-3 font-mono text-xs text-emerald-400 border border-slate-800">
                    <pre className="whitespace-pre-wrap">{selectedSub.output || '(No stdout produced)'}</pre>
                  </div>
                </div>

                {/* Grading Controls */}
                <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-2">
                      Assign Star Rating (0 — 5 Stars)
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setGradeStars(s)}
                          className={`text-2xl transition-transform hover:scale-125 cursor-pointer ${
                            s <= gradeStars ? 'text-amber-400' : 'text-slate-300'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                      <span className="ml-2 font-bold text-purple-900 text-xs">{gradeStars} / 5 Stars</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-1.5">
                      Teacher Feedback Note
                    </label>
                    <textarea
                      rows={2}
                      value={gradeFeedback}
                      onChange={(e) => setGradeFeedback(e.target.value)}
                      placeholder="Add guidance, code style suggestions, or congratulations..."
                      className="w-full p-3 bg-white border border-purple-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                <button
                  onClick={() => setSelectedSub(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveGrade}
                  disabled={isSavingGrade}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{isSavingGrade ? 'Saving Grade...' : 'Save Grade'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Attach Resource */}
        {newResourceDayId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Attach Study Resource</h3>
                <button onClick={() => setNewResourceDayId(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddResource} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Resource Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Variables & Memory Notes.pdf"
                    value={resourceTitle}
                    onChange={(e) => setResourceTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Resource Type
                  </label>
                  <select
                    value={resourceType}
                    onChange={(e) => setResourceType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  >
                    <option value="pdf">PDF Document (.pdf)</option>
                    <option value="ppt">Presentation Slides (.pptx / .ppt)</option>
                    <option value="doc">Reference Document (.docx / .doc)</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setNewResourceDayId(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                  >
                    Upload Resource
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Create Question */}
        {newQuestionType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">
                  Add {newQuestionType === 'solved' ? 'Solved Question' : 'Homework Question'}
                </h3>
                <button onClick={() => setNewQuestionType(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveQuestion} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Assign to Day
                  </label>
                  <select
                    value={questionDayId}
                    onChange={(e) => setQuestionDayId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  >
                    {days.map((d) => (
                      <option key={d.id} value={d.id}>
                        Day {d.day_number}: {d.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Question Statement
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="e.g. Write a C program to reverse an array in-place."
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>

                {newQuestionType === 'solved' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Explanation
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Detailed explanation of the algorithm..."
                        value={explanationText}
                        onChange={(e) => setExplanationText(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Expected Output
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Array reversed: 5 4 3 2 1"
                        value={expectedOutputText}
                        onChange={(e) => setExpectedOutputText(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                    </div>
                  </>
                )}

                {newQuestionType === 'homework' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Difficulty Level
                    </label>
                    <select
                      value={difficultyText}
                      onChange={(e: any) => setDifficultyText(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {newQuestionType === 'solved' ? 'Solution C Code' : 'Starter C Code'}
                  </label>
                  <textarea
                    rows={6}
                    placeholder="#include <stdio.h>&#10;&#10;int main() {&#10;    return 0;&#10;}"
                    value={solutionCodeText}
                    onChange={(e) => setSolutionCodeText(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 text-slate-100 font-mono text-xs rounded-xl"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setNewQuestionType(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                  >
                    Save Question
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
