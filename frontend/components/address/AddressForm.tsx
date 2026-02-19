'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { addressService } from '@/lib/services/addressService';
import {
  validateFirstName,
  validateLastName,
  validateStreetLine1,
  validateStreetLine2,
  validateCity,
  validateState,
  validatePostalCode,
  validateCountryCode,
  validatePhone,
  validateLabel,
  validateAddressForm,
  type AddressFormErrors,
  type AddressFormFields,
} from '@/lib/validations/address';
import { ApiException } from '@/lib/api/exceptions';
import type { components } from '@/lib/api/types';

type Address = components['schemas']['Address'];

export interface AddressFormProps {
  initialData?: Address;
  onSuccess: (address: Address) => void;
  onCancel?: () => void;
}

const getInitialFormData = (initialData?: Address): AddressFormFields => ({
  label: initialData?.label ?? '',
  firstName: initialData?.firstName ?? '',
  lastName: initialData?.lastName ?? '',
  streetLine1: initialData?.streetLine1 ?? '',
  streetLine2: initialData?.streetLine2 ?? '',
  city: initialData?.city ?? '',
  state: initialData?.state ?? '',
  postalCode: initialData?.postalCode ?? '',
  countryCode: initialData?.countryCode ?? '',
  phone: initialData?.phone ?? '',
  isDefault: initialData?.isDefault ?? false,
});

