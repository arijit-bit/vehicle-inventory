import type { LabelHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export const Label = ({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    className={cn(
      'text-[11px] font-semibold uppercase leading-none tracking-[0.14em] text-secondary',
      className,
    )}
    {...props}
  />
);
