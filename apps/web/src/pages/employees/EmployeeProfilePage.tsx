import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { employeeService } from '@/services/api.service';
import { Employee } from '@/types/employee.types';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { StatusBadge, WorkModeBadge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Tabs } from '@/components/ui/Tabs/Tabs';
import { Input } from '@/components/ui/Input/Input';
import { formatCurrency, formatDate, formatTenure } from '@/lib/formatters';
import {
  Pencil, User, Briefcase, CurrencyInr, GraduationCap, FileText,
  Phone, EnvelopeSimple, MapPin, Calendar, CheckCircle, Clock, ShieldCheck,
  Bank, Trophy, ClockCounterClockwise, ListBullets
} from '@phosphor-icons/react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal/Modal';
import { useAuthStore } from '@/store/authStore';
import { EmployeeActionsMenu } from '@/components/shared/EmployeeActionsMenu';
import { ActionWorkflowDrawer } from '@/components/shared/ActionWorkflowDrawer';

export default function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);

  const fetchTimeline = async () => {
    const targetId = id || employee?._id || employee?.employeeId;
    if (!targetId) return;
    try {
      const data = await employeeService.getTimeline(targetId);
      setTimelineEvents(data);
    } catch (err) {
      console.error('Error fetching timeline:', err);
    }
  };

  // Current logged in user context
  const currentUser = useAuthStore(s => s.user);
  const updateUser = useAuthStore(s => s.updateUser);
  const userRole = currentUser?.role || 'employee';

  // Actions Menu State
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [selectedActionId, setSelectedActionId] = useState('');
  const [selectedActionLabel, setSelectedActionLabel] = useState('');
  const [isActionWorkflowOpen, setIsActionWorkflowOpen] = useState(false);

  const handleSelectAction = (actionId: string, actionLabel: string) => {
    if (actionId === 'VIEW_PROFILE') {
      toast.info('Viewing full profile summary catalog.');
      return;
    }
    if (actionId === 'PRINT_PROFILE') {
      window.print();
      return;
    }
    if (actionId === 'DOWNLOAD_PDF') {
      toast.success('Downloading employee profile summary sheet...');
      return;
    }
    
    setSelectedActionId(actionId);
    setSelectedActionLabel(actionLabel);
    setIsActionWorkflowOpen(true);
  };

  const handleActionSuccess = (updatedEmployee: any) => {
    if (updatedEmployee === null) {
      // Deleted employee profile, go back
      navigate('/employees');
    } else {
      setEmployee(updatedEmployee);
      fetchTimeline();
    }
  };

  // Edit Profile Form State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    dateOfBirth: '',
    gender: 'male',
    maritalStatus: 'single',
    nationality: 'Indian',
    bloodGroup: '',
    personalPhone: '',
    workEmail: '',
    locationName: '',
  });

  const handleOpenEditModal = () => {
    if (employee) {
      setFormData({
        firstName: employee.personal.firstName || '',
        lastName: employee.personal.lastName || '',
        displayName: employee.personal.displayName || '',
        dateOfBirth: employee.personal.dateOfBirth || '',
        gender: employee.personal.gender || 'male',
        maritalStatus: employee.personal.maritalStatus || 'single',
        nationality: employee.personal.nationality || 'Indian',
        bloodGroup: employee.personal.bloodGroup || '',
        personalPhone: employee.personal.personalPhone || '',
        workEmail: employee.official.workEmail || '',
        locationName: employee.job.locationName || '',
      });
      setIsEditModalOpen(true);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    try {
      const payload = {
        fullName: `${formData.firstName} ${formData.lastName}`,
        'personal.firstName': formData.firstName,
        'personal.lastName': formData.lastName,
        'personal.displayName': formData.displayName,
        'personal.dateOfBirth': formData.dateOfBirth,
        'personal.gender': formData.gender,
        'personal.maritalStatus': formData.maritalStatus,
        'personal.nationality': formData.nationality,
        'personal.bloodGroup': formData.bloodGroup,
        'personal.personalPhone': formData.personalPhone,
        'official.workEmail': formData.workEmail,
        'job.locationName': formData.locationName,
      };

      const updated = await employeeService.update(employee._id || employee.employeeId, payload);
      setEmployee(updated);

      // If the edited profile belongs to the logged-in user, update the global auth store
      if (currentUser && currentUser.employeeId === employee.employeeId) {
        updateUser({
          fullName: updated.fullName,
          photo: updated.personal?.photo || currentUser.photo,
          email: updated.official?.workEmail || currentUser.email
        });
      }

      toast.success('Profile updated successfully!');
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile.');
    }
  };

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      try {
        const data = await employeeService.getById(id || 'emp_001');
        setEmployee(data);
        // Load timeline
        const targetId = id || data?._id || data?.employeeId;
        if (targetId) {
          const tl = await employeeService.getTimeline(targetId);
          setTimelineEvents(tl);
        }
      } catch (err) {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [id]);

  if (isLoading || !employee) {
    return (
      <PageContainer>
        <div className="py-20 text-center text-ag-ink-3">Loading employee profile...</div>
      </PageContainer>
    );
  }

  // Breakdown figures for Salary tab
  const salaryData = employee.salary ? [
    { name: 'Basic Salary', value: employee.salary.ctc * 0.4, color: '#5B3CF5' },
    { name: 'HRA Allowance', value: employee.salary.ctc * 0.2, color: '#00C48C' },
    { name: 'Special Allowance', value: employee.salary.ctc * 0.25, color: '#2BB5FF' },
    { name: 'Performance Bonus', value: employee.salary.ctc * 0.15, color: '#FFB020' },
  ] : [];

  // Tab content items
  const tabItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <User size={16} />,
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Details Card */}
          <Card>
            <CardHeader title="Contact Information" />
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <EnvelopeSimple size={18} className="text-ag-primary" />
                <div>
                  <p className="text-xs text-ag-ink-3">Work Email</p>
                  <p className="font-semibold text-ag-ink">{employee.official.workEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-ag-mint" />
                <div>
                  <p className="text-xs text-ag-ink-3">Personal Phone</p>
                  <p className="font-semibold text-ag-ink">{employee.personal.personalPhone || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-ag-coral" />
                <div>
                  <p className="text-xs text-ag-ink-3">Location</p>
                  <p className="font-semibold text-ag-ink">{employee.job.locationName || '—'}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Reporting Manager Card */}
          <Card>
            <CardHeader title="Reporting Manager" />
            <div className="flex items-center gap-4 p-4 rounded-xl bg-ag-surface-2/60 border border-ag-border/60">
              <Avatar name={employee.job.reportingManagerName || 'Manager'} size="lg" />
              <div>
                <h4 className="font-bold text-ag-ink text-base">{employee.job.reportingManagerName || 'Supervisor'}</h4>
                <p className="text-xs text-ag-ink-3">Assigned Supervisor</p>
                <span className="inline-block text-[11px] font-semibold text-ag-primary mt-1">Direct Reporting Manager</span>
              </div>
            </div>
          </Card>

          {/* Tenure & Joining Widget */}
          <Card>
            <CardHeader title="Tenure & Milestones" />
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-ag-primary-light/40">
                <div className="flex items-center gap-2.5">
                  <Calendar size={20} className="text-ag-primary" />
                  <span className="text-xs font-semibold text-ag-ink-2">Date of Joining</span>
                </div>
                <span className="font-bold text-ag-ink text-sm">{formatDate(employee.official.dateOfJoining)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#E6FAF4]">
                <div className="flex items-center gap-2.5">
                  <Clock size={20} className="text-ag-mint" />
                  <span className="text-xs font-semibold text-[#00875A]">Total Tenure</span>
                </div>
                <span className="font-bold text-[#00875A] text-sm">{formatTenure(employee.official.dateOfJoining)}</span>
              </div>
            </div>
          </Card>
        </div>
      ),
    },
    {
      id: 'personal',
      label: 'Personal Info',
      icon: <User size={16} />,
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Personal Record & Identity" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <p className="text-xs text-ag-ink-3">Full Name</p>
                <p className="font-semibold text-ag-ink mt-0.5">{employee.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-ag-ink-3">Date of Birth</p>
                <p className="font-semibold text-ag-ink mt-0.5">{formatDate(employee.personal.dateOfBirth)}</p>
              </div>
              <div>
                <p className="text-xs text-ag-ink-3">Gender</p>
                <p className="font-semibold text-ag-ink mt-0.5 capitalize">{employee.personal.gender}</p>
              </div>
              <div>
                <p className="text-xs text-ag-ink-3">Blood Group</p>
                <p className="font-semibold text-ag-ink mt-0.5">{employee.personal.bloodGroup || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-ag-ink-3">Nationality</p>
                <p className="font-semibold text-ag-ink mt-0.5">{employee.personal.nationality || 'Indian'}</p>
              </div>
              <div>
                <p className="text-xs text-ag-ink-3">Marital Status</p>
                <p className="font-semibold text-ag-ink mt-0.5 capitalize">{employee.personal.maritalStatus || 'Single'}</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Residential Address" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-bold text-ag-ink text-sm mb-2 text-ag-primary">Current Address</h4>
                <p className="font-semibold text-ag-ink">
                  {employee.curr_line1 ? (
                    <>
                      {employee.curr_line1}
                      {employee.curr_line2 ? `, ${employee.curr_line2}` : ''}
                      <br />
                      {employee.curr_city}, {employee.curr_state}
                      <br />
                      {employee.curr_country} - {employee.curr_pincode}
                    </>
                  ) : '—'}
                </p>
              </div>
              <div>
                <h4 className="font-bold text-ag-ink text-sm mb-2 text-ag-primary">Permanent Address</h4>
                <p className="font-semibold text-ag-ink">
                  {employee.perm_line1 ? (
                    <>
                      {employee.perm_line1}
                      {employee.perm_line2 ? `, ${employee.perm_line2}` : ''}
                      <br />
                      {employee.perm_city}, {employee.perm_state}
                      <br />
                      {employee.perm_country} - {employee.perm_pincode}
                    </>
                  ) : '—'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      ),
    },
    {
      id: 'org',
      label: 'Organization',
      icon: <Briefcase size={16} />,
      content: (
        <Card>
          <CardHeader title="Organization & Position Assignment" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-xs text-ag-ink-3">Department</p>
              <p className="font-semibold text-ag-ink mt-0.5">{employee.job.departmentName || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-ag-ink-3">Designation</p>
              <p className="font-semibold text-ag-ink mt-0.5">{employee.job.designationName || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-ag-ink-3">Reporting Manager</p>
              <p className="font-semibold text-ag-ink mt-0.5">{employee.job.reportingManagerName || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-ag-ink-3">Location / Branch</p>
              <p className="font-semibold text-ag-ink mt-0.5">{employee.job.locationName || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-ag-ink-3">Work Mode</p>
              <p className="font-semibold text-ag-ink mt-0.5 capitalize">{employee.job.workMode || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-ag-ink-3">Shift Name</p>
              <p className="font-semibold text-ag-ink mt-0.5">{employee.job.shiftName || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-ag-ink-3">Grade</p>
              <p className="font-semibold text-ag-ink mt-0.5">{employee.job.gradeName || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-ag-ink-3">Cost Center</p>
              <p className="font-semibold text-ag-ink mt-0.5">{employee.job.costCenter || '—'}</p>
            </div>
          </div>
        </Card>
      ),
    },
    {
      id: 'salary',
      label: 'Compensation',
      icon: <CurrencyInr size={16} />,
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader title="Current CTC Breakdown" subtitle="Annual and monthly package allocation." />
            <div className="p-6 rounded-2xl bg-ag-primary text-white flex items-center justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/80 font-semibold">Annual Cost to Company (CTC)</p>
                <h2 className="font-display font-extrabold text-4xl text-white mt-1">
                  {formatCurrency(employee.salary?.ctc || 0)}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/80 font-semibold">Monthly Gross</p>
                <p className="font-display font-bold text-2xl text-white mt-1">
                  {formatCurrency((employee.salary?.ctc || 0) / 12)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {salaryData.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-ag-surface-2/50 border border-ag-border/60">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-semibold text-ag-ink">{item.name}</span>
                  </div>
                  <span className="font-bold text-ag-ink text-sm">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="flex flex-col justify-between">
            <CardHeader title="Visual Allocation" />
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={salaryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {salaryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      ),
    },
    {
      id: 'education',
      label: 'Education & Exp',
      icon: <GraduationCap size={16} />,
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Education Qualifications" />
            <div className="space-y-4">
              {(employee.education && employee.education.length > 0) ? (
                employee.education.map((edu, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-ag-border flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-ag-primary-light text-ag-primary">
                      <GraduationCap size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-ag-ink text-base">{edu.degree} in {edu.field}</h4>
                      <p className="text-xs text-ag-ink-2 mt-0.5">{edu.institution}</p>
                      <p className="text-xs text-ag-ink-3 mt-1">{edu.startYear} – {edu.endYear} • {edu.percentage}% score</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-ag-ink-3">No educational records cataloged.</div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Work Experience" />
            <div className="space-y-4">
              {(employee.experience && employee.experience.length > 0) ? (
                employee.experience.map((exp, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-ag-border flex items-start gap-4 bg-ag-surface-2/20">
                    <div className="p-3 rounded-xl bg-ag-mint-light text-ag-mint">
                      <Briefcase size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-ag-ink text-base">{exp.designation} at {exp.company}</h4>
                      <p className="text-xs text-ag-ink-3 mt-1">
                        {formatDate(exp.startDate)} – {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                      </p>
                      {exp.responsibilities && (
                        <p className="text-sm text-ag-ink-2 mt-2 bg-white/60 p-3 rounded-lg border border-ag-border/40 font-semibold">{exp.responsibilities}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-ag-ink-3">No work experience records cataloged.</div>
              )}
            </div>
          </Card>
        </div>
      ),
    },
    {
      id: 'emergency',
      label: 'Emergency Contacts',
      icon: <Phone size={16} />,
      content: (
        <Card>
          <CardHeader title="Emergency Contacts" subtitle="Authorized emergency contact personnel." />
          <div className="space-y-4">
            {(employee.emergencyContacts && employee.emergencyContacts.length > 0) ? (
              employee.emergencyContacts.map((contact, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-ag-border bg-ag-surface-2/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-ag-coral-light text-ag-coral">
                      <User size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-ag-ink text-sm">{contact.name}</h4>
                      <p className="text-xs text-ag-ink-3 mt-0.5">{contact.relationship}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-ag-ink text-sm font-mono">{contact.phone}</span>
                    {contact.isPrimary && (
                      <span className="text-[10px] bg-ag-coral-light text-ag-coral font-bold px-2 py-0.5 rounded-full uppercase">Primary</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-ag-ink-3 py-4">No emergency contacts listed.</div>
            )}
          </div>
        </Card>
      ),
    },
    {
      id: 'banking',
      label: 'Bank Details',
      icon: <Bank size={16} />,
      content: (
        <Card>
          <CardHeader title="Employee Bank Accounts" subtitle="Primary and secondary account routing." />
          <div className="space-y-4">
            {(employee.bank && employee.bank.length > 0) ? (
              employee.bank.map((acc, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-ag-border bg-ag-surface-2/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-ag-primary-light text-ag-primary">
                      <Bank size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-ag-ink text-sm">{acc.bankName}</h4>
                      <p className="text-xs text-ag-ink-3 mt-0.5">IFSC/SWIFT: <span className="font-mono">{acc.ifscSwiftCode}</span></p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 text-xs">
                    <div>
                      <span className="text-ag-ink-3 block">Holder Name</span>
                      <span className="font-semibold text-ag-ink text-sm">{acc.accountHolderName}</span>
                    </div>
                    <div>
                      <span className="text-ag-ink-3 block">Account Number</span>
                      <span className="font-semibold text-ag-ink text-sm font-mono">{acc.accountNumber ? ('*'.repeat(Math.max(0, acc.accountNumber.length - 4)) + acc.accountNumber.slice(-4)) : '—'}</span>
                    </div>
                    <div>
                      <span className="text-ag-ink-3 block">Account Type</span>
                      <span className="font-semibold text-ag-ink text-sm capitalize">{acc.accountType}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 self-end md:self-auto">
                    {acc.isPrimary && (
                      <span className="text-[10px] bg-ag-primary-light text-ag-primary font-bold px-2 py-0.5 rounded-full uppercase">Primary</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-ag-ink-3 py-4">No bank account details listed.</div>
            )}
          </div>
        </Card>
      ),
    },
    {
      id: 'skills',
      label: 'Skills & Certs',
      icon: <Trophy size={16} />,
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader title="Skills Portfolio" />
            <div className="flex flex-wrap gap-2">
              {(employee.skills && employee.skills.length > 0) ? (
                employee.skills.map((sk, idx) => (
                  <span key={idx} className="px-3 py-1.5 rounded-xl border border-ag-border bg-ag-surface-2 text-ag-ink font-semibold text-xs flex flex-col">
                    <span>{sk.skillName}</span>
                    {sk.proficiencyLevel && (
                      <span className="text-[9px] text-ag-ink-3 capitalize font-bold mt-0.5">{sk.proficiencyLevel}</span>
                    )}
                  </span>
                ))
              ) : (
                <div className="text-sm text-ag-ink-3 py-2">No skill tags cataloged.</div>
              )}
            </div>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader title="Certifications" subtitle="Professional and compliance certifications." />
            <div className="space-y-4">
              {(employee.certifications && employee.certifications.length > 0) ? (
                employee.certifications.map((cert, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-ag-border flex items-start gap-4 bg-ag-surface-2/10">
                    <div className="p-3 rounded-xl bg-ag-primary-light text-ag-primary">
                      <Trophy size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-ag-ink text-base">{cert.certificationName}</h4>
                      <p className="text-xs text-ag-ink-3 mt-0.5">Issued by {cert.issuingAuthority}</p>
                      {cert.issueDate && (
                        <p className="text-[10px] text-ag-ink-3 font-semibold mt-1">Issued: {cert.issueDate}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-ag-ink-3 py-2">No professional certifications uploaded.</div>
              )}
            </div>
          </Card>
        </div>
      ),
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: <ClockCounterClockwise size={16} />,
      content: (
        <Card>
          <CardHeader title="Employee Timeline & Audits" subtitle="Chronological history of milestones, promotions, and changes." />
          <div className="relative pl-6 border-l-2 border-ag-border/80 space-y-8 mt-4 ml-3">
            {timelineEvents && timelineEvents.length > 0 ? (
              timelineEvents.map((ev, idx) => (
                <div key={idx} className="relative">
                  {/* Bullet */}
                  <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-ag-primary bg-white flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-ag-primary" />
                  </span>
                  <div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
                      <h4 className="font-bold text-ag-ink text-sm">{ev.title}</h4>
                      <span className="text-[11px] text-ag-ink-3 font-mono font-semibold">{ev.eventDate}</span>
                    </div>
                    {ev.description && (
                      <p className="text-xs text-ag-ink-2 mt-1 font-semibold">{ev.description}</p>
                    )}
                    {ev.performedBy && (
                      <span className="inline-block text-[10px] font-bold text-ag-primary mt-1">By: {ev.performedBy}</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-ag-ink-3 pl-2 py-4">No timeline logs found.</div>
            )}
          </div>
        </Card>
      ),
    },
  ];

  return (
    <PageContainer>
      {/* Sticky Profile Header */}
      <div className="bg-ag-surface border border-ag-border rounded-2xl p-6 shadow-card mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Avatar name={employee.fullName ?? `${employee.personal.firstName} ${employee.personal.lastName}`} src={employee.personal.photo} size="xl" />
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="font-display font-extrabold text-2xl text-ag-ink">{employee.fullName}</h1>
                <StatusBadge status={employee.official.status} />
              </div>
              <p className="text-sm font-semibold text-ag-ink-2">
                {employee.job.designationName} • <span className="text-ag-primary">{employee.job.departmentName}</span>
              </p>
              <div className="flex items-center gap-4 text-xs text-ag-ink-3 pt-1">
                <span className="font-mono bg-ag-surface-2 px-2 py-0.5 rounded text-ag-ink-2 font-bold">{employee.employeeId}</span>
                <span>Joined {formatDate(employee.official.dateOfJoining)}</span>
                <WorkModeBadge mode={employee.job.workMode} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" icon={<Pencil size={16} />} onClick={handleOpenEditModal}>Edit Profile</Button>
            {userRole !== 'employee' && (
              <Button variant="primary" onClick={() => setIsActionsMenuOpen(true)}>Actions ▾</Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs items={tabItems} defaultValue="overview" />

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Profile"
        description="Update your personal, contact, and identity details."
        maxWidth="2xl"
      >
        <form onSubmit={handleUpdateProfile} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={formData.firstName}
              onChange={e => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={e => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
            <Input
              label="Display Name"
              value={formData.displayName}
              onChange={e => setFormData({ ...formData, displayName: e.target.value })}
            />
            <Input
              label="Personal Phone"
              value={formData.personalPhone}
              onChange={e => setFormData({ ...formData, personalPhone: e.target.value })}
            />
            <Input
              label="Work Email"
              type="email"
              value={formData.workEmail}
              onChange={e => setFormData({ ...formData, workEmail: e.target.value })}
              required
            />
            <Input
              label="Location"
              value={formData.locationName}
              onChange={e => setFormData({ ...formData, locationName: e.target.value })}
            />
            <Input
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
            />
            <Input
              label="Nationality"
              value={formData.nationality}
              onChange={e => setFormData({ ...formData, nationality: e.target.value })}
            />
            <Input
              label="Blood Group"
              value={formData.bloodGroup}
              onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
            />
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-ag-ink-2 uppercase tracking-wider block">Gender</label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-ag-border bg-white text-sm text-ag-ink focus:border-ag-primary focus:ring-1 focus:ring-ag-primary outline-none"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-ag-ink-2 uppercase tracking-wider block">Marital Status</label>
              <select
                value={formData.maritalStatus}
                onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-ag-border bg-white text-sm text-ag-ink focus:border-ag-primary focus:ring-1 focus:ring-ag-primary outline-none"
              >
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="widowed">Widowed</option>
                <option value="divorced">Divorced</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-ag-border">
            <Button variant="ghost" type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Employee Actions Console Modal */}
      <EmployeeActionsMenu
        isOpen={isActionsMenuOpen}
        onClose={() => setIsActionsMenuOpen(false)}
        onSelectAction={handleSelectAction}
        userRole={userRole}
      />

      {/* Action Workflow Form Drawer */}
      <ActionWorkflowDrawer
        isOpen={isActionWorkflowOpen}
        onClose={() => setIsActionWorkflowOpen(false)}
        actionId={selectedActionId}
        actionLabel={selectedActionLabel}
        employeeId={employee.employeeId}
        onSuccess={handleActionSuccess}
      />
    </PageContainer>
  );
}
