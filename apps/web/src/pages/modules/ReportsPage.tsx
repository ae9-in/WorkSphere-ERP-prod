import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { Card, CardHeader } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { reportService } from '@/services/api.service';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { DataTable } from '@/components/ui/Table/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowsClockwise, Download, SquaresFour, Sliders } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'custom'>('analytics');
  const [headcount, setHeadcount] = useState<any[]>([]);
  const [diversity, setDiversity] = useState<any[]>([]);
  const [statutory, setStatutory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Custom Report Builder state
  const [customEntity, setCustomEntity] = useState('employee');
  const [customColumns, setCustomColumns] = useState<string[]>(['fullName', 'employeeId', 'official.status']);
  const [customResults, setCustomResults] = useState<any[]>([]);
  const [customLoading, setCustomLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const [hc, div, stat] = await Promise.all([
        reportService.getHeadcount('department'),
        reportService.getDiversity(),
        reportService.getStatutory()
      ]);
      setHeadcount(hc);
      setDiversity(div);
      setStatutory(stat);
    } catch {
      toast.error('Failed to load compliance report charts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleRunCustom = async () => {
    setCustomLoading(true);
    try {
      const data = await reportService.runCustom({
        entity: customEntity,
        columns: customColumns,
        filters: []
      });
      setCustomResults(data);
      toast.success(`Loaded ${data.length} records`);
    } catch {
      toast.error('Failed to run custom report query');
    } finally {
      setCustomLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (customResults.length === 0) return;
    const headers = customColumns.join(',');
    const rows = customResults.map((r: any) =>
      customColumns.map((col) => {
        // Resolve nested paths (e.g. official.status)
        const parts = col.split('.');
        let val = r;
        for (const p of parts) {
          val = val?.[p];
        }
        return `"${val ?? ''}"`;
      }).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `custom_report_${customEntity}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const COLORS = ['#5B3CF5', '#00C48C', '#FFBB28', '#FF8042', '#AF19FF'];

  const columns: ColumnDef<any>[] = customColumns.map((col) => ({
    accessorKey: col,
    header: col.replace('official.', '').replace('personal.', '').replace('totals.', '').toUpperCase(),
    cell: ({ row }) => {
      const parts = col.split('.');
      let val = row.original;
      for (const p of parts) {
        val = val?.[p];
      }
      return typeof val === 'number' && col.includes('amount') || col.includes('Price') || col.includes('gross') || col.includes('net') ? (
        <span className="font-mono text-sm">{formatCurrency(val)}</span>
      ) : (
        <span className="text-xs text-ag-ink-2">{String(val ?? '—')}</span>
      );
    }
  }));

  const entitiesList = [
    { value: 'employee', label: 'Employee Profile Registry', fields: ['fullName', 'employeeId', 'official.status', 'official.workEmail', 'official.employeeType'] },
    { value: 'payslip', label: 'Statutory Payroll Payslips', fields: ['employeeSnapshot.fullName', 'employeeId', 'totals.gross', 'totals.deductions', 'totals.net'] },
    { value: 'leave', label: 'Leave Applications List', fields: ['employeeId', 'days', 'status', 'from', 'to', 'reason'] },
    { value: 'attendance', label: 'Daily Attendance Logs', fields: ['employeeId', 'fullName', 'date', 'checkIn', 'checkOut', 'status'] }
  ];

  return (
    <PageContainer
      title="Reports & Statutory Analytics"
      subtitle="Run real-time headcount queries, audit tax challans and compile custom column reports."
      actions={
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={fetchReports} icon={<ArrowsClockwise size={18} />}>
            Refresh
          </Button>
        </div>
      }
    >
      {/* Tabs Menu */}
      <div className="flex gap-2 p-1 bg-ag-surface-2 rounded-xl w-fit border border-ag-border mb-8">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'analytics' ? 'bg-ag-primary text-white shadow' : 'text-ag-ink-3 hover:text-ag-ink'
          }`}
        >
          <SquaresFour size={18} />
          Compliance Dashboards
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'custom' ? 'bg-ag-primary text-white shadow' : 'text-ag-ink-3 hover:text-ag-ink'
          }`}
        >
          <Sliders size={18} />
          Custom Report Builder
        </button>
      </div>

      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* Statutory Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="p-5 flex flex-col justify-between">
              <div>
                <p className="text-xs text-ag-ink-3 uppercase font-semibold tracking-wider">Provident Fund (PF) Challan Liability</p>
                <h3 className="text-2xl font-bold font-display text-ag-ink mt-2">
                  {isLoading ? '—' : formatCurrency(statutory?.pfChallan ?? 0)}
                </h3>
              </div>
              <p className="text-xs text-[#00875A] font-semibold mt-4">Form 12A compliant filings</p>
            </Card>

            <Card className="p-5 flex flex-col justify-between">
              <div>
                <p className="text-xs text-ag-ink-3 uppercase font-semibold tracking-wider">ESI Contribution Liability</p>
                <h3 className="text-2xl font-bold font-display text-ag-ink mt-2">
                  {isLoading ? '—' : formatCurrency(statutory?.esiChallan ?? 0)}
                </h3>
              </div>
              <p className="text-xs text-ag-ink-3 mt-4">Statutory ESIC monthly ledger</p>
            </Card>

            <Card className="p-5 flex flex-col justify-between">
              <div>
                <p className="text-xs text-ag-ink-3 uppercase font-semibold tracking-wider">Total Statutory Obligations</p>
                <h3 className="text-2xl font-bold font-display text-ag-primary mt-2">
                  {isLoading ? '—' : formatCurrency(statutory?.totalStatutory ?? 0)}
                </h3>
              </div>
              <p className="text-xs text-ag-ink-3 mt-4">All statutory deductors summed</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Department Headcount */}
            <Card>
              <CardHeader title="Headcount Distribution" subtitle="Active employees grouped by department." />
              <div className="h-72 p-4">
                {isLoading ? (
                  <p className="text-ag-ink-3">Loading distribution chart...</p>
                ) : headcount.length === 0 ? (
                  <p className="text-ag-ink-3 text-center pt-24">No data available. Initialize employees to view chart.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={headcount}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDE8FF" />
                      <XAxis dataKey="_id" stroke="#1A1433" fontSize={11} />
                      <YAxis stroke="#1A1433" fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#5B3CF5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Gender Diversity */}
            <Card>
              <CardHeader title="Gender Diversity Ratio" subtitle="Diversity distribution across the workspace." />
              <div className="h-72 p-4 flex items-center justify-center">
                {isLoading ? (
                  <p className="text-ag-ink-3">Loading diversity ratio...</p>
                ) : diversity.length === 0 ? (
                  <p className="text-ag-ink-3 text-center">No data available.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={diversity}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="_id"
                      >
                        {diversity.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'custom' && (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Build Custom Report Columns" subtitle="Pick target dataset and column attributes to export CSV data." />
            <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Dataset Select */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider">Target Dataset</label>
                <select
                  className="w-full h-10 px-3 bg-ag-surface border border-ag-border rounded-lg text-sm text-ag-ink focus:outline-none"
                  value={customEntity}
                  onChange={(e) => {
                    setCustomEntity(e.target.value);
                    const entObj = entitiesList.find(ent => ent.value === e.target.value);
                    if (entObj) setCustomColumns(entObj.fields);
                  }}
                >
                  {entitiesList.map((ent) => (
                    <option key={ent.value} value={ent.value}>{ent.label}</option>
                  ))}
                </select>
              </div>

              {/* Column Selection Checkboxes */}
              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-ag-ink uppercase tracking-wider">Include Columns</label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-ag-surface-2 rounded-lg border border-ag-border">
                  {entitiesList.find(e => e.value === customEntity)?.fields.map((field) => (
                    <div key={field} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`chk-${field}`}
                        checked={customColumns.includes(field)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCustomColumns([...customColumns, field]);
                          } else {
                            setCustomColumns(customColumns.filter(c => c !== field));
                          }
                        }}
                        className="rounded border-ag-border text-ag-primary focus:ring-ag-primary"
                      />
                      <label htmlFor={`chk-${field}`} className="text-xs font-semibold text-ag-ink truncate">{field}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-end gap-3">
                <Button className="w-full h-10" onClick={handleRunCustom} isLoading={customLoading}>
                  Run Report
                </Button>
                {customResults.length > 0 && (
                  <Button variant="secondary" className="h-10" onClick={handleDownloadCSV} icon={<Download size={18} />} />
                )}
              </div>
            </div>
          </Card>

          {customResults.length > 0 && (
            <Card>
              <CardHeader title="Report Query Results" subtitle={`Found ${customResults.length} records matching column query.`} />
              <DataTable
                columns={columns}
                data={customResults}
                isLoading={customLoading}
                emptyTitle="No results found"
                emptySubtitle="Refine your criteria or run a new search."
              />
            </Card>
          )}
        </div>
      )}
    </PageContainer>
  );
}
