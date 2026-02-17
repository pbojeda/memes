/**
 * Converts a plain-text string into a URL-safe slug.
 *
 * Algorithm:
 * 1. Normalise to NFD (decomposed) form and strip diacritic combining marks
 * 2. Lowercase
 * 3. Replace any character that is not a lowercase letter or digit with a hyphen
 * 4. Collapse runs of consecutive hyphens into a single hyphen
 * 5. Strip leading/trailing hyphens
 * 6. If the result is empty, fall back to 'product'
 *
 * Output always satisfies /^[a-z0-9]+(?:-[a-z0-9]+)*$/ or equals 'product'.
 */
export function generateSlug(text: string): string {
  const slug = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritic combining marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumeric → hyphen
    .replace(/-+/g, '-') // collapse consecutive hyphens
    .replace(/^-|-$/g, ''); // strip leading/trailing hyphens

  return slug || 'product';
}
