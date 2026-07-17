import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { Skeleton } from '../Skeleton/Skeleton';
import { EmptyState } from '../EmptyState/EmptyState';
import { cn } from '@/lib/utils';

interface DataTableProps<TData> {
  columns:     ColumnDef<TData, any>[];
  data:        TData[];
  isLoading?:  boolean;
  onRowClick?: (row: TData) => void;
  emptyTitle?: string;
  emptySubtitle?: string;
  /** Make table use minimum-width horizontal scroll container */
  minWidth?: string;
}

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  onRowClick,
  emptyTitle = 'No data found',
  emptySubtitle = 'There are no records matching your request.',
  minWidth = '600px',
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="w-full flex flex-col gap-3 p-4 bg-ag-surface rounded-xl border border-ag-border">
        <Skeleton height={40} width="100%" />
        <Skeleton height={50} width="100%" />
        <Skeleton height={50} width="100%" />
        <Skeleton height={50} width="100%" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-ag-surface rounded-xl border border-ag-border overflow-hidden">
        <EmptyState title={emptyTitle} subtitle={emptySubtitle} />
      </div>
    );
  }

  return (
    /* Outer wrapper: clips and enables horizontal scroll with momentum on iOS */
    <div className="w-full overflow-x-auto -webkit-overflow-scrolling-touch bg-ag-surface rounded-xl border border-ag-border shadow-card">
      <table className="ag-table" style={{ minWidth }}>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row.original)}
              className={cn(onRowClick && 'cursor-pointer hover:bg-ag-primary-light/50 transition-colors')}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
