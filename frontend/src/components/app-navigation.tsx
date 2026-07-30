import { CarFront, LogOut, Menu, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { AuthUser } from '../features/auth/auth-api';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from './ui/navigation-menu';

type ActivePage = 'home' | 'inventory' | 'orders' | 'about' | null;

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

export const AppNavigation = ({ active = null, user = null, onLogout }: AppNavigationProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/75 px-5 backdrop-blur-xl sm:px-8 lg:px-12">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center border-b border-white/15">
        <Link aria-label="MotoVault home" className="flex items-center gap-3 text-primary" to="/">
          <span className="flex size-9 items-center justify-center rounded-full border border-white/30">
            <CarFront aria-hidden="true" className="size-4" />
          </span>
          <span className="text-xs font-semibold tracking-[-0.01em]">MotoVault</span>
        </Link>

        <NavigationMenu aria-label="Primary" className="mx-auto hidden md:flex">
          <NavigationMenuList className="gap-2">
            <NavigationMenuItem>
              <Link
                aria-current={active === 'home' ? 'page' : undefined}
                className={cn(
                  'group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50',
                  active === 'home' && 'bg-white/[0.04] text-primary',
                )}
                to="/"
              >
                Home
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link
                aria-current={active === 'about' ? 'page' : undefined}
                className={cn(
                  'group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50',
                  active === 'about' && 'bg-white/[0.04] text-primary',
                )}
                to="/about"
              >
                About
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link
                aria-current={active === 'inventory' ? 'page' : undefined}
                className={cn(
                  'group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50',
                  active === 'inventory' && 'bg-white/[0.04] text-primary',
                )}
                to="/dashboard"
              >
                Inventory
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link
                aria-current={active === 'orders' ? 'page' : undefined}
                className={cn(
                  'group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50',
                  active === 'orders' && 'bg-white/[0.04] text-primary',
                )}
                to="/orders"
              >
                Orders
              </Link>
            </NavigationMenuItem>
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
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild className="hidden sm:inline-flex" variant="outline">
                <Link to="/register">Request access</Link>
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
          <Link
            aria-current={active === 'home' ? 'page' : undefined}
            className={cn(
              'block rounded-lg px-4 py-3 text-sm text-secondary transition-colors hover:bg-white/[0.04] hover:text-primary',
              active === 'home' && 'bg-white/[0.05] text-primary',
            )}
            onClick={() => setIsMenuOpen(false)}
            to="/"
          >
            Home
          </Link>
          <Link
            aria-current={active === 'about' ? 'page' : undefined}
            className={cn(
              'mt-1 block rounded-lg px-4 py-3 text-sm text-secondary transition-colors hover:bg-white/[0.04] hover:text-primary',
              active === 'about' && 'bg-white/[0.05] text-primary',
            )}
            to="/about"
            onClick={() => setIsMenuOpen(false)}
          >
            About
          </Link>
          <Link
            aria-current={active === 'inventory' ? 'page' : undefined}
            className={cn(
              'mt-1 block rounded-lg px-4 py-3 text-sm text-secondary transition-colors hover:bg-white/[0.04] hover:text-primary',
              active === 'inventory' && 'bg-white/[0.05] text-primary',
            )}
            onClick={() => setIsMenuOpen(false)}
            to="/dashboard"
          >
            Inventory
          </Link>
          <Link
            aria-current={active === 'orders' ? 'page' : undefined}
            className={cn(
              'mt-1 block rounded-lg px-4 py-3 text-sm text-secondary transition-colors hover:bg-white/[0.04] hover:text-primary',
              active === 'orders' && 'bg-white/[0.05] text-primary',
            )}
            to="/orders"
            onClick={() => setIsMenuOpen(false)}
          >
            Orders
          </Link>
          {!user && (
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-3">
              <Button asChild variant="ghost">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Request access</Link>
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
