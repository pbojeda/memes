'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { promoCodeService } from '@/lib/services/promoCodeService';
import type { PromoCodeValidationData } from '@/lib/services/promoCodeService';
import { ApiException } from '@/lib/api/exceptions';
import { formatPrice } from '@/lib/utils';

export type PromoCodeResult = PromoCodeValidationData;

export interface PromoCodeInputProps {
  orderTotal?: number;
  onApply?: (result: PromoCodeResult) => void;
  onRemove?: () => void;
}

type ComponentState = 'idle' | 'input' | 'loading' | 'applied' | 'error';

export function PromoCodeInput({ orderTotal, onApply, onRemove }: PromoCodeInputProps) {
  const [code, setCode] = useState('');
  const [state, setState] = useState<ComponentState>('idle');
  const [appliedResult, setAppliedResult] = useState<PromoCodeValidationData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setCode(value);
    setState(value.trim() ? 'input' : 'idle');
    if (state === 'error') setErrorMessage(null);
  };

  const handleApply = async () => {
    if (!code.trim() || state === 'loading') return;

    setState('loading');
    setErrorMessage(null);

    try {
      const result = await promoCodeService.validate(code.trim(), orderTotal);

      if (result.valid) {
        setAppliedResult(result);
        setState('applied');
        onApply?.(result);
      } else {
        setErrorMessage(result.message ?? 'Invalid promo code');
        setState('error');
      }
    } catch (error) {
      if (error instanceof ApiException) {
        setErrorMessage('Invalid promo code. Please check and try again.');
      } else {
        setErrorMessage('Could not apply promo code. Please try again.');
      }
      setState('error');
    }
  };

  const handleRemove = () => {
    setCode('');
    setAppliedResult(null);
    setErrorMessage(null);
    setState('idle');
    onRemove?.();
  };

  const isLoading = state === 'loading';
  const isApplied = state === 'applied';
  const hasError = state === 'error';
  const isButtonDisabled = !code.trim() || isLoading;

  if (isApplied && appliedResult) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{appliedResult.code}</Badge>
              {appliedResult.discountType && appliedResult.discountValue !== undefined && (
                <span className="text-sm text-muted-foreground">
                  {appliedResult.discountType === 'PERCENTAGE'
                    ? `${appliedResult.discountValue}% off`
                    : `${formatPrice(appliedResult.discountValue!)} off`}
                </span>
              )}
            </div>
            {appliedResult.calculatedDiscount !== undefined && (
                <span className="text-sm font-medium text-green-700">
                  -{formatPrice(appliedResult.calculatedDiscount)} saved
                </span>
              )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
          >
            Remove
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="promo-code">Promo Code</Label>
      <div className="flex gap-2">
        <Input
          id="promo-code"
          type="text"
          placeholder="Enter promo code"
          value={code}
          onChange={handleChange}
          disabled={isLoading}
          aria-invalid={hasError}
          aria-describedby={hasError ? 'promo-code-error' : undefined}
        />
        <Button
          type="button"
          onClick={handleApply}
          disabled={isButtonDisabled}
        >
          {isLoading ? 'Applying...' : 'Apply'}
        </Button>
      </div>
      {hasError && errorMessage && (
        <Alert variant="destructive">
          <AlertDescription id="promo-code-error">{errorMessage}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
