import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const db = getDb();
  const sentNotifications = db.prepare(`
    SELECT n.*, u.name as student_name, u.email as student_email
    FROM notifications n
    LEFT JOIN users u ON n.user_id = u.id
    ORDER BY n.created_at DESC
    LIMIT 50
  `).all();

  return NextResponse.json({ notifications: sentNotifications });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized: Teacher access required' }, { status: 403 });
  }

  try {
    const { studentId, title, message, type = 'info' } = await req.json();

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Notification title and message are required' }, { status: 400 });
    }

    const db = getDb();
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = new Date().toISOString();
    const targetUserId = studentId && studentId !== 'all' ? studentId : null;

    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, read, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).run(id, targetUserId, title.trim(), message.trim(), type, createdAt);

    return NextResponse.json({ 
      success: true, 
      id,
      message: targetUserId ? 'Notification sent to student' : 'Broadcast sent to all students'
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to send notification';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    const db = getDb();
    db.prepare('DELETE FROM notifications WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to delete notification';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
