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

export async function updateFilter(id: string, params: any) {
  const response = await axios.patch(`${endpoints.filters.filters}/${id}`, params);
  return response;
}

export async function createFilter(params: any) {
  try {
    const response = await axios.post(endpoints.filters.filters, params);
    return response;
  } catch (error: any) {
    console.error('Error creating filter:', error);
    toast.error(error?.message);
    throw error;
  }
}

export async function deleteFilter(id: string) {
  const url = `${endpoints.filters.filters}/${id}`;
  const res = await axios.delete(url);
  return res;
}

export async function getPaginatedFilters(params: string) {
  try {
    const response = await axios.get(`${endpoints.filters.filters}${params}`);
    return response;
  } catch (error: any) {
    console.error('Error fetching paginated filters:', error);
    toast.error(error?.message);
    throw error;
  }
}

export function getFilterKeys() {
  const url = `${endpoints.filters.filterTypes}`;

  const { data } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      filterKeysData: data,
      mergedTags: data?.data?.map((key: string) => ({ name: key, value: `{{${key}}}` })) || [],
    }),
    [data]
  );

  return memoizedValue;
}

export function getFilterValues(key: string) {
  const url = `${endpoints.filters.filterValues}?key=${key}`;

  const { data } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      filterValues: data,
    }),
    [data]
  );

  return memoizedValue;
}

export function getAllFilters() {
  const url = `${endpoints.filters.filters}/all`;

  const { data } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      allFilters: data?.data,
    }),
    [data]
  );

  return memoizedValue;
}

export async function getFilterCount(params: any) {
  try {
    const response = await axios.post(endpoints.filters.filterCount, params);
    return response;
  } catch (error: any) {
    console.error('Error fetching filter count:', error);
    toast.error(error?.message);
    return null;
  }
}

export async function sendInteractions(params: any) {
  try {
    const response = await axios.post('/company-contacts/send-interactions', params);
    return response;
  } catch (error: any) {
    console.error('Error sending interactions:', error);
    toast.error(error?.message);
    return null;
  }
}

export async function sendTestEmail(params: any) {
  try {
    const response = await axios.post('/company-contacts/send-test-email', params);
    return response;
  } catch (error: any) {
    console.error('Error sending test email:', error);
    toast.error(error?.message);
    return null;
  }
}

export async function getVerifiedEmails() {
  try {
    const response = await axios.get(endpoints.configurations.verifiedEmails);
    return response;
  } catch (error: any) {
    console.error('Error fetching verified emails:', error);
    return null;
  }
}
