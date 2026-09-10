import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized: Teacher access required' }, { status: 403 });
  }

  const db = getDb();
  const rawDays = db.prepare(`
    SELECT 
      d.*,
      (SELECT count(*) FROM resources r WHERE r.day_id = d.id) as resources_count,
      (SELECT count(*) FROM solved_questions sq WHERE sq.day_id = d.id) as solved_count,
      (SELECT count(*) FROM homework_questions hq WHERE hq.day_id = d.id) as homework_count,
      (
        SELECT count(*) 
        FROM homework_submissions s 
        JOIN homework_questions hq ON s.homework_question_id = hq.id 
        WHERE hq.day_id = d.id
      ) as submission_count
    FROM course_days d
    ORDER BY d.day_number ASC
  `).all() as any[];

  const getResources = db.prepare('SELECT id, day_id, title, file_url, resource_type, uploaded_at FROM resources WHERE day_id = ? ORDER BY uploaded_at ASC');

  const days = rawDays.map(d => ({
    ...d,
    resources: getResources.all(d.id)
  }));

  return NextResponse.json({ days });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized: Teacher access required' }, { status: 403 });
  }

  try {
    const { dayId, title, description, published } = await req.json();

    if (!dayId) {
      return NextResponse.json({ error: 'dayId is required' }, { status: 400 });
    }

    const db = getDb();
    const day = db.prepare('SELECT * FROM course_days WHERE id = ?').get(dayId) as any;
    if (!day) {
      return NextResponse.json({ error: 'Day not found' }, { status: 404 });
    }

    const updatedTitle = title !== undefined ? title : day.title;
    const updatedDesc = description !== undefined ? description : day.description;
    const updatedPublished = published !== undefined ? (published ? 1 : 0) : day.published;

    db.prepare(`
      UPDATE course_days 
      SET title = ?, description = ?, published = ?
      WHERE id = ?
    `).run(updatedTitle, updatedDesc, updatedPublished, dayId);

    // If publishing, send notification to students
    if (updatedPublished === 1 && day.published === 0) {
      const students = db.prepare("SELECT id FROM users WHERE role = 'student'").all() as any[];
      const insertNotif = db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, read, created_at)
        VALUES (?, ?, ?, ?, 'resource', 0, ?)
      `);
      const now = new Date().toISOString();
      students.forEach(s => {
        insertNotif.run(crypto.randomUUID(), s.id, `Day ${day.day_number} Content Available`, `Day ${day.day_number}: ${updatedTitle} is now open for learning!`, now);
      });
    }

    return NextResponse.json({ success: true, message: 'Day updated successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Update failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
