import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: Request, context: { params: Promise<{ dayId: string }> }) {
  const { dayId } = await context.params;
  const user = await getCurrentUser();
  const db = getDb();

  // Find day by id or day_number
  let day = (await db.prepare('SELECT * FROM course_days WHERE id = ? OR day_number = ?').get(dayId, isNaN(Number(dayId)) ? -1 : Number(dayId))) as any;
  if (!day) {
    return NextResponse.json({ error: 'Day not found' }, { status: 404 });
  }

  const resources = (await db.prepare('SELECT * FROM resources WHERE day_id = ? ORDER BY uploaded_at ASC').all(day.id)) as any[];
  const solvedQuestions = (await db.prepare('SELECT * FROM solved_questions WHERE day_id = ? ORDER BY order_index ASC').all(day.id)) as any[];
  const homeworkQuestions = (await db.prepare('SELECT * FROM homework_questions WHERE day_id = ? AND published = 1 ORDER BY created_at ASC').all(day.id)) as any[];

  let lessonCompleted = false;
  let practiceCompleted = false;
  let submissionsMap: Record<string, any> = {};

  if (user && user.role === 'student') {
    const lp = (await db.prepare('SELECT completed FROM lesson_progress WHERE student_id = ? AND day_id = ?').get(user.id, day.id)) as any;
    if (lp && lp.completed === 1) lessonCompleted = true;

    const pp = (await db.prepare('SELECT completed FROM practice_progress WHERE student_id = ? AND day_id = ?').get(user.id, day.id)) as any;
    if (pp && pp.completed === 1) practiceCompleted = true;

    // Get submissions for each homework question
    for (const hw of homeworkQuestions) {
      const sub = await db.prepare(`
        SELECT 
          s.*,
          g.stars,
          g.feedback,
          g.graded_at
        FROM homework_submissions s
        LEFT JOIN homework_grades g ON g.submission_id = s.id
        WHERE s.student_id = ? AND s.homework_question_id = ?
        ORDER BY s.submitted_at DESC
        LIMIT 1
      `).get(user.id, hw.id);

      if (sub) {
        submissionsMap[hw.id] = sub;
      }
    }
  }

  return NextResponse.json({
    day: {
      ...day,
      published: Boolean(day.published),
      lessonCompleted,
      practiceCompleted
    },
    resources,
    solvedQuestions,
    homeworkQuestions: homeworkQuestions.map((hw) => ({
      ...hw,
      submission: submissionsMap[hw.id] || null
    }))
  });
}
