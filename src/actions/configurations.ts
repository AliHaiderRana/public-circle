import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import axios, { fetcher, endpoints } from '@/lib/api';
import { toast } from 'sonner';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: true,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 10000, // 10 seconds - prevents duplicate requests within this window
  focusThrottleInterval: 30000, // 30 seconds - throttle focus revalidation
};

// ----------------------------------------------------------------------

export function getAllConfigurations() {
  const url = endpoints.configurations.configuration;

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => {
      const emailConfigurations = data?.data?.emailConfigurations;

      // Check if all addresses and active domain addresses have Apple Relay verified
      const appleRelayVerified =
        emailConfigurations?.addresses?.every(
          (item: any) => item.privateRelayVerificationStatus === 'VERIFIED'
        ) &&
        emailConfigurations?.domains?.every((domain: any) => {
          const activeAddresses =
            domain?.addresses?.filter((addr: any) => addr.status === 'ACTIVE') || [];
          return (
            activeAddresses.length === 0 ||
            activeAddresses.every((addr: any) => addr.privateRelayVerificationStatus === 'VERIFIED')
          );
        });

      // isLoading is only true on first load when there's no data yet
      // Subsequent revalidations won't show loading state
      return {
        allConfigurations: emailConfigurations,
        isLoading: isLoading && !data,
        error,
        appleRelayVerified: appleRelayVerified ?? false,
      };
    },
    [data, error, isLoading]
  );

  return memoizedValue;
}

export async function verifyDomain(params: any) {
  try {
    const response = await axios.post(endpoints.configurations.domainCreation, params);
    return response;
  } catch (error: any) {
    console.error('Error verifying domain:', error);
    toast.error(error?.message);
    return null;
  }
}

export async function createEmailAddress(params: any) {
  try {
    const response = await axios.post(endpoints.configurations.emailCreation, params);
    return response;
  } catch (error: any) {
    console.error('Error creating email address:', error);
    toast.error(error?.message);
    return null;
  }
}

export async function deleteEmailAddress(id: string) {
  try {
    const response = await axios.delete(`${endpoints.configurations.deleteEmail}${id}`);
    return response;
  } catch (error: any) {
    console.error('Error deleting email address:', error);
    toast.error(error?.message);
    return null;
  }
}

export async function deleteDomain(emailDomain: string) {
  try {
    const response = await axios.delete(`${endpoints.configurations.deleteDomain}${emailDomain}`);
    return response;
  } catch (error: any) {
    console.error('Error deleting domain:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to delete domain');
    return null;
  }
}

export async function checkVerificationStatus() {
  try {
    const response = await axios.get(endpoints.configurations.checkVerificationStatus);
    return response;
  } catch (error: any) {
    console.error('Error checking verification status:', error);
    return null;
  }
}

export function getAllVerifiedEmails() {
  const url = endpoints.configurations.verifiedEmails;

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      verifiedEmails: data?.data || [],
      // isLoading only true on first load, not on revalidation
      isLoading: isLoading && !data,
      error,
    }),
    [data, error, isLoading]
  );

  return memoizedValue;
}

export async function deleteEmail(id: string) {
  return deleteEmailAddress(id);
}

export async function checkDomainVerification(emailDomain: string) {
  try {
    // Note: This endpoint uses GET with body, which is unusual but matches the server route
    const response = await axios.post(endpoints.configurations.domainCreation.replace('/domain', '/domain-name/verify'), {
      emailDomain,
    });
    return response;
  } catch (error: any) {
    console.error('Error checking domain verification:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to verify domain');
    return null;
  }
}

export async function verifyAppleRelay(senderEmail: string) {
  try {
    const response = await axios.post(endpoints.configurations.verifyAppleRelay, {
      senderEmail,
    });
    toast.success('Apple Relay verification email sent successfully');
    return response;
  } catch (error: any) {
    console.error('Error verifying Apple Relay:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to verify Apple Relay');
    return null;
  }
}

export async function disablePrivateRelay(emailAddress: string) {
  try {
    const response = await axios.post(endpoints.configurations.disablePrivateRelay, {
      emailAddress,
    });
    toast.success('Apple Relay disabled successfully');
    return response;
  } catch (error: any) {
    console.error('Error disabling Apple Relay:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to disable Apple Relay');
    return null;
  }
}

export async function recheckDomainVerification(emailDomain: string) {
  try {
    // Recheck by calling verifyDomain again to get updated DNS info
    const response = await axios.post(endpoints.configurations.domainCreation, {
      emailDomain,
    });
    return response;
  } catch (error: any) {
    console.error('Error rechecking domain verification:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to recheck domain');
    return null;
  }
}
