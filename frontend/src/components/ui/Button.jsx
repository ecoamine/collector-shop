import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const variants = {
  primary:
    'bg-primary text-surface-900 font-semibold hover:bg-primary-dim shadow-glow hover:shadow-glow-lg border border-primary/30 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-900',
  secondary:
    'glass text-primary border border-primary/20 hover:border-primary/40 hover:shadow-glow',
  danger:
    'bg-danger/90 text-white hover:bg-danger border border-danger/50 focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 focus-visible:ring-offset-surface-900',
  ghost:
    'text-gray-300 hover:text-primary hover:bg-white/5 border border-transparent',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-xl',
  md: 'px-4 py-2 text-sm rounded-2xl',
  lg: 'px-6 py-3 text-base rounded-2xl',
};

export const Button = forwardRef(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={disabled}
        whileHover={disabled ? {} : { scale: 1.02 }}
        whileTap={disabled ? {} : { scale: 0.98 }}
        className={clsx(
          'inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';
