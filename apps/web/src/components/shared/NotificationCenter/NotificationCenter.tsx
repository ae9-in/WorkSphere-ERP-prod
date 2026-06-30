import React, { useEffect } from 'react';
import { Drawer } from '@/components/ui/Drawer/Drawer';
import { useUIStore } from '@/store/uiStore';
import { useNotificationStore } from '@/store/notificationStore';
import { notificationService } from '@/services/api.service';
import { Button } from '@/components/ui/Button/Button';
import { Check, Bell, Cake, CurrencyInr, Calendar, CheckSquare } from '@phosphor-icons/react';
import { formatRelative } from '@/lib/formatters';

export function NotificationCenter() {
  const { notificationDrawerOpen, setNotificationDrawerOpen } = useUIStore();
  const { notifications, setNotifications, markAsRead, markAllAsRead } = useNotificationStore();

  useEffect(() => {
    notificationService.getAll().then(setNotifications);
  }, [setNotifications]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'birthday': return <Cake size={18} className="text-ag-pink" />;
      case 'payroll_processed': return <CurrencyInr size={18} className="text-ag-mint" />;
      case 'approval_request': return <CheckSquare size={18} className="text-ag-amber" />;
      default: return <Bell size={18} className="text-ag-primary" />;
    }
  };

  return (
    <Drawer
      isOpen={notificationDrawerOpen}
      onClose={() => setNotificationDrawerOpen(false)}
      title="Notification Center"
      description="Stay updated with enterprise alerts and approvals."
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between pb-3 border-b border-ag-border mb-4">
          <span className="text-xs font-semibold text-ag-ink-3">Recent Notifications</span>
          <button
            onClick={() => markAllAsRead()}
            className="text-xs font-semibold text-ag-primary hover:underline"
          >
            Mark all as read
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => markAsRead(n._id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                n.read
                  ? 'bg-ag-surface border-ag-border/60 opacity-75'
                  : 'bg-ag-primary-light/40 border-ag-border-strong shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-ag-surface shadow-xs flex-shrink-0">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-ag-ink leading-tight">{n.title}</h4>
                    <span className="text-[10px] text-ag-ink-3 whitespace-nowrap">{formatRelative(n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-ag-ink-2 mt-1 leading-relaxed">{n.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Drawer>
  );
}
