import React from 'react';
import { cn } from '@/lib/utils';
import { CaretDown } from '@phosphor-icons/react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?:       string;
  options:      SelectOption[];
  error?:       string;
  helperText?:  string;
  required?:    boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, required, className, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className={cn('ag-label', required && 'ag-label--required')}>
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'ag-input appearance-none pr-10 cursor-pointer',
              error && 'ag-input--error',
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 text-ag-ink-3 pointer-events-none flex items-center justify-center">
            <CaretDown size={16} />
          </div>
        </div>
        {error && <span className="ag-helper ag-helper--error">{error}</span>}
        {!error && helperText && <span className="ag-helper">{helperText}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
