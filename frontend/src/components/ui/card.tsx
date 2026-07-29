import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      className={cn(
        'rounded-[var(--radius)] border border-border bg-card text-primary shadow-[0_24px_80px_-48px_rgba(0,0,0,0.95)]',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div className={cn('flex flex-col space-y-2 p-6', className)} ref={ref} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div className={cn('p-6 pt-0', className)} ref={ref} {...props} />
  ),
);
CardContent.displayName = 'CardContent';
