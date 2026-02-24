import clsx from 'clsx';

const variantStyles = {
  default: 'bg-surface-600 text-gray-300 border border-white/10',
  primary: 'bg-primary/20 text-primary border border-primary/30',
  secondary: 'bg-secondary/20 text-purple-300 border border-secondary/30',
  success: 'bg-success/20 text-success border border-success/30',
  danger: 'bg-danger/20 text-danger border border-danger/30',
};

export function Badge({ children, variant = 'default', className, ...props }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
