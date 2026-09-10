import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { getDb } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'c_academy_super_secret_jwt_key_2026';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher';
  sessionId?: string;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function signToken(payload: UserSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('c_academy_session')?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded) return null;

  // Enforce single-device active session:
  // If user has logged in from another device, current_session_id will be different!
  if (decoded.sessionId) {
    const db = getDb();
    const userRow = db.prepare('SELECT current_session_id FROM users WHERE id = ?').get(decoded.id) as { current_session_id?: string } | undefined;
    if (!userRow || userRow.current_session_id !== decoded.sessionId) {
      return null;
    }
  }

  return decoded;
}
