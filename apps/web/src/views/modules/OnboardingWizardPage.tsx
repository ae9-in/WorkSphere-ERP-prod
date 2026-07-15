import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Button } from '@/components/ui/Button/Button';
import { Card } from '@/components/ui/Card/Card';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { onboardingService, employeeService } from '@/services/api.service';
import {
  User, Briefcase, FileText, CurrencyInr, Desktop, ShieldCheck,
  CheckCircle, ArrowLeft, ArrowRight, Trash, UploadSimple, Info,
  Heartbeat, UsersThree, Calendar, Warning
} from '@phosphor-icons/react';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, label: 'Personal Info', icon: <User size={16} /> },
  { id: 2, label: 'Employment Details', icon: <Briefcase size={16} /> },
  { id: 3, label: 'Documents & KYC', icon: <FileText size={16} /> },
  { id: 4, label: 'Bank & Payroll', icon: <CurrencyInr size={16} /> },
  { id: 5, label: 'Benefits', icon: <Heartbeat size={16} /> },
  { id: 6, label: 'IT Assets', icon: <Desktop size={16} /> },
  { id: 7, label: 'System Access', icon: <ShieldCheck size={16} /> },
  { id: 8, label: 'Manager & Buddy', icon: <UsersThree size={16} /> },
  { id: 9, label: 'Orientation', icon: <Calendar size={16} /> },
  { id: 10, label: 'Review & Complete', icon: <CheckCircle size={16} /> }
];

