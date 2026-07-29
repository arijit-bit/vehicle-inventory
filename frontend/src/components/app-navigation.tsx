import { CarFront, LogOut, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AuthUser } from '../features/auth/auth-api';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from './ui/navigation-menu';

interface AppNavigationProps {
  user: AuthUser | null;
  onLogout(): void;
}

const roleLabel = {
  CUSTOMER: 'Private client',
  EMPLOYEE: 'Sales specialist',
  ADMIN: 'Administrator',
} as const;

export const AppNavigation = ({ user, onLogout }: AppNavigationProps) => (
  <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-4">
    <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between rounded-[var(--radius)] border border-border bg-background/60 px-4 shadow-2xl shadow-black/15 backdrop-blur-md sm:px-6">
      <a className="flex items-center gap-3" href="/dashboard">
        <span className="flex size-9 items-center justify-center rounded-full border border-border bg-card">
          <CarFront aria-hidden="true" className="size-4 text-primary" />
        </span>
        <span className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
          MotoVault
        </span>
      </a>

      <NavigationMenu className="hidden md:flex">
        <NavigationMenuList>
          {[
            ['Collection', '#collection'],
            ['Private sales', '#private-sales'],
            ['Concierge', '#concierge'],
          ].map(([label, href], index) => (
            <NavigationMenuItem key={label}>
              <NavigationMenuLink
                className={cn(index === 0 && 'bg-white/[0.04] text-primary')}
                href={href}
              >
                {label}
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>

      <div className="flex items-center gap-2">
        {user ? (
          <>
            <div className="hidden text-right sm:block">
              <p className="max-w-44 truncate text-xs font-medium text-primary">{user.email}</p>
              <p className="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-secondary">
                {roleLabel[user.role]}
              </p>
            </div>
            <span className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-secondary">
              <UserRound aria-hidden="true" className="size-4" />
            </span>
            <Button aria-label="Sign out" onClick={onLogout} size="icon" variant="ghost">
              <LogOut aria-hidden="true" className="size-4" />
            </Button>
          </>
        ) : (
          <>
            <Button asChild className="hidden sm:inline-flex" variant="ghost">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Request access</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  </header>
);
