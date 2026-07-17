import React, { useEffect, useState, useCallback, useRef } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Badge } from '@/components/ui/Badge/Badge';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { KPICard } from '@/components/ui/KPICard/KPICard';
import { documentService, employeeService } from '@/services/api.service';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatFileSize, formatRelative } from '@/lib/formatters';
import type { EmployeeListItem } from '@/types/employee.types';
import {
  MagnifyingGlass, Upload, Download, Trash, ShieldCheck, ArrowsClockwise,
  FileText, FilePdf, FileXls, FileDoc, FileImage, Warning, CheckCircle,
  XCircle, Clock, ArrowRight, CloudArrowUp, Lock, Sparkle, Database,
  Buildings, GridFour, ListBullets, Eye, Tag, FileArrowDown,
  CaretRight, Info, ArrowCounterClockwise, User, Bell,
  FolderOpen, ChartBar, ClockCounterClockwise, Archive, Funnel,
  DotsThreeVertical, X, Check, Shield
} from '@phosphor-icons/react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Doc = {
  _id: string;
  name: string;
  category: string;
  employeeId?: string;
  size: number;
  mimeType: string;
  expiryDate?: string;
  url: string;
  uploadedAt: string;
  verifiedAt?: string;
  isExpired?: boolean;
};

type ActiveTab =
  | 'dashboard'
  | 'employee_docs'
  | 'company_docs'
  | 'library'
  | 'compliance'
  | 'approvals'
  | 'audit'
  | 'analytics';

// ─────────────────────────────────────────────────────────────────────────────
// Document Category Config
// ─────────────────────────────────────────────────────────────────────────────

type DocCategoryItem = { key: string; label: string; required: boolean };
type DocCategory = { id: string; label: string; icon: React.ReactNode; color: string; docs: DocCategoryItem[] };

const EMPLOYEE_CATEGORIES: DocCategory[] = [
  {
    id: 'identity', label: 'Identity Documents', color: 'text-ag-primary', icon: <User size={16} />,
    docs: [
      { key: 'pan',     label: 'PAN Card',        required: true },
      { key: 'aadhaar', label: 'Aadhaar Card',     required: true },
      { key: 'passport',label: 'Passport',         required: false },
      { key: 'dl',      label: 'Driving License',  required: false },
      { key: 'voter',   label: 'Voter ID',         required: false },
    ],
  },
  {
    id: 'employment', label: 'Employment Documents', color: 'text-ag-sky', icon: <Buildings size={16} />,
    docs: [
      { key: 'offer',       label: 'Offer Letter',       required: true },
      { key: 'appointment', label: 'Appointment Letter',  required: true },
      { key: 'joining',     label: 'Joining Forms',       required: true },
      { key: 'experience',  label: 'Experience Letter',   required: false },
      { key: 'promotion',   label: 'Promotion Letter',    required: false },
      { key: 'increment',   label: 'Increment Letter',    required: false },
    ],
  },
  {
    id: 'payroll', label: 'Payroll Documents', color: 'text-ag-mint', icon: <FileXls size={16} />,
    docs: [
      { key: 'salary_slip',   label: 'Salary Slips',       required: true },
      { key: 'bank_passbook', label: 'Bank Passbook',       required: true },
      { key: 'cheque',        label: 'Cancelled Cheque',    required: true },
      { key: 'pf_decl',      label: 'PF Declaration',      required: true },
      { key: 'esi',          label: 'ESI Document',        required: false },
      { key: 'form16',       label: 'Form 16',             required: false },
    ],
  },
  {
    id: 'education', label: 'Education', color: 'text-ag-amber', icon: <FileText size={16} />,
    docs: [
      { key: 'degree',   label: 'Degree Certificate', required: true },
      { key: 'diploma',  label: 'Diploma',            required: false },
      { key: 'markcard', label: 'Mark Cards',         required: false },
      { key: 'cert',     label: 'Other Certificates', required: false },
    ],
  },
  {
    id: 'compliance', label: 'Compliance', color: 'text-ag-coral', icon: <Shield size={16} />,
    docs: [
      { key: 'nda',        label: 'NDA',                   required: true },
      { key: 'contract',   label: 'Employment Contract',    required: true },
      { key: 'bgv',        label: 'Background Verification',required: false },
      { key: 'police',     label: 'Police Verification',    required: false },
      { key: 'medical',    label: 'Medical Certificate',    required: false },
    ],
  },
];

const COMPANY_DOC_TYPES = [
  { label: 'Employee Handbook',     category: 'policy',     required: true },
  { label: 'HR Policy Manual',      category: 'policy',     required: true },
  { label: 'IT Security Policy',    category: 'policy',     required: true },
  { label: 'Finance SOP',           category: 'policy',     required: false },
  { label: 'Code of Conduct',       category: 'policy',     required: true },
  { label: 'POSH Policy',           category: 'compliance', required: true },
  { label: 'GST Registration',      category: 'company',    required: true },
  { label: 'MCA Incorporation',     category: 'company',    required: true },
  { label: 'Startup India Cert.',   category: 'company',    required: false },
  { label: 'ISO Certification',     category: 'compliance', required: false },
  { label: 'PF Establishment',      category: 'compliance', required: true },
  { label: 'Shop & Est. License',   category: 'legal',      required: true },
];