export default function OnboardingWizardPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'male',
    displayName: '',
    fatherName: '',
    aadhaar: '',
    pan: '',
    profilePhoto: '',

    // Step 2: Employment
    branch: 'Bengaluru HQ',
    department: 'Engineering',
    designation: 'Software Engineer',
    employmentType: 'full_time',
    dateOfJoining: '',
    workLocation: 'onsite', // onsite, remote, hybrid
    shift: 'General Shift (9am-6pm)',

    // Step 3: Documents
    documents: [] as { documentType: string; fileName: string; fileSize: number; status: string }[],

    // Step 4: Bank & Payroll
    ctc: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    taxRegime: 'new', // new, old

    // Step 5: Benefits
    pfEnabled: true,
    esiEnabled: false,
    professionalTax: true,
    insurancePlan: 'premium_5l', // none, basic_3l, premium_5l, exec_10l
    accidentInsurance: true,

    // Step 6: IT Assets
    assets: [] as { assetType: string; assetName: string; serialNumber: string }[],

    // Step 7: System Access
    generateAccount: true,
    role: 'employee',
    sendWelcomeEmail: true,
    apps: ['m365', 'slack', 'jira', 'vpn', 'erp'] as string[], // m365, google, slack, github, jira, vpn, erp

    // Step 8: Reporting Manager
    reportingManager: '',
    buddy: '',
    probationMonths: '6', // 3, 6, none

    // Step 9: Orientation
    handbookAgreed: false,
    ndaAgreed: false,
    policiesAgreed: false,
    orientationDate: '',
    orientationTime: '10:00',
  });

  // Mock Upload state
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch employees list for Manager & Buddy choices
  useEffect(() => {
    async function loadManagers() {
      try {
        const res = await employeeService.list({ limit: 100 });
        const list = res.employees || [];
        setEmployees(list);
        if (list.length > 0) {
          setFormData(prev => ({
            ...prev,
            reportingManager: prev.reportingManager || list[0].fullName,
            buddy: prev.buddy || (list[1] ? list[1].fullName : list[0].fullName)
          }));
        }
      } catch {
        // Fallback static options
      }
    }
    loadManagers();
  }, []);

  // Draft Restore
  useEffect(() => {
    const saved = localStorage.getItem('worksphere_onboarding_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed);
        toast.success('Resumed onboarding wizard draft from your last session!');
      } catch {
        // Ignore
      }
    }
  }, []);

  // Autosave Draft
  const saveDraft = (data: typeof formData) => {
    localStorage.setItem('worksphere_onboarding_draft', JSON.stringify(data));
  };

  const updateField = (fields: Partial<typeof formData>) => {
    setFormData(prev => {
      const next = { ...prev, ...fields };
      saveDraft(next);
      return next;
    });
  };

  // Live Field Validation Summary
  const getValidationErrors = () => {
    const errors: string[] = [];
    if (currentStep === 1) {
      if (!formData.firstName.trim()) errors.push('First Name is required');
      if (!formData.lastName.trim()) errors.push('Last Name is required');
      if (!formData.email.trim()) errors.push('Work Email is required');
      if (!formData.phone.trim()) errors.push('Personal Phone is required');
    }
    if (currentStep === 2) {
      if (!formData.branch.trim()) errors.push('Branch Office is required');
      if (!formData.department.trim()) errors.push('Department is required');
      if (!formData.designation.trim()) errors.push('Designation is required');
      if (!formData.dateOfJoining) errors.push('Joining Date is required');
    }
    if (currentStep === 4) {
      if (!formData.ctc || Number(formData.ctc) <= 0) errors.push('CTC must be a positive number');
      if (!formData.bankName.trim()) errors.push('Bank Name is required');
      if (!formData.accountNumber.trim()) errors.push('Account Number is required');
      if (!formData.ifsc.trim()) errors.push('IFSC Code is required');
    }
    if (currentStep === 8) {
      if (!formData.reportingManager.trim()) errors.push('Reporting Manager selection is required');
    }
    if (currentStep === 9) {
      if (!formData.orientationDate) errors.push('Orientation Session Date is required');
      if (!formData.handbookAgreed) errors.push('Must acknowledge Employee Handbook');
      if (!formData.ndaAgreed) errors.push('Must sign NDA agreement');
    }
    return errors;
  };

  const handleNext = () => {
    const errors = getValidationErrors();
    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
      return;
    }

    if (currentStep === 2) {
      // Date joining validation (future or today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const joiningDate = new Date(formData.dateOfJoining);
      joiningDate.setHours(0, 0, 0, 0);
      if (joiningDate.getTime() < today.getTime()) {
        toast.error('Joining date must be today or in the future.');
        return;
      }
    }

    setCurrentStep(prev => Math.min(10, prev + 1));
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleFileUpload = (docType: string, file: File) => {
    const maxSize = 5 * 1024 * 1024; // 5MB limit
    if (file.size > maxSize) {
      toast.error(`File "${file.name}" exceeds the 5MB limit. Please upload a smaller file.`);
      return;
    }

    setUploadingDocType(docType);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadingDocType(null);

          const nextDocs = [
            ...formData.documents.filter(d => d.documentType !== docType),
            {
              documentType: docType,
              fileName: file.name,
              fileSize: file.size,
              status: 'pending'
            }
          ];
          updateField({ documents: nextDocs });
          toast.success(`${docType.toUpperCase().replace('_', ' ')} uploaded successfully!`);
          return 100;
        }
        return prev + 25;
      });
    }, 80);
  };

  const triggerFileSelect = (docType: string) => {
    document.getElementById(`file-input-${docType}`)?.click();
  };

  const handleRemoveDoc = (docType: string) => {
    const nextDocs = formData.documents.filter(d => d.documentType !== docType);
    updateField({ documents: nextDocs });
  };

  const handleToggleAsset = (assetType: string, assetName: string) => {
    const exists = formData.assets.find(a => a.assetType === assetType);
    if (exists) {
      updateField({ assets: formData.assets.filter(a => a.assetType !== assetType) });
    } else {
      const serial = `SN-${Math.floor(100000 + Math.random() * 900000)}`;
      updateField({ assets: [...formData.assets, { assetType, assetName, serialNumber: serial }] });
    }
  };

  const handleToggleApp = (appId: string) => {
    const exists = formData.apps.includes(appId);
    if (exists) {
      updateField({ apps: formData.apps.filter(a => a !== appId) });
    } else {
      updateField({ apps: [...formData.apps, appId] });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        basic: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          displayName: formData.displayName,
          fatherName: formData.fatherName,
          aadhaar: formData.aadhaar,
          pan: formData.pan,
          profilePhoto: formData.profilePhoto,
        },
        org: {
          branch: formData.branch,
          department: formData.department,
          designation: formData.designation,
          reportingManager: formData.reportingManager,
          employmentType: formData.employmentType,
          dateOfJoining: formData.dateOfJoining,
          workLocation: formData.workLocation,
          shift: formData.shift,
        },
        documents: formData.documents,
        payroll: {
          ctc: formData.ctc,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          ifsc: formData.ifsc,
          uan: '', // generated empty initially
          pfEnabled: formData.pfEnabled,
          esiEnabled: formData.esiEnabled,
          professionalTax: formData.professionalTax,
          tds: '10',
          payrollGroup: 'Standard Monthly',
        },
        assets: formData.assets,
        systemAccess: {
          role: formData.role,
        }
      };

      const res = await onboardingService.create(payload);
      setSuccessData(res);
      localStorage.removeItem('worksphere_onboarding_draft');

      // Save onboarding workspace setup configurations
      const mockWorkspace = {
        checklist: {
          'offer_letter': true,
          'employee_profile': true,
          'emergency_contact': false,
          'photo': !!formData.profilePhoto,
          'documents_verification': false,
          'bank_details': true,
          'salary_structure': false,
          'tax_info': false,
          'pf_link': false,
          'esic_link': false,
          'laptop_assign': formData.assets.some(a => a.assetType === 'laptop'),
          'monitor_assign': formData.assets.some(a => a.assetType === 'monitor'),
          'email_provision': formData.apps.includes('m365') || formData.apps.includes('google'),
          'vpn_provision': formData.apps.includes('vpn'),
          'erp_provision': formData.apps.includes('erp'),
          'buddy_match': true,
          'goal_setting': false,
          'id_card': false,
          'leave_policy_ack': formData.policiesAgreed,
          'nda_sign': formData.ndaAgreed,
        },
        approvals: {
          hr: 'pending',
          finance: 'pending',
          it: 'pending',
          manager: 'pending',
          admin: 'pending',
        },
        systemAccess: formData.apps.reduce((acc, app) => ({ ...acc, [app]: 'active' }), {}),
        timeline: [
          { action: 'EMPLOYEE_CREATED', user: 'System Admin', dept: 'HR', date: new Date().toISOString() }
        ],
        comments: [] as any[]
      };
      localStorage.setItem(`worksphere_onboarding_${res.employeeId}`, JSON.stringify(mockWorkspace));

      setCurrentStep(10);
      toast.success('Employee onboarding workspace initialized!');
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'Onboarding registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const validationErrors = getValidationErrors();
  const completionPercentage = Math.round((currentStep / 10) * 100);

  return (
    <PageContainer
      title="Create Onboarding Workspace"
      subtitle="Complete bio details, documentation registry, compensation bands, IT hardware cataloging, and systems provisioning."
      actions={
        <Link to="/onboarding">
          <Button variant="ghost" icon={<ArrowLeft size={16} />}>Back to Workspace</Button>
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">

        {/* Left Sticky Progress Sidebar */}
        <div className="lg:col-span-1 space-y-5">
          <Card className="p-5 sticky top-6 border border-ag-border/80">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-black uppercase text-ag-ink-3 tracking-wider">Overall Progress</span>
              <span className="text-sm font-black text-ag-primary">{completionPercentage}%</span>
            </div>
            
            <div className="h-2 w-full bg-ag-surface-2 border border-ag-border rounded-full overflow-hidden mb-6">
              <div className="h-full bg-ag-primary transition-all duration-300" style={{ width: `${completionPercentage}%` }} />
            </div>

            <div className="space-y-4">
              {STEPS.map((step) => {
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                return (
                  <button
                    key={step.id}
                    onClick={() => currentStep < 10 && setCurrentStep(step.id)}
                    disabled={currentStep === 10}
                    className={`w-full flex items-center gap-3 text-left p-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-ag-primary-light/40 text-ag-primary font-bold'
                        : 'text-ag-ink-2 hover:bg-ag-surface-2/40'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-xs shrink-0 ${
                      isActive
                        ? 'bg-ag-primary text-white'
                        : isCompleted
                          ? 'bg-ag-mint/10 text-ag-mint border border-ag-mint/30'
                          : 'bg-ag-surface-2 border border-ag-border text-ag-ink-3'
                    }`}>
                      {isCompleted ? <CheckCircle size={14} className="text-ag-mint" /> : step.id}
                    </div>
                    <span className="text-xs truncate font-semibold">{step.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-5 border-t border-ag-border flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] text-ag-ink-3">
                <span>Draft Status</span>
                <span className="font-bold text-ag-mint flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-ag-mint" /> Autosaved
                </span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  saveDraft(formData);
                  toast.success('Draft configuration saved successfully!');
                }}
                className="w-full text-xs mt-2"
              >
                Save as Draft
              </Button>
            </div>
          </Card>

          {validationErrors.length > 0 && currentStep < 10 && (
            <Card className="p-4 bg-[#FFF8E6] border border-ag-amber/30 space-y-2">
              <div className="flex gap-2 text-ag-amber">
                <Warning size={18} className="shrink-0 mt-0.5" />
                <h4 className="font-bold text-xs text-ag-ink">Required for this Step</h4>
              </div>
              <ul className="list-disc list-inside text-[11px] text-ag-ink-3 space-y-1 pl-1">
                {validationErrors.map((err, idx) => <li key={idx}>{err}</li>)}
              </ul>
            </Card>
          )}
        </div>

        {/* Right Form Container */}
        <div className="lg:col-span-3">
          <Card className="p-8 shadow-lvl2 relative min-h-[550px] flex flex-col justify-between overflow-hidden">
            <div>
              {/* STEP 1: Personal Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display font-black text-xl text-ag-ink">Biographical & Personal Profiles</h3>
                    <p className="text-xs text-ag-ink-3 mt-1">Enter candidate biographical details, contact records, and identity numbers.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <Input
                      label="First Name *"
                      value={formData.firstName}
                      onChange={e => updateField({ firstName: e.target.value })}
                      placeholder="e.g. Shikhar"
                      required
                    />
                    <Input
                      label="Last Name *"
                      value={formData.lastName}
                      onChange={e => updateField({ lastName: e.target.value })}
                      placeholder="e.g. Srivastava"
                      required
                    />
                    <Input
                      label="Work Email Address *"
                      type="email"
                      value={formData.email}
                      onChange={e => updateField({ email: e.target.value })}
                      placeholder="e.g. shikhar@company.com"
                      required
                    />
                    <Input
                      label="Personal Contact Phone *"
                      value={formData.phone}
                      onChange={e => updateField({ phone: e.target.value })}
                      placeholder="+91 9988776655"
                      required
                    />
                    <Input
                      label="Display Name"
                      value={formData.displayName}
                      onChange={e => updateField({ displayName: e.target.value })}
                      placeholder="e.g. Shikhar S."
                    />
                    <Input
                      label="Father's / Guardian Name"
                      value={formData.fatherName}
                      onChange={e => updateField({ fatherName: e.target.value })}
                      placeholder="e.g. Rajesh Srivastava"
                    />
                    <Input
                      label="Date of Birth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={e => updateField({ dateOfBirth: e.target.value })}
                    />
                    <Select
                      label="Gender"
                      options={[
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' },
                        { value: 'other', label: 'Other / Prefer not to say' }
                      ]}
                      value={formData.gender}
                      onChange={e => updateField({ gender: e.target.value })}
                    />
                    <Input
                      label="Aadhaar ID Card Number"
                      value={formData.aadhaar}
                      onChange={e => updateField({ aadhaar: e.target.value })}
                      placeholder="12-digit UID"
                    />
                    <Input
                      label="PAN ID Card Number"
                      value={formData.pan}
                      onChange={e => updateField({ pan: e.target.value })}
                      placeholder="10-digit Alphanumeric ID"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Employment Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display font-black text-xl text-ag-ink">Employment & Position Details</h3>
                    <p className="text-xs text-ag-ink-3 mt-1">Configure company department alignment, office branch location, and join dates.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <Input
                      label="Office Branch Location *"
                      value={formData.branch}
                      onChange={e => updateField({ branch: e.target.value })}
                      placeholder="e.g. Noida Office / Bengaluru HQ"
                      required
                    />
                    <Input
                      label="Department Alignment *"
                      value={formData.department}
                      onChange={e => updateField({ department: e.target.value })}
                      placeholder="e.g. Product Engineering"
                      required
                    />
                    <Input
                      label="Designation Role *"
                      value={formData.designation}
                      onChange={e => updateField({ designation: e.target.value })}
                      placeholder="e.g. Senior Frontend Developer"
                      required
                    />
                    <Input
                      label="Joining Date *"
                      type="date"
                      value={formData.dateOfJoining}
                      onChange={e => updateField({ dateOfJoining: e.target.value })}
                      required
                    />
                    <Select
                      label="Employment Type"
                      options={[
                        { value: 'full_time', label: 'Full-time Regular' },
                        { value: 'part_time', label: 'Part-time employee' },
                        { value: 'contract', label: 'Contractual Specialist' },
                        { value: 'intern', label: 'Intern' }
                      ]}
                      value={formData.employmentType}
                      onChange={e => updateField({ employmentType: e.target.value })}
                    />
                    <Select
                      label="Work Mode Location"
                      options={[
                        { value: 'onsite', label: 'Onsite (Office-based)' },
                        { value: 'remote', label: 'Fully Remote (Work from home)' },
                        { value: 'hybrid', label: 'Hybrid model' }
                      ]}
                      value={formData.workLocation}
                      onChange={e => updateField({ workLocation: e.target.value })}
                    />
                    <Input
                      label="Daily Shift Schedule"
                      value={formData.shift}
                      onChange={e => updateField({ shift: e.target.value })}
                      placeholder="e.g. General Shift (9:00 AM - 6:00 PM)"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Documents Upload */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display font-black text-xl text-ag-ink">Documents & KYC Registries</h3>
                    <p className="text-xs text-ag-ink-3 mt-1">Upload verified files for Aadhaar, PAN, Resume, Offer Letters, and contracts.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    {['aadhaar', 'pan', 'resume', 'offer_letter', 'passport', 'employment_contract'].map((docType) => {
                      const doc = formData.documents.find(d => d.documentType === docType);
                      const isUploading = uploadingDocType === docType;
                      return (
                        <div key={docType} className="p-4 border border-ag-border/70 rounded-xl flex flex-col justify-between bg-ag-surface-2/30 gap-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-xs uppercase font-bold text-ag-ink-2 tracking-wider">{docType.replace('_', ' ')}</h4>
                              <p className="text-[10px] text-ag-ink-3 mt-0.5">Verified copy file upload.</p>
                            </div>
                            {doc && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-ag-amber-light text-ag-amber uppercase">
                                {doc.status} Approval
                              </span>
                            )}
                          </div>

                          {doc ? (
                            <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-ag-border text-xs">
                              <span className="truncate font-semibold text-ag-ink max-w-[180px]">{doc.fileName}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveDoc(docType)}
                                className="p-1 hover:bg-ag-surface-2 text-ag-coral rounded transition-colors"
                              >
                                <Trash size={15} />
                              </button>
                            </div>
                          ) : isUploading ? (
                            <div className="space-y-1.5 py-1.5">
                              <div className="h-1.5 w-full bg-ag-border rounded-full overflow-hidden">
                                <div className="h-full bg-ag-primary transition-all duration-75" style={{ width: `${uploadProgress}%` }} />
                              </div>
                              <span className="text-[9px] text-ag-ink-3 font-semibold">Uploading... {uploadProgress}%</span>
                            </div>
                          ) : (
                            <div>
                              <input
                                type="file"
                                id={`file-input-${docType}`}
                                className="hidden"
                                accept=".pdf,.png,.jpg,.jpeg"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(docType, file);
                                }}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<UploadSimple size={15} />}
                                onClick={() => triggerFileSelect(docType)}
                                className="w-full bg-white border border-ag-border text-ag-ink-2 hover:bg-ag-surface-2 text-xs"
                              >
                                Select & Upload
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 4: Bank & Payroll */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display font-black text-xl text-ag-ink">Compensation & Bank Registry</h3>
                    <p className="text-xs text-ag-ink-3 mt-1">Configure candidate CTC compensation, salary bank details, and active tax regime.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <Input
                      label="Annual CTC Amount (INR) *"
                      type="number"
                      value={formData.ctc}
                      onChange={e => updateField({ ctc: e.target.value })}
                      placeholder="e.g. 1500000"
                      required
                    />
                    <Input
                      label="Salary Bank Name *"
                      value={formData.bankName}
                      onChange={e => updateField({ bankName: e.target.value })}
                      placeholder="e.g. ICICI Bank / HDFC Bank"
                      required
                    />
                    <Input
                      label="Bank Account Number *"
                      value={formData.accountNumber}
                      onChange={e => updateField({ accountNumber: e.target.value })}
                      placeholder="e.g. 5020001234567"
                      required
                    />
                    <Input
                      label="IFSC Code *"
                      value={formData.ifsc}
                      onChange={e => updateField({ ifsc: e.target.value })}
                      placeholder="e.g. ICIC0000104"
                      required
                    />
                    <Select
                      label="Tax Regime Preference"
                      options={[
                        { value: 'new', label: 'New Tax Regime (Simplified)' },
                        { value: 'old', label: 'Old Tax Regime (With Deductions)' }
                      ]}
                      value={formData.taxRegime}
                      onChange={e => updateField({ taxRegime: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* STEP 5: Benefits */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display font-black text-xl text-ag-ink">Social Benefits & Insurances</h3>
                    <p className="text-xs text-ag-ink-3 mt-1">Select statutory benefit enrollments, PF contributions, and medical coverages.</p>
                  </div>
                  <div className="space-y-4 pt-2">
                    <Select
                      label="Group Medical Health Insurance Plan"
                      options={[
                        { value: 'none', label: 'No coverage plan selected' },
                        { value: 'basic_3l', label: 'Basic Plan (₹3,00,000 Cover)' },
                        { value: 'premium_5l', label: 'Premium Plan (₹5,00,000 Cover)' },
                        { value: 'exec_10l', label: 'Executive Cover (₹10,00,000 Cover)' }
                      ]}
                      value={formData.insurancePlan}
                      onChange={e => updateField({ insurancePlan: e.target.value })}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="p-4 border border-ag-border bg-ag-surface-2/40 rounded-xl">
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-ag-ink-2 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={formData.pfEnabled}
                            onChange={e => updateField({ pfEnabled: e.target.checked })}
                            className="rounded border-ag-border accent-ag-primary h-4 w-4"
                          />
                          Enable PF Deduction (12% CTC)
                        </label>
                        <p className="text-[10px] text-ag-ink-3 mt-2 pl-6">
                          Auto-linking with UAN registry and employer matching PF payouts.
                        </p>
                      </div>

                      <div className="p-4 border border-ag-border bg-ag-surface-2/40 rounded-xl">
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-ag-ink-2 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={formData.esiEnabled}
                            onChange={e => updateField({ esiEnabled: e.target.checked })}
                            className="rounded border-ag-border accent-ag-primary h-4 w-4"
                          />
                          ESIC Scheme Registration
                        </label>
                        <p className="text-[10px] text-ag-ink-3 mt-2 pl-6">
                          Eligible under statutory state employee insurance (where applicable).
                        </p>
                      </div>

                      <div className="p-4 border border-ag-border bg-ag-surface-2/40 rounded-xl">
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-ag-ink-2 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={formData.professionalTax}
                            onChange={e => updateField({ professionalTax: e.target.checked })}
                            className="rounded border-ag-border accent-ag-primary h-4 w-4"
                          />
                          Deduct Professional Tax
                        </label>
                        <p className="text-[10px] text-ag-ink-3 mt-2 pl-6">
                          Deduct monthly state professional tax according to local slabs.
                        </p>
                      </div>

                      <div className="p-4 border border-ag-border bg-ag-surface-2/40 rounded-xl">
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-ag-ink-2 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={formData.accidentInsurance}
                            onChange={e => updateField({ accidentInsurance: e.target.checked })}
                            className="rounded border-ag-border accent-ag-primary h-4 w-4"
                          />
                          Group Personal Accident Cover
                        </label>
                        <p className="text-[10px] text-ag-ink-3 mt-2 pl-6">
                          Enroll in company sponsored accidental term benefits.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: IT Assets */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display font-black text-xl text-ag-ink">Hardware & Device Allocation</h3>
                    <p className="text-xs text-ag-ink-3 mt-1">Select the standard IT corporate inventory items requested for this employee.</p>
                  </div>
                  <div className="space-y-3 pt-2">
                    {[
                      { id: 'laptop', name: 'Engineering Laptop - Apple MacBook Pro M3 Max 16"', desc: 'Standard developer configuration (32GB RAM / 1TB SSD).' },
                      { id: 'monitor', name: 'UltraSharp Display - Dell 27" 4K Monitor', desc: 'Extended secondary screen unit setup.' },
                      { id: 'sim', name: 'Cellular Connectivity - Corporate Jio 5G SIM', desc: 'Company telephone number and internet data allocation.' },
                      { id: 'access_card', name: 'Building Access Card - NFC Access Key', desc: 'Secure entrance and attendance scanning tag.' }
                    ].map((item) => {
                      const isChecked = !!formData.assets.find(a => a.assetType === item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleToggleAsset(item.id, item.name)}
                          className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                            isChecked
                              ? 'border-ag-primary bg-ag-primary-light/10 shadow-sm'
                              : 'border-ag-border hover:bg-ag-surface-2/40'
                          }`}
                        >
                          <div>
                            <h4 className="text-sm font-bold text-ag-ink">{item.name}</h4>
                            <p className="text-xs text-ag-ink-3 mt-0.5">{item.desc}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded border-ag-border accent-ag-primary h-4 w-4"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 7: System Access */}
              {currentStep === 7 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display font-black text-xl text-ag-ink">Systems Access & SaaS Provisioning</h3>
                    <p className="text-xs text-ag-ink-3 mt-1">Select the tools, apps, and credentials to auto-provision for the new profile.</p>
                  </div>
                  <div className="space-y-4 pt-2">
                    <Select
                      label="Security Portal Role Access"
                      options={[
                        { value: 'employee', label: 'Standard Employee Portal' },
                        { value: 'reporting_manager', label: 'Supervisor / Department Manager' },
                        { value: 'hr_head', label: 'HR Administrator' }
                      ]}
                      value={formData.role}
                      onChange={e => updateField({ role: e.target.value })}
                    />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                      {[
                        { id: 'm365', label: 'Microsoft 365' },
                        { id: 'google', label: 'Google Workspace' },
                        { id: 'slack', label: 'Slack Workspace' },
                        { id: 'teams', label: 'Microsoft Teams' },
                        { id: 'github', label: 'GitHub Organization' },
                        { id: 'jira', label: 'Jira / Confluence' },
                        { id: 'vpn', label: 'Corporate VPN' },
                        { id: 'erp', label: 'WorkSphere ERP' }
                      ].map((app) => {
                        const isChecked = formData.apps.includes(app.id);
                        return (
                          <div
                            key={app.id}
                            onClick={() => handleToggleApp(app.id)}
                            className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                              isChecked
                                ? 'border-ag-primary bg-ag-primary-light/10 font-semibold text-ag-primary'
                                : 'border-ag-border text-ag-ink-2 hover:bg-ag-surface-2/40'
                            }`}
                          >
                            <span className="text-xs">{app.label}</span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="rounded border-ag-border accent-ag-primary h-3.5 w-3.5"
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <label className="flex items-start gap-2.5 cursor-pointer p-4 border border-ag-border bg-ag-surface-2/40 rounded-xl">
                        <input
                          type="checkbox"
                          checked={formData.generateAccount}
                          onChange={e => updateField({ generateAccount: e.target.checked })}
                          className="rounded border-ag-border accent-ag-primary h-4 w-4 mt-0.5"
                        />
                        <div>
                          <span className="text-xs font-bold text-ag-ink block">Auto-generate login ID & password</span>
                          <span className="text-[10px] text-ag-ink-3 mt-1 block">
                            System will auto-create password-less hashes for security activation.
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 cursor-pointer p-4 border border-ag-border bg-ag-surface-2/40 rounded-xl">
                        <input
                          type="checkbox"
                          checked={formData.sendWelcomeEmail}
                          onChange={e => updateField({ sendWelcomeEmail: e.target.checked })}
                          className="rounded border-ag-border accent-ag-primary h-4 w-4 mt-0.5"
                        />
                        <div>
                          <span className="text-xs font-bold text-ag-ink block">Send Welcome Invitation Email</span>
                          <span className="text-[10px] text-ag-ink-3 mt-1 block">
                            Sends instructions containing temporary password and onboarding schedule.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 8: Manager & Buddy */}
              {currentStep === 8 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display font-black text-xl text-ag-ink">Supervisor & Onboarding Buddy</h3>
                    <p className="text-xs text-ag-ink-3 mt-1">Assign reporting lines, mentors, and probation parameters for the candidate.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-xs font-bold text-ag-ink-2 uppercase tracking-wider block mb-1.5">Reporting Manager *</label>
                      <select
                        value={formData.reportingManager}
                        onChange={e => updateField({ reportingManager: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg border border-ag-border bg-white text-sm text-ag-ink outline-none focus:border-ag-primary focus:ring-1 focus:ring-ag-primary"
                      >
                        <option value="">Choose reporting manager</option>
                        {employees.map(emp => (
                          <option key={emp._id} value={emp.fullName}>{emp.fullName} ({emp.job.designationName})</option>
                        ))}
                        {employees.length === 0 && (
                          <>
                            <option value="Priya Sharma">Priya Sharma (Engineering Lead)</option>
                            <option value="Amit Verma">Amit Verma (HR Lead)</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-ag-ink-2 uppercase tracking-wider block mb-1.5">Onboarding Buddy / Mentor</label>
                      <select
                        value={formData.buddy}
                        onChange={e => updateField({ buddy: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg border border-ag-border bg-white text-sm text-ag-ink outline-none focus:border-ag-primary focus:ring-1 focus:ring-ag-primary"
                      >
                        <option value="">Choose buddy mentor</option>
                        {employees.map(emp => (
                          <option key={emp._id} value={emp.fullName}>{emp.fullName} ({emp.job.departmentName})</option>
                        ))}
                        {employees.length === 0 && (
                          <>
                            <option value="Rohan Gupta">Rohan Gupta (Product Engineer)</option>
                            <option value="Anjali Roy">Anjali Roy (Designer)</option>
                          </>
                        )}
                      </select>
                    </div>

                    <Select
                      label="Probation Evaluation Term"
                      options={[
                        { value: '3', label: '3 Months term' },
                        { value: '6', label: '6 Months term (Standard)' },
                        { value: '12', label: '1 Year term' },
                        { value: 'none', label: 'No probation (Direct confirmation)' }
                      ]}
                      value={formData.probationMonths}
                      onChange={e => updateField({ probationMonths: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* STEP 9: Orientation Setup */}
              {currentStep === 9 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display font-black text-xl text-ag-ink">Orientation Setup & Policies</h3>
                    <p className="text-xs text-ag-ink-3 mt-1">Schedule first day orientation briefings and request mandatory policy agreements.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <Input
                      label="Orientation Date *"
                      type="date"
                      value={formData.orientationDate}
                      onChange={e => updateField({ orientationDate: e.target.value })}
                      required
                    />
                    <Input
                      label="Orientation Time *"
                      type="time"
                      value={formData.orientationTime}
                      onChange={e => updateField({ orientationTime: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="flex items-start gap-2.5 cursor-pointer p-4 border border-ag-border bg-ag-surface-2/40 rounded-xl">
                      <input
                        type="checkbox"
                        checked={formData.handbookAgreed}
                        onChange={e => updateField({ handbookAgreed: e.target.checked })}
                        className="rounded border-ag-border accent-ag-primary h-4 w-4 mt-0.5"
                      />
                      <div>
                        <span className="text-xs font-bold text-ag-ink block">Acknowledge Employee Handbook</span>
                        <span className="text-[10px] text-ag-ink-3 mt-1 block">
                          I agree to share and verify company policy outlines with the candidate.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer p-4 border border-ag-border bg-ag-surface-2/40 rounded-xl">
                      <input
                        type="checkbox"
                        checked={formData.ndaAgreed}
                        onChange={e => updateField({ ndaAgreed: e.target.checked })}
                        className="rounded border-ag-border accent-ag-primary h-4 w-4 mt-0.5"
                      />
                      <div>
                        <span className="text-xs font-bold text-ag-ink block">Mandatory Non-Disclosure Agreement (NDA)</span>
                        <span className="text-[10px] text-ag-ink-3 mt-1 block">
                          Request signature on confidentiality protocols and data protection clauses on Day 1.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer p-4 border border-ag-border bg-ag-surface-2/40 rounded-xl">
                      <input
                        type="checkbox"
                        checked={formData.policiesAgreed}
                        onChange={e => updateField({ policiesAgreed: e.target.checked })}
                        className="rounded border-ag-border accent-ag-primary h-4 w-4 mt-0.5"
                      />
                      <div>
                        <span className="text-xs font-bold text-ag-ink block">Office Leave & Attendance Policy Briefing</span>
                        <span className="text-[10px] text-ag-ink-3 mt-1 block">
                          Provide training session schedules covering check-in protocols.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 10: Summary Review & Success */}
              {currentStep === 10 && !successData && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display font-black text-xl text-ag-ink">Onboarding Final Review</h3>
                    <p className="text-xs text-ag-ink-3 mt-1">Review the consolidated details below. Click Edit steps to backtrack changes.</p>
                  </div>

                  <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 pt-2">
                    {/* Personal */}
                    <div className="p-4 border border-ag-border rounded-xl space-y-2 bg-white relative">
                      <button type="button" onClick={() => setCurrentStep(1)} className="absolute top-4 right-4 text-xs font-bold text-ag-primary hover:underline">Edit</button>
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-ag-ink-3">1. Personal & Contact Details</h4>
                      <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                        <div><span className="text-ag-ink-3">Name:</span> <strong className="text-ag-ink">{formData.firstName} {formData.lastName}</strong></div>
                        <div><span className="text-ag-ink-3">Work Email:</span> <strong className="text-ag-ink">{formData.email}</strong></div>
                        <div><span className="text-ag-ink-3">Phone:</span> <strong className="text-ag-ink">{formData.phone}</strong></div>
                        <div><span className="text-ag-ink-3">Gender:</span> <strong className="text-ag-ink capitalize">{formData.gender}</strong></div>
                      </div>
                    </div>

                    {/* Employment */}
                    <div className="p-4 border border-ag-border rounded-xl space-y-2 bg-white relative">
                      <button type="button" onClick={() => setCurrentStep(2)} className="absolute top-4 right-4 text-xs font-bold text-ag-primary hover:underline">Edit</button>
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-ag-ink-3">2. Employment position</h4>
                      <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                        <div><span className="text-ag-ink-3">Branch:</span> <strong className="text-ag-ink">{formData.branch}</strong></div>
                        <div><span className="text-ag-ink-3">Department:</span> <strong className="text-ag-ink">{formData.department}</strong></div>
                        <div><span className="text-ag-ink-3">Designation:</span> <strong className="text-ag-ink">{formData.designation}</strong></div>
                        <div><span className="text-ag-ink-3">Joined Date:</span> <strong className="text-ag-ink">{formData.dateOfJoining}</strong></div>
                      </div>
                    </div>

                    {/* Banking / payroll */}
                    <div className="p-4 border border-ag-border rounded-xl space-y-2 bg-white relative">
                      <button type="button" onClick={() => setCurrentStep(4)} className="absolute top-4 right-4 text-xs font-bold text-ag-primary hover:underline">Edit</button>
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-ag-ink-3">3. Payroll & Banking</h4>
                      <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                        <div><span className="text-ag-ink-3">Annual CTC:</span> <strong className="text-ag-ink">₹{Number(formData.ctc || 0).toLocaleString('en-IN')}</strong></div>
                        <div><span className="text-ag-ink-3">Bank Name:</span> <strong className="text-ag-ink">{formData.bankName}</strong></div>
                        <div><span className="text-ag-ink-3">Account No:</span> <strong className="text-ag-ink">{formData.accountNumber}</strong></div>
                        <div><span className="text-ag-ink-3">IFSC Code:</span> <strong className="text-ag-ink">{formData.ifsc}</strong></div>
                      </div>
                    </div>

                    {/* IT Assets / Apps */}
                    <div className="p-4 border border-ag-border rounded-xl space-y-2 bg-white text-xs">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-ag-ink-3">4. Allocated IT Assets & Software Access</h4>
                      <div className="space-y-1">
                        <div><span className="text-ag-ink-3">Hardware Items:</span> <strong className="text-ag-ink">{formData.assets.map(a => a.assetName).join(', ') || 'None'}</strong></div>
                        <div><span className="text-ag-ink-3">Provisioned apps:</span> <strong className="text-ag-ink">{formData.apps.join(', ').toUpperCase() || 'None'}</strong></div>
                      </div>
                    </div>

                    {/* Manager & Orientation */}
                    <div className="p-4 border border-ag-border rounded-xl space-y-2 bg-white text-xs">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-ag-ink-3">5. Supervision & Orientation Schedule</h4>
                      <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                        <div><span className="text-ag-ink-3">Reporting Manager:</span> <strong className="text-ag-ink">{formData.reportingManager}</strong></div>
                        <div><span className="text-ag-ink-3">Onboarding Buddy:</span> <strong className="text-ag-ink">{formData.buddy}</strong></div>
                        <div><span className="text-ag-ink-3">Briefing Date:</span> <strong className="text-ag-ink">{formData.orientationDate}</strong></div>
                        <div><span className="text-ag-ink-3">Briefing Time:</span> <strong className="text-ag-ink">{formData.orientationTime}</strong></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUCCESS PANEL */}
              {currentStep === 10 && successData && (
                <div className="space-y-6 text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-ag-mint/10 text-ag-mint flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle size={36} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-display font-black text-2xl text-ag-ink">Onboarding Workspace Initialized!</h3>
                    <p className="text-sm text-ag-ink-3 max-w-md mx-auto">
                      A corporate profile and onboarding workflow workspace for <strong>{successData.fullName}</strong> has been initialized successfully.
                    </p>
                  </div>

                  <div className="max-w-md mx-auto p-5 border border-ag-border bg-ag-surface-2/40 rounded-xl text-left text-xs space-y-3">
                    <h4 className="text-xs uppercase font-bold text-ag-ink-2 tracking-wider">Candidate Portal Credentials</h4>
                    <div>
                      <span className="text-ag-ink-3">Employee Login Email ID:</span>
                      <div className="p-2 bg-white rounded border border-ag-border font-mono text-ag-ink font-bold mt-1 select-all">
                        {successData.email}
                      </div>
                    </div>
                    <div>
                      <span className="text-ag-ink-3">Temporary Assigned Password:</span>
                      <div className="p-2 bg-white rounded border border-ag-border font-mono text-ag-ink font-bold mt-1 select-all">
                        {successData.tempPassword || 'ws-temporary-secret'}
                      </div>
                    </div>
                    <p className="text-[10px] text-ag-ink-3 italic">
                      Note: The credentials have been dispatched via welcome email invitation to the candidate.
                    </p>
                  </div>

                  <div className="pt-4 flex justify-center gap-3">
                    <Link to="/onboarding">
                      <Button variant="primary">Return to Onboarding Workspace</Button>
                    </Link>
                    <Link to={`/onboarding/${successData.employeeId}`}>
                      <Button variant="secondary">Go to Employee Workspace</Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Wizard Navigation Controls */}
            {currentStep <= 10 && !successData && (
              <div className="flex justify-between items-center pt-6 mt-8 border-t border-ag-border">
                <Button
                  variant="ghost"
                  onClick={handlePrev}
                  disabled={currentStep === 1}
                  icon={<ArrowLeft size={16} />}
                >
                  Previous Step
                </Button>

                {currentStep === 10 ? (
                  <Button
                    variant="primary"
                    loading={loading}
                    onClick={handleSubmit}
                    icon={<CheckCircle size={16} />}
                    className="bg-ag-mint hover:bg-opacity-95 text-white border-transparent"
                  >
                    Initialize Workspace
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleNext}
                    iconRight={<ArrowRight size={16} />}
                  >
                    Continue
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>

      </div>
    </PageContainer>
  );
}
