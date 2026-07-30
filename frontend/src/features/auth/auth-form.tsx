import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import type { AuthCredentials, RegistrableRole } from './auth-api';

type AuthMode = 'login' | 'register';

interface AuthFormProps {
  mode: AuthMode;
  onSubmit: (credentials: AuthCredentials) => Promise<void> | void;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
}

const qualifiedEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const passwordByteLength = (password: string) => new TextEncoder().encode(password).length;

export const AuthForm = ({ mode, onSubmit }: AuthFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<RegistrableRole>('CUSTOMER');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const isRegistration = mode === 'register';
  const emailErrorId = `${mode}-email-error`;
  const passwordErrorId = `${mode}-password-error`;
  const confirmPasswordErrorId = `${mode}-confirm-password-error`;

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (!qualifiedEmailPattern.test(email) || email.includes('..')) {
      nextErrors.email = 'Enter a valid email with @ and a dotted domain.';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    } else if (isRegistration && password.length < 8) {
      nextErrors.password = 'Use at least 8 characters.';
    } else if (passwordByteLength(password) > 72) {
      nextErrors.password = 'Password must be 72 bytes or fewer.';
    }

    if (isRegistration && password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await onSubmit({
        email: email.trim().toLowerCase(),
        password,
        ...(isRegistration ? { role } : { rememberMe }),
      });
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : 'Unable to complete your request.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit}>
      {errors.form && (
        <div
          className="rounded-[var(--radius)] border border-red-400/20 bg-red-400/8 px-4 py-3 text-sm text-red-200"
          role="alert"
        >
          {errors.form}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={`${mode}-email`}>Email address</Label>
        <div className="relative">
          <Mail
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-secondary"
          />
          <Input
            aria-describedby={errors.email ? emailErrorId : undefined}
            aria-invalid={Boolean(errors.email)}
            autoComplete="email"
            className="pl-11"
            id={`${mode}-email`}
            inputMode="email"
            onChange={(event) => {
              setEmail(event.target.value.toLowerCase());
              setErrors((current) => ({ ...current, email: undefined, form: undefined }));
            }}
            placeholder="you@company.com"
            spellCheck={false}
            type="email"
            value={email}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-red-300" id={emailErrorId}>
            {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={`${mode}-password`}>Password</Label>
          {!isRegistration && (
            <span className="text-[10px] uppercase tracking-[0.14em] text-secondary">
              Encrypted access
            </span>
          )}
        </div>
        <div className="relative">
          <LockKeyhole
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-secondary"
          />
          <Input
            aria-describedby={errors.password ? passwordErrorId : undefined}
            aria-invalid={Boolean(errors.password)}
            autoComplete={isRegistration ? 'new-password' : 'current-password'}
            className="px-11"
            id={`${mode}-password`}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((current) => ({ ...current, password: undefined, form: undefined }));
            }}
            placeholder={isRegistration ? 'Minimum 8 characters' : 'Enter your password'}
            type={showPassword ? 'text' : 'password'}
            value={password}
          />
          <button
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-secondary transition hover:bg-white/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            onClick={() => setShowPassword((visible) => !visible)}
            type="button"
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" className="size-4" />
            ) : (
              <Eye aria-hidden="true" className="size-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-300" id={passwordErrorId}>
            {errors.password}
          </p>
        )}
      </div>

      {!isRegistration && (
        <label className="flex cursor-pointer items-center gap-2.5" htmlFor="login-remember-me">
          <div className="relative flex items-center">
            <input
              checked={rememberMe}
              className="peer sr-only"
              id="login-remember-me"
              onChange={(e) => setRememberMe(e.target.checked)}
              type="checkbox"
            />
            <div className="flex size-4 items-center justify-center rounded border border-white/25 bg-background/65 transition peer-checked:border-primary/60 peer-checked:bg-primary/20 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30">
              {rememberMe && (
                <svg className="size-2.5 text-primary" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 12 12">
                  <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm text-secondary">
            Remember me for 7 days
          </span>
        </label>
      )}

      {isRegistration && (
        <div className="space-y-2">
          <Label htmlFor="register-role">Account type</Label>
          <Select onValueChange={(value) => setRole(value as RegistrableRole)} value={role}>
            <SelectTrigger
              aria-label="Account type"
              className="w-full bg-background/65 text-sm"
              id="register-role"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CUSTOMER">Customer — browse and purchase</SelectItem>
              <SelectItem value="EMPLOYEE">Employee — manage inventory</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs leading-5 text-secondary">
            Employees can add and update vehicles, but only administrators can delete or restock.
          </p>
        </div>
      )}

      {isRegistration && (
        <div className="space-y-2">
          <Label htmlFor="register-confirm-password">Confirm password</Label>
          <Input
            aria-describedby={errors.confirmPassword ? confirmPasswordErrorId : undefined}
            aria-invalid={Boolean(errors.confirmPassword)}
            autoComplete="new-password"
            id="register-confirm-password"
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setErrors((current) => ({
                ...current,
                confirmPassword: undefined,
                form: undefined,
              }));
            }}
            placeholder="Repeat your password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-300" id={confirmPasswordErrorId}>
              {errors.confirmPassword}
            </p>
          )}
        </div>
      )}

      <Button className="w-full" disabled={isSubmitting} size="lg" type="submit">
        {isSubmitting && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
        {isSubmitting
          ? isRegistration
            ? 'Creating account…'
            : 'Signing in…'
          : isRegistration
            ? 'Create account'
            : 'Sign in'}
      </Button>

      <p className="text-center text-[10px] uppercase leading-5 tracking-[0.1em] text-secondary/70">
        By continuing, you agree to protect access credentials and use MotoVault responsibly.
      </p>
    </form>
  );
};
