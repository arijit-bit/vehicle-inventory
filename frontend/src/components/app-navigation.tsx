import { CarFront, LogOut, Menu, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import type { AuthUser } from '../features/auth/auth-api';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from './ui/navigation-menu';

type ActivePage = 'home' | 'inventory' | null;

interface AppNavigationProps {
  active?: ActivePage;
  user?: AuthUser | null;
  onLogout?(): void;
}

const roleLabel = {
  CUSTOMER: 'Private client',
  EMPLOYEE: 'Sales specialist',
  ADMIN: 'Administrator',
} as const;

const deferredNavigation = ['About', 'Services', 'Contact'] as const;

const DeferredNavigationItem = ({ label }: { label: (typeof deferredNavigation)[number] }) => (
  <span
    aria-disabled="true"
    className="cursor-default rounded-lg px-3 py-2 text-xs font-medium text-secondary/65"
  >
    {label}
  </span>
);

export const AppNavigation = ({ active = null, user = null, onLogout }: AppNavigationProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/75 px-5 backdrop-blur-xl sm:px-8 lg:px-12">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center border-b border-white/15">
        <a aria-label="MotoVault home" className="flex items-center gap-3 text-primary" href="/">
          <span className="flex size-9 items-center justify-center rounded-full border border-white/30">
            <CarFront aria-hidden="true" className="size-4" />
          </span>
          <span className="text-xs font-semibold tracking-[-0.01em]">MotoVault</span>
        </a>

        <NavigationMenu aria-label="Primary" className="mx-auto hidden md:flex">
          <NavigationMenuList className="gap-2">
            <NavigationMenuItem>
              <NavigationMenuLink
                aria-current={active === 'home' ? 'page' : undefined}
                className={cn(active === 'home' && 'bg-white/[0.04] text-primary')}
                href="/"
              >
                Home
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                aria-current={active === 'inventory' ? 'page' : undefined}
                className={cn(active === 'inventory' && 'bg-white/[0.04] text-primary')}
                href="/dashboard"
              >
                Inventory
              </NavigationMenuLink>
            </NavigationMenuItem>
            {deferredNavigation.map((label) => (
              <NavigationMenuItem className="flex" key={label}>
                <DeferredNavigationItem label={label} />
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="ml-auto flex items-center gap-1.5">
          {user ? (
            <>
              <div className="mr-1 hidden text-right lg:block">
                <p className="max-w-36 truncate text-xs font-medium text-primary">{user.email}</p>
                <p className="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-secondary">
                  {roleLabel[user.role]}
                </p>
              </div>
              <span className="hidden size-9 items-center justify-center rounded-full border border-border bg-card text-secondary sm:flex">
                <UserRound aria-hidden="true" className="size-4" />
              </span>
              <Button aria-label="Sign out" onClick={onLogout} size="icon" variant="ghost">
                <LogOut aria-hidden="true" className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild className="hidden lg:inline-flex" variant="ghost">
                <a href="/login">Sign in</a>
              </Button>
              <Button asChild className="hidden sm:inline-flex" variant="outline">
                <a href="/register">Request access</a>
              </Button>
            </>
          )}

          <button
            aria-controls="site-menu"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="flex size-11 items-center justify-center text-primary transition-colors hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
            type="button"
          >
            {isMenuOpen ? (
              <X aria-hidden="true" className="size-5" />
            ) : (
              <Menu aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
      </div>

      <div
        className={cn(
          'absolute right-5 top-[calc(100%+0.75rem)] w-64 rounded-[var(--radius)] border border-border bg-card/95 p-2 shadow-2xl backdrop-blur-xl transition sm:right-8 lg:right-12',
          isMenuOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0',
        )}
        hidden={!isMenuOpen}
        id="site-menu"
      >
        <nav aria-label="Menu">
          <a
            aria-current={active === 'home' ? 'page' : undefined}
            className={cn(
              'block rounded-lg px-4 py-3 text-sm text-secondary transition-colors hover:bg-white/[0.04] hover:text-primary',
              active === 'home' && 'bg-white/[0.05] text-primary',
            )}
            onClick={() => setIsMenuOpen(false)}
            href="/"
          >
            Home
          </a>
          <a
            aria-current={active === 'inventory' ? 'page' : undefined}
            className={cn(
              'mt-1 block rounded-lg px-4 py-3 text-sm text-secondary transition-colors hover:bg-white/[0.04] hover:text-primary',
              active === 'inventory' && 'bg-white/[0.05] text-primary',
            )}
            onClick={() => setIsMenuOpen(false)}
            href="/dashboard"
          >
            Inventory
          </a>
          {deferredNavigation.map((label) => (
            <span
              aria-disabled="true"
              className="mt-1 block cursor-default rounded-lg px-4 py-3 text-sm text-secondary/55"
              key={label}
            >
              {label}
              <span className="float-right text-[9px] uppercase tracking-[0.14em]">Soon</span>
            </span>
          ))}
          {!user && (
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-3">
              <Button asChild variant="ghost">
                <a href="/login">Sign in</a>
              </Button>
              <Button asChild>
                <a href="/register">Request access</a>
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
