import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Button } from '@/components/ui/Button/Button';
import { Card } from '@/components/ui/Card/Card';
import { Input } from '@/components/ui/Input/Input';
import { onboardingService } from '@/services/api.service';
import {
  Sparkle, ShieldCheck, User, Briefcase, FileText, CurrencyInr, Desktop,
  CheckCircle, ArrowLeft, ArrowRight, Trash, UploadSimple, Info
} from '@phosphor-icons/react';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, label: 'Basic Details', icon: <User size={16} /> },
  { id: 2, label: 'Organization', icon: <Briefcase size={16} /> },
  { id: 3, label: 'Documents', icon: <FileText size={16} /> },
  { id: 4, label: 'Payroll', icon: <CurrencyInr size={16} /> },
  { id: 5, label: 'IT Assets', icon: <Desktop size={16} /> },
  { id: 6, label: 'System Access', icon: <ShieldCheck size={16} /> },
  { id: 7, label: 'Review', icon: <Info size={16} /> },
  { id: 8, label: 'Complete', icon: <CheckCircle size={16} /> }
];

export default function OnboardingWizardPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Basic
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

    // Step 2: Org
    branch: 'Bengaluru HQ',
    department: 'Engineering',
    designation: 'Software Engineer',
    reportingManager: 'Priya Sharma',
    employmentType: 'full_time',
    dateOfJoining: '',
    workLocation: 'Bengaluru',
    shift: 'General Shift (9am-6pm)',

    // Step 3: Documents (Meta arrays)
    documents: [] as { documentType: string; fileName: string; fileSize: number; status: string }[],

    // Step 4: Payroll
    ctc: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    uan: '',
    pfEnabled: true,
    esiEnabled: false,
    professionalTax: true,
    tds: '10',
    payrollGroup: 'Standard Monthly',

    // Step 5: IT Assets (Meta arrays)
    assets: [] as { assetType: string; assetName: string; serialNumber: string }[],

    // Step 6: System Access
    generateAccount: true,
    role: 'employee',
    sendWelcomeEmail: true,
  });

  // Mock Upload state
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const handleNext = () => {
    // Step Validations
    if (currentStep === 1) {
      if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.phone.trim()) {
        toast.error('Please fill in required fields (Name, Email, Phone)');
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.branch.trim() || !formData.department.trim() || !formData.designation.trim() || !formData.dateOfJoining) {
        toast.error('Please specify branch, department, designation, and joining date');
        return;
      }
      // Date joining validation (future or today)
      const today = new Date();
      today.setHours(0,0,0,0);
      const joiningDate = new Date(formData.dateOfJoining);
      joiningDate.setHours(0,0,0,0);
      if (joiningDate.getTime() < today.getTime()) {
        toast.error('Joining date must be today or in the future.');
        return;
      }
    } else if (currentStep === 4) {
      if (!formData.ctc || Number(formData.ctc) <= 0 || !formData.bankName.trim() || !formData.accountNumber.trim() || !formData.ifsc.trim()) {
        toast.error('Please provide valid bank details and CTC');
        return;
      }
    }

    setCurrentStep(prev => prev + 1);
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
            ...formData.documents,
            {
              documentType: docType,
              fileName: file.name,
              fileSize: file.size,
              status: 'pending'
            }
          ];
          updateField({ documents: nextDocs });
          toast.success(`${docType.toUpperCase()} file "${file.name}" uploaded successfully!`);
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
          uan: formData.uan,
          pfEnabled: formData.pfEnabled,
          esiEnabled: formData.esiEnabled,
          professionalTax: formData.professionalTax,
          tds: formData.tds,
          payrollGroup: formData.payrollGroup,
        },
        assets: formData.assets,
        systemAccess: {
          role: formData.role,
        }
      };

      const res = await onboardingService.create(payload);
      setSuccessData(res);
      // Clear Cache
      localStorage.removeItem('worksphere_onboarding_draft');
      setCurrentStep(8);
      toast.success('Employee onboarding record saved successfully!');
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'Onboarding registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer
      title="Candidate Onboarding Wizard"
      subtitle="Complete biographical verification, asset cataloging, payroll setup, and system login provisions."
      actions={
        <Link to="/onboarding">
          <Button variant="ghost" icon={<ArrowLeft size={16} />}>Back to Workspace</Button>
        </Link>
      }
    >
      <div className="space-y-8 max-w-5xl mx-auto">
        
        {/* Step Indicator Panel */}
        <div className="flex justify-between items-center bg-white border border-ag-border rounded-xl p-4 shadow-sm overflow-x-auto gap-4">
          {STEPS.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <div key={step.id} className="flex items-center gap-2 shrink-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-ag-primary text-white ring-4 ring-ag-primary-light'
                    : isCompleted
                      ? 'bg-ag-mint/10 text-ag-mint border border-ag-mint/35'
                      : 'bg-ag-surface-2 border border-ag-border text-ag-ink-3'
                }`}>
                  {isCompleted ? <CheckCircle size={18} className="text-ag-mint" /> : step.id}
                </div>
                <span className={`text-xs font-semibold hidden md:block ${isActive ? 'text-ag-ink font-bold' : 'text-ag-ink-3'}`}>
                  {step.label}
                </span>
                {step.id < 8 && <div className="h-px w-6 bg-ag-border hidden md:block" />}
              </div>
            );
          })}
        </div>

        {/* Step Cards */}
        <Card className="p-8 shadow-lvl2 relative overflow-hidden">
          
          {/* STEP 1: Basic Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="font-display font-bold text-lg text-ag-ink border-b border-ag-border pb-2">Step 1: Personal & Bio Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name *"
                  value={formData.firstName}
                  onChange={e => updateField({ firstName: e.target.value })}
                  placeholder="e.g. Priyan"
                  required
                />
                <Input
                  label="Last Name *"
                  value={formData.lastName}
                  onChange={e => updateField({ lastName: e.target.value })}
                  placeholder="e.g. Patel"
                  required
                />
                <Input
                  label="Work Email *"
                  type="email"
                  value={formData.email}
                  onChange={e => updateField({ email: e.target.value })}
                  placeholder="candidate@company.com"
                  required
                />
                <Input
                  label="Personal Phone *"
                  value={formData.phone}
                  onChange={e => updateField({ phone: e.target.value })}
                  placeholder="+91 9988776655"
                  required
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={e => updateField({ dateOfBirth: e.target.value })}
                />
                <Input
                  label="Aadhaar ID Number"
                  value={formData.aadhaar}
                  onChange={e => updateField({ aadhaar: e.target.value })}
                  placeholder="12-digit Aadhaar Card number"
                />
                <Input
                  label="PAN Number"
                  value={formData.pan}
                  onChange={e => updateField({ pan: e.target.value })}
                  placeholder="ABCDE1234F"
                />
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ag-ink-2 uppercase tracking-wider block">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={e => updateField({ gender: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-ag-border bg-white text-sm text-ag-ink outline-none focus:border-ag-primary focus:ring-1 focus:ring-ag-primary"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Organization */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="font-display font-bold text-lg text-ag-ink border-b border-ag-border pb-2">Step 2: Corporate Organization</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Work Branch Office *"
                  value={formData.branch}
                  onChange={e => updateField({ branch: e.target.value })}
                  placeholder="e.g. Bengaluru HQ"
                  required
                />
                <Input
                  label="Department Name *"
                  value={formData.department}
                  onChange={e => updateField({ department: e.target.value })}
                  placeholder="e.g. Engineering"
                  required
                />
                <Input
                  label="Designation Role *"
                  value={formData.designation}
                  onChange={e => updateField({ designation: e.target.value })}
                  placeholder="e.g. Software Engineer"
                  required
                />
                <Input
                  label="Reporting Manager *"
                  value={formData.reportingManager}
                  onChange={e => updateField({ reportingManager: e.target.value })}
                  placeholder="e.g. Priya Sharma"
                  required
                />
                <Input
                  label="Joining Date *"
                  type="date"
                  value={formData.dateOfJoining}
                  onChange={e => updateField({ dateOfJoining: e.target.value })}
                  required
                />
                <Input
                  label="Office Shift Schedule"
                  value={formData.shift}
                  onChange={e => updateField({ shift: e.target.value })}
                  placeholder="General Shift (9am-6pm)"
                />
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ag-ink-2 uppercase tracking-wider block">Employment Type</label>
                  <select
                    value={formData.employmentType}
                    onChange={e => updateField({ employmentType: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-ag-border bg-white text-sm text-ag-ink outline-none focus:border-ag-primary"
                  >
                    <option value="full_time">Full-time Regular</option>
                    <option value="contract">Contractor</option>
                    <option value="intern">Internship</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Documents */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="font-display font-bold text-lg text-ag-ink border-b border-ag-border pb-2">Step 3: Document Attachments & KYC</h3>
              <p className="text-xs text-ag-ink-3">Upload candidate document files or mock proof attachments.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['aadhaar', 'pan', 'resume', 'offer_letter'].map((docType) => {
                  const doc = formData.documents.find(d => d.documentType === docType);
                  const isUploading = uploadingDocType === docType;

                  return (
                    <div key={docType} className="p-4 border border-ag-border rounded-xl flex flex-col justify-between bg-ag-surface-2/40 gap-3">
                      <div>
                        <h4 className="text-xs uppercase font-bold text-ag-ink-2 tracking-wider">{docType.replace('_', ' ')} Document</h4>
                        <p className="text-[11px] text-ag-ink-3 mt-1">Upload verified files for candidate profiling.</p>
                      </div>

                      {doc ? (
                        <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-ag-border text-xs">
                          <span className="truncate font-semibold text-ag-ink">{doc.fileName} ({Math.round(doc.fileSize / 1024)} KB)</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDoc(docType)}
                            className="p-1 hover:bg-ag-surface-2 text-ag-coral rounded"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      ) : isUploading ? (
                        <div className="space-y-1.5 py-2">
                          <div className="h-1.5 w-full bg-ag-border rounded-full overflow-hidden">
                            <div className="h-full bg-ag-primary transition-all duration-100" style={{ width: `${uploadProgress}%` }} />
                          </div>
                          <span className="text-[10px] text-ag-ink-3 font-semibold">Uploading... {uploadProgress}%</span>
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
                              if (file) {
                                handleFileUpload(docType, file);
                              }
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<UploadSimple size={16} />}
                            onClick={() => triggerFileSelect(docType)}
                            className="w-full bg-white border border-ag-border text-ag-ink-2 hover:bg-ag-surface-2"
                          >
                            Drag & Drop or Click to Upload
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Payroll */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="font-display font-bold text-lg text-ag-ink border-b border-ag-border pb-2">Step 4: Salary & Banking Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="CTC Amount (INR Annual) *"
                  type="number"
                  value={formData.ctc}
                  onChange={e => updateField({ ctc: e.target.value })}
                  placeholder="e.g. 1200000"
                  required
                />
                <Input
                  label="Bank Name *"
                  value={formData.bankName}
                  onChange={e => updateField({ bankName: e.target.value })}
                  placeholder="HDFC Bank"
                  required
                />
                <Input
                  label="Account Number *"
                  value={formData.accountNumber}
                  onChange={e => updateField({ accountNumber: e.target.value })}
                  placeholder="50100234567890"
                  required
                />
                <Input
                  label="IFSC Code *"
                  value={formData.ifsc}
                  onChange={e => updateField({ ifsc: e.target.value })}
                  placeholder="HDFC0000123"
                  required
                />
                <Input
                  label="EPF UAN Number (Optional)"
                  value={formData.uan}
                  onChange={e => updateField({ uan: e.target.value })}
                  placeholder="100234567890"
                />
                <Input
                  label="Payroll Group"
                  value={formData.payrollGroup}
                  onChange={e => updateField({ payrollGroup: e.target.value })}
                  placeholder="Standard Monthly"
                />
              </div>

              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-ag-ink-2">
                  <input
                    type="checkbox"
                    checked={formData.pfEnabled}
                    onChange={e => updateField({ pfEnabled: e.target.checked })}
                    className="rounded border-ag-border accent-ag-primary"
                  />
                  Enable PF Deduction
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-ag-ink-2">
                  <input
                    type="checkbox"
                    checked={formData.professionalTax}
                    onChange={e => updateField({ professionalTax: e.target.checked })}
                    className="rounded border-ag-border accent-ag-primary"
                  />
                  Deduct Professional Tax
                </label>
              </div>
            </div>
          )}

          {/* STEP 5: IT Assets */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h3 className="font-display font-bold text-lg text-ag-ink border-b border-ag-border pb-2">Step 5: Hardware & IT Assets Assignment</h3>
              <p className="text-xs text-ag-ink-3">Select the asset categories to allocate to this candidate during onboarding.</p>

              <div className="space-y-3">
                {[
                  { id: 'laptop', name: 'MacBook Pro M3 Max 16"', desc: 'Standard Engineering Laptop Assignment' },
                  { id: 'monitor', name: 'Dell UltraSharp 27" 4K Monitor', desc: 'Desktop secondary monitor unit' },
                  { id: 'access_card', name: 'WorkSphere Access Key Card', desc: 'Office premises access card' },
                  { id: 'sim', name: 'Corporate Jio SIM Card', desc: 'Corporate cellular network connectivity' }
                ].map((asset) => {
                  const isChecked = !!formData.assets.find(a => a.assetType === asset.id);
                  return (
                    <div
                      key={asset.id}
                      onClick={() => handleToggleAsset(asset.id, asset.name)}
                      className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? 'border-ag-primary bg-ag-primary-light/10 shadow-sm'
                          : 'border-ag-border hover:bg-ag-surface-2/40'
                      }`}
                    >
                      <div>
                        <h4 className="text-sm font-bold text-ag-ink">{asset.name}</h4>
                        <p className="text-xs text-ag-ink-3 mt-0.5">{asset.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by div click
                        className="rounded border-ag-border accent-ag-primary cursor-pointer h-4 w-4"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 6: System Access */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <h3 className="font-display font-bold text-lg text-ag-ink border-b border-ag-border pb-2">Step 6: Account & Security Access</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ag-ink-2 uppercase tracking-wider block">Security Access Role</label>
                  <select
                    value={formData.role}
                    onChange={e => updateField({ role: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-ag-border bg-white text-sm text-ag-ink outline-none focus:border-ag-primary"
                  >
                    <option value="employee">Standard Employee Portal Access</option>
                    <option value="reporting_manager">Supervisor / Manager Portal Access</option>
                    <option value="hr_head">HR / Company Administrator Access</option>
                  </select>
                </div>

                <div className="p-4 border border-ag-border bg-ag-surface-2/40 rounded-xl space-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-ag-ink-2 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={formData.generateAccount}
                      onChange={e => updateField({ generateAccount: e.target.checked })}
                      className="rounded border-ag-border accent-ag-primary h-4 w-4"
                    />
                    Generate Login Credentials Automatically
                  </label>
                  <p className="text-[11px] text-ag-ink-3 pl-6">
                    A secure authentication profile will be generated in the database, allowing immediate sign-in at `/employee/login`.
                  </p>
                </div>

                <div className="p-4 border border-ag-border bg-ag-surface-2/40 rounded-xl space-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-ag-ink-2 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={formData.sendWelcomeEmail}
                      onChange={e => updateField({ sendWelcomeEmail: e.target.checked })}
                      className="rounded border-ag-border accent-ag-primary h-4 w-4"
                    />
                    Send Digital Invitation & Welcoming Email
                  </label>
                  <p className="text-[11px] text-ag-ink-3 pl-6">
                    Dispatches a welcome note containing their workspace URL and temporary login password.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Review Summary */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <h3 className="font-display font-bold text-lg text-ag-ink border-b border-ag-border pb-2">Step 7: Summary Review & Verification</h3>
              <p className="text-xs text-ag-ink-3">Please review the details below. Click edit icons to backtrack changes.</p>

              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                {/* Biographical details Card */}
                <div className="p-5 border border-ag-border rounded-xl space-y-3 bg-white relative">
                  <button type="button" onClick={() => setCurrentStep(1)} className="absolute top-4 right-4 text-xs font-bold text-ag-primary hover:underline">Edit Step 1</button>
                  <h4 className="text-xs font-black uppercase tracking-wider text-ag-ink-3">1. Biographical & Contact info</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <div><span className="text-ag-ink-3">Full Name:</span> <strong className="text-ag-ink">{formData.firstName} {formData.lastName}</strong></div>
                    <div><span className="text-ag-ink-3">Work Email:</span> <strong className="text-ag-ink">{formData.email}</strong></div>
                    <div><span className="text-ag-ink-3">Personal Phone:</span> <strong className="text-ag-ink">{formData.phone}</strong></div>
                    <div><span className="text-ag-ink-3">Date of Birth:</span> <strong className="text-ag-ink">{formData.dateOfBirth || '—'}</strong></div>
                    <div><span className="text-ag-ink-3">Gender:</span> <strong className="text-ag-ink capitalize">{formData.gender}</strong></div>
                    <div><span className="text-ag-ink-3">PAN Number:</span> <strong className="text-ag-ink uppercase">{formData.pan || '—'}</strong></div>
                  </div>
                </div>

                {/* Organization Details Card */}
                <div className="p-5 border border-ag-border rounded-xl space-y-3 bg-white relative">
                  <button type="button" onClick={() => setCurrentStep(2)} className="absolute top-4 right-4 text-xs font-bold text-ag-primary hover:underline">Edit Step 2</button>
                  <h4 className="text-xs font-black uppercase tracking-wider text-ag-ink-3">2. Organization Position</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <div><span className="text-ag-ink-3">Department:</span> <strong className="text-ag-ink">{formData.department}</strong></div>
                    <div><span className="text-ag-ink-3">Designation:</span> <strong className="text-ag-ink">{formData.designation}</strong></div>
                    <div><span className="text-ag-ink-3">Joined Date:</span> <strong className="text-ag-ink">{formData.dateOfJoining}</strong></div>
                    <div><span className="text-ag-ink-3">Reporting Line:</span> <strong className="text-ag-ink">{formData.reportingManager}</strong></div>
                    <div><span className="text-ag-ink-3">Branch Location:</span> <strong className="text-ag-ink">{formData.branch}</strong></div>
                    <div><span className="text-ag-ink-3">Work Mode:</span> <strong className="text-ag-ink capitalize">{formData.employmentType.replace('_', ' ')}</strong></div>
                  </div>
                </div>

                {/* Payroll details Card */}
                <div className="p-5 border border-ag-border rounded-xl space-y-3 bg-white relative">
                  <button type="button" onClick={() => setCurrentStep(4)} className="absolute top-4 right-4 text-xs font-bold text-ag-primary hover:underline">Edit Step 4</button>
                  <h4 className="text-xs font-black uppercase tracking-wider text-ag-ink-3">3. Compensation & Banking</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <div><span className="text-ag-ink-3">CTC (Annual Package):</span> <strong className="text-ag-ink">₹{Number(formData.ctc).toLocaleString('en-IN')}</strong></div>
                    <div><span className="text-ag-ink-3">Bank Name:</span> <strong className="text-ag-ink">{formData.bankName}</strong></div>
                    <div><span className="text-ag-ink-3">Account Number:</span> <strong className="text-ag-ink">{formData.accountNumber}</strong></div>
                    <div><span className="text-ag-ink-3">IFSC Branch Code:</span> <strong className="text-ag-ink">{formData.ifsc}</strong></div>
                    <div><span className="text-ag-ink-3">PF Deduct Status:</span> <strong className="text-ag-ink">{formData.pfEnabled ? 'Enabled' : 'Disabled'}</strong></div>
                  </div>
                </div>

                {/* IT Assets & Documents Card */}
                <div className="p-5 border border-ag-border rounded-xl space-y-3 bg-white text-xs">
                  <h4 className="text-xs font-black uppercase tracking-wider text-ag-ink-3">4. Uploaded KYC & IT Assignments</h4>
                  <div className="space-y-1">
                    <div><span className="text-ag-ink-3">Attached Documents:</span> <strong className="text-ag-ink">{formData.documents.map(d => d.documentType.toUpperCase()).join(', ') || 'No document attachments'}</strong></div>
                    <div><span className="text-ag-ink-3">Assigned Asset Count:</span> <strong className="text-ag-ink">{formData.assets.length} devices</strong></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: Success Onboarding Complete */}
          {currentStep === 8 && successData && (
            <div className="space-y-6 text-center py-6">
              <div className="w-16 h-16 rounded-full bg-ag-mint/10 text-ag-mint flex items-center justify-center mx-auto shadow-md">
                <CheckCircle size={36} />
              </div>
              <div className="space-y-2">
                <h3 className="font-display font-black text-2xl text-ag-ink">Employee Onboarded Successfully!</h3>
                <p className="text-sm text-ag-ink-3 max-w-md mx-auto">
                  A corporate profile for <strong>{successData.fullName}</strong> has been generated and isolated under your tenant organization.
                </p>
              </div>

              <div className="max-w-md mx-auto p-5 border border-ag-border bg-ag-surface-2/40 rounded-xl text-left text-xs space-y-3">
                <h4 className="text-xs uppercase font-bold text-ag-ink-2 tracking-wider">Candidate Portal Credentials</h4>
                <div>
                  <span className="text-ag-ink-3">Employee Login ID:</span>
                  <div className="p-2 bg-white rounded border border-ag-border font-mono text-ag-ink font-bold mt-1 select-all">
                    {successData.email}
                  </div>
                </div>
                <div>
                  <span className="text-ag-ink-3">Temporary Assigned Password:</span>
                  <div className="p-2 bg-white rounded border border-ag-border font-mono text-ag-ink font-bold mt-1 select-all">
                    {successData.tempPassword}
                  </div>
                </div>
                <p className="text-[10px] text-ag-ink-3 italic">
                  Note: The candidate belongs to employee role group. They can sign in immediately at the employee login page.
                </p>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <Link to="/onboarding">
                  <Button variant="primary">Return to Onboarding</Button>
                </Link>
                <Link to="/employees">
                  <Button variant="secondary">View Employee List</Button>
                </Link>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          {currentStep < 8 && (
            <div className="flex justify-between items-center pt-6 mt-8 border-t border-ag-border">
              <Button
                variant="ghost"
                onClick={handlePrev}
                disabled={currentStep === 1}
                icon={<ArrowLeft size={16} />}
              >
                Previous Step
              </Button>

              {currentStep === 7 ? (
                <Button
                  variant="primary"
                  loading={loading}
                  onClick={handleSubmit}
                  icon={<CheckCircle size={16} />}
                  className="bg-ag-mint hover:bg-opacity-95 text-white"
                >
                  Submit & Create
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
    </PageContainer>
  );
}
