import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal/Modal';
import {
  User, Briefcase, FileText, CurrencyInr, Desktop, ShieldCheck,
  Chats, Warning, MagnifyingGlass, FileArrowDown, Printer, ArrowUpRight
} from '@phosphor-icons/react';

interface ActionItem {
  id: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  isDanger?: boolean;
}

interface ActionGroup {
  category: string;
  actions: ActionItem[];
}

interface EmployeeActionsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (actionId: string, actionLabel: string) => void;
  userRole: string;
}

const ACTION_GROUPS: ActionGroup[] = [
  {
    category: 'Profile & Summaries',
    actions: [
      { id: 'VIEW_PROFILE', label: 'View Full Profile', desc: 'Read candidate files summary.', icon: <User size={16} /> },
      { id: 'PRINT_PROFILE', label: 'Print Profile', desc: 'Print physical format sheet.', icon: <Printer size={16} /> },
      { id: 'DOWNLOAD_PDF', label: 'Download Summary (PDF)', desc: 'Generate system document resume.', icon: <FileArrowDown size={16} /> }
    ]
  },
  {
    category: 'Employment Details',
    actions: [
      { id: 'PROMOTE', label: 'Promote Employee', desc: 'Revise designation and package CTC.', icon: <ArrowUpRight size={16} /> },
      { id: 'TRANSFER', label: 'Transfer Department', desc: 'Move to a separate department team.', icon: <Briefcase size={16} /> },
      { id: 'CHANGE_DESIGNATION', label: 'Change Designation', desc: 'Update official job title.', icon: <Briefcase size={16} /> },
      { id: 'CHANGE_REPORTING_MANAGER', label: 'Change Reporting Manager', desc: 'Assign new team supervisor.', icon: <User size={16} /> },
      { id: 'CONVERT_EMPLOYMENT_TYPE', label: 'Convert Employment Type', desc: 'Convert regular/contract settings.', icon: <Briefcase size={16} /> },
      { id: 'EXTEND_PROBATION', label: 'Extend Probation', desc: 'Prolong probation periods.', icon: <Briefcase size={16} /> },
      { id: 'CONFIRM_EMPLOYMENT', label: 'Confirm Employment', desc: 'Set employee as permanent active.', icon: <CheckCircleWrapper size={16} /> },
      { id: 'MARK_RESIGNED', label: 'Mark Resigned', desc: 'Record voluntary resignation notice.', icon: <Briefcase size={16} /> },
      { id: 'INITIATE_OFFBOARDING', label: 'Initiate Offboarding', desc: 'Setup exit workflows and clearance.', icon: <Briefcase size={16} /> }
    ]
  },
  {
    category: 'Attendance & Leaves',
    actions: [
      { id: 'VIEW_ATTENDANCE', label: 'View Attendance', desc: 'Check biometric timesheet.', icon: <Desktop size={16} /> },
      { id: 'REGULARIZE_ATTENDANCE', label: 'Regularize Attendance', desc: 'Approve logs corrections.', icon: <Desktop size={16} /> },
      { id: 'ASSIGN_SHIFT', label: 'Assign Shift', desc: 'Re-assign work schedule timings.', icon: <Desktop size={16} /> },
      { id: 'VIEW_LEAVE', label: 'View Leave Balance', desc: 'Check leave quota status.', icon: <FileText size={16} /> },
      { id: 'APPROVE_LEAVE', label: 'Approve Leave', desc: 'Validate pending leave forms.', icon: <FileText size={16} /> },
      { id: 'ASSIGN_LEAVE_POLICY', label: 'Assign Leave Policy', desc: 'Assign annual leave structures.', icon: <FileText size={16} /> }
    ]
  },
  {
    category: 'Compensation & Payroll',
    actions: [
      { id: 'VIEW_SALARY', label: 'View Salary Structure', desc: 'Annual payout breakup details.', icon: <CurrencyInr size={16} /> },
      { id: 'REVISE_SALARY', label: 'Revise Salary', desc: 'Make standalone CTC package corrections.', icon: <CurrencyInr size={16} /> },
      { id: 'GENERATE_PAYSLIP', label: 'Generate Payslip', desc: 'Manually compile monthly payslip.', icon: <CurrencyInr size={16} /> },
      { id: 'ASSIGN_PAYROLL_GROUP', label: 'Assign Payroll Group', desc: 'Link to specific payroll cycle groups.', icon: <CurrencyInr size={16} /> }
    ]
  },
  {
    category: 'IT Hardware Assets',
    actions: [
      { id: 'ASSIGN_ASSET', label: 'Assign Assets', desc: 'Log serial assignments.', icon: <Desktop size={16} /> },
      { id: 'RETURN_ASSET', label: 'Return Assets', desc: 'Deallocate and return to IT inventory.', icon: <Desktop size={16} /> }
    ]
  },
  {
    category: 'Verification Documents',
    actions: [
      { id: 'UPLOAD_DOC', label: 'Upload Documents', desc: 'Add new KYC/PAN attachments.', icon: <FileText size={16} /> },
      { id: 'VERIFY_DOC', label: 'Verify Documents', desc: 'Mark document files verified.', icon: <FileText size={16} /> }
    ]
  },
  {
    category: 'Security & Access',
    actions: [
      { id: 'RESET_PASSWORD', label: 'Reset Password', desc: 'Generate temporary passwords.', icon: <ShieldCheck size={16} /> },
      { id: 'DISABLE_LOGIN', label: 'Disable Login', desc: 'Revoke active system account access.', icon: <ShieldCheck size={16} /> },
      { id: 'ACTIVATE_LOGIN', label: 'Activate Login', desc: 'Unblock login credentials access.', icon: <ShieldCheck size={16} /> }
    ]
  },
  {
    category: 'Corporate Communications',
    actions: [
      { id: 'SEND_ANNOUNCEMENT', label: 'Send Announcement', desc: 'Push notification warning notes.', icon: <Chats size={16} /> },
      { id: 'SEND_EMAIL', label: 'Send Email', desc: 'Deliver direct mock email alerts.', icon: <Chats size={16} /> },
      { id: 'SCHEDULE_MEETING', label: 'Schedule Meeting', desc: 'Invite supervisor meeting dates.', icon: <Chats size={16} /> }
    ]
  },
  {
    category: 'Danger Zone',
    actions: [
      { id: 'TERMINATE', label: 'Terminate Employee', desc: 'Revoke login and exit employee.', icon: <Warning size={16} />, isDanger: true },
      { id: 'DELETE', label: 'Delete Employee Profile', desc: 'Permanently purge database records.', icon: <Warning size={16} />, isDanger: true }
    ]
  }
];

