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
  ChevronRight,
  Users,
  KeyRound,
  UserPlus,
  Lock,
  Mail,
  User,
  Bell
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

interface StudentItem {
  id: string;
  name: string;
  email: string;
  created_at: string;
  lessons_completed: number;
  practice_completed: number;
  homework_completed: number;
  total_submissions: number;
}

export default function TeacherDashboardPage() {
  const { user, setUser, refreshStats, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'submissions' | 'days' | 'students'>('submissions');
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [days, setDays] = useState<any[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Teacher Login Form State (if not authenticated as teacher)
  const [teacherLoginId, setTeacherLoginId] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherLoginError, setTeacherLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Grading modal state
  const [selectedSub, setSelectedSub] = useState<SubmissionItem | null>(null);
  const [gradeStars, setGradeStars] = useState<number>(5);
  const [gradeFeedback, setGradeFeedback] = useState<string>('Excellent solution! Clean and compiles without warnings.');
  const [isSavingGrade, setIsSavingGrade] = useState(false);

  // Attach Resource state
  const [newResourceDayId, setNewResourceDayId] = useState<string | null>(null);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceLink, setResourceLink] = useState('');
  const [resourceType, setResourceType] = useState('drive');

  // Question modal state
  const [newQuestionType, setNewQuestionType] = useState<'solved' | 'homework' | null>(null);
  const [questionDayId, setQuestionDayId] = useState('day-1');
  const [questionText, setQuestionText] = useState('');
  const [explanationText, setExplanationText] = useState('');
  const [solutionCodeText, setSolutionCodeText] = useState('');
  const [expectedOutputText, setExpectedOutputText] = useState('');
  const [difficultyText, setDifficultyText] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');

  // Student Management modal states
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [studentError, setStudentError] = useState('');
  const [studentSuccess, setStudentSuccess] = useState('');

  const [resetStudent, setResetStudent] = useState<StudentItem | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Student Notification modal states
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyTargetStudentId, setNotifyTargetStudentId] = useState<string>('all');
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [notifyType, setNotifyType] = useState<'info' | 'urgent' | 'homework'>('info');
  const [isSendingNotice, setIsSendingNotice] = useState(false);
  const [noticeFeedback, setNoticeFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    }
    try {
      const [subRes, daysRes, studRes] = await Promise.all([
        fetch('/api/teacher/submissions'),
        fetch('/api/teacher/days'),
        fetch('/api/teacher/students')
      ]);

      if (subRes.ok) {
        const d = await subRes.json();
        setSubmissions(d.submissions || []);
      }

      if (daysRes.ok) {
        const d = await daysRes.json();
        setDays(d.days || []);
      }

      if (studRes.ok) {
        const d = await studRes.json();
        setStudents(d.students || []);
      }
    } catch (err) {
      console.error('Failed to load teacher data', err);
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  };

  const isTeacher = user?.role === 'teacher';

  useEffect(() => {
    if (isTeacher) {
      loadData(true);
    } else {
      setLoading(false);
    }
  }, [isTeacher, user?.id]);

  // Handle Teacher Admin Login
  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: teacherLoginId,
          password: teacherPassword,
          role: 'teacher'
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setTeacherLoginError(data.error || 'Invalid teacher credentials');
        setIsLoggingIn(false);
        return;
      }

      setUser(data.user);
      await refreshStats();
      await loadData();
    } catch {
      setTeacherLoginError('Connection error occurred');
    } finally {
      setIsLoggingIn(false);
    }
  };

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
          fileUrl: resourceLink.trim(),
          resourceType
        })
      });
      setNewResourceDayId(null);
      setResourceTitle('');
      setResourceLink('');
      await loadData();
    } catch (err) {
      console.error('Failed to add resource', err);
    }
  };

  // Delete Resource from Day
  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm('Are you sure you want to remove this resource link?')) return;
    try {
      await fetch(`/api/teacher/resources?id=${resourceId}`, {
        method: 'DELETE'
      });
      await loadData();
    } catch (err) {
      console.error('Failed to delete resource', err);
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

  // Add Student Handler
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');
    setStudentSuccess('');

    try {
      const res = await fetch('/api/teacher/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStudentName,
          email: newStudentEmail,
          password: newStudentPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setStudentError(data.error || 'Failed to add student');
        return;
      }

      setStudentSuccess(`✓ Student "${newStudentName}" added successfully!`);
      setNewStudentName('');
      setNewStudentEmail('');
      setNewStudentPassword('');
      setShowAddStudent(false);
      await loadData();
    } catch {
      setStudentError('Network error while adding student');
    }
  };

  // Reset Student Password Handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetStudent || !resetPasswordVal.trim() || isResetting) return;
    setIsResetting(true);

    try {
      const res = await fetch('/api/teacher/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: resetStudent.id,
          newPassword: resetPasswordVal
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message || 'Password reset successfully');
        setResetStudent(null);
        setResetPasswordVal('');
      } else {
        alert(data.error || 'Failed to reset password');
      }
    } catch {
      alert('Error connecting to server');
    } finally {
      setIsResetting(false);
    }
  };

  // Delete Student Handler
  const handleDeleteStudent = async (studentId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove student "${name}" and all their records?`)) return;

    try {
      const res = await fetch(`/api/teacher/students?id=${studentId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await loadData();
      }
    } catch {
      alert('Failed to remove student');
    }
  };

  // Send Notification Handler
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyTitle.trim() || !notifyMessage.trim()) {
      setNoticeFeedback({ type: 'error', text: 'Please enter both title and message.' });
      return;
    }

    setIsSendingNotice(true);
    setNoticeFeedback(null);

    try {
      const res = await fetch('/api/teacher/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: notifyTargetStudentId,
          title: notifyTitle,
          message: notifyMessage,
          type: notifyType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setNoticeFeedback({ type: 'error', text: data.error || 'Failed to send notification' });
      } else {
        setNoticeFeedback({ type: 'success', text: data.message || 'Notification sent successfully!' });
        setTimeout(() => {
          setShowNotifyModal(false);
          setNoticeFeedback(null);
          setNotifyTitle('');
          setNotifyMessage('');
        }, 1200);
      }
    } catch {
      setNoticeFeedback({ type: 'error', text: 'Network error occurred' });
    } finally {
      setIsSendingNotice(false);
    }
  };

  // If not logged in as Teacher, render the Teacher Admin Login Portal
  if (!authLoading && (!user || user.role !== 'teacher')) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 text-white font-black text-2xl shadow-xl shadow-purple-950 mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Teacher &amp; Instructor Portal
          </h1>
          <p className="mt-1.5 text-xs font-semibold text-purple-300 tracking-wide uppercase">
            Administrative Access • Course Management &amp; Evaluation
          </p>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-slate-950 py-8 px-6 shadow-2xl rounded-3xl border border-slate-800 sm:px-10">
            {teacherLoginError && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{teacherLoginError}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleTeacherLogin}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Instructor Name or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={teacherLoginId}
                    onChange={(e) => setTeacherLoginId(e.target.value)}
                    placeholder="Enter teacher name or email"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-slate-850"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-slate-850"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:opacity-90 transition-all shadow-lg shadow-purple-950 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{isLoggingIn ? 'Verifying Admin Access...' : 'Sign In as Teacher'}</span>
                <ShieldCheck className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/login')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors"
            >
              ← Back to Student Login
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              <span>Instructor Portal • Welcome {user?.name}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Course Management &amp; Grading Portal
            </h1>
            <p className="mt-1 text-xs md:text-sm text-purple-100 font-medium">
              Manage all 30 curriculum days, attach Google Drive resources, review student C homework, and manage student accounts.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl text-xs font-bold border border-white/20">
              {students.length} Enrolled Students
            </span>
            <span className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl text-xs font-bold border border-white/20">
              {submissions.length} Submissions
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
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
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'days'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Manage 30 Days &amp; Resources</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'students'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Student Management ({students.length})</span>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => {
                setNewQuestionType('solved');
                setQuestionDayId('day-1');
              }}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Solved Q</span>
            </button>

            <button
              onClick={() => {
                setNewQuestionType('homework');
                setQuestionDayId('day-1');
              }}
              className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Homework Q</span>
            </button>
          </div>
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
                <p className="text-xs text-slate-500">Toggle publishing status and attach Google Drive lecture PDFs, slides, and study guides</p>
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

                    {/* Attached Resources / Drive links list */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>Attached Links ({d.resources?.length || 0})</span>
                      </div>
                      {d.resources && d.resources.length > 0 ? (
                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-0.5">
                          {d.resources.map((res: any) => (
                            <div
                              key={res.id}
                              className="flex items-center justify-between gap-1.5 p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px]"
                            >
                              <div className="min-w-0 flex items-center gap-1.5">
                                <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 shrink-0">
                                  {res.resource_type === 'drive' ? 'DRIVE' : res.resource_type.toUpperCase()}
                                </span>
                                <span className="truncate font-medium text-slate-700" title={res.title}>
                                  {res.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <a
                                  href={res.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded text-indigo-600 hover:bg-indigo-50 transition-colors"
                                  title="Open link in new tab"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteResource(res.id)}
                                  className="p-1 rounded text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Remove resource link"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">No drive links attached yet</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">
                      {d.resources?.length || d.resources_count} files • {d.solved_count} solved • {d.homework_count} hw
                    </span>

                    <button
                      onClick={() => {
                        setNewResourceDayId(d.id);
                        setResourceLink('');
                        setResourceTitle('');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Attach Drive Link</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Student Management */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Enrolled Students Management</h2>
                <p className="text-xs text-slate-500">Add new students, reset passwords, track progress, and send direct notices</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setNotifyTargetStudentId('all');
                    setNotifyTitle('');
                    setNotifyMessage('');
                    setNotifyType('info');
                    setNoticeFeedback(null);
                    setShowNotifyModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-200 cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  <span>Send Notice</span>
                </button>

                <button
                  onClick={() => {
                    setShowAddStudent(true);
                    setStudentError('');
                    setStudentSuccess('');
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-purple-200 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add New Student</span>
                </button>
              </div>
            </div>

            {students.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">No students enrolled yet</p>
                <p className="text-xs text-slate-400 mt-1">Click &quot;Add New Student&quot; above to create accounts for your students.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Student Name</th>
                      <th className="px-6 py-3.5">Email / Login ID</th>
                      <th className="px-6 py-3.5">Lessons Completed</th>
                      <th className="px-6 py-3.5">Practice Completed</th>
                      <th className="px-6 py-3.5">Homework Graded</th>
                      <th className="px-6 py-3.5">Joined</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{s.name}</p>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-600">
                          {s.email}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-blue-600">{s.lessons_completed} / 30</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-indigo-600">{s.practice_completed} / 30</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-purple-600">{s.homework_completed} Questions</span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                          {new Date(s.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setNotifyTargetStudentId(s.id);
                                setNotifyTitle(`Notice for ${s.name}`);
                                setNotifyMessage('Please submit the answer as soon as possible.');
                                setNotifyType('urgent');
                                setNoticeFeedback(null);
                                setShowNotifyModal(true);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                              title={`Send notice to ${s.name}`}
                            >
                              <Bell className="w-3.5 h-3.5 text-amber-600" />
                              <span>Notify</span>
                            </button>

                            <button
                              onClick={() => {
                                setResetStudent(s);
                                setResetPasswordVal('');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                              title="Reset student password"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>Reset Password</span>
                            </button>

                            <button
                              onClick={() => handleDeleteStudent(s.id, s.name)}
                              className="p-1.5 rounded-xl hover:bg-rose-50 text-rose-500 transition-colors cursor-pointer"
                              title="Remove student account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal: Add New Student */}
        {showAddStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Add New Student</h3>
                    <p className="text-[11px] text-slate-400">Create login credentials for a student</p>
                  </div>
                </div>
                <button onClick={() => setShowAddStudent(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {studentError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">
                  {studentError}
                </div>
              )}

              <form onSubmit={handleCreateStudent} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email / Login Username (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. rahul@student.c (auto-generated if empty)"
                    value={newStudentEmail}
                    onChange={(e) => setNewStudentEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Student Initial Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newStudentPassword}
                    onChange={(e) => setNewStudentPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddStudent(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-200 cursor-pointer"
                  >
                    Create Student
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Reset Student Password */}
        {resetStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Reset Student Password</h3>
                    <p className="text-[11px] text-slate-400">For {resetStudent.name}</p>
                  </div>
                </div>
                <button onClick={() => setResetStudent(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <p className="text-xs text-slate-600 mb-3 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                    Setting a new password will immediately disconnect any active sessions for <strong>{resetStudent.name}</strong> on any device.
                  </p>

                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Enter New Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter new password"
                    value={resetPasswordVal}
                    onChange={(e) => setResetPasswordVal(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setResetStudent(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-200 cursor-pointer disabled:opacity-50"
                  >
                    {isResetting ? 'Updating...' : 'Save New Password'}
                  </button>
                </div>
              </form>
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
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Problem
                  </h4>
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-800">
                    {selectedSub.question}
                  </p>
                </div>

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

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Compiler &amp; Program Output
                  </h4>
                  <div className="bg-slate-950 rounded-xl p-3 font-mono text-xs text-emerald-400 border border-slate-800">
                    <pre className="whitespace-pre-wrap">{selectedSub.output || '(No stdout produced)'}</pre>
                  </div>
                </div>

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
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Attach Study Resource / Drive Link</h3>
                  <p className="text-xs text-slate-500">Provide a Google Drive share link for zero memory server hosting</p>
                </div>
                <button
                  onClick={() => {
                    setNewResourceDayId(null);
                    setResourceLink('');
                    setResourceTitle('');
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddResource} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Google Drive / Resource Link (URL) *
                  </label>
                  <p className="text-[11px] text-slate-500 mb-1.5">
                    Upload your file (PDF, PPT, DOC) to your Google Drive, set sharing to <em>&quot;Anyone with the link can view&quot;</em>, and paste the link here. When students click download or open, they will be redirected to this link.
                  </p>
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                    value={resourceLink}
                    onChange={(e) => {
                      setResourceLink(e.target.value);
                      if (e.target.value.includes('drive.google.com')) {
                        setResourceType('drive');
                      }
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Resource Display Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Day 1 Introduction Notes & Architecture.pdf"
                    value={resourceTitle}
                    onChange={(e) => setResourceTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Resource Type
                  </label>
                  <select
                    value={resourceType}
                    onChange={(e) => setResourceType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="drive">📁 Google Drive Link (File / Folder)</option>
                    <option value="pdf">📄 PDF Document (.pdf)</option>
                    <option value="ppt">📊 Presentation Slides (.pptx / .ppt)</option>
                    <option value="doc">📝 Reference Document (.docx / .doc)</option>
                    <option value="link">🔗 Web / External Resource Link</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewResourceDayId(null);
                      setResourceLink('');
                      setResourceTitle('');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-200 cursor-pointer"
                  >
                    Attach Link
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

        {/* Modal: Send Notification to Student */}
        {showNotifyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Send Notification</h3>
                    <p className="text-xs text-slate-500">Send an instant alert or reminder to your students</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNotifyModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {noticeFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    noticeFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {noticeFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{noticeFeedback.text}</span>
                </div>
              )}

              <form onSubmit={handleSendNotification} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Recipient *
                  </label>
                  <select
                    value={notifyTargetStudentId}
                    onChange={(e) => setNotifyTargetStudentId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
                  >
                    <option value="all">📢 All Enrolled Students (Broadcast Announcement)</option>
                    <optgroup label="Individual Students">
                      {students.map((st) => (
                        <option key={st.id} value={st.id}>
                          👤 {st.name} ({st.email})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Notification Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setNotifyType('info')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        notifyType === 'info'
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      General Info
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotifyType('homework')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        notifyType === 'homework'
                          ? 'bg-purple-50 border-purple-300 text-purple-700 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Homework
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotifyType('urgent')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        notifyType === 'urgent'
                          ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      🚨 Urgent Notice
                    </button>
                  </div>
                </div>

                {/* Quick Templates */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Quick Templates:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setNotifyTitle('Homework Submission Reminder');
                        setNotifyMessage('Please submit the answer as soon as possible.');
                        setNotifyType('urgent');
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 hover:text-amber-800 text-slate-600 transition-colors cursor-pointer"
                    >
                      &quot;Please submit answer ASAP&quot;
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNotifyTitle('Homework Graded & Feedback Ready');
                        setNotifyMessage('Your homework submission has been reviewed and graded. Check your stars and feedback in the Homework tab!');
                        setNotifyType('homework');
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 hover:text-purple-800 text-slate-600 transition-colors cursor-pointer"
                    >
                      &quot;Homework Graded&quot;
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNotifyTitle('New Class Notes Available');
                        setNotifyMessage('New daily study notes and practice materials are now open for today.');
                        setNotifyType('info');
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-100 hover:text-indigo-800 text-slate-600 transition-colors cursor-pointer"
                    >
                      &quot;New Notes Available&quot;
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Notification Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Please submit the answer as soon as possible"
                    value={notifyTitle}
                    onChange={(e) => setNotifyTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Notification Message *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Write your message to the student..."
                    value={notifyMessage}
                    onChange={(e) => setNotifyMessage(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNotifyModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingNotice}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-md shadow-amber-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingNotice ? 'Sending...' : 'Send Notification'}</span>
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
