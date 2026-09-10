import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ notifications: [] });
  }

  const db = getDb();
  const notifications = db.prepare(`
    SELECT * FROM notifications 
    WHERE user_id = ? OR user_id IS NULL
    ORDER BY created_at DESC 
    LIMIT 20
  `).all(user.id);

  return NextResponse.json({ notifications });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { notifId } = await req.json();
    const db = getDb();
    if (notifId) {
      db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND (user_id = ? OR user_id IS NULL)').run(notifId, user.id);
    } else {
      db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ? OR user_id IS NULL').run(user.id);
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update notification';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
