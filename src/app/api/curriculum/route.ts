import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  const db = getDb();

  const days = (await db.prepare(`
    SELECT 
      d.*,
      (SELECT count(*) FROM resources r WHERE r.day_id = d.id) as resources_count,
      (SELECT count(*) FROM solved_questions sq WHERE sq.day_id = d.id) as solved_count,
      (SELECT count(*) FROM homework_questions hq WHERE hq.day_id = d.id AND hq.published = 1) as homework_count
    FROM course_days d
    ORDER BY d.day_number ASC
  `).all()) as any[];

  let lessonProgressMap = new Map<string, number>();
  let practiceProgressMap = new Map<string, number>();
  let homeworkStatusMap = new Map<string, string>();

  if (user && user.role === 'student') {
    const lpRows = (await db.prepare('SELECT day_id, completed FROM lesson_progress WHERE student_id = ?').all(user.id)) as any[];
    lpRows.forEach((r) => lessonProgressMap.set(r.day_id, r.completed));

    const ppRows = (await db.prepare('SELECT day_id, completed FROM practice_progress WHERE student_id = ?').all(user.id)) as any[];
    ppRows.forEach((r) => practiceProgressMap.set(r.day_id, r.completed));

    // Get homework submission statuses for each day
    const hwRows = (await db.prepare(`
      SELECT 
        hq.day_id,
        s.status as sub_status,
        g.stars
      FROM homework_questions hq
      LEFT JOIN homework_submissions s ON s.homework_question_id = hq.id AND s.student_id = ?
      LEFT JOIN homework_grades g ON g.submission_id = s.id
      WHERE hq.published = 1
    `).all(user.id)) as any[];

    hwRows.forEach((r) => {
      if (r.stars !== null && r.stars !== undefined) {
        homeworkStatusMap.set(r.day_id, 'Graded');
      } else if (r.sub_status) {
        homeworkStatusMap.set(r.day_id, r.sub_status);
      }
    });
  }

  const enrichedDays = days.map((d) => {
    const lessonCompleted = lessonProgressMap.get(d.id) === 1;
    const practiceCompleted = practiceProgressMap.get(d.id) === 1;
    const hwStatus = homeworkStatusMap.get(d.id) || 'Not Started';

    return {
      ...d,
      published: Boolean(d.published),
      lessonCompleted,
      practiceCompleted,
      homeworkStatus: hwStatus,
    };
  });

  // Calculate dynamic overall progress
  const totalDays = 30;
  const completedLessons = Array.from(lessonProgressMap.values()).filter(v => v === 1).length;
  const completedPractice = Array.from(practiceProgressMap.values()).filter(v => v === 1).length;

  const totalPublishedHwRow = (await db.prepare('SELECT count(*) as count FROM homework_questions WHERE published = 1').get()) as { count: number } | null;
  const totalPublishedHw = totalPublishedHwRow?.count || 1;

  let gradedHwCount = 0;
  if (user && user.role === 'student') {
    const gradedHwRow = (await db.prepare(`
      SELECT count(DISTINCT s.homework_question_id) as count
      FROM homework_submissions s
      JOIN homework_grades g ON s.id = g.submission_id
      WHERE s.student_id = ? AND g.stars > 0
    `).get(user.id)) as { count: number } | null;
    gradedHwCount = gradedHwRow?.count || 0;
  }

  const stats = {
    learningProgress: Math.min(100, Math.round((completedLessons / totalDays) * 100)),
    completedLessons,
    practiceProgress: Math.min(100, Math.round((completedPractice / totalDays) * 100)),
    completedPractice,
    homeworkProgress: totalPublishedHw > 0 ? Math.min(100, Math.round((gradedHwCount / totalPublishedHw) * 100)) : 0,
    completedHomework: gradedHwCount,
    totalHomework: totalPublishedHw
  };

  return NextResponse.json({
    days: enrichedDays,
    stats
  });
}
