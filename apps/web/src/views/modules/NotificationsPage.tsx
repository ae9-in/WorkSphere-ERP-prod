import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { notificationService } from '@/services/api.service';
import { useNotificationStore } from '@/store/notificationStore';
import {
  Bell, BellSlash, CheckCircle, ArrowsClockwise,
  CheckSquare, Clock, FileText, CurrencyInr, UserPlus,
  ShieldCheck, CalendarBlank, Package, WarningCircle
} from '@phosphor-icons/react';
import { formatRelative } from '@/lib/formatters';
import { toast } from 'sonner';

type NotifType =
  | 'leave_request' | 'leave_approved' | 'leave_rejected'
  | 'attendance' | 'payroll' | 'onboarding' | 'offboarding'
  | 'asset' | 'document' | 'approval' | 'system' | 'general';

type TabId = 'all' | 'unread';

const notifIcon: Record<string, React.ReactNode> = {
  leave_request:  <CalendarBlank size={20} className="text-ag-primary" />,
  leave_approved: <CheckCircle   size={20} className="text-ag-mint" />,
  leave_rejected: <WarningCircle size={20} className="text-ag-accent-pink" />,
  attendance:     <Clock         size={20} className="text-ag-amber" />,
  payroll:        <CurrencyInr   size={20} className="text-[#00875A]" />,
  onboarding:     <UserPlus      size={20} className="text-ag-primary" />,
  offboarding:    <CheckSquare   size={20} className="text-ag-ink-3" />,
  asset:          <Package       size={20} className="text-[#0077B6]" />,
  document:       <FileText      size={20} className="text-ag-amber" />,
  approval:       <ShieldCheck   size={20} className="text-ag-mint" />,
  system:         <Bell          size={20} className="text-ag-ink-3" />,
  general:        <Bell          size={20} className="text-ag-primary" />,
};

const notifBg: Record<string, string> = {
  leave_request:  'bg-ag-primary-light',
  leave_approved: 'bg-[#E6FAF4]',
  leave_rejected: 'bg-ag-accent-pink/10',
  attendance:     'bg-[#FFF8E6]',
  payroll:        'bg-[#E6FAF4]',
  onboarding:     'bg-ag-primary-light',
  offboarding:    'bg-ag-surface-2',
  asset:          'bg-[#E8F6FF]',
  document:       'bg-[#FFF8E6]',
  approval:       'bg-[#E6FAF4]',
  system:         'bg-ag-surface-2',
  general:        'bg-ag-primary-light',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [activeTab, setActiveTab]         = useState<TabId>('all');
  const [markingId, setMarkingId]         = useState<string | null>(null);
  const [markingAll, setMarkingAll]       = useState(false);
  const { markAsRead, markAllAsRead } = useNotificationStore();

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await notificationService.getAll();
      setNotifications(data || []);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    if (markingId) return;
    setMarkingId(id);
    try {
      await notificationService.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id || n._id === id) ? { ...n, read: true } : n)
      );
      markAsRead(id);
    } catch {
      toast.error('Failed to mark notification as read');
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      markAllAsRead();
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const filtered = activeTab === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <PageContainer
      title="Notifications"
      subtitle="Stay up to date with leave approvals, payroll updates, onboarding alerts, and system events."
      actions={
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={fetchNotifications}
            icon={<ArrowsClockwise size={18} />}
          >
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllRead}
              loading={markingAll}
              icon={<CheckSquare size={18} />}
            >
              Mark All Read
            </Button>
          )}
        </div>
      }
    >
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-8">
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-ag-primary-light text-ag-primary shrink-0">
            <Bell size={22} />
          </div>
          <div>
            <p className="text-xs text-ag-ink-3 font-semibold uppercase tracking-wider">Total</p>
            <p className="text-2xl font-bold font-display text-ag-ink mt-0.5">
              {isLoading ? '—' : notifications.length}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-ag-accent-pink/15 text-ag-accent-pink shrink-0">
            <BellSlash size={22} />
          </div>
          <div>
            <p className="text-xs text-ag-ink-3 font-semibold uppercase tracking-wider">Unread</p>
            <p className="text-2xl font-bold font-display text-ag-accent-pink mt-0.5">
              {isLoading ? '—' : unreadCount}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-[#E6FAF4] text-ag-mint shrink-0">
            <CheckCircle size={22} />
          </div>
          <div>
            <p className="text-xs text-ag-ink-3 font-semibold uppercase tracking-wider">Read</p>
            <p className="text-2xl font-bold font-display text-ag-ink mt-0.5">
              {isLoading ? '—' : notifications.filter((n) => n.read).length}
            </p>
          </div>
        </Card>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-2 p-1 bg-ag-surface-2 rounded-xl w-fit border border-ag-border mb-6">
        {(['all', 'unread'] as TabId[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab
                ? 'bg-ag-primary text-white shadow'
                : 'text-ag-ink-3 hover:text-ag-ink'
            }`}
          >
            {tab === 'all' ? 'All' : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader
          title={activeTab === 'all' ? 'All Notifications' : 'Unread Notifications'}
          subtitle={
            isLoading
              ? 'Loading notifications from server…'
              : `${filtered.length} notification(s) ${activeTab === 'unread' ? 'pending review' : 'in total'}`
          }
        />

        {isLoading ? (
          <div className="p-16 text-center">
            <div className="w-8 h-8 border-2 border-ag-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-ag-ink-3">Loading notifications…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="p-5 rounded-2xl bg-ag-surface-2">
              <Bell size={40} className="text-ag-ink-3" />
            </div>
            <div className="text-center">
              <p className="font-bold text-ag-ink text-base">
                {activeTab === 'unread' ? 'All Caught Up!' : 'No Notifications'}
              </p>
              <p className="text-sm text-ag-ink-3 mt-1.5 max-w-xs">
                {activeTab === 'unread'
                  ? 'You have no unread notifications. Check the All tab for your history.'
                  : 'Your notification centre is empty. System events and HR updates will appear here.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-ag-border/40">
            {filtered.map((notif) => {
              const iconKey = (notif.type ?? 'general') as string;
              const icon    = notifIcon[iconKey] ?? notifIcon['general'];
              const bg      = notifBg[iconKey] ?? notifBg['general'];

              return (
                <div
                  key={notif.id || notif._id}
                  className={`flex items-start gap-4 px-5 py-4 transition-all hover:bg-ag-surface-2/40 ${
                    !notif.read ? 'bg-ag-primary-light/20' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className={`shrink-0 p-2.5 rounded-xl ${bg} mt-0.5`}>
                    {icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`text-sm font-semibold ${notif.read ? 'text-ag-ink-2' : 'text-ag-ink'}`}>
                          {notif.title || 'WorkSphere Notification'}
                        </p>
                        <p className="text-xs text-ag-ink-3 mt-0.5 leading-relaxed">
                          {notif.message || notif.body || '—'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <p className="text-[11px] text-ag-ink-3 whitespace-nowrap">
                          {notif.createdAt ? formatRelative(notif.createdAt) : '—'}
                        </p>
                        {!notif.read && (
                          <button
                            onClick={() => handleMarkRead(notif.id || notif._id)}
                            disabled={markingId === (notif.id || notif._id)}
                            className="text-[11px] font-bold text-ag-primary hover:underline disabled:opacity-50 transition-opacity"
                          >
                            {markingId === (notif.id || notif._id) ? 'Marking…' : 'Mark Read'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Unread dot + category badge */}
                    <div className="flex items-center gap-2 mt-2">
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-ag-primary shrink-0" />
                      )}
                      {notif.type && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-ag-surface-2 text-ag-ink-3">
                          {String(notif.type).replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
