'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher';
}

export interface UserStats {
  lessonsCompleted: number;
  practiceCompleted: number;
  homeworkCompleted: number;
  totalHomework: number;
  learningProgress: number;
  practiceProgress: number;
  homeworkProgress: number;
  avgRating: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: number;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  stats: UserStats;
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  refreshStats: () => Promise<void>;
  markNotificationRead: (id?: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: User | null) => void;
}

const defaultStats: UserStats = {
  lessonsCompleted: 0,
  practiceCompleted: 0,
  homeworkCompleted: 0,
  totalHomework: 1,
  learningProgress: 0,
  practiceProgress: 0,
  homeworkProgress: 0,
  avgRating: 0,
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  stats: defaultStats,
  notifications: [],
  unreadCount: 0,
  loading: true,
  refreshStats: async () => {},
  markNotificationRead: async () => {},
  logout: async () => {},
  setUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.stats) setStats(data.stats);
      } else {
        // If previously logged in and now rejected, another device logged in!
        setUser(prevUser => {
          if (prevUser && pathname !== '/login' && pathname !== '/teacher') {
            router.push('/login?reason=concurrent_session');
          }
          return null;
        });
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [pathname, router]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch {
      // Ignore notification fetch error
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Periodic heartbeat every 6 seconds to enforce single active device and fetch new notifications
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchCurrentUser();
      fetchNotifications();
    }, 6000);
    return () => clearInterval(interval);
  }, [user, fetchCurrentUser, fetchNotifications]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  const refreshStats = async () => {
    await fetchCurrentUser();
    await fetchNotifications();
  };

  const markNotificationRead = async (id?: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifId: id })
      });
      setNotifications(prev =>
        prev.map(n => (!id || n.id === id ? { ...n, read: 1 } : n))
      );
    } catch {
      // Ignore
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  const unreadCount = notifications.filter(n => n.read === 0).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        stats,
        notifications,
        unreadCount,
        loading,
        refreshStats,
        markNotificationRead,
        logout,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
