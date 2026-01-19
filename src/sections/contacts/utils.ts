// ----------------------------------------------------------------------

export function formatKeyName(key: string): string {
  // Convert camelCase or snake_case to Title Case
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

export function isApplePrivateRelayEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') return false;
  return /@privaterelay\.appleid\.com\s*$/i.test(email.trim());
}
