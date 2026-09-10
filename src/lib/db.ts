import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = path.join(process.cwd(), 'c_academy.db');

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    dbInstance.exec('PRAGMA journal_mode = WAL;');
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    initSchema(dbInstance);
  }
  return dbInstance;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'teacher')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS course_days (
      id TEXT PRIMARY KEY,
      day_number INTEGER UNIQUE NOT NULL CHECK(day_number BETWEEN 1 AND 30),
      title TEXT NOT NULL,
      description TEXT,
      published INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY,
      day_id TEXT NOT NULL,
      title TEXT NOT NULL,
      file_url TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      uploaded_at TEXT NOT NULL,
      FOREIGN KEY(day_id) REFERENCES course_days(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS solved_questions (
      id TEXT PRIMARY KEY,
      day_id TEXT NOT NULL,
      question TEXT NOT NULL,
      explanation TEXT,
      solution_code TEXT NOT NULL,
      expected_output TEXT,
      order_index INTEGER DEFAULT 0,
      FOREIGN KEY(day_id) REFERENCES course_days(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS homework_questions (
      id TEXT PRIMARY KEY,
      day_id TEXT NOT NULL,
      question TEXT NOT NULL,
      starter_code TEXT,
      difficulty TEXT DEFAULT 'Easy' CHECK(difficulty IN ('Easy', 'Medium', 'Hard')),
      published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY(day_id) REFERENCES course_days(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS lesson_progress (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      day_id TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      UNIQUE(student_id, day_id),
      FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(day_id) REFERENCES course_days(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS practice_progress (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      day_id TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      UNIQUE(student_id, day_id),
      FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(day_id) REFERENCES course_days(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS homework_submissions (
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
    );

    CREATE TABLE IF NOT EXISTS homework_grades (
      id TEXT PRIMARY KEY,
      submission_id TEXT UNIQUE NOT NULL,
      teacher_id TEXT NOT NULL,
      stars INTEGER NOT NULL CHECK(stars BETWEEN 0 AND 5),
      feedback TEXT,
      graded_at TEXT NOT NULL,
      FOREIGN KEY(submission_id) REFERENCES homework_submissions(id) ON DELETE CASCADE,
      FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);
}
