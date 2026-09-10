import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { executeCCode } from '@/lib/compiler';
import crypto from 'node:crypto';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') {
    return NextResponse.json({ error: 'Only logged in students can submit homework' }, { status: 401 });
  }

  try {
    const { homeworkQuestionId, code, stdin } = await req.json();

    if (!homeworkQuestionId || !code || !code.trim()) {
      return NextResponse.json({ error: 'Question ID and C code are required' }, { status: 400 });
    }

    const db = getDb();

    // Check if question exists
    const question = db.prepare('SELECT * FROM homework_questions WHERE id = ?').get(homeworkQuestionId) as any;
    if (!question) {
      return NextResponse.json({ error: 'Homework question not found' }, { status: 404 });
    }

    // Check if previously submitted and graded
    const existingSub = db.prepare(`
      SELECT s.*, g.id as grade_id, g.stars
      FROM homework_submissions s
      LEFT JOIN homework_grades g ON g.submission_id = s.id
      WHERE s.student_id = ? AND s.homework_question_id = ?
      ORDER BY s.submitted_at DESC
      LIMIT 1
    `).get(user.id, homeworkQuestionId) as any;

    if (existingSub && existingSub.grade_id && existingSub.status === 'Graded') {
      return NextResponse.json({
        error: 'This homework has already been graded by the teacher and cannot be resubmitted unless the teacher requests revision.'
      }, { status: 400 });
    }

    // Compile & verify the program before submission
    const compileResult = await executeCCode(code, stdin || '');

    if (!compileResult.success) {
      return NextResponse.json({
        error: 'Cannot submit code that fails to compile cleanly. Please fix errors first.',
        compilationError: compileResult.compilationError || compileResult.error,
      }, { status: 422 });
    }

    const submissionId = existingSub?.id || crypto.randomUUID();
    const now = new Date().toISOString();

    if (existingSub) {
      db.prepare(`
        UPDATE homework_submissions
        SET code = ?, output = ?, compilation_status = 'success', submitted_at = ?, status = 'Submitted'
        WHERE id = ?
      `).run(code, compileResult.output, now, existingSub.id);
    } else {
      db.prepare(`
        INSERT INTO homework_submissions (id, student_id, homework_question_id, code, output, compilation_status, submitted_at, status)
        VALUES (?, ?, ?, ?, ?, 'success', ?, 'Submitted')
      `).run(submissionId, user.id, homeworkQuestionId, code, compileResult.output, now);
    }

    // Also add teacher notification
    const teacher = db.prepare("SELECT id FROM users WHERE role = 'teacher' LIMIT 1").get() as any;
    if (teacher) {
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, read, created_at)
        VALUES (?, ?, ?, ?, ?, 0, ?)
      `).run(
        crypto.randomUUID(),
        teacher.id,
        'New Homework Submitted',
        `${user.name} submitted code for Day ${question.day_id.replace('day-', '')} homework.`,
        'homework',
        now
      );
    }

    return NextResponse.json({
      success: true,
      submissionId,
      status: 'Submitted — Waiting for Teacher Review',
      output: compileResult.output
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Submission failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
