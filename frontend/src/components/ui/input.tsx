import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn(
      'flex h-11 w-full rounded-[var(--radius)] border border-border bg-background/65 px-4 text-sm text-primary outline-none transition-colors placeholder:text-secondary/70 hover:border-secondary/50 focus:border-secondary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  />
);
