/**
 * Account Restrictions Utility
 * Utility functions for checking account restrictions based on SES status
 */

interface User {
  company?: {
    sesComplaintStatus?: string;
    sesBounceStatus?: string;
    status?: string;
  };
}

/**
 * Check if account has SES restrictions (RISK or BLOCK status)
 * @param user - User object from auth context
 * @returns boolean indicating if account is restricted
 */
export function isAccountRestricted(user: User | null | undefined): boolean {
  if (!user?.company) return false;

  const complaintStatus = user.company.sesComplaintStatus?.toUpperCase();
  const bounceStatus = user.company.sesBounceStatus?.toUpperCase();

  return (
    ['RISK', 'BLOCK', 'BLOCKED'].includes(complaintStatus || '') ||
    ['RISK', 'BLOCK', 'BLOCKED'].includes(bounceStatus || '')
  );
}

/**
 * Get combined account status from complaint and bounce statuses
 * Priority: BLOCK > RISK > WARNING > HEALTHY
 * @param user - User object from auth context
 * @returns Combined status string or null if no status
 */
export function getCombinedAccountStatus(user: User | null | undefined): 'BLOCKED' | 'RISK' | 'WARNING' | 'HEALTHY' | null {
  if (!user?.company) return null;

  const complaintStatus = user.company.sesComplaintStatus?.toUpperCase();
  const bounceStatus = user.company.sesBounceStatus?.toUpperCase();

  // BLOCK takes highest precedence
  if (complaintStatus === 'BLOCK' || complaintStatus === 'BLOCKED' || 
      bounceStatus === 'BLOCK' || bounceStatus === 'BLOCKED') {
    return 'BLOCKED';
  }

  // RISK takes second precedence
  if (complaintStatus === 'RISK' || bounceStatus === 'RISK') {
    return 'RISK';
  }

  // WARNING takes third precedence
  if (complaintStatus === 'WARNING' || bounceStatus === 'WARNING') {
    return 'WARNING';
  }

  // HEALTHY is default
  if (complaintStatus === 'HEALTHY' || bounceStatus === 'HEALTHY') {
    return 'HEALTHY';
  }

  return null;
}

/**
 * Check if account is suspended
 * @param user - User object from auth context
 * @returns boolean indicating if account is suspended
 */
export function isAccountSuspended(user: User | null | undefined): boolean {
  return user?.company?.status?.toUpperCase() === 'SUSPENDED';
}

/**
 * Get restriction message based on account status
 * @param user - User object from auth context
 * @returns Restriction message or null if no restriction
 */
export function getRestrictionMessage(user: User | null | undefined): string | null {
  if (!user) return null;

  if (isAccountSuspended(user)) {
    return 'Your account has been suspended. Please contact support to resolve this issue.';
  }

  const status = getCombinedAccountStatus(user);
  
  switch (status) {
    case 'BLOCKED':
      return 'Resending is disabled because your account is Blocked.';
    case 'RISK':
      return 'Resending is restricted because your account has Risk status.';
    case 'WARNING':
      return 'Your account has Warning status. Please monitor your email performance.';
    default:
      return null;
  }
}