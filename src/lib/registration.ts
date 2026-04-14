/**
 * Must match backend REGISTRATION_ENABLED. Registration is off unless this is exactly "true".
 */
export function isRegistrationEnabled(): boolean {
  return process.env.NEXT_PUBLIC_REGISTRATION_ENABLED === "true";
}
