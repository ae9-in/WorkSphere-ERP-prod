import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Notification } from '@/types/api.types';

interface NotificationState {
  notifications: Notification[];
  unreadCount:   number;

  setNotifications:   (notifications: Notification[]) => void;
  addNotification:    (notification: Notification) => void;
  markAsRead:         (id: string) => void;
  markAllAsRead:      () => void;
  removeNotification: (id: string) => void;
  clearAll:           () => void;
}

export const useNotificationStore = create<NotificationState>()(
  immer((set) => ({
    notifications: [],
    unreadCount:   0,

    setNotifications: (notifications) => set((state) => {
      state.notifications = notifications;
      state.unreadCount   = notifications.filter(n => !n.read).length;
    }),

    addNotification: (notification) => set((state) => {
      state.notifications.unshift(notification);
      if (!notification.read) state.unreadCount += 1;
    }),

    markAsRead: (id) => set((state) => {
      const n = state.notifications.find(n => n._id === id);
      if (n && !n.read) {
        n.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    }),

    markAllAsRead: () => set((state) => {
      state.notifications.forEach(n => { n.read = true; });
      state.unreadCount = 0;
    }),

    removeNotification: (id) => set((state) => {
      const idx = state.notifications.findIndex(n => n._id === id);
      if (idx !== -1) {
        if (!state.notifications[idx].read) state.unreadCount -= 1;
        state.notifications.splice(idx, 1);
      }
    }),

    clearAll: () => set((state) => {
      state.notifications = [];
      state.unreadCount   = 0;
    }),
  }))
);
