import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { createClient } from '@libsql/client';

const url = 'libsql://c-academy-codemax00.aws-ap-south-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODkwNjA4MTIsImlkIjoiMDFhMDhjNTMtNjIwMS03MmVkLTg2YzYtZTM5NzZmNGY2NDAyIiwia2lkIjoiY0hFMUN1b3d0ZkRwUFF0QjR4MUZUQ2xVQ3VXV0tKWm1lU0RjekVock1GQSIsInJpZCI6ImIyNmMyZmNkLTFlNjYtNDU5My04ZGNjLWFhMzFiYzcwZTlkNSJ9.pCWklFpiXa64Dypau6kXLMV69FHUfs_CBwiIBrb3BYmdGuW3Da0HtbrXkhffi38UC1l-Q-a32R8C5JMFiOYSCQ';

const localDbPath = path.join(process.cwd(), 'c_academy.db');
const localDb = new DatabaseSync(localDbPath);
const turso = createClient({ url, authToken });

async function migrate() {
  console.log('--- Migrating Database to Turso Cloud ---');

  // 1. Create Schema on Turso
  const schemaStatements = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'teacher')),
      current_session_id TEXT,
      created_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS course_days (
      id TEXT PRIMARY KEY,
      day_number INTEGER UNIQUE NOT NULL CHECK(day_number BETWEEN 1 AND 30),
      title TEXT NOT NULL,
      description TEXT,
      published INTEGER NOT NULL DEFAULT 0
    );`,
    `CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY,
      day_id TEXT NOT NULL,
      title TEXT NOT NULL,
      file_url TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      uploaded_at TEXT NOT NULL,
      FOREIGN KEY(day_id) REFERENCES course_days(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS solved_questions (
      id TEXT PRIMARY KEY,
      day_id TEXT NOT NULL,
      question TEXT NOT NULL,
      explanation TEXT,
      solution_code TEXT NOT NULL,
      expected_output TEXT,
      order_index INTEGER DEFAULT 0,
      FOREIGN KEY(day_id) REFERENCES course_days(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS homework_questions (
      id TEXT PRIMARY KEY,
      day_id TEXT NOT NULL,
      question TEXT NOT NULL,
      starter_code TEXT,
      difficulty TEXT DEFAULT 'Easy' CHECK(difficulty IN ('Easy', 'Medium', 'Hard')),
      published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY(day_id) REFERENCES course_days(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS lesson_progress (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      day_id TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      UNIQUE(student_id, day_id),
      FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(day_id) REFERENCES course_days(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS practice_progress (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      day_id TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      UNIQUE(student_id, day_id),
      FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(day_id) REFERENCES course_days(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS homework_submissions (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      homework_question_id TEXT NOT NULL,
      code TEXT NOT NULL,
      output TEXT,
      compilation_status TEXT NOT NULL CHECK(compilation_status IN ('success', 'error')),
      submitted_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Submitted',
      FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(homework_question_id) REFERENCES homework_questions(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS homework_grades (
      id TEXT PRIMARY KEY,
      submission_id TEXT UNIQUE NOT NULL,
      teacher_id TEXT NOT NULL,
      stars INTEGER NOT NULL CHECK(stars BETWEEN 0 AND 5),
      feedback TEXT,
      graded_at TEXT NOT NULL,
      FOREIGN KEY(submission_id) REFERENCES homework_submissions(id) ON DELETE CASCADE,
      FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );`
  ];

  for (const statement of schemaStatements) {
    await turso.execute(statement);
  }
  console.log('✓ All 10 tables created on Turso successfully.');

  // 2. Transfer Users
  const localUsers = localDb.prepare('SELECT * FROM users').all();
  for (const u of localUsers) {
    await turso.execute({
      sql: `INSERT OR REPLACE INTO users (id, name, email, password_hash, role, current_session_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [u.id, u.name, u.email, u.password_hash, u.role, u.current_session_id || null, u.created_at]
    });
  }
  console.log(`✓ Transferred ${localUsers.length} users to Turso.`);

  // 3. Transfer Course Days
  const localDays = localDb.prepare('SELECT * FROM course_days').all();
  for (const d of localDays) {
    await turso.execute({
      sql: `INSERT OR REPLACE INTO course_days (id, day_number, title, description, published)
            VALUES (?, ?, ?, ?, ?)`,
      args: [d.id, d.day_number, d.title, d.description, d.published]
    });
  }
  console.log(`✓ Transferred ${localDays.length} curriculum days to Turso.`);

  // 4. Transfer Resources
  const localResources = localDb.prepare('SELECT * FROM resources').all();
  for (const r of localResources) {
    await turso.execute({
      sql: `INSERT OR REPLACE INTO resources (id, day_id, title, file_url, resource_type, uploaded_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [r.id, r.day_id, r.title, r.file_url, r.resource_type, r.uploaded_at]
    });
  }
  console.log(`✓ Transferred ${localResources.length} resources to Turso.`);

  // 5. Transfer Solved Questions
  const localSolved = localDb.prepare('SELECT * FROM solved_questions').all();
  for (const sq of localSolved) {
    await turso.execute({
      sql: `INSERT OR REPLACE INTO solved_questions (id, day_id, question, explanation, solution_code, expected_output, order_index)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [sq.id, sq.day_id, sq.question, sq.explanation, sq.solution_code, sq.expected_output, sq.order_index]
    });
  }
  console.log(`✓ Transferred ${localSolved.length} solved questions to Turso.`);

  // 6. Transfer Homework Questions
  const localHw = localDb.prepare('SELECT * FROM homework_questions').all();
  for (const hq of localHw) {
    await turso.execute({
      sql: `INSERT OR REPLACE INTO homework_questions (id, day_id, question, starter_code, difficulty, published, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [hq.id, hq.day_id, hq.question, hq.starter_code, hq.difficulty, hq.published, hq.created_at]
    });
  }
  console.log(`✓ Transferred ${localHw.length} homework questions to Turso.`);

  // 7. Verify counts on Turso
  const tursoUsers = await turso.execute('SELECT count(*) as count FROM users');
  const tursoDays = await turso.execute('SELECT count(*) as count FROM course_days');
  console.log(`Verification: Turso now has ${tursoUsers.rows[0].count} users and ${tursoDays.rows[0].count} days.`);
  console.log('Migration to Turso completed successfully! 🎉');
}

migrate().catch(console.error);
