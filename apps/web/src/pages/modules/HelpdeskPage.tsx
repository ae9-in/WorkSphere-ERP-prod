import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import {
  Headset, WarningCircle, CheckCircle, ArrowsClockwise, Plus,
  ChatCircle, Clock, User
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import api from '@/services/api';

const PRIORITY_COLORS: Record<string, string> = {
  high:   'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low:    'bg-green-100 text-green-700',
};

const STATUS_COLORS: Record<string, string> = {
  open:        'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved:    'bg-green-100 text-green-700',
  closed:      'bg-gray-100 text-gray-500',
};

export default function HelpdeskPage() {
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [myEmpId, setMyEmpId] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
  });

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const meRes = await api.get('/auth/me');
      setMyEmpId(meRes.data.data?.employeeId || '');
      const res = await api.get('/helpdesk/tickets');
      setTickets(res.data.data || []);
    } catch {
      toast.error('Failed to load helpdesk tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.title.trim() || !newTicket.description.trim()) {
      return toast.error('Title and description are required');
    }
    try {
      const res = await api.post('/helpdesk/tickets', newTicket);
      toast.success('Support ticket submitted!');
      setNewTicket({ title: '', description: '', category: 'general', priority: 'medium' });
      setShowNewForm(false);
      fetchTickets();
      setSelectedTicket(res.data.data);
    } catch {
      toast.error('Failed to submit ticket');
    }
  };

  const handleAssignToSelf = async () => {
    if (!selectedTicket || !myEmpId) return;
    try {
      const res = await api.post(`/helpdesk/tickets/${selectedTicket._id}/assign`, {
        assignedToId: myEmpId,
      });
      toast.success('Ticket assigned to you!');
      setSelectedTicket(res.data.data);
      fetchTickets();
    } catch {
      toast.error('Failed to assign ticket');
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicket) return;
    try {
      const res = await api.patch(`/helpdesk/tickets/${selectedTicket._id}/status`, { status });
      toast.success(`Ticket marked as ${status}`);
      setSelectedTicket(res.data.data);
      fetchTickets();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTicket) return;
    setSubmittingComment(true);
    try {
      const res = await api.post(`/helpdesk/tickets/${selectedTicket._id}/comments`, {
        content: commentText,
      });
      setCommentText('');
      setSelectedTicket(res.data.data);
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length;

  return (
    <PageContainer
      title="Helpdesk & Support"
      subtitle="Submit and track IT, HR, payroll, and facilities queries. All requests are routed to the appropriate support team."
      actions={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={fetchTickets} icon={<ArrowsClockwise size={18} />}>Refresh</Button>
          <Button onClick={() => setShowNewForm(true)} icon={<Plus size={18} />}>New Ticket</Button>
        </div>
      }
    >
      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Open', count: openCount, color: 'bg-blue-50 border-blue-100', textColor: 'text-blue-600' },
          { label: 'In Progress', count: inProgressCount, color: 'bg-yellow-50 border-yellow-100', textColor: 'text-yellow-600' },
          { label: 'Resolved', count: resolvedCount, color: 'bg-green-50 border-green-100', textColor: 'text-green-600' },
        ].map(kpi => (
          <div key={kpi.label} className={`p-4 rounded-xl border ${kpi.color} text-center`}>
            <p className={`text-2xl font-black ${kpi.textColor}`}>{kpi.count}</p>
            <p className="text-xs font-semibold text-ag-ink-3 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* New Ticket Form */}
      {showNewForm && (
        <Card className="p-5 mb-6 border-ag-primary/30">
          <h3 className="font-bold text-base text-ag-ink mb-4 flex items-center gap-2">
            <Headset size={20} className="text-ag-primary" /> Submit New Support Request
          </h3>
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <Input
              label="Issue Title *"
              value={newTicket.title}
              onChange={e => setNewTicket(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Payslip for June not generated"
              required
            />
            <div>
              <label className="text-xs font-bold text-ag-ink-2 uppercase block mb-1">Description *</label>
              <textarea
                value={newTicket.description}
                onChange={e => setNewTicket(p => ({ ...p, description: e.target.value }))}
                placeholder="Describe the issue in detail..."
                className="w-full min-h-[80px] p-3 text-sm border border-ag-border rounded-lg focus:outline-none focus:border-ag-primary"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-ag-ink-2 uppercase block mb-1">Category</label>
                <select
                  value={newTicket.category}
                  onChange={e => setNewTicket(p => ({ ...p, category: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-ag-border bg-white text-sm focus:border-ag-primary"
                >
                  <option value="general">General</option>
                  <option value="hr">HR</option>
                  <option value="it">IT</option>
                  <option value="payroll">Payroll</option>
                  <option value="facilities">Facilities</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-ag-ink-2 uppercase block mb-1">Priority</label>
                <select
                  value={newTicket.priority}
                  onChange={e => setNewTicket(p => ({ ...p, priority: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-ag-border bg-white text-sm focus:border-ag-primary"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" type="button" onClick={() => setShowNewForm(false)}>Cancel</Button>
              <Button type="submit">Submit Ticket</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-2 border-ag-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-ag-ink-3">Loading support tickets…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Ticket List */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-ag-ink-2 mb-2">All Tickets ({tickets.length})</h3>
            {tickets.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-ag-border rounded-xl text-ag-ink-3 text-xs">
                No tickets submitted yet.
              </div>
            ) : (
              tickets.map(t => (
                <button
                  key={t._id}
                  onClick={() => setSelectedTicket(t)}
                  className={`w-full text-left p-4 rounded-xl border transition-all focus:outline-none space-y-2 ${
                    selectedTicket?._id === t._id
                      ? 'border-ag-primary bg-ag-primary/5'
                      : 'border-ag-border bg-white hover:border-ag-primary/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-xs text-ag-ink truncate flex-1">{t.title}</h4>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${PRIORITY_COLORS[t.priority] || 'bg-gray-100 text-gray-500'}`}>
                      {t.priority}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-ag-ink-3">
                    <span className="uppercase font-semibold">{t.category}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold ${STATUS_COLORS[t.status] || 'bg-gray-100'}`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Ticket Detail Panel */}
          <div className="lg:col-span-3">
            {!selectedTicket ? (
              <div className="h-full flex items-center justify-center border border-dashed border-ag-border rounded-xl p-12 text-ag-ink-3 text-xs text-center">
                <div>
                  <Headset size={40} className="mx-auto mb-3 text-ag-ink-3/30" />
                  <p>Select a ticket from the list to view details</p>
                </div>
              </div>
            ) : (
              <Card className="p-5 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 border-b border-ag-border pb-4">
                  <div className="space-y-1 flex-1">
                    <h3 className="font-bold text-base text-ag-ink">{selectedTicket.title}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[selectedTicket.priority]}`}>
                        {selectedTicket.priority} priority
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[selectedTicket.status]}`}>
                        {selectedTicket.status.replace('_', ' ')}
                      </span>
                      <span className="text-[9px] font-semibold text-ag-ink-3 uppercase">{selectedTicket.category}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {selectedTicket.status === 'open' && (
                      <Button size="sm" variant="secondary" onClick={handleAssignToSelf}>
                        Assign to Me
                      </Button>
                    )}
                    {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                      <Button size="sm" onClick={() => handleUpdateStatus('resolved')}>
                        Resolve
                      </Button>
                    )}
                    {selectedTicket.status === 'resolved' && (
                      <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus('closed')}>
                        Close
                      </Button>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase text-ag-ink-2">Issue Description</h4>
                  <p className="text-sm text-ag-ink leading-relaxed">{selectedTicket.description}</p>
                </div>

                {/* Comments Thread */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-ag-ink-2 flex items-center gap-1.5">
                    <ChatCircle size={14} /> Response Thread ({selectedTicket.comments?.length || 0})
                  </h4>

                  <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                    {(selectedTicket.comments || []).length === 0 ? (
                      <p className="text-xs text-ag-ink-3">No responses yet. Add the first comment below.</p>
                    ) : (
                      selectedTicket.comments.map((c: any) => (
                        <div key={c._id} className="flex gap-3">
                          <div className="w-7 h-7 rounded-full bg-ag-primary/10 flex items-center justify-center shrink-0">
                            <User size={14} className="text-ag-primary" />
                          </div>
                          <div className="flex-1 bg-ag-surface-2/40 rounded-lg p-3">
                            <p className="text-xs text-ag-ink">{c.content}</p>
                            <p className="text-[9px] text-ag-ink-3 mt-1">{new Date(c.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Comment */}
                  <form onSubmit={handleAddComment} className="flex gap-3 items-end pt-2 border-t border-ag-border">
                    <textarea
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      placeholder="Add a response or update..."
                      className="flex-1 min-h-[60px] p-2.5 text-xs border border-ag-border rounded-lg focus:outline-none focus:border-ag-primary"
                    />
                    <Button type="submit" size="sm" loading={submittingComment}>Send</Button>
                  </form>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
