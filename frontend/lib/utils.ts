import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extract a display string from a localized name field.
 * The backend stores names as `{ es: "..." }` (LocalizedString).
 * Since i18n is deferred (ADR-003), this extracts the first available value.
 */
export function getLocalizedName(name: string | Record<string, string> | undefined, fallback = ''): string {
  if (!name) return fallback;
  if (typeof name === 'string') return name;
  const values = Object.values(name);
  return values[0] ?? fallback;
}

/**
 * Extract a locale-specific string from a localized field.
 * Used in admin forms where fields are stored as JSONB {es: "...", en: "..."}.
 *
 * When value is a plain string (backward-compat: API may return a pre-localized string),
 * it is returned as-is regardless of the requested locale. Callers should be aware that
 * this means all locale slots receive the same string in the plain-string case.
 *
 * @param value - The field value (string, localized object, or undefined)
 * @param locale - The locale key to extract
 * @param fallback - Value to return when not found (defaults to '')
 */
export function getLocalizedField(
  value: string | Record<string, string> | undefined,
  locale: 'es' | 'en',
  fallback = ''
): string {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  return value[locale] ?? fallback;
}

/**
 * Format price as EUR currency in Spanish locale.
 * Single-market EUR store — hardcoded per business requirements (MVP scope).
 * @param price - The numeric price to format
 * @returns Formatted price string (e.g., "24,99 €")
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}
