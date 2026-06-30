import React from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { Button } from '../Button/Button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage:  number;
  totalPages:   number;
  onPageChange: (page: number) => void;
  totalItems?:  number;
  pageSize?:    number;
  className?:   string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 15,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem   = Math.min(currentPage * pageSize, totalItems || 0);

  return (
    <div className={cn('flex items-center justify-between py-4 border-t border-ag-border', className)}>
      <div className="text-xs text-ag-ink-3">
        {totalItems !== undefined ? (
          <>Showing <span className="font-semibold text-ag-ink">{startItem}</span> to <span className="font-semibold text-ag-ink">{endItem}</span> of <span className="font-semibold text-ag-ink">{totalItems}</span> results</>
        ) : (
          <>Page <span className="font-semibold text-ag-ink">{currentPage}</span> of <span className="font-semibold text-ag-ink">{totalPages}</span></>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          icon={<CaretLeft size={14} />}
        >
          Previous
        </Button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .map((page, idx, arr) => {
              const prev = arr[idx - 1];
              const showEllipsis = prev && page - prev > 1;

              return (
                <React.Fragment key={page}>
                  {showEllipsis && <span className="px-1 text-ag-ink-3 text-xs">…</span>}
                  <button
                    onClick={() => onPageChange(page)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-xs font-semibold transition-colors',
                      currentPage === page
                        ? 'bg-ag-primary text-white'
                        : 'text-ag-ink-2 hover:bg-ag-surface-2'
                    )}
                  >
                    {page}
                  </button>
                </React.Fragment>
              );
            })}
        </div>

        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          iconRight={<CaretRight size={14} />}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
