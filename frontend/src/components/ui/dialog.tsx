import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    className={cn('fixed inset-0 z-50 bg-black/80 backdrop-blur-sm', className)}
    ref={ref}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface DialogContentProps extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  title: string;
  description: string;
  children: ReactNode;
}

export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, title, description, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogOverlay />
    <DialogPrimitive.Content
      className={cn(
        'fixed left-1/2 top-1/2 z-50 max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[var(--radius)] border border-border bg-card p-6 text-primary shadow-2xl outline-none sm:p-8',
        className,
      )}
      ref={ref}
      {...props}
    >
      <div className="pr-10">
        <DialogPrimitive.Title className="text-xl font-semibold tracking-[-0.025em]">
          {title}
        </DialogPrimitive.Title>
        <DialogPrimitive.Description className="mt-2 text-sm leading-6 text-secondary">
          {description}
        </DialogPrimitive.Description>
      </div>
      <div className="mt-7">{children}</div>
      <DialogPrimitive.Close className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full text-secondary transition-colors hover:bg-white/[0.05] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20">
        <X aria-hidden="true" className="size-4" />
        <span className="sr-only">Close dialog</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;
