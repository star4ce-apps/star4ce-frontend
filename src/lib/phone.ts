/**
 * Strict phone format: 10–15 digits; optional leading +.
 * US 11-digit must start with 1. Only digits, spaces, dashes, parentheses, dots allowed.
 */

export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

/** Return digits-only (10–15). Invalid returns null. */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let s = phone.trim();
  if (s.startsWith('+')) s = s.slice(1).trim();
  const digits = s.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    const ten = digits.slice(1);
    return ten.length === 10 ? ten : null;
  }
  if (digits.length >= 10 && digits.length <= 15) return digits;
  return null;
}

export function validatePhoneFormat(phone: string | null | undefined): boolean {
  return normalizePhone(phone) !== null;
}

/**
 * Format raw input as user types: (###) ###-#### (US 10-digit).
 * Strips non-digits and inserts () and - automatically. Caps at 10 digits for the mask.
 */
export function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export const PHONE_FORMAT_HELP = '10–15 digits; e.g. (123) 456-7890 or +1 123 456 7890';