const AUDIT_LOG = [
  { action: 'Uploaded',   doc: 'Offer Letter', emp: 'Rahul Mehta',  user: 'HR Admin', time: '10 min ago', icon: <CloudArrowUp size={13} />,   color: 'text-ag-primary bg-ag-primary-light' },
  { action: 'Verified',   doc: 'PAN Card',     emp: 'Priya Singh',  user: 'HR Head',  time: '1 hr ago',   icon: <CheckCircle size={13} />,     color: 'text-ag-mint bg-[#E6FAF4]' },
  { action: 'Downloaded', doc: 'Form 16',      emp: 'Raj Kumar',    user: 'Finance',  time: '2 hrs ago',  icon: <FileArrowDown size={13} />,   color: 'text-ag-sky bg-[#E8F6FF]' },
  { action: 'Rejected',   doc: 'Passport',     emp: 'Aisha Bose',   user: 'HR Head',  time: '3 hrs ago',  icon: <XCircle size={13} />,         color: 'text-ag-coral bg-[#FFF0EF]' },
  { action: 'Uploaded',   doc: 'Joining Kit',  emp: 'New Batch',    user: 'HR Admin', time: '5 hrs ago',  icon: <CloudArrowUp size={13} />,    color: 'text-ag-primary bg-ag-primary-light' },
  { action: 'Approved',   doc: 'NDA',          emp: 'John D.',      user: 'Manager',  time: 'Yesterday',  icon: <ShieldCheck size={13} />,     color: 'text-ag-mint bg-[#E6FAF4]' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getMimeIcon(mime: string = '') {
  if (mime.includes('pdf'))   return <FilePdf size={18} className="text-ag-coral" />;
  if (mime.includes('sheet') || mime.includes('excel')) return <FileXls size={18} className="text-ag-mint" />;
  if (mime.includes('word') || mime.includes('document')) return <FileDoc size={18} className="text-ag-primary" />;
  if (mime.includes('image')) return <FileImage size={18} className="text-ag-sky" />;
  return <FileText size={18} className="text-ag-ink-3" />;
}

function getCategoryBadge(cat: string) {
  const map: Record<string, string> = {
    policy: 'bg-ag-primary-light text-ag-primary',
    employee: 'bg-[#E6FAF4] text-ag-mint',
    company: 'bg-[#E8F6FF] text-ag-sky',
    payslip: 'bg-[#FFF8E6] text-ag-amber',
    compliance: 'bg-[#FFF0EF] text-ag-coral',
    legal: 'bg-ag-surface-2 text-ag-ink-2',
    other: 'bg-ag-surface-2 text-ag-ink-3',
  };
  return map[cat] ?? 'bg-ag-surface-2 text-ag-ink-3';
}

function CompletionRing({ pct, size = 48, stroke = 5 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 90 ? '#00C48C' : pct >= 60 ? '#FFB020' : '#FF5F57';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E4DFFF" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <span className="absolute text-[10px] font-black" style={{ color }}>{pct}%</span>
    </div>
  );
}

function DocStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    verified:   { label: 'Verified',           cls: 'bg-[#E6FAF4] text-ag-mint' },
    pending:    { label: 'Pending Verification',cls: 'bg-[#FFF8E6] text-ag-amber' },
    rejected:   { label: 'Rejected',           cls: 'bg-[#FFF0EF] text-ag-coral' },
    expired:    { label: 'Expired',            cls: 'bg-[#FFF0EF] text-ag-coral animate-pulse' },
    expiring:   { label: 'Expiring Soon',      cls: 'bg-[#FFF8E6] text-ag-amber' },
    missing:    { label: 'Not Uploaded',       cls: 'bg-ag-surface-2 text-ag-ink-3' },
    uploaded:   { label: 'Uploaded',           cls: 'bg-ag-primary-light text-ag-primary' },
  };
  const cfg = map[status] ?? map.missing;
  return <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Employee Document Card
// ─────────────────────────────────────────────────────────────────────────────

function DocItemCard({ docType, matchedDoc, onUpload, onDownload, onVerify, onDelete, isHr }: {
  docType: DocCategoryItem;
  matchedDoc?: Doc;
  onUpload: () => void;
  onDownload: () => void;
  onVerify: () => void;
  onDelete: () => void;
  isHr: boolean;
}) {
  const status = !matchedDoc
    ? 'missing'
    : matchedDoc.isExpired
    ? 'expired'
    : matchedDoc.verifiedAt
    ? 'verified'
    : 'pending';

  return (
    <div className={`group relative p-4 border rounded-xl bg-white transition-all hover:shadow-sm ${
      status === 'missing' ? 'border-dashed border-ag-border' :
      status === 'verified' ? 'border-ag-mint/30' :
      status === 'expired' ? 'border-ag-coral/40' :
      'border-ag-border hover:border-ag-border-strong'
    }`}>
      {/* Required badge */}
      {docType.required && (
        <span className="absolute top-2 right-2 text-[8px] font-black text-ag-coral bg-[#FFF0EF] px-1.5 py-0.5 rounded-full">
          Required
        </span>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`p-2 rounded-lg shrink-0 ${
          status === 'verified' ? 'bg-[#E6FAF4]' :
          status === 'missing'  ? 'bg-ag-surface-2' :
          status === 'expired'  ? 'bg-[#FFF0EF]' :
          'bg-ag-primary-light'
        }`}>
          {getMimeIcon(matchedDoc?.mimeType ?? 'application/pdf')}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-black text-xs text-ag-ink">{docType.label}</p>
          {matchedDoc ? (
            <div className="mt-1 space-y-0.5 text-[10px] text-ag-ink-3">
              <p className="truncate font-medium">{matchedDoc.name}</p>
              <p>{formatDate(matchedDoc.uploadedAt)} · {formatFileSize(matchedDoc.size)}</p>
              {matchedDoc.expiryDate && (
                <p className={matchedDoc.isExpired ? 'text-ag-coral font-bold' : ''}>
                  Expires: {formatDate(matchedDoc.expiryDate)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-ag-ink-3 mt-1">Not uploaded yet</p>
          )}
          <div className="mt-2"><DocStatusBadge status={status} /></div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 mt-3 pt-2.5 border-t border-ag-border/40">
        {matchedDoc ? (
          <>
            <Button size="sm" variant="secondary" className="flex-1 text-[10px] h-7" icon={<Eye size={10} />} onClick={onDownload}>Preview</Button>
            <Button size="sm" variant="secondary" className="px-2 h-7" icon={<Download size={10} />} onClick={onDownload} />
            {isHr && !matchedDoc.verifiedAt && (
              <Button size="sm" className="px-2 h-7" icon={<ShieldCheck size={10} />} onClick={onVerify} />
            )}
            {isHr && (
              <Button size="sm" variant="secondary" className="px-2 h-7 hover:text-ag-coral hover:border-ag-coral/30" icon={<Trash size={10} />} onClick={onDelete} />
            )}
          </>
        ) : (
          <Button size="sm" variant="secondary" className="flex-1 text-[10px] h-7" icon={<CloudArrowUp size={10} />} onClick={onUpload}>Upload</Button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Employee Row Component
// ─────────────────────────────────────────────────────────────────────────────

function EmployeeRow({ emp, docs, onSelect, isSelected }: {
  emp: EmployeeListItem;
  docs: Doc[];
  onSelect: () => void;
  isSelected: boolean;
}) {
  const empDocs = docs.filter(d => d.employeeId === emp.employeeId || d.employeeId === emp._id);
  const verified = empDocs.filter(d => d.verifiedAt).length;
  const pending = empDocs.filter(d => !d.verifiedAt).length;
  const expired = empDocs.filter(d => d.isExpired).length;
  const totalRequired = EMPLOYEE_CATEGORIES.reduce((s, c) => s + c.docs.filter(d => d.required).length, 0);
  const compliance = totalRequired > 0 ? Math.round((verified / totalRequired) * 100) : 0;

  return (
    <tr
      onClick={onSelect}
      className={`border-b border-ag-border/40 cursor-pointer transition-colors ${
        isSelected ? 'bg-ag-primary-light' : 'hover:bg-ag-surface-2/30'
      }`}
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <Avatar name={emp.fullName} src={emp.personal?.photo} size="sm" />
          <div>
            <p className="font-bold text-xs text-ag-ink">{emp.fullName}</p>
            <p className="text-[10px] font-mono text-ag-ink-3">{emp.employeeId}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-xs text-ag-ink-2">{emp.job?.departmentName ?? '—'}</td>
      <td className="py-3 px-4 text-xs text-ag-ink-2">{emp.job?.designationName ?? '—'}</td>
      <td className="py-3 px-4 text-xs text-ag-ink-3 font-mono">{formatDate(emp.official?.dateOfJoining)}</td>
      <td className="py-3 px-4 text-center text-xs font-bold text-ag-ink">{empDocs.length}</td>
      <td className="py-3 px-4 text-center">
        <span className="text-[10px] font-bold text-ag-mint">{verified}</span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="text-[10px] font-bold text-ag-amber">{pending}</span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="text-[10px] font-bold text-ag-coral">{expired}</span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 bg-ag-border rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${compliance >= 90 ? 'bg-ag-mint' : compliance >= 60 ? 'bg-ag-amber' : 'bg-ag-coral'}`}
              style={{ width: `${compliance}%` }}
            />
          </div>
          <span className={`text-[10px] font-black ${compliance >= 90 ? 'text-ag-mint' : compliance >= 60 ? 'text-ag-amber' : 'text-ag-coral'}`}>
            {compliance}%
          </span>
        </div>
      </td>
      <td className="py-3 px-4 text-[10px] text-ag-ink-3">{formatRelative(emp.official?.dateOfJoining)}</td>
      <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
        <div className="flex gap-1.5">
          <Button size="sm" variant="secondary" className="text-[10px] h-7 px-2" icon={<FolderOpen size={11} />} onClick={onSelect}>View</Button>
          <Button size="sm" variant="secondary" className="text-[10px] h-7 px-2" icon={<CloudArrowUp size={11} />}>Upload</Button>
          <Button size="sm" variant="secondary" className="text-[10px] h-7 px-2" icon={<Download size={11} />}>ZIP</Button>
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Employee Document Profile Panel
// ─────────────────────────────────────────────────────────────────────────────

function EmployeeDocProfile({ emp, docs, onVerify, onDownload, onDelete, onUpload, isHr, onClose }: {
  emp: EmployeeListItem;
  docs: Doc[];
  onVerify: (id: string) => void;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
  onUpload: () => void;
  isHr: boolean;
  onClose: () => void;
}) {
  const empDocs = docs.filter(d => d.employeeId === emp.employeeId || d.employeeId === emp._id);
  const verified = empDocs.filter(d => d.verifiedAt).length;
  const pending  = empDocs.filter(d => !d.verifiedAt).length;
  const expired  = empDocs.filter(d => d.isExpired).length;
  const totalReq = EMPLOYEE_CATEGORIES.reduce((s, c) => s + c.docs.filter(d => d.required).length, 0);
  const completion = totalReq > 0 ? Math.round((empDocs.length / totalReq) * 100) : 0;
  const compliance = totalReq > 0 ? Math.round((verified / totalReq) * 100) : 0;

  const getDocForType = (key: string) =>
    empDocs.find(d => d.name.toLowerCase().includes(key.replace('_', ' ')) || d.category.includes(key));

  return (
    <div className="flex flex-col h-full">
      {/* Profile Header */}
      <div className="p-5 border-b border-ag-border bg-gradient-to-r from-ag-primary-light/60 to-transparent">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar name={emp.fullName} src={emp.personal?.photo} size="lg" />
            <div>
              <h3 className="font-display font-black text-base text-ag-ink">{emp.fullName}</h3>
              <p className="text-xs text-ag-ink-3">{emp.employeeId} · {emp.job?.designationName ?? 'Employee'}</p>
              <p className="text-xs text-ag-ink-3">{emp.job?.departmentName ?? '—'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-ag-surface-2 transition-colors">
            <X size={16} className="text-ag-ink-3" />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Completion', value: `${completion}%`, sub: `${empDocs.length}/${totalReq} docs`, color: completion >= 90 ? 'text-ag-mint' : 'text-ag-amber' },
            { label: 'Verified',   value: verified,          sub: 'documents',    color: 'text-ag-mint' },
            { label: 'Pending',    value: pending,           sub: 'to review',    color: 'text-ag-amber' },
            { label: 'Expired',    value: expired,           sub: 'need renewal', color: 'text-ag-coral' },
          ].map(s => (
            <div key={s.label} className="bg-white/70 rounded-xl p-2.5 text-center">
              <div className={`font-black text-base font-display ${s.color}`}>{s.value}</div>
              <div className="text-[9px] text-ag-ink-3 font-semibold uppercase tracking-wider">{s.label}</div>
              <div className="text-[9px] text-ag-ink-3">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Progress bars */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-ag-ink-3 w-20 shrink-0">Completion</span>
            <div className="flex-1 h-1.5 bg-ag-border rounded-full overflow-hidden">
              <div className="h-full bg-ag-primary rounded-full" style={{ width: `${completion}%` }} />
            </div>
            <span className="font-bold text-ag-primary">{completion}%</span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-ag-ink-3 w-20 shrink-0">Compliance</span>
            <div className="flex-1 h-1.5 bg-ag-border rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${compliance >= 90 ? 'bg-ag-mint' : compliance >= 60 ? 'bg-ag-amber' : 'bg-ag-coral'}`}
                style={{ width: `${compliance}%` }} />
            </div>
            <span className={`font-bold ${compliance >= 90 ? 'text-ag-mint' : 'text-ag-amber'}`}>{compliance}%</span>
          </div>
        </div>
      </div>

      {/* Document Categories */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {EMPLOYEE_CATEGORIES.map(cat => (
          <div key={cat.id}>
            <h4 className={`font-display font-black text-xs flex items-center gap-1.5 mb-3 ${cat.color}`}>
              {cat.icon} {cat.label}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {cat.docs.map(dt => {
                const matched = getDocForType(dt.key);
                return (
                  <DocItemCard
                    key={dt.key}
                    docType={dt}
                    matchedDoc={matched}
                    isHr={isHr}
                    onUpload={onUpload}
                    onDownload={() => matched && onDownload(matched._id)}
                    onVerify={() => matched && onVerify(matched._id)}
                    onDelete={() => matched && onDelete(matched._id)}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {/* Other uploaded docs not categorized */}
        {empDocs.filter(d => !EMPLOYEE_CATEGORIES.some(c => c.docs.some(dt => d.name.toLowerCase().includes(dt.key.replace('_', ' '))))).length > 0 && (
          <div>
            <h4 className="font-display font-black text-xs text-ag-ink-2 flex items-center gap-1.5 mb-3"><FileText size={14} />Other Documents</h4>
            <div className="space-y-2">
              {empDocs.filter(d => !EMPLOYEE_CATEGORIES.some(c => c.docs.some(dt => d.name.toLowerCase().includes(dt.key.replace('_', ' '))))).map(d => (
                <div key={d._id} className="flex items-center justify-between p-3 border border-ag-border rounded-xl bg-white hover:border-ag-border-strong transition-all">
                  <div className="flex items-center gap-2">
                    {getMimeIcon(d.mimeType)}
                    <div>
                      <p className="font-semibold text-xs text-ag-ink">{d.name}</p>
                      <p className="text-[10px] text-ag-ink-3">{formatDate(d.uploadedAt)} · {formatFileSize(d.size)}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <DocStatusBadge status={d.verifiedAt ? 'verified' : d.isExpired ? 'expired' : 'pending'} />
                    <Button size="sm" variant="secondary" className="h-7 px-2" icon={<Download size={10} />} onClick={() => onDownload(d._id)} />
                    {isHr && <Button size="sm" variant="secondary" className="h-7 px-2 hover:text-ag-coral" icon={<Trash size={10} />} onClick={() => onDelete(d._id)} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-ag-border flex gap-2">
        <Button className="flex-1" icon={<CloudArrowUp size={14} />} onClick={onUpload}>Upload Document</Button>
        <Button variant="secondary" icon={<Download size={14} />}>Download ZIP</Button>
        {isHr && <Button variant="secondary" icon={<Bell size={14} />}>Send Reminder</Button>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Upload Drawer
// ─────────────────────────────────────────────────────────────────────────────

function UploadDrawer({ onClose, onSuccess, employees }: {
  onClose: () => void;
  onSuccess: () => void;
  employees: EmployeeListItem[];
}) {
  const [form, setForm] = useState({
    name: '', category: 'employee', employeeId: '',
    size: 204800, mimeType: 'application/pdf', expiryDate: '', url: ''
  });
  const [isDragging, setIsDragging] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.url) { toast.error('Document name and URL are required.'); return; }
    try {
      await documentService.upload(form);
      toast.success('Document uploaded successfully!');
      onSuccess();
      onClose();
    } catch { toast.error('Upload failed.'); }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-[480px] bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-ag-border flex items-center justify-between">
          <div>
            <h3 className="font-display font-black text-base text-ag-ink">Upload Document</h3>
            <p className="text-xs text-ag-ink-3 mt-0.5">Register a new document in the system</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-ag-surface-2 transition-colors">
            <X size={18} className="text-ag-ink-3" />
          </button>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => { e.preventDefault(); setIsDragging(false); toast.info('Please fill the form below and click Upload.'); }}
          className={`mx-5 mt-5 border-2 border-dashed rounded-xl p-6 text-center transition-all ${
            isDragging ? 'border-ag-primary bg-ag-primary-light/20' : 'border-ag-border hover:border-ag-primary/50'
          }`}
        >
          <CloudArrowUp size={28} className={`mx-auto mb-2 ${isDragging ? 'text-ag-primary' : 'text-ag-ink-3'}`} />
          <p className="text-xs font-bold text-ag-ink">{isDragging ? 'Drop here' : 'Drag & drop or browse files'}</p>
          <p className="text-[10px] text-ag-ink-3 mt-0.5">PDF, Word, Excel, Images · max 50MB</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <Input label="Document Name *" placeholder="e.g. Aadhaar Card - Rahul Mehta" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Category *"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              options={[
                { value: 'employee',   label: 'Employee Document' },
                { value: 'identity',   label: 'Identity Document' },
                { value: 'employment', label: 'Employment Document' },
                { value: 'payslip',    label: 'Payroll Document' },
                { value: 'education',  label: 'Education Certificate' },
                { value: 'compliance', label: 'Compliance Document' },
                { value: 'policy',     label: 'Company Policy' },
                { value: 'legal',      label: 'Legal Document' },
                { value: 'other',      label: 'Other' },
              ]}
            />
            <Select
              label="File Type"
              value={form.mimeType}
              onChange={e => setForm({ ...form, mimeType: e.target.value })}
              options={[
                { value: 'application/pdf',  label: 'PDF' },
                { value: 'application/msword', label: 'Word' },
                { value: 'application/vnd.ms-excel', label: 'Excel' },
                { value: 'image/jpeg', label: 'JPEG Image' },
                { value: 'image/png',  label: 'PNG Image' },
              ]}
            />
          </div>

          <Select
            label="Associated Employee (Optional)"
            value={form.employeeId}
            onChange={e => setForm({ ...form, employeeId: e.target.value })}
            options={[
              { value: '', label: 'Company Document (No Employee)' },
              ...employees.map(e => ({ value: e.employeeId, label: `${e.fullName} (${e.employeeId})` }))
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="File Size (bytes)" type="number" value={form.size} onChange={e => setForm({ ...form, size: Number(e.target.value) })} />
            <Input label="Expiry Date" type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
          </div>

          <Input label="Document URL *" placeholder="https://storage.example.com/file.pdf" required value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />

          <div className="p-3 bg-ag-primary-light/60 border border-ag-primary/20 rounded-xl text-[10px] text-ag-ink-3">
            <p className="font-bold text-ag-primary mb-1 flex items-center gap-1"><Info size={11} />Upload Guidelines</p>
            <ul className="space-y-0.5">
              <li>• Employee documents must have an employee ID linked</li>
              <li>• Set expiry dates for ID cards, certifications, and contracts</li>
              <li>• All uploads are logged in the audit trail</li>
            </ul>
          </div>
        </form>

        {/* Footer */}
        <div className="p-5 border-t border-ag-border flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" icon={<CloudArrowUp size={14} />} onClick={handleSubmit as any}>Upload Document</Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('employee_docs');
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [expiring, setExpiring] = useState<Doc[]>([]);
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Employee docs state
  const [selectedEmp, setSelectedEmp] = useState<EmployeeListItem | null>(null);
  const [empSearch, setEmpSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [showUpload, setShowUpload] = useState(false);

  // Library state
  const [libSearch, setLibSearch] = useState('');
  const [libCatFilter, setLibCatFilter] = useState('all');
  const [libViewMode, setLibViewMode] = useState<'grid' | 'list'>('grid');

  const isHr = !!(user && ['hr_head', 'company_admin', 'super_admin'].includes(user.role));

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allDocs, expDocs, empList] = await Promise.all([
        documentService.getAll(),
        documentService.getExpiring(30),
        employeeService.list({ limit: 100 }),
      ]);
      setDocuments(allDocs);
      setExpiring(expDocs);
      setEmployees(empList.employees);
    } catch {
      toast.error('Failed to load document data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleDownload = async (id: string) => {
    try {
      const url = await documentService.download(id);
      window.open(url, '_blank');
    } catch { toast.error('Download failed.'); }
  };

  const handleVerify = async (id: string) => {
    try {
      await documentService.verify(id);
      toast.success('Document verified.');
      fetchData();
    } catch { toast.error('Verification failed.'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    try {
      await documentService.delete(id);
      toast.success('Document deleted.');
      fetchData();
    } catch { toast.error('Delete failed.'); }
  };

  // ── Derived Data ───────────────────────────────────────────────────────────

  const verifiedCount = documents.filter(d => d.verifiedAt).length;
  const pendingCount  = documents.filter(d => !d.verifiedAt).length;
  const expiredCount  = documents.filter(d => d.isExpired).length;
  const totalSize     = documents.reduce((s, d) => s + (d.size || 0), 0);

  const companyDocs = documents.filter(d => !d.employeeId);
  const employeeDocs = documents.filter(d => !!d.employeeId);

  const filteredEmps = employees.filter(e => {
    const matchSearch = !empSearch || e.fullName.toLowerCase().includes(empSearch.toLowerCase()) || e.employeeId.toLowerCase().includes(empSearch.toLowerCase());
    const matchDept = deptFilter === 'all' || (e.job?.departmentName ?? '') === deptFilter;
    return matchSearch && matchDept;
  });

  const libFilteredDocs = documents.filter(d => {
    const matchSearch = !libSearch || d.name.toLowerCase().includes(libSearch.toLowerCase());
    const matchCat = libCatFilter === 'all' || d.category === libCatFilter;
    return matchSearch && matchCat;
  });

  const depts = Array.from(new Set(employees.map(e => e.job?.departmentName).filter(Boolean))) as string[];

  const pieData = [
    { name: 'Verified', value: verifiedCount, color: '#00C48C' },
    { name: 'Pending',  value: pendingCount,  color: '#FFB020' },
    { name: 'Expired',  value: expiredCount,  color: '#FF5F57' },
  ].filter(d => d.value > 0);

  const deptDistData = depts.slice(0, 6).map(dept => ({
    name: dept.split(' ')[0],
    docs: documents.filter(d => {
      const emp = employees.find(e => e.employeeId === d.employeeId || e._id === d.employeeId);
      return emp?.job?.departmentName === dept;
    }).length,
  }));

  // ── Tabs ────────────────────────────────────────────────────────────────────

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard',     label: 'Dashboard',         icon: <GridFour size={14} /> },
    { id: 'employee_docs', label: 'Employee Documents', icon: <User size={14} /> },
    { id: 'company_docs',  label: 'Company Documents',  icon: <Buildings size={14} /> },
    { id: 'library',       label: 'Document Library',   icon: <FolderOpen size={14} /> },
    { id: 'compliance',    label: 'Compliance',         icon: <Shield size={14} />, badge: expiredCount + expiring.length },
    { id: 'approvals',     label: 'Approvals',          icon: <CheckCircle size={14} />, badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'audit',         label: 'Audit Trail',        icon: <ClockCounterClockwise size={14} /> },
    { id: 'analytics',     label: 'Analytics',          icon: <ChartBar size={14} /> },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <PageContainer
      title="Employee Document Management"
      subtitle="Employee-centric document lifecycle management — identity, employment, payroll, compliance, and company records."
      actions={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={fetchData} icon={<ArrowsClockwise size={16} />}>Refresh</Button>
          <Button icon={<CloudArrowUp size={16} />} onClick={() => setShowUpload(true)}>Upload Document</Button>
        </div>
      }
    >
      {/* Upload Drawer */}
      {showUpload && (
        <UploadDrawer employees={employees} onClose={() => setShowUpload(false)} onSuccess={fetchData} />
      )}

      {/* ── Tab Nav ── */}
      <div className="flex gap-1 p-1 bg-ag-surface-2 border border-ag-border rounded-xl w-fit mb-8 overflow-x-auto max-w-full shrink-0 scrollbar-none">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black transition-all shrink-0 ${
              activeTab === tab.id ? 'bg-ag-primary text-white shadow-sm' : 'text-ag-ink-3 hover:text-ag-ink hover:bg-ag-surface'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge && tab.badge > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-ag-coral text-white text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════
          DASHBOARD
          ═══════════════════════════════════════════════════════ */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
            {[
              { title: 'Total Documents',    value: documents.length,        icon: <img src="/logo/logo_main.png" alt="Logo" className="w-5 h-5 object-contain" />, bg: 'bg-ag-primary-light text-ag-primary' },
              { title: 'Employee Docs',      value: employeeDocs.length,     icon: <User size={20} />,        bg: 'bg-[#E8F6FF] text-ag-sky' },
              { title: 'Company Docs',       value: companyDocs.length,      icon: <Buildings size={20} />,   bg: 'bg-ag-surface-2 text-ag-ink-2' },
              { title: 'Verified',           value: verifiedCount,           icon: <CheckCircle size={20} />, bg: 'bg-[#E6FAF4] text-ag-mint' },
              { title: 'Pending Review',     value: pendingCount,            icon: <Clock size={20} />,       bg: 'bg-[#FFF8E6] text-ag-amber' },
              { title: 'Expiring (30 days)', value: expiring.length,         icon: <Warning size={20} />,     bg: 'bg-[#FFF8E6] text-ag-amber' },
              { title: 'Expired',            value: expiredCount,            icon: <XCircle size={20} />,     bg: 'bg-[#FFF0EF] text-ag-coral' },
              { title: 'Storage Used',       value: formatFileSize(totalSize),icon: <Database size={20} />,   bg: 'bg-[#E8F6FF] text-ag-sky' },
            ].map(k => (
              <Card key={k.title} className="p-4 flex items-center gap-3 border border-ag-border/60 hover:border-ag-border-strong transition-all">
                <div className={`p-2.5 rounded-xl shrink-0 ${k.bg}`}>{k.icon}</div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-ag-ink-3 block">{k.title}</span>
                  {isLoading
                    ? <div className="h-5 w-10 bg-ag-border rounded animate-pulse mt-1" />
                    : <span className="font-display font-black text-lg text-ag-ink">{k.value}</span>
                  }
                </div>
              </Card>
            ))}
          </div>

          {/* Three-Panel Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left — Folder / Quick Summary */}
            <div className="lg:col-span-3 space-y-5">
              <Card className="p-4">
                <h4 className="font-bold text-[10px] uppercase text-ag-ink-3 tracking-wider border-b border-ag-border pb-2 mb-3">Quick Navigation</h4>
                <div className="space-y-1">
                  {[
                    { label: 'Employee Documents',  tab: 'employee_docs' as ActiveTab, icon: <User size={14} />,       count: employeeDocs.length },
                    { label: 'Company Documents',   tab: 'company_docs' as ActiveTab,  icon: <Buildings size={14} />,  count: companyDocs.length },
                    { label: 'Pending Verification',tab: 'approvals' as ActiveTab,     icon: <Clock size={14} />,      count: pendingCount },
                    { label: 'Compliance Alerts',   tab: 'compliance' as ActiveTab,    icon: <Warning size={14} />,    count: expiredCount + expiring.length },
                    { label: 'Document Library',    tab: 'library' as ActiveTab,       icon: <FolderOpen size={14} />, count: documents.length },
                  ].map(item => (
                    <button
                      key={item.label}
                      onClick={() => setActiveTab(item.tab)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-ag-primary-light hover:text-ag-primary transition-all text-xs text-ag-ink-2 group"
                    >
                      <span className="flex items-center gap-2 font-semibold">{item.icon}{item.label}</span>
                      <span className="font-mono text-[10px] font-bold">{item.count}</span>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Employee Compliance Snapshot */}
              <Card className="p-4">
                <h4 className="font-bold text-[10px] uppercase text-ag-ink-3 tracking-wider border-b border-ag-border pb-2 mb-3">Employee Compliance Snapshot</h4>
                <div className="space-y-2.5">
                  {employees.slice(0, 5).map(emp => {
                    const empDocsN = documents.filter(d => d.employeeId === emp.employeeId || d.employeeId === emp._id);
                    const vf = empDocsN.filter(d => d.verifiedAt).length;
                    const totalReq = EMPLOYEE_CATEGORIES.reduce((s, c) => s + c.docs.filter(d => d.required).length, 0);
                    const pct = totalReq > 0 ? Math.round((vf / totalReq) * 100) : 0;
                    return (
                      <div key={emp._id} className="flex items-center gap-2 cursor-pointer hover:bg-ag-surface-2/50 px-1 py-1 rounded-lg" onClick={() => { setSelectedEmp(emp); setActiveTab('employee_docs'); }}>
                        <Avatar name={emp.fullName} size="xs" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[10px] text-ag-ink truncate">{emp.fullName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="h-1 flex-1 bg-ag-border rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${pct >= 90 ? 'bg-ag-mint' : pct >= 60 ? 'bg-ag-amber' : 'bg-ag-coral'}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className={`text-[9px] font-black ${pct >= 90 ? 'text-ag-mint' : pct >= 60 ? 'text-ag-amber' : 'text-ag-coral'}`}>{pct}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {employees.length === 0 && <p className="text-[10px] text-ag-ink-3 text-center py-2">No employees found.</p>}
                </div>
              </Card>
            </div>

            {/* Center — Recent Documents */}
            <div className="lg:col-span-5 space-y-5">
              <Card>
                <div className="p-4 border-b border-ag-border flex items-center justify-between">
                  <h4 className="font-display font-black text-sm text-ag-ink">Recent Documents</h4>
                  <Button size="sm" variant="secondary" onClick={() => setActiveTab('library')} icon={<ArrowRight size={12} />}>View Library</Button>
                </div>
                <div className="divide-y divide-ag-border/40">
                  {isLoading ? (
                    <div className="p-6 text-center text-xs text-ag-ink-3">Loading…</div>
                  ) : documents.slice(0, 8).length === 0 ? (
                    <div className="p-8 text-center text-xs text-ag-ink-3">
                      <FileText size={32} className="mx-auto mb-2 text-ag-border-strong" />
                      No documents yet.
                    </div>
                  ) : documents.slice(0, 8).map(d => {
                    const emp = employees.find(e => e.employeeId === d.employeeId || e._id === d.employeeId);
                    return (
                      <div key={d._id} className="flex items-center justify-between px-4 py-3 hover:bg-ag-surface-2/30 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          {getMimeIcon(d.mimeType)}
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-ag-ink truncate">{d.name}</p>
                            <p className="text-[10px] text-ag-ink-3">
                              {emp ? <><span className="font-semibold text-ag-ink-2">{emp.fullName}</span> · </> : ''}
                              {formatDate(d.uploadedAt)} · {formatFileSize(d.size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <DocStatusBadge status={d.verifiedAt ? 'verified' : d.isExpired ? 'expired' : 'pending'} />
                          <Button size="sm" variant="ghost" icon={<Download size={11} />} onClick={() => handleDownload(d._id)} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Right — Stats & Activity */}
            <div className="lg:col-span-4 space-y-5">
              {/* Verification donut */}
              <Card className="p-4">
                <h4 className="font-bold text-[10px] uppercase text-ag-ink-3 tracking-wider mb-3">Verification Status</h4>
                {pieData.length > 0 ? (
                  <>
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={3} dataKey="value">
                            {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                          <Tooltip formatter={(v, n) => [`${v} docs`, n]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-center text-[10px]">
                      {pieData.map(d => (
                        <div key={d.name}>
                          <span className="w-2 h-2 rounded-full inline-block mr-1" style={{ background: d.color }} />
                          <div className="font-black text-ag-ink">{d.value}</div>
                          <div className="text-ag-ink-3">{d.name}</div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : <div className="h-24 flex items-center justify-center text-xs text-ag-ink-3">No documents yet.</div>}
              </Card>

              {/* Compliance alerts */}
              {expiring.length > 0 && (
                <Card className="p-4 bg-[#FFF8E6] border-ag-amber/30">
                  <h4 className="font-bold text-xs text-ag-amber flex items-center gap-1.5 mb-2"><Warning size={13} />Expiry Alerts</h4>
                  <div className="space-y-1.5">
                    {expiring.slice(0, 4).map(d => (
                      <div key={d._id} className="flex justify-between text-[10px]">
                        <span className="font-semibold text-ag-ink-2 truncate pr-2">{d.name}</span>
                        <span className="text-ag-coral font-bold shrink-0">{formatDate(d.expiryDate)}</span>
                      </div>
                    ))}
                    {expiring.length > 4 && (
                      <button onClick={() => setActiveTab('compliance')} className="text-[10px] text-ag-amber font-bold">
                        +{expiring.length - 4} more →
                      </button>
                    )}
                  </div>
                </Card>
              )}

              {/* Recent Activity */}
              <Card className="p-4">
                <h4 className="font-bold text-[10px] uppercase text-ag-ink-3 tracking-wider mb-3">Recent Activity</h4>
                <div className="space-y-2.5">
                  {AUDIT_LOG.slice(0, 5).map((a, i) => (
                    <div key={i} className="flex items-start gap-2 text-[10px]">
                      <span className={`p-1 rounded-md shrink-0 ${a.color}`}>{a.icon}</span>
                      <div className="min-w-0">
                        <p className="font-bold text-ag-ink">{a.action}: <span className="font-normal">{a.doc}</span></p>
                        <p className="text-ag-ink-3">{a.emp} · by {a.user} · {a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          EMPLOYEE DOCUMENTS — MAIN WORKSPACE
          ═══════════════════════════════════════════════════════ */}
      {activeTab === 'employee_docs' && (
        <div className="space-y-5">
          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-56">
              <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ag-ink-3" />
              <input
                type="text"
                value={empSearch}
                onChange={e => setEmpSearch(e.target.value)}
                placeholder="Search employee by name or ID…"
                className="w-full h-9 pl-9 pr-3 bg-white border border-ag-border rounded-lg text-xs focus:outline-none focus:border-ag-primary"
              />
            </div>
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="h-9 px-3 bg-white border border-ag-border rounded-lg text-xs focus:outline-none"
            >
              <option value="all">All Departments</option>
              {depts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <Button size="sm" variant="secondary" icon={<Funnel size={14} />}>More Filters</Button>
            <Button size="sm" icon={<CloudArrowUp size={14} />} onClick={() => setShowUpload(true)}>Quick Upload</Button>
          </div>

          {/* Main Split View */}
          <div className={`grid gap-6 ${selectedEmp ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>

            {/* Employee Directory Table */}
            <div className={selectedEmp ? 'lg:col-span-5' : 'col-span-1'}>
              <Card>
                <div className="p-4 border-b border-ag-border flex items-center justify-between">
                  <h4 className="font-display font-black text-sm text-ag-ink">Employee Directory</h4>
                  <span className="text-[10px] text-ag-ink-3 font-semibold">{filteredEmps.length} employees</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-ag-border bg-ag-surface-2/40">
                        {['Employee', 'Department', 'Designation', 'Joined', 'Docs', '✓', '⏳', '⚠', 'Compliance', 'Updated', 'Actions'].map(h => (
                          <th key={h} className="py-2.5 px-3 text-left text-[9px] font-black uppercase tracking-wider text-ag-ink-3 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr><td colSpan={11} className="p-8 text-center text-xs text-ag-ink-3">Loading employees…</td></tr>
                      ) : filteredEmps.length === 0 ? (
                        <tr><td colSpan={11} className="p-8 text-center text-xs text-ag-ink-3">No employees found.</td></tr>
                      ) : filteredEmps.map(emp => (
                        <EmployeeRow
                          key={emp._id}
                          emp={emp}
                          docs={documents}
                          onSelect={() => setSelectedEmp(prev => prev?._id === emp._id ? null : emp)}
                          isSelected={selectedEmp?._id === emp._id}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Employee Document Profile */}
            {selectedEmp && (
              <div className="lg:col-span-7">
                <Card className="flex flex-col min-h-[70vh]">
                  <EmployeeDocProfile
                    emp={selectedEmp}
                    docs={documents}
                    isHr={isHr}
                    onVerify={handleVerify}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                    onUpload={() => setShowUpload(true)}
                    onClose={() => setSelectedEmp(null)}
                  />
                </Card>
              </div>
            )}

            {/* Empty state when no employee selected */}
            {!selectedEmp && employees.length > 0 && (
              <div className="col-span-1 border-2 border-dashed border-ag-border rounded-xl p-12 text-center">
                <User size={40} className="mx-auto mb-3 text-ag-border-strong" />
                <p className="font-bold text-ag-ink text-sm">Select an employee to view their documents</p>
                <p className="text-xs text-ag-ink-3 mt-1">Click any row in the directory above to open their complete document profile.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          COMPANY DOCUMENTS
          ═══════════════════════════════════════════════════════ */}
      {activeTab === 'company_docs' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-black text-base text-ag-ink">Company Documents</h3>
              <p className="text-xs text-ag-ink-3 mt-0.5">Policies, legal documents, and corporate records — not linked to any employee</p>
            </div>
            <Button icon={<CloudArrowUp size={14} />} onClick={() => setShowUpload(true)}>Upload Company Document</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {COMPANY_DOC_TYPES.map((docType, i) => {
              const matched = companyDocs.find(d => d.name.toLowerCase().includes(docType.label.toLowerCase().split(' ')[0].toLowerCase()));
              return (
                <div key={i} className={`p-4 border rounded-xl bg-white hover:shadow-sm transition-all ${
                  matched ? (matched.verifiedAt ? 'border-ag-mint/30' : 'border-ag-border') : 'border-dashed border-ag-border'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${getCategoryBadge(docType.category)}`}>
                        <FileText size={14} />
                      </div>
                      <div>
                        <h4 className="font-black text-xs text-ag-ink">{docType.label}</h4>
                        <span className={`text-[9px] font-bold capitalize px-1.5 rounded ${getCategoryBadge(docType.category)}`}>{docType.category}</span>
                      </div>
                    </div>
                    {matched
                      ? <CheckCircle size={16} className="text-ag-mint" weight="fill" />
                      : docType.required
                      ? <Warning size={16} className="text-ag-coral" />
                      : <XCircle size={16} className="text-ag-border-strong" />
                    }
                  </div>

                  {matched ? (
                    <div className="space-y-1 text-[10px] text-ag-ink-3">
                      <p className="font-semibold text-ag-ink truncate">{matched.name}</p>
                      <p>{formatDate(matched.uploadedAt)} · {formatFileSize(matched.size)}</p>
                      <DocStatusBadge status={matched.verifiedAt ? 'verified' : 'pending'} />
                      <div className="flex gap-1.5 mt-2">
                        <Button size="sm" variant="secondary" className="flex-1 h-7 text-[10px]" icon={<Download size={10} />} onClick={() => handleDownload(matched._id)}>Download</Button>
                        {isHr && !matched.verifiedAt && <Button size="sm" className="h-7 px-2" icon={<ShieldCheck size={10} />} onClick={() => handleVerify(matched._id)} />}
                      </div>
                    </div>
                  ) : (
                    <div>
                      {docType.required && <p className="text-[9px] text-ag-coral font-bold mb-2">Required document missing</p>}
                      <Button size="sm" variant="secondary" className="w-full h-7 text-[10px]" icon={<CloudArrowUp size={10} />} onClick={() => setShowUpload(true)}>Upload</Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Other company docs */}
          {companyDocs.filter(d => !COMPANY_DOC_TYPES.some(t => d.name.toLowerCase().includes(t.label.toLowerCase().split(' ')[0].toLowerCase()))).length > 0 && (
            <Card>
              <CardHeader title="Other Company Documents" subtitle="Documents uploaded outside the standard templates." />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2/40">
                      {['Document', 'Category', 'Uploaded', 'Size', 'Status', 'Actions'].map(h => (
                        <th key={h} className="py-2.5 px-4 text-left text-[10px] font-black uppercase tracking-wider text-ag-ink-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {companyDocs.filter(d => !COMPANY_DOC_TYPES.some(t => d.name.toLowerCase().includes(t.label.toLowerCase().split(' ')[0].toLowerCase()))).map(d => (
                      <tr key={d._id} className="border-b border-ag-border/40 hover:bg-ag-surface-2/30">
                        <td className="py-3 px-4 flex items-center gap-2">
                          {getMimeIcon(d.mimeType)}
                          <span className="font-semibold text-xs text-ag-ink">{d.name}</span>
                        </td>
                        <td className="py-3 px-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${getCategoryBadge(d.category)}`}>{d.category}</span></td>
                        <td className="py-3 px-4 text-xs text-ag-ink-3">{formatDate(d.uploadedAt)}</td>
                        <td className="py-3 px-4 text-xs font-mono text-ag-ink-3">{formatFileSize(d.size)}</td>
                        <td className="py-3 px-4"><DocStatusBadge status={d.verifiedAt ? 'verified' : d.isExpired ? 'expired' : 'pending'} /></td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1.5">
                            <Button size="sm" variant="secondary" icon={<Download size={11} />} onClick={() => handleDownload(d._id)} />
                            {isHr && !d.verifiedAt && <Button size="sm" variant="secondary" icon={<ShieldCheck size={11} />} onClick={() => handleVerify(d._id)} />}
                            {isHr && <Button size="sm" variant="secondary" className="hover:text-ag-coral" icon={<Trash size={11} />} onClick={() => handleDelete(d._id)} />}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          DOCUMENT LIBRARY
          ═══════════════════════════════════════════════════════ */}
      {activeTab === 'library' && (
        <div className="space-y-5">
          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ag-ink-3" />
              <input
                type="text"
                value={libSearch}
                onChange={e => setLibSearch(e.target.value)}
                placeholder="Search all documents…"
                className="w-full h-9 pl-9 pr-3 bg-white border border-ag-border rounded-lg text-xs focus:outline-none focus:border-ag-primary"
              />
            </div>
            <select
              value={libCatFilter}
              onChange={e => setLibCatFilter(e.target.value)}
              className="h-9 px-3 bg-white border border-ag-border rounded-lg text-xs focus:outline-none"
            >
              <option value="all">All Categories</option>
              {['employee', 'identity', 'employment', 'payslip', 'education', 'compliance', 'policy', 'legal', 'other'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="flex gap-1 p-0.5 bg-ag-surface-2 rounded-lg border border-ag-border">
              <button onClick={() => setLibViewMode('grid')} className={`p-1.5 rounded-md ${libViewMode === 'grid' ? 'bg-white shadow text-ag-primary' : 'text-ag-ink-3'}`}><GridFour size={15} /></button>
              <button onClick={() => setLibViewMode('list')} className={`p-1.5 rounded-md ${libViewMode === 'list' ? 'bg-white shadow text-ag-primary' : 'text-ag-ink-3'}`}><ListBullets size={15} /></button>
            </div>
            <span className="text-xs text-ag-ink-3 font-semibold">{libFilteredDocs.length} documents</span>
          </div>

          {libViewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-44 rounded-xl bg-ag-surface-2 animate-pulse" />)
              ) : libFilteredDocs.length === 0 ? (
                <div className="col-span-full text-center py-16 text-xs text-ag-ink-3">
                  <FolderOpen size={40} className="mx-auto mb-3 text-ag-border-strong" />
                  <p className="font-bold text-ag-ink text-sm">No documents found</p>
                </div>
              ) : libFilteredDocs.map(d => {
                const emp = employees.find(e => e.employeeId === d.employeeId || e._id === d.employeeId);
                return (
                  <div key={d._id} className="group bg-white border border-ag-border rounded-xl p-4 hover:border-ag-border-strong hover:shadow-sm transition-all space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="p-2 bg-ag-surface-2 rounded-lg">{getMimeIcon(d.mimeType)}</div>
                      <DocStatusBadge status={d.verifiedAt ? 'verified' : d.isExpired ? 'expired' : 'pending'} />
                    </div>
                    <div>
                      <p className="font-black text-xs text-ag-ink line-clamp-2">{d.name}</p>
                      {emp && <p className="text-[10px] text-ag-primary mt-0.5 font-semibold">{emp.fullName}</p>}
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize mt-1 inline-block ${getCategoryBadge(d.category)}`}>{d.category}</span>
                    </div>
                    <div className="text-[10px] text-ag-ink-3">
                      <p>{formatDate(d.uploadedAt)} · {formatFileSize(d.size)}</p>
                    </div>
                    <div className="flex gap-1 pt-1.5 border-t border-ag-border/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="secondary" className="flex-1 h-7 text-[10px]" icon={<Eye size={10} />} onClick={() => handleDownload(d._id)}>Preview</Button>
                      <Button size="sm" variant="secondary" className="px-2 h-7" icon={<Download size={10} />} onClick={() => handleDownload(d._id)} />
                      {isHr && !d.verifiedAt && <Button size="sm" className="px-2 h-7" icon={<ShieldCheck size={10} />} onClick={() => handleVerify(d._id)} />}
                      {isHr && <Button size="sm" variant="secondary" className="px-2 h-7 hover:text-ag-coral" icon={<Trash size={10} />} onClick={() => handleDelete(d._id)} />}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2/40">
                      {['Document', 'Owner', 'Category', 'Size', 'Uploaded', 'Expiry', 'Status', 'Actions'].map(h => (
                        <th key={h} className="py-2.5 px-4 text-left text-[10px] font-black uppercase tracking-wider text-ag-ink-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {libFilteredDocs.map(d => {
                      const emp = employees.find(e => e.employeeId === d.employeeId || e._id === d.employeeId);
                      return (
                        <tr key={d._id} className="border-b border-ag-border/40 hover:bg-ag-surface-2/30">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {getMimeIcon(d.mimeType)}
                              <div>
                                <p className="font-semibold text-xs text-ag-ink">{d.name}</p>
                                <p className="text-[10px] font-mono text-ag-ink-3">{d.mimeType}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {emp ? (
                              <div className="flex items-center gap-1.5">
                                <Avatar name={emp.fullName} size="xs" />
                                <span className="text-xs font-semibold text-ag-ink">{emp.fullName}</span>
                              </div>
                            ) : <span className="text-xs text-ag-ink-3">Company</span>}
                          </td>
                          <td className="py-3 px-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${getCategoryBadge(d.category)}`}>{d.category}</span></td>
                          <td className="py-3 px-4 font-mono text-xs text-ag-ink-3">{formatFileSize(d.size)}</td>
                          <td className="py-3 px-4 text-xs text-ag-ink-3">{formatDate(d.uploadedAt)}</td>
                          <td className="py-3 px-4 text-xs">{d.expiryDate ? <span className={d.isExpired ? 'text-ag-coral font-bold' : 'text-ag-ink-3'}>{formatDate(d.expiryDate)}</span> : '—'}</td>
                          <td className="py-3 px-4"><DocStatusBadge status={d.verifiedAt ? 'verified' : d.isExpired ? 'expired' : 'pending'} /></td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1.5">
                              <Button size="sm" variant="secondary" icon={<Download size={11} />} onClick={() => handleDownload(d._id)} />
                              {isHr && !d.verifiedAt && <Button size="sm" variant="secondary" icon={<ShieldCheck size={11} />} onClick={() => handleVerify(d._id)} />}
                              {isHr && <Button size="sm" variant="secondary" className="hover:text-ag-coral" icon={<Trash size={11} />} onClick={() => handleDelete(d._id)} />}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          COMPLIANCE CENTER
          ═══════════════════════════════════════════════════════ */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Expiring in 30 Days', value: expiring.length,  color: 'bg-[#FFF8E6] text-ag-amber',  icon: <Warning size={20} /> },
              { label: 'Expired Documents',   value: expiredCount,      color: 'bg-[#FFF0EF] text-ag-coral',  icon: <XCircle size={20} /> },
              { label: 'Pending Verification',value: pendingCount,      color: 'bg-[#FFF8E6] text-ag-amber',  icon: <Clock size={20} /> },
              { label: 'Fully Verified',      value: verifiedCount,     color: 'bg-[#E6FAF4] text-ag-mint',   icon: <CheckCircle size={20} /> },
            ].map(k => (
              <Card key={k.label} className="p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-xl shrink-0 ${k.color}`}>{k.icon}</div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-ag-ink-3 block">{k.label}</span>
                  <span className="font-display font-black text-xl text-ag-ink">{isLoading ? '—' : k.value}</span>
                </div>
              </Card>
            ))}
          </div>

          {/* Employee Compliance Table */}
          <Card>
            <CardHeader title="Employee Compliance Status" subtitle="Compliance overview across all employees with document gaps and expiry alerts." />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ag-border bg-ag-surface-2/40">
                    {['Employee', 'Department', 'Docs Uploaded', 'Verified', 'Missing Required', 'Expired', 'Compliance Score', 'Status', 'Actions'].map(h => (
                      <th key={h} className="py-2.5 px-4 text-left text-[10px] font-black uppercase tracking-wider text-ag-ink-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => {
                    const empDocs = documents.filter(d => d.employeeId === emp.employeeId || d.employeeId === emp._id);
                    const vf = empDocs.filter(d => d.verifiedAt).length;
                    const ex = empDocs.filter(d => d.isExpired).length;
                    const totalReq = EMPLOYEE_CATEGORIES.reduce((s, c) => s + c.docs.filter(d => d.required).length, 0);
                    const uploaded = empDocs.length;
                    const missing = Math.max(0, totalReq - uploaded);
                    const compliance = totalReq > 0 ? Math.round((vf / totalReq) * 100) : 0;
                    return (
                      <tr key={emp._id} className="border-b border-ag-border/40 hover:bg-ag-surface-2/30">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Avatar name={emp.fullName} size="xs" />
                            <div>
                              <p className="font-bold text-xs text-ag-ink">{emp.fullName}</p>
                              <p className="text-[10px] font-mono text-ag-ink-3">{emp.employeeId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-ag-ink-2">{emp.job?.departmentName ?? '—'}</td>
                        <td className="py-3 px-4 text-xs font-bold text-ag-ink">{uploaded}</td>
                        <td className="py-3 px-4 text-xs font-bold text-ag-mint">{vf}</td>
                        <td className="py-3 px-4">
                          {missing > 0
                            ? <span className="text-[10px] font-bold text-ag-coral">{missing} missing</span>
                            : <span className="text-[10px] font-bold text-ag-mint">All submitted</span>
                          }
                        </td>
                        <td className="py-3 px-4">
                          {ex > 0 ? <span className="text-[10px] font-bold text-ag-coral">{ex} expired</span> : <span className="text-[10px] text-ag-ink-3">—</span>}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 bg-ag-border rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${compliance >= 90 ? 'bg-ag-mint' : compliance >= 60 ? 'bg-ag-amber' : 'bg-ag-coral'}`} style={{ width: `${compliance}%` }} />
                            </div>
                            <span className={`text-[10px] font-black ${compliance >= 90 ? 'text-ag-mint' : compliance >= 60 ? 'text-ag-amber' : 'text-ag-coral'}`}>{compliance}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <DocStatusBadge status={compliance >= 90 ? 'verified' : missing > 0 ? 'missing' : 'pending'} />
                        </td>
                        <td className="py-3 px-4">
                          <Button size="sm" variant="secondary" className="text-[10px] h-7 px-2" onClick={() => { setSelectedEmp(emp); setActiveTab('employee_docs'); }}>
                            View Docs
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Expiring Docs Table */}
          {[...expiring, ...documents.filter(d => d.isExpired)].length > 0 && (
            <Card>
              <CardHeader title="Documents Requiring Attention" subtitle="Expiring and expired document alerts." />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ag-border bg-ag-surface-2/40">
                      {['Document', 'Employee', 'Category', 'Expiry Date', 'Days Left', 'Verification', 'Action'].map(h => (
                        <th key={h} className="py-2.5 px-4 text-left text-[10px] font-black uppercase tracking-wider text-ag-ink-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...expiring, ...documents.filter(d => d.isExpired && !expiring.find(e => e._id === d._id))].map(d => {
                      const emp = employees.find(e => e.employeeId === d.employeeId || e._id === d.employeeId);
                      const exp = d.expiryDate ? new Date(d.expiryDate) : null;
                      const daysLeft = exp ? Math.ceil((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                      return (
                        <tr key={d._id} className="border-b border-ag-border/40 hover:bg-ag-surface-2/30">
                          <td className="py-3 px-4 flex items-center gap-2">{getMimeIcon(d.mimeType)}<span className="font-semibold text-xs text-ag-ink">{d.name}</span></td>
                          <td className="py-3 px-4">
                            {emp ? <div className="flex items-center gap-1.5"><Avatar name={emp.fullName} size="xs" /><span className="text-xs">{emp.fullName}</span></div> : <span className="text-xs text-ag-ink-3">Company</span>}
                          </td>
                          <td className="py-3 px-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${getCategoryBadge(d.category)}`}>{d.category}</span></td>
                          <td className="py-3 px-4 text-xs font-mono">{formatDate(d.expiryDate)}</td>
                          <td className="py-3 px-4">
                            {daysLeft !== null && <span className={`text-xs font-black ${daysLeft <= 0 ? 'text-ag-coral' : daysLeft <= 15 ? 'text-ag-coral' : 'text-ag-amber'}`}>{daysLeft <= 0 ? 'EXPIRED' : `${daysLeft} days`}</span>}
                          </td>
                          <td className="py-3 px-4"><DocStatusBadge status={d.verifiedAt ? 'verified' : 'pending'} /></td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1.5">
                              <Button size="sm" variant="secondary" icon={<ArrowCounterClockwise size={11} />}>Renew</Button>
                              {isHr && !d.verifiedAt && <Button size="sm" icon={<ShieldCheck size={11} />} onClick={() => handleVerify(d._id)}>Verify</Button>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          APPROVALS
          ═══════════════════════════════════════════════════════ */}
      {activeTab === 'approvals' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <CardHeader title="Pending Document Verifications" subtitle="Documents submitted by employees awaiting HR review." />
              <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                {documents.filter(d => !d.verifiedAt).length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle size={36} className="mx-auto mb-2 text-ag-mint" weight="fill" />
                    <p className="font-bold text-sm text-ag-ink">All caught up!</p>
                    <p className="text-xs text-ag-ink-3 mt-1">No pending verification requests.</p>
                  </div>
                ) : documents.filter(d => !d.verifiedAt).map(d => {
                  const emp = employees.find(e => e.employeeId === d.employeeId || e._id === d.employeeId);
                  return (
                    <div key={d._id} className="p-4 border border-ag-border rounded-xl flex items-center justify-between hover:border-ag-border-strong transition-all bg-white">
                      <div className="flex items-center gap-3">
                        {emp && <Avatar name={emp.fullName} size="sm" />}
                        <div className="flex items-center gap-2">
                          {getMimeIcon(d.mimeType)}
                          <div>
                            <p className="font-bold text-xs text-ag-ink">{d.name}</p>
                            <p className="text-[10px] text-ag-ink-3">
                              {emp ? <span className="font-semibold text-ag-ink-2">{emp.fullName} · </span> : 'Company Document · '}
                              {formatDate(d.uploadedAt)} · {formatFileSize(d.size)}
                            </p>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize mt-1 inline-block ${getCategoryBadge(d.category)}`}>{d.category}</span>
                          </div>
                        </div>
                      </div>
                      {isHr && (
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" variant="ghost" icon={<XCircle size={12} />} onClick={() => handleDelete(d._id)}>Reject</Button>
                          <Button size="sm" icon={<ShieldCheck size={12} />} onClick={() => handleVerify(d._id)}>Verify</Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            {/* Workflow */}
            <Card className="p-4">
              <h4 className="font-bold text-xs uppercase text-ag-ink tracking-wider mb-4">Verification Workflow</h4>
              <div className="space-y-3">
                {[
                  { step: 1, label: 'Document Submitted',  done: true,  desc: 'Employee uploads document' },
                  { step: 2, label: 'HR Verification',     done: false, desc: 'HR reviews authenticity' },
                  { step: 3, label: 'Manager Approval',    done: false, desc: 'Reporting manager sign-off' },
                  { step: 4, label: 'Compliance Check',    done: false, desc: 'Legal/compliance review' },
                  { step: 5, label: 'Fully Verified',      done: false, desc: 'Document is archived' },
                ].map((s, i) => (
                  <div key={i} className="relative flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-black text-[10px] border-2 ${s.done ? 'bg-ag-mint border-ag-mint text-white' : 'bg-white border-ag-border text-ag-ink-3'}`}>
                      {s.done ? '✓' : s.step}
                    </div>
                    {i < 4 && <div className="absolute left-[13px] top-7 w-0.5 h-4 bg-ag-border" />}
                    <div>
                      <p className={`font-bold text-xs ${s.done ? 'text-ag-mint' : 'text-ag-ink'}`}>{s.label}</p>
                      <p className="text-[10px] text-ag-ink-3">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Policy */}
            <Card className="p-4 bg-ag-primary-light border-ag-primary/20">
              <h4 className="font-bold text-xs text-ag-primary uppercase tracking-wider mb-2 flex items-center gap-1.5"><Lock size={13} />Verification Policy</h4>
              <ul className="space-y-1 text-[10px] text-ag-ink-3">
                <li>• KYC docs must be verified within 7 days of joining</li>
                <li>• All documents require at least HR verification</li>
                <li>• Rejected docs must include a reason comment</li>
                <li>• Verified docs are immutable and audit-logged</li>
              </ul>
            </Card>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          AUDIT TRAIL
          ═══════════════════════════════════════════════════════ */}
      {activeTab === 'audit' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader title="Document Audit Trail" subtitle="Complete immutable log of all document actions." />
              <div className="divide-y divide-ag-border/40 max-h-[600px] overflow-y-auto">
                {AUDIT_LOG.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-4 hover:bg-ag-surface-2/30 transition-colors">
                    <div className={`p-2 rounded-lg shrink-0 ${a.color}`}>{a.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-xs text-ag-ink">{a.action}: <span className="font-normal">{a.doc}</span></p>
                          <p className="text-[10px] text-ag-ink-3 mt-0.5">Employee: <span className="font-semibold text-ag-ink-2">{a.emp}</span> · by {a.user}</p>
                        </div>
                        <span className="text-[9px] text-ag-ink-3 font-mono shrink-0">{a.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <div className="space-y-5">
            <Card className="p-4">
              <h4 className="font-bold text-xs uppercase text-ag-ink tracking-wider mb-3">Activity Summary</h4>
              <div className="space-y-2">
                {[
                  { label: 'Total Uploads',     val: documents.length,    color: 'text-ag-primary' },
                  { label: 'Verified Today',    val: verifiedCount,        color: 'text-ag-mint' },
                  { label: 'Pending Review',    val: pendingCount,         color: 'text-ag-amber' },
                  { label: 'Expiring Soon',     val: expiring.length,      color: 'text-ag-coral' },
                ].map(s => (
                  <div key={s.label} className="flex justify-between py-1 border-b border-ag-border/40 text-xs">
                    <span className="text-ag-ink-3">{s.label}</span>
                    <strong className={`font-black ${s.color}`}>{s.val}</strong>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <h4 className="font-bold text-xs uppercase text-ag-ink tracking-wider mb-2 flex items-center gap-1.5"><Shield size={13} className="text-ag-primary" />Audit Policy</h4>
              <ul className="space-y-1 text-[10px] text-ag-ink-3">
                <li>• All activities logged with user ID, timestamp, and IP</li>
                <li>• Audit records are immutable — retained 7 years</li>
                <li>• Deleted documents moved to archive, never hard-deleted</li>
              </ul>
            </Card>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          ANALYTICS
          ═══════════════════════════════════════════════════════ */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Documents',   val: documents.length,           color: 'text-ag-primary bg-ag-primary-light', icon: <img src="/logo/logo_main.png" alt="Logo" className="w-5 h-5 object-contain" /> },
              { label: 'Verification Rate', val: documents.length > 0 ? `${Math.round((verifiedCount / documents.length) * 100)}%` : '0%', color: 'text-ag-mint bg-[#E6FAF4]', icon: <Database size={20} /> },
              { label: 'Compliance Rate',   val: employees.length > 0 ? `${Math.round((verifiedCount / Math.max(1, employees.length * EMPLOYEE_CATEGORIES.reduce((s, c) => s + c.docs.filter(d => d.required).length, 0))) * 100)}%` : '0%', color: 'text-ag-sky bg-[#E8F6FF]', icon: <Database size={20} /> },
              { label: 'Storage Used',      val: formatFileSize(totalSize),  color: 'text-ag-amber bg-[#FFF8E6]', icon: <Database size={20} /> },
            ].map(k => (
              <Card key={k.label} className="p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${k.color} shrink-0`}>{k.icon}</div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-ag-ink-3 block">{k.label}</span>
                  <span className="font-display font-black text-xl text-ag-ink">{k.val}</span>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Verification Status Donut */}
            <Card className="p-5">
              <CardHeader title="Verification Status" subtitle="Breakdown of all document verification states." />
              {pieData.length > 0 ? (
                <div className="flex items-center gap-6">
                  <div className="h-44 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                          {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip formatter={(v, n) => [`${v} docs`, n]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {pieData.map(d => (
                      <div key={d.name} className="flex items-center gap-2 text-xs">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: d.color }} />
                        <div><p className="font-black text-ag-ink">{d.value}</p><p className="text-ag-ink-3">{d.name}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <div className="h-32 flex items-center justify-center text-xs text-ag-ink-3">No data yet.</div>}
            </Card>

            {/* Department Distribution */}
            <Card className="p-5">
              <CardHeader title="Documents by Department" subtitle="How documents are distributed across departments." />
              <div className="h-48">
                {deptDistData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptDistData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f4" />
                      <XAxis dataKey="name" stroke="#8E88A8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#8E88A8" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8E8F0', fontSize: 12 }} />
                      <Bar dataKey="docs" fill="#5B3CF5" radius={[4, 4, 0, 0]} name="Documents" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-xs text-ag-ink-3">No department data.</div>}
              </div>
            </Card>
          </div>

          {/* Future Ready */}
          <Card className="p-5 bg-ag-ink border-0 text-white">
            <h3 className="font-display font-black text-sm mb-4 flex items-center gap-2"><Sparkle size={18} className="text-ag-amber" />Future Document Intelligence</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'OCR Text Extraction', desc: 'AI-powered document parsing', status: 'Roadmap' },
                { label: 'Digital Signatures',  desc: 'DocuSign & Adobe Sign',       status: 'Planned' },
                { label: 'AI Search',           desc: 'Semantic document search',     status: 'Roadmap' },
                { label: 'Cloud Backup',        desc: 'SharePoint / Google Drive sync',status: 'Coming Soon' },
              ].map(item => (
                <div key={item.label} className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                  <h5 className="font-bold text-xs text-white">{item.label}</h5>
                  <p className="text-[10px] text-white/50 mt-0.5">{item.desc}</p>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded bg-white/10 text-white/60 mt-2 inline-block">{item.status}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

    </PageContainer>
  );
}

