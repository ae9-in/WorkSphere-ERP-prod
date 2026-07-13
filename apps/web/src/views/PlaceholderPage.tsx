import React from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { Rocket, CurrencyInr, CalendarCheck, ChartBar, Gear, CheckSquare, ShieldCheck } from '@phosphor-icons/react';

interface PlaceholderPageProps {
  module: string;
}

export default function PlaceholderPage({ module }: PlaceholderPageProps) {
  const getIcon = () => {
    switch (module.toLowerCase()) {
      case 'payroll': return <CurrencyInr size={32} weight="duotone" />;
      case 'attendance': return <CalendarCheck size={32} weight="duotone" />;
      case 'reports': return <ChartBar size={32} weight="duotone" />;
      case 'settings': return <Gear size={32} weight="duotone" />;
      case 'approvals': return <CheckSquare size={32} weight="duotone" />;
      case 'audit logs': return <ShieldCheck size={32} weight="duotone" />;
      default: return <Rocket size={32} weight="duotone" />;
    }
  };

  return (
    <PageContainer title={`${module} Workspace`}>
      <div className="bg-ag-surface rounded-2xl border border-ag-border shadow-card p-12">
        <EmptyState
          icon={getIcon()}
          title={`${module} Module Initialized`}
          subtitle={`The ${module} enterprise workspace is active with Phase 1 configuration. Connect your backend microservices or API environment variables to populate production records.`}
          actionLabel="Return to Dashboard"
          onAction={() => window.location.href = '/'}
        />
      </div>
    </PageContainer>
  );
}
