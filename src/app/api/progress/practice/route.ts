import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import crypto from 'node:crypto';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { dayId, completed } = await req.json();
    if (!dayId) {
      return NextResponse.json({ error: 'dayId is required' }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id, completed FROM practice_progress WHERE student_id = ? AND day_id = ?').get(user.id, dayId) as any;

    const newCompleted = completed !== undefined ? (completed ? 1 : 0) : (existing && existing.completed === 1 ? 0 : 1);

    if (existing) {
      db.prepare('UPDATE practice_progress SET completed = ?, completed_at = ? WHERE id = ?')
        .run(newCompleted, newCompleted === 1 ? new Date().toISOString() : null, existing.id);
    } else {
      db.prepare('INSERT INTO practice_progress (id, student_id, day_id, completed, completed_at) VALUES (?, ?, ?, ?, ?)')
        .run(crypto.randomUUID(), user.id, dayId, newCompleted, newCompleted === 1 ? new Date().toISOString() : null);
    }

    return NextResponse.json({ success: true, completed: newCompleted === 1 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update practice progress';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
