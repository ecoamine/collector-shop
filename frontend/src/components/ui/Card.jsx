import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export const Card = forwardRef(
  ({ children, className, hover = false, ...props }, ref) => {
    const Comp = motion.div;
    return (
      <Comp
        ref={ref}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        whileHover={
          hover
            ? {
                y: -4,
                boxShadow: '0 0 30px rgba(0, 245, 212, 0.15)',
                transition: { duration: 0.2 },
              }
            : undefined
        }
        className={clsx(
          'rounded-2xl border border-white/10 bg-surface-700/40 backdrop-blur-xl shadow-glass overflow-hidden',
          hover && 'cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
Card.displayName = 'Card';

export function CardHeader({ children, className, ...props }) {
  return (
    <div className={clsx('p-4 md:p-5 border-b border-white/5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={clsx('p-4 md:p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div className={clsx('p-4 md:p-5 border-t border-white/5', className)} {...props}>
      {children}
    </div>
  );
}
