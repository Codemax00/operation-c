import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import crypto from 'node:crypto';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized: Teacher access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { type, id, dayId, question, explanation, solutionCode, expectedOutput, starterCode, difficulty, published } = body;

    if (!type || !dayId || !question) {
      return NextResponse.json({ error: 'Type, dayId, and question are required' }, { status: 400 });
    }

    const db = getDb();

    if (type === 'solved') {
      if (id) {
        await db.prepare(`
          UPDATE solved_questions 
          SET question = ?, explanation = ?, solution_code = ?, expected_output = ?
          WHERE id = ?
        `).run(question, explanation || '', solutionCode || '', expectedOutput || '', id);
        return NextResponse.json({ success: true, message: 'Solved question updated' });
      } else {
        const newId = `sq-${Date.now()}`;
        const orderIndexRow = (await db.prepare('SELECT COALESCE(MAX(order_index), 0) + 1 as next_idx FROM solved_questions WHERE day_id = ?').get(dayId)) as any;
        await db.prepare(`
          INSERT INTO solved_questions (id, day_id, question, explanation, solution_code, expected_output, order_index)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(newId, dayId, question, explanation || '', solutionCode || '', expectedOutput || '', orderIndexRow?.next_idx || 1);
        return NextResponse.json({ success: true, id: newId, message: 'Solved question created' });
      }
    } else if (type === 'homework') {
      if (id) {
        await db.prepare(`
          UPDATE homework_questions
          SET question = ?, starter_code = ?, difficulty = ?, published = ?
          WHERE id = ?
        `).run(question, starterCode || '', difficulty || 'Easy', published ? 1 : 0, id);
        return NextResponse.json({ success: true, message: 'Homework question updated' });
      } else {
        const newId = `hw-${Date.now()}`;
        await db.prepare(`
          INSERT INTO homework_questions (id, day_id, question, starter_code, difficulty, published, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(newId, dayId, question, starterCode || '', difficulty || 'Easy', published !== undefined ? (published ? 1 : 0) : 1, new Date().toISOString());
        return NextResponse.json({ success: true, id: newId, message: 'Homework question created' });
      }
    }

    return NextResponse.json({ error: 'Invalid question type' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Operation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized: Teacher access required' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ error: 'Type and id are required' }, { status: 400 });
    }

    const db = getDb();
    if (type === 'solved') {
      await db.prepare('DELETE FROM solved_questions WHERE id = ?').run(id);
    } else if (type === 'homework') {
      await db.prepare('DELETE FROM homework_questions WHERE id = ?').run(id);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Delete failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
