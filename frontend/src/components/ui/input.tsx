import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn(
      'flex h-12 w-full rounded-xl border border-slate-700/90 bg-slate-950/60 px-4 text-[15px] text-slate-100 shadow-inner shadow-black/10 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/80 focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60',
      className,
    )}
    {...props}
  />
);
