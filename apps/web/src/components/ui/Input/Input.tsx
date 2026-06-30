import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:       string;
  error?:       string;
  helperText?:  string;
  icon?:        React.ReactNode;
  iconRight?:   React.ReactNode;
  required?:    boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, iconRight, required, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className={cn('ag-label', required && 'ag-label--required')}>
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'ag-input',
              icon && 'pl-10',
              iconRight && 'pr-10',
              error && 'ag-input--error',
              className
            )}
            {...props}
          />
          {icon && (
            <div className="absolute left-3.5 text-ag-ink-3 pointer-events-none flex items-center justify-center z-10">
              {icon}
            </div>
          )}
          {iconRight && (
            <div className="absolute right-3.5 text-ag-ink-3 flex items-center justify-center z-10">
              {iconRight}
            </div>
          )}
        </div>
        {error && <span className="ag-helper ag-helper--error">{error}</span>}
        {!error && helperText && <span className="ag-helper">{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
