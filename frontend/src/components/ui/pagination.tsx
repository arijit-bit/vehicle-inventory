import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '../../lib/utils';

export const Pagination = ({ className, ...props }: ComponentProps<'nav'>) => (
  <nav
    aria-label="pagination"
    className={cn('mx-auto flex w-full justify-center', className)}
    {...props}
  />
);

export const PaginationContent = ({ className, ...props }: ComponentProps<'ul'>) => (
  <ul className={cn('flex flex-row items-center gap-1', className)} {...props} />
);

export const PaginationItem = (props: ComponentProps<'li'>) => <li {...props} />;

interface PaginationLinkProps extends ComponentProps<'button'> {
  isActive?: boolean;
  size?: 'default' | 'icon';
}

export const PaginationLink = ({
  className,
  isActive,
  size = 'icon',
  ...props
}: PaginationLinkProps) => (
  <button
    aria-current={isActive ? 'page' : undefined}
    className={cn(
      'inline-flex h-9 items-center justify-center rounded-[var(--radius)] border border-transparent px-3 text-sm font-medium text-secondary transition-colors hover:border-border hover:bg-card hover:text-primary disabled:pointer-events-none disabled:opacity-40',
      size === 'icon' && 'w-9 px-0',
      isActive &&
        'border-primary bg-primary text-background hover:bg-primary hover:text-background',
      className,
    )}
    type="button"
    {...props}
  />
);

export const PaginationPrevious = ({
  className,
  children = 'Previous',
  ...props
}: PaginationLinkProps) => (
  <PaginationLink
    aria-label="Go to previous page"
    className={cn('gap-1 pl-2.5', className)}
    size="default"
    {...props}
  >
    <ChevronLeft aria-hidden="true" className="size-4" />
    <span className="hidden sm:block">{children}</span>
  </PaginationLink>
);

export const PaginationNext = ({ className, children = 'Next', ...props }: PaginationLinkProps) => (
  <PaginationLink
    aria-label="Go to next page"
    className={cn('gap-1 pr-2.5', className)}
    size="default"
    {...props}
  >
    <span className="hidden sm:block">{children}</span>
    <ChevronRight aria-hidden="true" className="size-4" />
  </PaginationLink>
);

export const PaginationEllipsis = ({ className, ...props }: ComponentProps<'span'>) => (
  <span
    aria-hidden="true"
    className={cn('flex size-9 items-center justify-center text-secondary', className)}
    {...props}
  >
    <MoreHorizontal className="size-4" />
    <span className="sr-only">More pages</span>
  </span>
);
