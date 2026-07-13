import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import {
  Megaphone, Chats, ThumbsUp, Heart, Trophy,
  Plus, ArrowsClockwise, PaperPlaneRight, CheckCircle
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import api from '@/services/api';

export default function CommunityPage() {
  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [myEmployee, setMyEmployee] = useState<any>(null);

  // Form states
  const [postContent, setPostContent] = useState('');
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPinned, setAnnPinned] = useState(false);
  const [showAnnForm, setShowAnnForm] = useState(false);

  // Poll Form states
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  const fetchData = async () => {
    setLoading(true);
    try {
      const meRes = await api.get('/auth/me');
      setMyEmployee(meRes.data.data);

      const [annRes, postsRes, pollsRes] = await Promise.all([
        api.get('/community/announcements'),
        api.get('/community/posts'),
        api.get('/community/polls')
      ]);

      setAnnouncements(annRes.data.data || []);
      setPosts(postsRes.data.data || []);
      setPolls(pollsRes.data.data || []);
    } catch {
      toast.error('Failed to load community space');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    try {
      await api.post('/community/posts', { content: postContent });
      setPostContent('');
      toast.success('Post shared to the feed!');
      fetchData();
    } catch {
      toast.error('Failed to publish post');
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      await api.post(`/community/posts/${postId}/like`);
      fetchData();
    } catch {
      toast.error('Failed to like post');
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return toast.error('Announcement details required');
    try {
      await api.post('/community/announcements', {
        title: annTitle,
        content: annContent,
        isPinned: annPinned
      });
      toast.success('Official announcement published!');
      setAnnTitle('');
      setAnnContent('');
      setAnnPinned(false);
      setShowAnnForm(false);
      fetchData();
    } catch {
      toast.error('Failed to publish announcement');
    }
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOptions = pollOptions.filter(o => o.trim() !== '');
    if (!pollQuestion.trim() || cleanOptions.length < 2) {
      return toast.error('Poll question and at least 2 options are required');
    }
    try {
      await api.post('/community/polls', {
        question: pollQuestion,
        optionsJson: cleanOptions
      });
      toast.success('Interactive poll created!');
      setPollQuestion('');
      setPollOptions(['', '']);
      setShowPollForm(false);
      fetchData();
    } catch {
      toast.error('Failed to create poll');
    }
  };

  const handleVote = async (pollId: string, option: string) => {
    try {
      await api.post(`/community/polls/${pollId}/vote`, {
        selectedOption: option
      });
      toast.success('Vote recorded!');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to register vote');
    }
  };

  return (
    <PageContainer
      title="Feeds & Community"
      subtitle="Engage with team members, participate in surveys, and stay up to date with official company bulletins."
      actions={
        <Button variant="secondary" onClick={fetchData} icon={<ArrowsClockwise size={18} />}>
          Refresh
        </Button>
      }
    >
      {/* Pinned Announcement Alert Banner */}
      {announcements.filter(a => a.isPinned).map(ann => (
        <div key={ann._id} className="mb-6 p-4 rounded-xl border border-ag-amber/30 bg-[#FFF8E6] flex gap-3 shadow-sm">
          <Megaphone size={22} className="text-ag-amber shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-ag-ink text-xs uppercase tracking-wider">PINNED ANNOUNCEMENT: {ann.title}</h4>
            <p className="text-xs text-ag-ink-3 mt-1 leading-relaxed">{ann.content}</p>
          </div>
        </div>
      ))}

      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-2 border-ag-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-ag-ink-3">Loading feed space…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Feed Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Share Post Box */}
            <Card className="p-4">
              <form onSubmit={handleCreatePost} className="flex gap-4 items-start">
                <Avatar name={myEmployee?.fullName || 'User'} size="md" />
                <div className="flex-1 space-y-3">
                  <textarea
                    value={postContent}
                    onChange={e => setPostContent(e.target.value)}
                    placeholder="Share something with your team members..."
                    className="w-full min-h-[60px] p-2 text-xs border border-ag-border rounded-lg bg-ag-surface-2 focus:outline-none focus:border-ag-primary"
                  />
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" icon={<PaperPlaneRight size={14} />}>
                      Post
                    </Button>
                  </div>
                </div>
              </form>
            </Card>

            {/* Posts Feed list */}
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-ag-border rounded-xl text-ag-ink-3 text-xs">
                  No post records. Be the first to share something!
                </div>
              ) : (
                posts.map(p => (
                  <Card key={p._id} className="p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar name="Colleague" size="sm" />
                      <div>
                        <h4 className="font-bold text-xs text-ag-ink">Team Member</h4>
                        <p className="text-[10px] text-ag-ink-3">{new Date(p.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className="text-xs text-ag-ink leading-relaxed">{p.content}</p>
                    <div className="flex items-center gap-4 pt-3 border-t border-ag-border text-xs text-ag-ink-3">
                      <button
                        onClick={() => handleLikePost(p._id)}
                        className="flex items-center gap-1.5 hover:text-ag-primary transition-colors focus:outline-none"
                      >
                        <ThumbsUp size={16} />
                        <span>{p.likesCount} Likes</span>
                      </button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Right Column (Announcements & Polls Panel) */}
          <div className="space-y-6">
            
            {/* Polls Widget */}
            <Card className="p-5">
              <div className="flex items-center justify-between border-b border-ag-border pb-3 mb-4">
                <h3 className="font-bold text-sm text-ag-ink">Interactive Polls</h3>
                <button
                  onClick={() => setShowPollForm(!showPollForm)}
                  className="text-xs text-ag-primary font-bold hover:underline"
                >
                  Create
                </button>
              </div>

              {showPollForm && (
                <form onSubmit={handleCreatePoll} className="space-y-3 border p-3 rounded-xl bg-ag-surface-2/40 mb-4">
                  <Input
                    label="Poll Question *"
                    value={pollQuestion}
                    onChange={e => setPollQuestion(e.target.value)}
                    placeholder="e.g. Favorite dashboard style?"
                    required
                  />
                  {pollOptions.map((opt, idx) => (
                    <Input
                      key={idx}
                      label={`Option ${idx + 1}`}
                      value={opt}
                      onChange={e => {
                        const next = [...pollOptions];
                        next[idx] = e.target.value;
                        setPollOptions(next);
                      }}
                      placeholder={`Option ${idx + 1}`}
                    />
                  ))}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPollOptions([...pollOptions, ''])}
                      className="text-[10px] text-ag-primary font-bold"
                    >
                      + Add Option
                    </button>
                  </div>
                  <Button type="submit" className="w-full size-sm">Publish Poll</Button>
                </form>
              )}

              <div className="space-y-5">
                {polls.length === 0 ? (
                  <p className="text-xs text-ag-ink-3 py-4 text-center">No active polls scheduled.</p>
                ) : (
                  polls.map(p => {
                    const totalVotes = p.votes?.length || 0;
                    const hasVoted = p.votes?.some((v: any) => v.employeeId === myEmployee?.employeeId);
                    
                    return (
                      <div key={p._id} className="space-y-3 p-3.5 border border-ag-border rounded-xl bg-ag-surface-2/15">
                        <h4 className="font-bold text-xs text-ag-ink">{p.question}</h4>
                        
                        <div className="space-y-2">
                          {p.options.map((opt: string) => {
                            const optionVotes = p.votes?.filter((v: any) => v.selectedOption === opt).length || 0;
                            const pct = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
                            
                            return (
                              <div key={opt} className="relative">
                                <button
                                  disabled={hasVoted}
                                  onClick={() => handleVote(p._id, opt)}
                                  className={`w-full text-left p-2.5 rounded-lg text-xs font-semibold border transition-all flex justify-between relative overflow-hidden focus:outline-none ${
                                    hasVoted ? 'bg-ag-surface-2 border-ag-border cursor-default' : 'hover:border-ag-primary/45 bg-white border-ag-border'
                                  }`}
                                >
                                  <div
                                    className="absolute left-0 top-0 bottom-0 bg-ag-primary/10 transition-all duration-300"
                                    style={{ width: `${pct}%`, zIndex: 0 }}
                                  />
                                  <span className="relative z-10">{opt}</span>
                                  <span className="relative z-10 text-ag-primary font-bold">{pct}%</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-ag-ink-3">{totalVotes} votes cast</p>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

            {/* Announcements List widget */}
            <Card className="p-5">
              <div className="flex items-center justify-between border-b border-ag-border pb-3 mb-4">
                <h3 className="font-bold text-sm text-ag-ink">Official Bulletins</h3>
                <button
                  onClick={() => setShowAnnForm(!showAnnForm)}
                  className="text-xs text-ag-primary font-bold hover:underline"
                >
                  Publish
                </button>
              </div>

              {showAnnForm && (
                <form onSubmit={handleCreateAnnouncement} className="space-y-3 border p-3 rounded-xl bg-ag-surface-2/40 mb-4">
                  <Input
                    label="Bulletin Title *"
                    value={annTitle}
                    onChange={e => setAnnTitle(e.target.value)}
                    required
                  />
                  <textarea
                    value={annContent}
                    onChange={e => setAnnContent(e.target.value)}
                    placeholder="Announcement details..."
                    className="w-full min-h-[60px] p-2 text-xs border rounded bg-white text-ag-ink focus:outline-none"
                    required
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={annPinned}
                      onChange={e => setAnnPinned(e.target.checked)}
                      id="pin-chk"
                    />
                    <label htmlFor="pin-chk" className="text-xs text-ag-ink-3 font-semibold">Pin Alert Bulletin</label>
                  </div>
                  <Button type="submit" className="w-full size-sm">Publish Alert</Button>
                </form>
              )}

              <div className="space-y-4">
                {announcements.filter(a => !a.isPinned).map(ann => (
                  <div key={ann._id} className="p-3 border-b border-ag-border last:border-b-0 space-y-1.5">
                    <h4 className="font-bold text-xs text-ag-ink leading-tight">{ann.title}</h4>
                    <p className="text-[11px] text-ag-ink-3 leading-relaxed">{ann.content}</p>
                    <p className="text-[9px] text-ag-ink-3">{new Date(ann.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