function CheckCircleWrapper({ size }: { size: number }) {
  return <ShieldCheck size={size} />;
}

export function EmployeeActionsMenu({
  isOpen,
  onClose,
  onSelectAction,
  userRole
}: EmployeeActionsMenuProps) {
  const [search, setSearch] = useState('');

  // 1. Filter Groups by User Role
  const isSuperAdmin = userRole === 'super_admin';
  const isCompanyHR = userRole === 'company_admin' || userRole === 'hr_head';
  const isManager = userRole === 'reporting_manager' || userRole === 'manager';

  const getFilteredGroups = () => {
    return ACTION_GROUPS.map((group) => {
      const actions = group.actions.filter((act) => {
        // Gating actions
        if (act.id === 'DELETE' && !isSuperAdmin) return false;
        
        if (isManager) {
          const managerAllowed = [
            'VIEW_ATTENDANCE', 'REGULARIZE_ATTENDANCE', 'ASSIGN_SHIFT',
            'VIEW_LEAVE', 'APPROVE_LEAVE', 'ASSIGN_LEAVE_POLICY',
            'SEND_EMAIL', 'SCHEDULE_MEETING'
          ];
          if (!managerAllowed.includes(act.id)) return false;
        }

        // Filter by Search Query
        if (search.trim() !== '') {
          const query = search.toLowerCase();
          return act.label.toLowerCase().includes(query) || act.desc.toLowerCase().includes(query);
        }

        return true;
      });

      return { ...group, actions };
    }).filter((group) => group.actions.length > 0);
  };

  const filteredGroups = getFilteredGroups();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Employee Action Console"
      description="Search and trigger contextual profile updates, payroll, hardware assets, or security controls."
      maxWidth="2xl"
    >
      <div className="space-y-4 mt-2">
        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlass size={18} className="absolute left-3 top-3.5 text-ag-ink-3" />
          <input
            type="text"
            placeholder="Type to search employee workflows (e.g. Promote, Transfer, Terminate)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-ag-border bg-ag-surface text-sm text-ag-ink outline-none focus:border-ag-primary focus:ring-1 focus:ring-ag-primary"
            autoFocus
          />
        </div>

        {/* Groups Grid */}
        <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-5 scrollbar-thin">
          {filteredGroups.length === 0 ? (
            <div className="py-12 text-center text-xs text-ag-ink-3">
              No matching actions found for "{search}".
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.category} className="space-y-2">
                <h4 className="text-[10px] uppercase font-bold text-ag-ink-3 tracking-wider px-2">
                  {group.category}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {group.actions.map((act) => (
                    <button
                      key={act.id}
                      onClick={() => {
                        onSelectAction(act.id, act.label);
                        onClose();
                      }}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                        act.isDanger
                          ? 'border-ag-coral/20 bg-ag-coral/5 hover:bg-ag-coral/10 hover:border-ag-coral/45'
                          : 'border-ag-border bg-white hover:bg-ag-surface-2 hover:border-ag-border-strong'
                      }`}
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${
                        act.isDanger ? 'bg-ag-coral/15 text-ag-coral' : 'bg-ag-surface-2 text-ag-ink-2'
                      }`}>
                        {act.icon}
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${act.isDanger ? 'text-ag-coral' : 'text-ag-ink'}`}>
                          {act.label}
                        </p>
                        <p className="text-[10px] text-ag-ink-3 mt-0.5">
                          {act.desc}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
