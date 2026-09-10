import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import crypto from 'node:crypto';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized: Teacher access required' }, { status: 403 });
  }

  const db = getDb();
  const submissions = (await db.prepare(`
    SELECT 
      s.id,
      s.student_id,
      u.name as student_name,
      u.email as student_email,
      d.day_number,
      d.title as day_title,
      hq.id as question_id,
      hq.question,
      s.code,
      s.output,
      s.compilation_status,
      s.submitted_at,
      s.status,
      g.stars,
      g.feedback,
      g.graded_at
    FROM homework_submissions s
    JOIN users u ON u.id = s.student_id
    JOIN homework_questions hq ON hq.id = s.homework_question_id
    JOIN course_days d ON d.id = hq.day_id
    LEFT JOIN homework_grades g ON g.submission_id = s.id
    ORDER BY s.submitted_at DESC
  `).all()) as any[];

  return NextResponse.json({ submissions });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized: Teacher access required' }, { status: 403 });
  }

  try {
    const { submissionId, stars, feedback, status } = await req.json();

    if (!submissionId || stars === undefined) {
      return NextResponse.json({ error: 'Submission ID and stars (0-5) are required' }, { status: 400 });
    }

    const starCount = Math.max(0, Math.min(5, parseInt(stars, 10)));
    const submissionStatus = status || (starCount >= 3 ? 'Graded' : 'Needs Improvement');

    const db = getDb();

    // Check submission exists
    const sub = (await db.prepare(`
      SELECT s.*, hq.day_id, d.day_number 
      FROM homework_submissions s
      JOIN homework_questions hq ON hq.id = s.homework_question_id
      JOIN course_days d ON d.id = hq.day_id
      WHERE s.id = ?
    `).get(submissionId)) as any;

    if (!sub) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    // Upsert grade
    const existingGrade = (await db.prepare('SELECT id FROM homework_grades WHERE submission_id = ?').get(submissionId)) as any;

    if (existingGrade) {
      await db.prepare(`
        UPDATE homework_grades
        SET stars = ?, feedback = ?, teacher_id = ?, graded_at = ?
        WHERE id = ?
      `).run(starCount, feedback || '', user.id, now, existingGrade.id);
    } else {
      await db.prepare(`
        INSERT INTO homework_grades (id, submission_id, teacher_id, stars, feedback, graded_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(crypto.randomUUID(), submissionId, user.id, starCount, feedback || '', now);
    }

    // Update submission status
    await db.prepare(`
      UPDATE homework_submissions
      SET status = ?
      WHERE id = ?
    `).run(submissionStatus, submissionId);

    // Notify the student
    await db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, read, created_at)
      VALUES (?, ?, ?, ?, 'grade', 0, ?)
    `).run(
      crypto.randomUUID(),
      sub.student_id,
      'Homework Graded!',
      `${user.name} graded your Day ${sub.day_number} submission: ${'★'.repeat(starCount)}${'☆'.repeat(5 - starCount)}${feedback ? ` - "${feedback}"` : ''}`,
      now
    );

    return NextResponse.json({
      success: true,
      message: 'Grade saved successfully',
      stars: starCount,
      status: submissionStatus
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save grade';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
