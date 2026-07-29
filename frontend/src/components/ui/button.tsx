import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        default:
          'bg-cyan-400 text-slate-950 shadow-[0_12px_30px_-12px_rgba(34,211,238,0.8)] hover:bg-cyan-300 active:translate-y-px',
        outline:
          'border border-slate-700 bg-slate-900/60 text-slate-100 hover:border-slate-500 hover:bg-slate-800',
        ghost: 'text-slate-300 hover:bg-white/5 hover:text-white',
      },
      size: {
        sm: 'h-9 rounded-lg px-3 text-xs',
        default: 'h-11 px-5',
        lg: 'h-12 px-6 text-base',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = ({ className, variant, size, ...props }: ButtonProps) => (
  <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
);
