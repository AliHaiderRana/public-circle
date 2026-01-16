import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import axios, { fetcher, endpoints } from '@/lib/api';
import { toast } from 'sonner';

// ----------------------------------------------------------------------

const enableServer = true;

const swrOptions = {
  revalidateIfStale: enableServer,
  revalidateOnFocus: enableServer,
  revalidateOnReconnect: enableServer,
};

// ----------------------------------------------------------------------

export function getAllConfigurations() {
  const url = endpoints.configurations.configuration;

  const { data } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      allConfigurations: data?.data,
      isLoading: !data,
    }),
    [data]
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

  const { data } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      verifiedEmails: data?.data || [],
      isLoading: !data,
    }),
    [data]
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
