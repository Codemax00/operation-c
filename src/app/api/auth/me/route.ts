import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const db = getDb();
  // Fetch overall progress stats for student
  let stats = {
    lessonsCompleted: 0,
    practiceCompleted: 0,
    homeworkCompleted: 0,
    totalHomework: 0,
    learningProgress: 0,
    practiceProgress: 0,
    homeworkProgress: 0,
    avgRating: 0,
  };

  if (user.role === 'student') {
    const lRow = (await db.prepare('SELECT count(*) as count FROM lesson_progress WHERE student_id = ? AND completed = 1').get(user.id)) as { count: number } | null;
    const pRow = (await db.prepare('SELECT count(*) as count FROM practice_progress WHERE student_id = ? AND completed = 1').get(user.id)) as { count: number } | null;
    
    // Graded homework count
    const hRow = (await db.prepare(`
      SELECT count(DISTINCT s.homework_question_id) as count
      FROM homework_submissions s
      JOIN homework_grades g ON s.id = g.submission_id
      WHERE s.student_id = ? AND g.stars > 0
    `).get(user.id)) as { count: number } | null;

    // Total published homework questions
    const totalHwRow = (await db.prepare('SELECT count(*) as count FROM homework_questions WHERE published = 1').get()) as { count: number } | null;

    // Average rating
    const ratingRow = (await db.prepare(`
      SELECT AVG(g.stars) as avg_stars
      FROM homework_submissions s
      JOIN homework_grades g ON s.id = g.submission_id
      WHERE s.student_id = ?
    `).get(user.id)) as { avg_stars: number | null } | null;

    const lessonsCompleted = lRow ? lRow.count : 0;
    const practiceCompleted = pRow ? pRow.count : 0;
    const homeworkCompleted = hRow ? hRow.count : 0;
    const totalHomework = totalHwRow ? totalHwRow.count : 1;

    stats = {
      lessonsCompleted,
      practiceCompleted,
      homeworkCompleted,
      totalHomework,
      learningProgress: Math.round((lessonsCompleted / 30) * 100),
      practiceProgress: Math.round((practiceCompleted / 30) * 100),
      homeworkProgress: totalHomework > 0 ? Math.round((homeworkCompleted / totalHomework) * 100) : 0,
      avgRating: ratingRow && ratingRow.avg_stars ? parseFloat(ratingRow.avg_stars.toFixed(1)) : 0
    };
  }

  return NextResponse.json({
    user,
    stats
  });
}
