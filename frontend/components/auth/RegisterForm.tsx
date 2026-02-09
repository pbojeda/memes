'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PasswordStrength } from './PasswordStrength';
import { authService } from '@/lib/services/authService';
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
} from '@/lib/validations/auth';

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function RegisterForm() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validate email on blur
  const validateEmailField = useCallback(() => {
    const result = validateEmail(email);
    setErrors((prev) => ({
      ...prev,
      email: result.error,
    }));
  }, [email]);

  // Validate password match on blur or when passwords change
  const validateConfirmField = useCallback(() => {
    if (!touched.confirmPassword) return;
    const result = validatePasswordMatch(password, confirmPassword);
    setErrors((prev) => ({
      ...prev,
      confirmPassword: result.error,
    }));
  }, [password, confirmPassword, touched.confirmPassword]);

  // Re-validate confirm password when password changes
  useEffect(() => {
    if (touched.confirmPassword && confirmPassword) {
      validateConfirmField();
    }
  }, [password, touched.confirmPassword, confirmPassword, validateConfirmField]);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'email') {
      validateEmailField();
    } else if (field === 'confirmPassword') {
      validateConfirmField();
    }
  };

  // Check if form is valid for submission
  const isFormValid = () => {
    const emailResult = validateEmail(email);
    const passwordResult = validatePassword(password);
    const matchResult = validatePasswordMatch(password, confirmPassword);

    return emailResult.isValid && passwordResult.isValid && matchResult.isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!isFormValid()) return;

    setIsSubmitting(true);

    try {
      await authService.register({
        email,
        password,
      });
      router.push('/login?registered=true');
    } catch (error) {
      const err = error as Error & { status?: number };
      if (err.status === 409) {
        setApiError('This email is already registered');
      } else {
        setApiError('Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {apiError && (
        <Alert variant="destructive">
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => handleBlur('email')}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive">
            {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => handleBlur('password')}
          aria-describedby="password-requirements"
        />
        <PasswordStrength password={password} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onBlur={() => handleBlur('confirmPassword')}
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
        />
        {errors.confirmPassword && (
          <p id="confirm-error" className="text-sm text-destructive">
            {errors.confirmPassword}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={!isFormValid() || isSubmitting}>
        {isSubmitting ? 'Creating account...' : 'Create Account'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Login
        </Link>
      </p>
    </form>
  );
}
