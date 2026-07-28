import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import type { AuthCredentials } from './auth-api';

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
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const isRegistration = mode === 'register';

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
          className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
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
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500"
          />
          <Input
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
        {errors.email && <p className="text-sm text-rose-300">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={`${mode}-password`}>Password</Label>
          {!isRegistration && (
            <span className="text-xs font-medium text-slate-500">Secure access</span>
          )}
        </div>
        <div className="relative">
          <LockKeyhole
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500"
          />
          <Input
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
            className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/5 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
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
        {errors.password && <p className="text-sm text-rose-300">{errors.password}</p>}
      </div>

      {isRegistration && (
        <div className="space-y-2">
          <Label htmlFor="register-confirm-password">Confirm password</Label>
          <Input
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
            <p className="text-sm text-rose-300">{errors.confirmPassword}</p>
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

      <p className="text-center text-xs leading-5 text-slate-500">
        By continuing, you agree to protect access credentials and use MotorVault responsibly.
      </p>
    </form>
  );
};
