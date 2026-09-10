import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(process.cwd(), 'c_academy.db');
const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

console.log('Resetting and seeding database for production publish...');

// Ensure current_session_id column exists
try {
  db.exec('ALTER TABLE users ADD COLUMN current_session_id TEXT;');
} catch {
  // column exists
}

// 1. Clean demo submissions, grades, progress, and users
db.exec('DELETE FROM homework_grades;');
db.exec('DELETE FROM homework_submissions;');
db.exec('DELETE FROM lesson_progress;');
db.exec('DELETE FROM practice_progress;');
db.exec('DELETE FROM notifications;');
db.exec('DELETE FROM users;');

// 2. Create Teacher with user-specified credentials
const teacherPassHash = bcrypt.hashSync('umesh5433x', 10);
const now = new Date().toISOString();

db.prepare(`
  INSERT INTO users (id, name, email, password_hash, role, created_at)
  VALUES (?, ?, ?, ?, 'teacher', ?)
`).run('usr-teacher-umesh', 'umesh rocky', 'umeshrocky@academy.c', teacherPassHash, now);

console.log('Teacher created:');
console.log('Name: umesh rocky');
console.log('Email: umeshrocky@academy.c');
console.log('Role: teacher');

// 3. Create clean initial student for testing / student portal
const studentPassHash = bcrypt.hashSync('student123', 10);
db.prepare(`
  INSERT INTO users (id, name, email, password_hash, role, created_at)
  VALUES (?, ?, ?, ?, 'student', ?)
`).run('usr-student-init', 'Student', 'student@academy.c', studentPassHash, now);

console.log('Initial student account ready.');

// Check days count
const daysCount = db.prepare('SELECT count(*) as count FROM course_days').get();
console.log('Course days active in curriculum:', daysCount.count);
console.log('Database reset for production publishing complete!');
