import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword, signToken } from '@/lib/auth';
import crypto from 'node:crypto';

export async function POST(req: Request) {
  try {
    const { email, identifier, password, role } = await req.json();
    const loginId = (identifier || email || '').trim();

    if (!loginId || !password) {
      return NextResponse.json({ error: 'Name/Email and password are required' }, { status: 400 });
    }

    const db = getDb();
    
    // Find user by either email OR username (case-insensitive)
    const user = (await db.prepare(`
      SELECT * FROM users 
      WHERE LOWER(email) = LOWER(?) OR LOWER(name) = LOWER(?)
      LIMIT 1
    `).get(loginId, loginId)) as {
      id: string;
      name: string;
      email: string;
      password_hash: string;
      role: 'student' | 'teacher';
    } | null;

    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: 'Invalid name/email or password' }, { status: 401 });
    }

    // Optional role check
    if (role && user.role !== role) {
      if (role === 'teacher') {
        return NextResponse.json({ error: 'Access denied: Teacher privileges required' }, { status: 403 });
      }
    }

    // Generate fresh session ID to enforce single-device active session
    const sessionId = crypto.randomUUID();
    await db.prepare('UPDATE users SET current_session_id = ? WHERE id = ?').run(sessionId, user.id);

    const sessionData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      sessionId
    };

    const token = signToken(sessionData);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

    response.cookies.set('c_academy_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
