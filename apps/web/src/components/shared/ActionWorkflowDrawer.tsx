import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { employeeService } from '@/services/api.service';
import { toast } from 'sonner';
import { Warning, Info } from '@phosphor-icons/react';

interface ActionWorkflowDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  actionId: string;
  actionLabel: string;
  employeeId: string;
  onSuccess: (updatedEmployee: any) => void;
}

export function ActionWorkflowDrawer({
  isOpen,
  onClose,
  actionId,
  actionLabel,
  employeeId,
  onSuccess
}: ActionWorkflowDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [confirmDanger, setConfirmDanger] = useState(false);

  // Form Fields State
  const [designationName, setDesignationName] = useState('');
  const [ctc, setCtc] = useState('');
  const [departmentName, setDepartmentName] = useState('Engineering');
  const [reportingManagerName, setReportingManagerName] = useState('');
  const [employeeType, setEmployeeType] = useState('full_time');
  const [probationEndDate, setProbationEndDate] = useState('');
  const [lastWorkingDay, setLastWorkingDay] = useState('');
  const [assetType, setAssetType] = useState('laptop');
  const [assetName, setAssetName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [details, setDetails] = useState('');
  const [dateRange, setDateRange] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check Danger Zone confirmations
    if ((actionId === 'DELETE' || actionId === 'TERMINATE') && !confirmDanger) {
      toast.error('Please confirm the action checkbox to proceed.');
      return;
    }

    setLoading(true);
    try {
      let data: any = {};

      switch (actionId) {
        case 'PROMOTE':
          data = { designationName, ctc: Number(ctc) };
          break;
        case 'TRANSFER':
          data = { departmentName };
          break;
        case 'CHANGE_DESIGNATION':
          data = { designationName };
          break;
        case 'CHANGE_REPORTING_MANAGER':
          data = { reportingManagerName };
          break;
        case 'CONVERT_EMPLOYMENT_TYPE':
          data = { employeeType };
          break;
        case 'EXTEND_PROBATION':
          data = { probationEndDate };
          break;
        case 'MARK_RESIGNED':
        case 'INITIATE_OFFBOARDING':
          data = { lastWorkingDay };
          break;
        case 'ASSIGN_ASSET':
          data = { assetType, assetName, serialNumber };
          break;
        case 'RETURN_ASSET':
          data = { assetName };
          break;
        case 'REVISE_SALARY':
          data = { ctc: Number(ctc) };
          break;
        case 'REGULARIZE_ATTENDANCE':
          data = { details };
          break;
        case 'APPROVE_LEAVE':
          data = { dateRange, details };
          break;
        default:
          data = { details: `Triggered ${actionLabel}` };
      }

      const updated = await employeeService.dispatchAction(employeeId, actionId, data);
      
      if (actionId === 'DELETE') {
        toast.success('Employee profile deleted successfully.');
        onSuccess(null);
      } else {
        toast.success(`Action "${actionLabel}" completed successfully!`);
        onSuccess(updated);
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || `Failed to execute action "${actionLabel}"`;
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const renderFormFields = () => {
    switch (actionId) {
      case 'PROMOTE':
        return (
          <div className="space-y-4">
            <Input
              label="New Designation Title"
              value={designationName}
              onChange={e => setDesignationName(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              required
            />
            <Input
              label="Revised CTC (Annual INR Package)"
              type="number"
              value={ctc}
              onChange={e => setCtc(e.target.value)}
              placeholder="e.g. 1800000"
              required
            />
          </div>
        );

      case 'TRANSFER':
        return (
          <div className="space-y-1">
            <label className="text-xs font-bold text-ag-ink-2 uppercase tracking-wider block">Target Department</label>
            <select
              value={departmentName}
              onChange={e => setDepartmentName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-ag-border bg-white text-sm text-ag-ink outline-none focus:border-ag-primary"
            >
              <option value="Engineering">Engineering</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Product">Product</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
              <option value="Finance">Finance</option>
            </select>
          </div>
        );

      case 'CHANGE_DESIGNATION':
        return (
          <Input
            label="Job Designation Title"
            value={designationName}
            onChange={e => setDesignationName(e.target.value)}
            placeholder="e.g. Tech Lead"
            required
          />
        );

      case 'CHANGE_REPORTING_MANAGER':
        return (
          <Input
            label="Supervisor Name"
            value={reportingManagerName}
            onChange={e => setReportingManagerName(e.target.value)}
            placeholder="e.g. Rajan Kumar"
            required
          />
        );

      case 'CONVERT_EMPLOYMENT_TYPE':
        return (
          <div className="space-y-1">
            <label className="text-xs font-bold text-ag-ink-2 uppercase tracking-wider block">Employment Classification</label>
            <select
              value={employeeType}
              onChange={e => setEmployeeType(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-ag-border bg-white text-sm text-ag-ink outline-none focus:border-ag-primary"
            >
              <option value="full_time">Full-time Regular</option>
              <option value="part_time">Part-time Regular</option>
              <option value="contract">Contractor</option>
              <option value="intern">Internship</option>
            </select>
          </div>
        );

      case 'EXTEND_PROBATION':
        return (
          <Input
            label="Extended Date Limit"
            type="date"
            value={probationEndDate}
            onChange={e => setProbationEndDate(e.target.value)}
            required
          />
        );

      case 'MARK_RESIGNED':
      case 'INITIATE_OFFBOARDING':
        return (
          <Input
            label="Last Working Day"
            type="date"
            value={lastWorkingDay}
            onChange={e => setLastWorkingDay(e.target.value)}
            required
          />
        );

      case 'ASSIGN_ASSET':
        return (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-ag-ink-2 uppercase tracking-wider block">Hardware Asset Type</label>
              <select
                value={assetType}
                onChange={e => setAssetType(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-ag-border bg-white text-sm text-ag-ink outline-none focus:border-ag-primary"
              >
                <option value="laptop">Laptop PC</option>
                <option value="desktop">Desktop Monitor</option>
                <option value="sim">Mobile SIM Card</option>
                <option value="license">Software License</option>
              </select>
            </div>
            <Input
              label="Hardware Model / Asset Name"
              value={assetName}
              onChange={e => setAssetName(e.target.value)}
              placeholder="e.g. MacBook Pro M3"
              required
            />
            <Input
              label="Serial Number (Optional)"
              value={serialNumber}
              onChange={e => setSerialNumber(e.target.value)}
              placeholder="e.g. SN-987654"
            />
          </div>
        );

      case 'RETURN_ASSET':
        return (
          <Input
            label="Deallocated Asset Name"
            value={assetName}
            onChange={e => setAssetName(e.target.value)}
            placeholder="e.g. MacBook Pro M3"
            required
          />
        );

      case 'REVISE_SALARY':
        return (
          <Input
            label="Standalone CTC revised amount"
            type="number"
            value={ctc}
            onChange={e => setCtc(e.target.value)}
            placeholder="e.g. 1500000"
            required
          />
        );

      case 'REGULARIZE_ATTENDANCE':
        return (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ag-ink-2">Adjustment Comments & Reason</label>
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Provide a reason for correcting biometric logs..."
              className="w-full min-h-[80px] p-3 rounded-lg border border-ag-border bg-white text-sm text-ag-ink focus:border-ag-primary focus:ring-1 focus:ring-ag-primary outline-none"
              required
            />
          </div>
        );

      case 'APPROVE_LEAVE':
        return (
          <div className="space-y-4">
            <Input
              label="Days Date Range"
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              placeholder="e.g. 12 July - 15 July"
              required
            />
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ag-ink-2">Manager Approval Remarks</label>
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Remarks..."
                className="w-full min-h-[80px] p-3 rounded-lg border border-ag-border bg-white text-sm text-ag-ink focus:border-ag-primary focus:ring-1 focus:ring-ag-primary outline-none"
                required
              />
            </div>
          </div>
        );

      case 'DELETE':
      case 'TERMINATE':
        const isDelete = actionId === 'DELETE';
        return (
          <div className="space-y-4">
            <div className="p-4 border border-ag-coral/30 bg-ag-coral/5 text-ag-coral rounded-xl flex items-start gap-3">
              <Warning size={20} className="shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold uppercase tracking-wider">Critical Warning Node</p>
                <p className="mt-1 font-medium leading-relaxed">
                  {isDelete
                    ? 'This action will permanently purge this employee from all multi-tenant payroll profiles, document logs, and attendance tables. This cannot be undone.'
                    : 'This will instantly revoke corporate sign-in access. Security keys and dashboard logs will be disabled for this employee.'}
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-ag-ink-2 uppercase tracking-wider">
              <input
                type="checkbox"
                checked={confirmDanger}
                onChange={e => setConfirmDanger(e.target.checked)}
                className="rounded border-ag-border accent-ag-coral h-4 w-4"
              />
              Confirm and proceed anyway
            </label>
          </div>
        );

      default:
        // Standalone actions (Print, View PDF, Reset MFA)
        return (
          <div className="p-4 border border-ag-primary/20 bg-ag-primary-light/10 text-ag-primary rounded-xl flex items-start gap-3 text-xs font-medium">
            <Info size={18} className="shrink-0 mt-0.5" />
            <p>Triggering the corporate workflow: <strong>{actionLabel}</strong>. Click submit to execute and log actions.</p>
          </div>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={actionLabel}
      description={`Enter workflow information for ${actionLabel.toLowerCase()}.`}
      maxWidth={actionId === 'DELETE' || actionId === 'TERMINATE' ? 'md' : 'lg'}
    >
      <form onSubmit={handleSubmit} className="space-y-6 mt-4">
        {renderFormFields()}

        <div className="flex justify-end gap-3 pt-4 border-t border-ag-border">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            loading={loading}
            className={actionId === 'DELETE' || actionId === 'TERMINATE' ? 'bg-ag-coral hover:bg-opacity-95 text-white' : ''}
          >
            Confirm Action
          </Button>
        </div>
      </form>
    </Modal>
  );
}
