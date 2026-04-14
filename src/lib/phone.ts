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
 * Format raw input as user types.
 *
 * Behaviour:
 * - 10 digits: US local format → (###) ###-####
 * - >10 digits: treat the extra leading digits as country code and render:
 *     +<country> (###) ###-####
 *   where the last 10 digits are formatted as US local.
 * - Always strips non-digits and caps at 15 digits total.
 */
export function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 15);
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // More than 10 digits: treat the leading digits as country code,
  // and format the last 10 as a US-style local number.
  const country = digits.slice(0, digits.length - 10);
  const local = digits.slice(-10);
  const localFormatted = `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
  return `+${country} ${localFormatted}`;
}

export const PHONE_FORMAT_HELP = '10–15 digits; e.g. (123) 456-7890 or +1 123 456 7890';
