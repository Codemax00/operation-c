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
    const { dayId, title, fileUrl, resourceType } = await req.json();

    if (!dayId || !title) {
      return NextResponse.json({ error: 'dayId and title are required' }, { status: 400 });
    }

    const type = resourceType || 'pdf';
    const url = fileUrl || `/resources/${encodeURIComponent(title.toLowerCase().replace(/\s+/g, '_'))}.${type}`;

    const db = getDb();
    const id = `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO resources (id, day_id, title, file_url, resource_type, uploaded_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, dayId, title, url, type, now);

    return NextResponse.json({ success: true, resource: { id, day_id: dayId, title, file_url: url, resource_type: type, uploaded_at: now } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add resource';
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
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Resource id is required' }, { status: 400 });
    }

    const db = getDb();
    db.prepare('DELETE FROM resources WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete resource';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
