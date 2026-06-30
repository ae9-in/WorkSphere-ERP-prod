import React from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export interface TabItem {
  id:       string;
  label:    string;
  icon?:    React.ReactNode;
  badge?:   string | number;
  content:  React.ReactNode;
}

interface TabsProps {
  items:        TabItem[];
  defaultValue?:string;
  value?:       string;
  onValueChange?:(val: string) => void;
  className?:   string;
}

export function Tabs({ items, defaultValue, value, onValueChange, className }: TabsProps) {
  const activeVal = value || defaultValue || items[0]?.id;

  return (
    <RadixTabs.Root
      value={activeVal}
      defaultValue={defaultValue || items[0]?.id}
      onValueChange={onValueChange}
      className={cn('w-full flex flex-col gap-6', className)}
    >
      <RadixTabs.List className="flex items-center gap-2 border-b border-ag-border overflow-x-auto no-scrollbar pb-px">
        {items.map((tab) => (
          <RadixTabs.Trigger
            key={tab.id}
            value={tab.id}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-semibold text-ag-ink-3 border-b-2 border-transparent transition-all cursor-pointer whitespace-nowrap select-none hover:text-ag-ink',
              'data-[state=active]:text-ag-primary data-[state=active]:border-ag-primary'
            )}
          >
            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-ag-surface-2 text-ag-ink-2 data-[state=active]:bg-ag-primary-light data-[state=active]:text-ag-primary">
                {tab.badge}
              </span>
            )}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>

      {items.map((tab) => (
        <RadixTabs.Content key={tab.id} value={tab.id} className="focus:outline-none animate-fade-in">
          {tab.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}
