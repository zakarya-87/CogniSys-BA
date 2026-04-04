import { useState, useEffect, useCallback, useRef } from 'react';
import { NotificationAPI, createNotificationStream } from '../../src/services/api';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  payload?: Record<string, unknown>;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await NotificationAPI.list(false, 20);
      const items: AppNotification[] = (res.data as any).notifications ?? [];
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.read).length);
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (id: string) => {
    await NotificationAPI.markRead(id).catch(() => {});
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await NotificationAPI.markAllRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  // Subscribe to SSE stream for real-time pushes
  useEffect(() => {
    let mounted = true;
    createNotificationStream((notification) => {
      if (!mounted) return;
      const n = notification as AppNotification;
      setNotifications((prev) => [n, ...prev].slice(0, 50));
      setUnreadCount((c) => c + 1);
    }).then((es) => {
      if (mounted) esRef.current = es;
    });

    fetchNotifications();

    return () => {
      mounted = false;
      esRef.current?.close();
    };
  }, [fetchNotifications]);

  return { notifications, unreadCount, loading, markRead, markAllRead, refetch: fetchNotifications };
}
