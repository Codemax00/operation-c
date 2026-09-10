import { NextResponse } from 'next/server';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { getDb } from '@/lib/db';
import crypto from 'node:crypto';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized: Teacher access required' }, { status: 403 });
  }

  const db = getDb();
  const students = (await db.prepare(`
    SELECT 
      u.id,
      u.name,
      u.email,
      u.created_at,
      (SELECT count(*) FROM lesson_progress lp WHERE lp.student_id = u.id AND lp.completed = 1) as lessons_completed,
      (SELECT count(*) FROM practice_progress pp WHERE pp.student_id = u.id AND pp.completed = 1) as practice_completed,
      (
        SELECT count(DISTINCT s.homework_question_id) 
        FROM homework_submissions s 
        JOIN homework_grades g ON g.submission_id = s.id 
        WHERE s.student_id = u.id AND g.stars > 0
      ) as homework_completed,
      (
        SELECT count(*) 
        FROM homework_submissions s 
        WHERE s.student_id = u.id
      ) as total_submissions
    FROM users u
    WHERE u.role = 'student'
    ORDER BY u.created_at DESC
  `).all()) as any[];

  return NextResponse.json({ students });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized: Teacher access required' }, { status: 403 });
  }

  try {
    const { name, email, password } = await req.json();

    if (!name || !name.trim() || !password || !password.trim()) {
      return NextResponse.json({ error: 'Student name and password are required' }, { status: 400 });
    }

    const trimmedName = name.trim();
    // Default or formatted email
    let studentEmail = (email && email.trim()) || '';
    if (!studentEmail) {
      const sanitized = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '');
      studentEmail = `${sanitized}@student.c`;
    }

    const db = getDb();

    // Check uniqueness
    const existing = await db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(name) = LOWER(?)').get(studentEmail, trimmedName);
    if (existing) {
      return NextResponse.json({ error: 'A student with this name or email already exists' }, { status: 409 });
    }

    const newId = `usr-student-${Date.now()}`;
    const passwordHash = hashPassword(password.trim());
    const now = new Date().toISOString();

    await db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, created_at)
      VALUES (?, ?, ?, ?, 'student', ?)
    `).run(newId, trimmedName, studentEmail, passwordHash, now);

    return NextResponse.json({
      success: true,
      message: 'Student created successfully',
      student: {
        id: newId,
        name: trimmedName,
        email: studentEmail,
        created_at: now
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create student';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Reset Student Password
export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized: Teacher access required' }, { status: 403 });
  }

  try {
    const { studentId, newPassword } = await req.json();

    if (!studentId || !newPassword || !newPassword.trim()) {
      return NextResponse.json({ error: 'Student ID and new password are required' }, { status: 400 });
    }

    const db = getDb();
    const student = (await db.prepare("SELECT id, name FROM users WHERE id = ? AND role = 'student'").get(studentId)) as any;

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const passwordHash = hashPassword(newPassword.trim());

    // Update password and clear current_session_id so any active session is logged out
    await db.prepare(`
      UPDATE users 
      SET password_hash = ?, current_session_id = NULL 
      WHERE id = ?
    `).run(passwordHash, studentId);

    return NextResponse.json({
      success: true,
      message: `Password for ${student.name} was successfully reset. All active sessions have been logged out.`
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to reset password';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Delete Student
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized: Teacher access required' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const db = getDb();
    await db.prepare("DELETE FROM users WHERE id = ? AND role = 'student'").run(id);

    return NextResponse.json({ success: true, message: 'Student removed successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to remove student';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
