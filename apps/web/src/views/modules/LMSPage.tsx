import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import {
  GraduationCap, BookOpen, Clock, ShieldCheck, Trophy,
  Plus, ArrowsClockwise, Star, ArrowRight, CheckCircle
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import api from '@/services/api';

export default function LMSPage() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'my_learning' | 'dashboard'>('catalog');
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [myEmployeeId, setMyEmployeeId] = useState('');

  // Course Form
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    category: 'technical',
    difficulty: 'beginner',
    durationHours: 10
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const meRes = await api.get('/auth/me');
      const empId = meRes.data.data?.employeeId;
      setMyEmployeeId(empId || '');

      const coursesRes = await api.get('/lms/courses');
      setCourses(coursesRes.data.data || []);

      if (empId) {
        const enrollRes = await api.get(`/lms/employee/${empId}/enrollments`);
        setEnrollments(enrollRes.data.data || []);
      }
    } catch {
      toast.error('Failed to load LMS data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.title.trim()) return toast.error('Course title is required');
    try {
      await api.post('/lms/courses', newCourse);
      toast.success('Course created and published!');
      setNewCourse({
        title: '',
        description: '',
        category: 'technical',
        difficulty: 'beginner',
        durationHours: 10
      });
      fetchData();
    } catch {
      toast.error('Failed to create course');
    }
  };

  const handleEnroll = async (courseId: string) => {
    if (!myEmployeeId) return toast.error('No employee ID associated with this profile');
    try {
      await api.post('/lms/enrollments', {
        courseId,
        employeeId: myEmployeeId
      });
      toast.success('Enrolled in course successfully!');
      fetchData();
    } catch {
      toast.error('Failed to enroll in course');
    }
  };

  const handleUpdateProgress = async (enrollmentId: string, progress: number) => {
    try {
      await api.patch(`/lms/enrollments/${enrollmentId}/progress`, {
        progressPercent: progress
      });
      toast.success(progress >= 100 ? 'Course completed! Certificate awarded.' : 'Study progress logged!');
      fetchData();
    } catch {
      toast.error('Failed to update progress');
    }
  };

  return (
    <PageContainer
      title="Learning Management (LMS)"
      subtitle="Organize technical certifications, compliance training courses, and employee learning pathways."
      actions={
        <Button variant="secondary" onClick={fetchData} icon={<ArrowsClockwise size={18} />}>
          Refresh
        </Button>
      }
    >
      {/* Tabs */}
      <div className="flex border-b border-ag-border gap-4 mb-6">
        {[
          { id: 'catalog', label: 'Course Catalog', icon: <BookOpen size={18} /> },
          { id: 'my_learning', label: 'My Learning Space', icon: <GraduationCap size={18} /> },
          { id: 'dashboard', label: 'Admin Panel', icon: <Trophy size={18} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 pb-3 font-semibold text-sm transition-all focus:outline-none ${
              activeTab === tab.id
                ? 'border-b-2 border-ag-primary text-ag-primary'
                : 'text-ag-ink-3 hover:text-ag-ink'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-2 border-ag-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-ag-ink-3">Loading LMS platform…</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* CATALOG TAB */}
          {activeTab === 'catalog' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.length === 0 ? (
                <div className="col-span-full text-center py-12 text-ag-ink-3 text-xs border border-dashed border-ag-border rounded-xl">
                  No courses published yet. Go to the Admin Panel to publish the first course.
                </div>
              ) : (
                courses.map(c => {
                  const isEnrolled = enrollments.some(e => e.courseId === c._id);
                  return (
                    <Card key={c._id} className="p-5 flex flex-col justify-between hover:border-ag-primary/40 transition-all shadow-sm">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-ag-primary-light text-ag-primary uppercase">
                            {c.category}
                          </span>
                          <span className="text-[10px] font-semibold text-ag-ink-3 capitalize">
                            {c.difficulty}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-ag-ink mt-2 leading-snug">{c.title}</h4>
                        <p className="text-xs text-ag-ink-3 line-clamp-3 leading-relaxed">{c.description}</p>
                      </div>

                      <div className="flex items-center justify-between border-t border-ag-border mt-5 pt-4">
                        <span className="text-[10px] text-ag-ink-3 flex items-center gap-1.5">
                          <Clock size={14} /> {c.durationHours} Hours
                        </span>
                        {isEnrolled ? (
                          <span className="text-xs font-bold text-ag-mint flex items-center gap-1">
                            <CheckCircle size={16} /> Enrolled
                          </span>
                        ) : (
                          <Button size="sm" onClick={() => handleEnroll(c._id)} icon={<ArrowRight size={12} />}>
                            Enroll Now
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          )}

          {/* MY LEARNING SPACE */}
          {activeTab === 'my_learning' && (
            <div className="space-y-4">
              <Card>
                <CardHeader title="Enrolled Training Progress" subtitle="Monitor course completions and training certificates." />
                <div className="p-4 space-y-4">
                  {enrollments.length === 0 ? (
                    <p className="text-xs text-ag-ink-3 py-6 text-center">You have not enrolled in any training pathways yet.</p>
                  ) : (
                    enrollments.map(e => {
                      const course = courses.find(c => c._id === e.courseId);
                      return (
                        <div key={e._id} className="p-4 border border-ag-border rounded-xl space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-bold text-sm text-ag-ink">{course?.title || 'Training Path'}</h4>
                              <p className="text-xs text-ag-ink-3 mt-1">{course?.description || 'Learn module design'}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                              e.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            } capitalize`}>
                              {e.status}
                            </span>
                          </div>

                          {/* Progress slide */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-ag-ink-3">Progress: {e.progressPercent}% Completed</span>
                              {e.status !== 'completed' && (
                                <button
                                  onClick={() => handleUpdateProgress(e._id, 100)}
                                  className="text-[10px] text-ag-primary font-bold hover:underline"
                                >
                                  Mark Complete ✓
                                </button>
                              )}
                            </div>
                            <div className="w-full bg-ag-border h-1.5 rounded-lg overflow-hidden">
                              <div
                                className="h-full bg-ag-primary transition-all duration-300"
                                style={{ width: `${e.progressPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* ADMIN PANEL */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Courses overview */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader title="Published Course Templates" subtitle="LMS catalog offerings management." />
                  <div className="p-4 space-y-3">
                    {courses.map(c => (
                      <div key={c._id} className="p-3 border border-ag-border rounded-xl flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-xs text-ag-ink">{c.title}</h4>
                          <p className="text-[10px] text-ag-ink-3 mt-0.5">{c.category} · {c.difficulty}</p>
                        </div>
                        <span className="text-[10px] text-ag-ink-2 font-semibold">{c.durationHours} hrs</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Publish Course Form */}
              <Card className="p-5 h-fit">
                <h4 className="font-display font-bold text-base text-ag-ink border-b border-ag-border pb-2 mb-4">Publish New Course</h4>
                <form onSubmit={handleCreateCourse} className="space-y-4">
                  <Input
                    label="Course Title *"
                    value={newCourse.title}
                    onChange={e => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. FastAPI and SQLAlchemy"
                    required
                  />
                  <Input
                    label="Description"
                    value={newCourse.description}
                    onChange={e => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter course syllabus context..."
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-ag-ink-2 uppercase block">Category</label>
                      <select
                        value={newCourse.category}
                        onChange={e => setNewCourse(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full h-10 px-3 rounded-lg border border-ag-border bg-white text-sm focus:border-ag-primary"
                      >
                        <option value="technical">Technical</option>
                        <option value="compliance">Compliance</option>
                        <option value="leadership">Leadership</option>
                        <option value="soft_skills">Soft Skills</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-ag-ink-2 uppercase block">Difficulty</label>
                      <select
                        value={newCourse.difficulty}
                        onChange={e => setNewCourse(prev => ({ ...prev, difficulty: e.target.value }))}
                        className="w-full h-10 px-3 rounded-lg border border-ag-border bg-white text-sm focus:border-ag-primary"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                  <Input
                    label="Duration (Hours)"
                    type="number"
                    value={newCourse.durationHours}
                    onChange={e => setNewCourse(prev => ({ ...prev, durationHours: Number(e.target.value) }))}
                  />
                  <Button type="submit" className="w-full" icon={<Plus size={16} />}>Publish Course</Button>
                </form>
              </Card>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}

