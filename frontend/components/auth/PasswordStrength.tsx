'use client';

import { validatePassword } from '@/lib/validations/auth';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
}

interface RequirementItemProps {
  label: string;
  met: boolean;
}

function RequirementItem({ label, met }: RequirementItemProps) {
  return (
    <li
      role="listitem"
      data-met={met}
      className={cn(
        'flex items-center gap-2 text-sm transition-colors',
        met ? 'text-green-600' : 'text-muted-foreground'
      )}
    >
      {met ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <X className="h-4 w-4" aria-hidden="true" />
      )}
      <span>{label}</span>
    </li>
  );
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { requirements } = validatePassword(password);

  return (
    <div className="mt-2 space-y-1">
      <p className="text-sm font-medium text-muted-foreground">
        Password requirements:
      </p>
      <ul className="space-y-1" aria-label="Password requirements">
        <RequirementItem
          label="At least 12 characters"
          met={requirements.minLength}
        />
        <RequirementItem
          label="One uppercase letter"
          met={requirements.hasUppercase}
        />
        <RequirementItem
          label="One lowercase letter"
          met={requirements.hasLowercase}
        />
        <RequirementItem label="One number" met={requirements.hasNumber} />
      </ul>
    </div>
  );
}
