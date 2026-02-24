import { forwardRef } from 'react';
import clsx from 'clsx';

export const Input = forwardRef(
  ({ className, error, label, id, ...props }, ref) => {
    const inputId = id || props.name || label?.toLowerCase().replace(/\s/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-300 mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full px-4 py-2.5 rounded-2xl border bg-surface-800 text-gray-100 placeholder-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50',
            'transition-colors duration-200',
            error
              ? 'border-danger focus:ring-danger/50 focus:border-danger'
              : 'border-white/10 hover:border-white/20',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export function Textarea({ className, error, label, id, ...props }) {
  const inputId = id || props.name || label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-300 mb-1.5"
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={clsx(
          'w-full px-4 py-2.5 rounded-2xl border bg-surface-800 text-gray-100 placeholder-gray-500 min-h-[100px]',
          'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50',
          'transition-colors duration-200 resize-y',
          error
            ? 'border-danger focus:ring-danger/50 focus:border-danger'
            : 'border-white/10 hover:border-white/20',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