export function AddressForm({ initialData, onSuccess, onCancel }: AddressFormProps) {
  const isEditMode = !!initialData?.id;

  const [formData, setFormData] = useState<AddressFormFields>(getInitialFormData(initialData));
  const [errors, setErrors] = useState<AddressFormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (field: keyof AddressFormFields, value: string | boolean) => {
    if (field === 'countryCode' && typeof value === 'string') {
      setFormData((prev) => ({ ...prev, [field]: value.toUpperCase() }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    // Clear error for the field when value changes
    if (touched[field] && typeof value === 'string') {
      const validationValue = field === 'countryCode' ? value.toUpperCase() : value;
      const fieldError = validateFieldByName(field as keyof AddressFormErrors, validationValue);
      setErrors((prev) => ({ ...prev, [field]: fieldError }));
    }
  };

  const validateFieldByName = (field: keyof AddressFormErrors, value: string): string | undefined => {
    switch (field) {
      case 'firstName': return validateFirstName(value).error;
      case 'lastName': return validateLastName(value).error;
      case 'streetLine1': return validateStreetLine1(value).error;
      case 'streetLine2': return validateStreetLine2(value).error;
      case 'city': return validateCity(value).error;
      case 'state': return validateState(value).error;
      case 'postalCode': return validatePostalCode(value).error;
      case 'countryCode': return validateCountryCode(value).error;
      case 'phone': return validatePhone(value).error;
      case 'label': return validateLabel(value).error;
      default: return undefined;
    }
  };

  const handleBlur = (field: keyof AddressFormErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value = String(formData[field] ?? '');
    const error = validateFieldByName(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isDefault: checked }));
  };

  const isFormValid = () => {
    return validateAddressForm(formData).isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!isFormValid()) return;

    setIsSubmitting(true);

    try {
      let result: Address;

      if (isEditMode && initialData?.id) {
        result = await addressService.update(initialData.id, {
          label: formData.label || undefined,
          firstName: formData.firstName,
          lastName: formData.lastName,
          streetLine1: formData.streetLine1,
          streetLine2: formData.streetLine2 || undefined,
          city: formData.city,
          state: formData.state || undefined,
          postalCode: formData.postalCode,
          countryCode: formData.countryCode,
          phone: formData.phone || undefined,
          isDefault: formData.isDefault,
        });
      } else {
        result = await addressService.create({
          label: formData.label || undefined,
          firstName: formData.firstName,
          lastName: formData.lastName,
          streetLine1: formData.streetLine1,
          streetLine2: formData.streetLine2 || undefined,
          city: formData.city,
          state: formData.state || undefined,
          postalCode: formData.postalCode,
          countryCode: formData.countryCode,
          phone: formData.phone || undefined,
          isDefault: formData.isDefault,
        });
      }

      onSuccess(result);
    } catch (error) {
      if (error instanceof ApiException && error.status === 409 && error.code === 'ADDRESS_LIMIT_EXCEEDED') {
        setApiError('You have reached the maximum number of addresses (10).');
      } else {
        setApiError('Failed to save address. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitLabel = isSubmitting ? 'Saving...' : isEditMode ? 'Update Address' : 'Save Address';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {apiError && (
        <Alert variant="destructive">
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      {/* Label (optional) */}
      <div className="space-y-2">
        <Label htmlFor="label">Label (optional)</Label>
        <Input
          id="label"
          type="text"
          placeholder="e.g. Home, Work"
          value={formData.label}
          onChange={(e) => handleChange('label', e.target.value)}
          onBlur={() => handleBlur('label')}
          aria-invalid={!!errors.label}
          aria-describedby={errors.label ? 'label-error' : undefined}
        />
        {errors.label && (
          <p id="label-error" className="text-sm text-destructive">
            {errors.label}
          </p>
        )}
      </div>

      {/* First Name + Last Name side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            onBlur={() => handleBlur('firstName')}
            aria-invalid={!!errors.firstName}
            aria-describedby={errors.firstName ? 'firstName-error' : undefined}
          />
          {errors.firstName && (
            <p id="firstName-error" className="text-sm text-destructive">
              {errors.firstName}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            onBlur={() => handleBlur('lastName')}
            aria-invalid={!!errors.lastName}
            aria-describedby={errors.lastName ? 'lastName-error' : undefined}
          />
          {errors.lastName && (
            <p id="lastName-error" className="text-sm text-destructive">
              {errors.lastName}
            </p>
          )}
        </div>
      </div>

      {/* Street Address */}
      <div className="space-y-2">
        <Label htmlFor="streetLine1">Street Address</Label>
        <Input
          id="streetLine1"
          type="text"
          placeholder="123 Main St"
          value={formData.streetLine1}
          onChange={(e) => handleChange('streetLine1', e.target.value)}
          onBlur={() => handleBlur('streetLine1')}
          aria-invalid={!!errors.streetLine1}
          aria-describedby={errors.streetLine1 ? 'streetLine1-error' : undefined}
        />
        {errors.streetLine1 && (
          <p id="streetLine1-error" className="text-sm text-destructive">
            {errors.streetLine1}
          </p>
        )}
      </div>

      {/* Apartment / Suite (optional) */}
      <div className="space-y-2">
        <Label htmlFor="streetLine2">Apartment, suite, etc. (optional)</Label>
        <Input
          id="streetLine2"
          type="text"
          placeholder="Apt 4B"
          value={formData.streetLine2}
          onChange={(e) => handleChange('streetLine2', e.target.value)}
          onBlur={() => handleBlur('streetLine2')}
          aria-invalid={!!errors.streetLine2}
          aria-describedby={errors.streetLine2 ? 'streetLine2-error' : undefined}
        />
        {errors.streetLine2 && (
          <p id="streetLine2-error" className="text-sm text-destructive">
            {errors.streetLine2}
          </p>
        )}
      </div>

      {/* City + State side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            type="text"
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
            onBlur={() => handleBlur('city')}
            aria-invalid={!!errors.city}
            aria-describedby={errors.city ? 'city-error' : undefined}
          />
          {errors.city && (
            <p id="city-error" className="text-sm text-destructive">
              {errors.city}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State / Province (optional)</Label>
          <Input
            id="state"
            type="text"
            value={formData.state}
            onChange={(e) => handleChange('state', e.target.value)}
            onBlur={() => handleBlur('state')}
            aria-invalid={!!errors.state}
            aria-describedby={errors.state ? 'state-error' : undefined}
          />
          {errors.state && (
            <p id="state-error" className="text-sm text-destructive">
              {errors.state}
            </p>
          )}
        </div>
      </div>

      {/* Postal Code + Country Code side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="postalCode">Postal Code</Label>
          <Input
            id="postalCode"
            type="text"
            value={formData.postalCode}
            onChange={(e) => handleChange('postalCode', e.target.value)}
            onBlur={() => handleBlur('postalCode')}
            aria-invalid={!!errors.postalCode}
            aria-describedby={errors.postalCode ? 'postalCode-error' : undefined}
          />
          {errors.postalCode && (
            <p id="postalCode-error" className="text-sm text-destructive">
              {errors.postalCode}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="countryCode">Country Code</Label>
          <Input
            id="countryCode"
            type="text"
            placeholder="US"
            maxLength={2}
            value={formData.countryCode}
            onChange={(e) => handleChange('countryCode', e.target.value)}
            onBlur={() => handleBlur('countryCode')}
            aria-invalid={!!errors.countryCode}
            aria-describedby={errors.countryCode ? 'countryCode-error' : undefined}
          />
          {errors.countryCode && (
            <p id="countryCode-error" className="text-sm text-destructive">
              {errors.countryCode}
            </p>
          )}
        </div>
      </div>

      {/* Phone (optional) */}
      <div className="space-y-2">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+1-555-555-5555"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          onBlur={() => handleBlur('phone')}
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? 'phone-error' : undefined}
        />
        {errors.phone && (
          <p id="phone-error" className="text-sm text-destructive">
            {errors.phone}
          </p>
        )}
      </div>

      {/* isDefault checkbox */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="isDefault"
          checked={formData.isDefault}
          onCheckedChange={handleCheckboxChange}
        />
        <Label htmlFor="isDefault" className="cursor-pointer font-normal">
          Set as default address
        </Label>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button type="submit" disabled={!isFormValid() || isSubmitting}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
