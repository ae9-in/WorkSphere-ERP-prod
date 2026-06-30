import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card } from '@/components/ui/Card/Card';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Button } from '@/components/ui/Button/Button';
import { employeeService } from '@/services/api.service';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check } from '@phosphor-icons/react';

export default function EmployeeCreatePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    workEmail: '',
    personalPhone: '',
    dateOfBirth: '',
    gender: 'male',
    departmentName: 'Engineering',
    designationName: 'Software Engineer',
    locationName: 'Bengaluru',
    workMode: 'hybrid',
    ctc: '1200000',
    dateOfJoining: new Date().toISOString().split('T')[0],
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const created = await employeeService.create({
        personal: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth || '1995-01-01',
          gender: formData.gender as any,
          personalPhone: formData.personalPhone,
        },
        official: {
          workEmail: formData.workEmail,
          employeeType: 'full_time',
          dateOfJoining: formData.dateOfJoining,
        },
        job: {
          departmentName: formData.departmentName,
          designationName: formData.designationName,
          locationName: formData.locationName,
          workMode: formData.workMode as any,
        },
      });
      toast.success(`Employee ${created.fullName} created successfully!`);
      navigate(`/employees/${created._id}`);
    } catch {
      toast.error('Failed to create employee.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer
      title="Create New Employee"
      subtitle="Complete the multi-step wizard to onboard corporate staff."
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between p-4 bg-ag-surface rounded-xl border border-ag-border mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                  step === s
                    ? 'bg-ag-primary text-white shadow-sm'
                    : step > s
                    ? 'bg-[#E6FAF4] text-ag-mint'
                    : 'bg-ag-surface-2 text-ag-ink-3'
                }`}
              >
                {step > s ? <Check size={18} weight="bold" /> : s}
              </div>
              <span className={`text-xs font-semibold hidden sm:inline ${step === s ? 'text-ag-ink' : 'text-ag-ink-3'}`}>
                {s === 1 ? 'Personal Info' : s === 2 ? 'Job & Official' : 'Compensation'}
              </span>
            </div>
          ))}
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="font-display font-bold text-lg text-ag-ink border-b border-ag-border pb-3">Step 1: Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="First Name" required value={formData.firstName} onChange={e => handleChange('firstName', e.target.value)} />
                  <Input label="Last Name" required value={formData.lastName} onChange={e => handleChange('lastName', e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Date of Birth" type="date" required value={formData.dateOfBirth} onChange={e => handleChange('dateOfBirth', e.target.value)} />
                  <Select
                    label="Gender"
                    value={formData.gender}
                    onChange={e => handleChange('gender', e.target.value)}
                    options={[
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' },
                      { value: 'non_binary', label: 'Non Binary' },
                    ]}
                  />
                </div>
                <Input label="Personal Phone Number" placeholder="+91 98765 43210" value={formData.personalPhone} onChange={e => handleChange('personalPhone', e.target.value)} />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="font-display font-bold text-lg text-ag-ink border-b border-ag-border pb-3">Step 2: Job & Department Allocation</h3>
                <Input label="Work Email Address" type="email" required value={formData.workEmail} onChange={e => handleChange('workEmail', e.target.value)} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Department"
                    value={formData.departmentName}
                    onChange={e => handleChange('departmentName', e.target.value)}
                    options={[
                      { value: 'Engineering', label: 'Engineering' },
                      { value: 'Product', label: 'Product' },
                      { value: 'Human Resources', label: 'Human Resources' },
                      { value: 'Sales', label: 'Sales' },
                    ]}
                  />
                  <Input label="Designation" required value={formData.designationName} onChange={e => handleChange('designationName', e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Work Mode"
                    value={formData.workMode}
                    onChange={e => handleChange('workMode', e.target.value)}
                    options={[
                      { value: 'onsite', label: 'Onsite' },
                      { value: 'hybrid', label: 'Hybrid' },
                      { value: 'remote', label: 'Remote' },
                    ]}
                  />
                  <Input label="Date of Joining" type="date" required value={formData.dateOfJoining} onChange={e => handleChange('dateOfJoining', e.target.value)} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="font-display font-bold text-lg text-ag-ink border-b border-ag-border pb-3">Step 3: Compensation & Package</h3>
                <Input label="Annual CTC (INR ₹)" type="number" required value={formData.ctc} onChange={e => handleChange('ctc', e.target.value)} helperText="Gross annual cost to company before deductions." />
              </div>
            )}

            {/* Wizard Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-ag-border">
              {step > 1 ? (
                <Button type="button" variant="ghost" onClick={() => setStep(step - 1)} icon={<ArrowLeft size={16} />}>
                  Back
                </Button>
              ) : <div />}

              {step < 3 ? (
                <Button type="button" onClick={() => setStep(step + 1)} iconRight={<ArrowRight size={16} />}>
                  Next Step
                </Button>
              ) : (
                <Button type="submit" loading={loading} icon={<Check size={16} />}>
                  Complete Onboarding
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </PageContainer>
  );
}
