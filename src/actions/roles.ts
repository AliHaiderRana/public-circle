import { useMemo } from 'react';
import useSWR from 'swr';
import axios, { fetcher } from '@/lib/api';
import { toast } from 'sonner';

const enableServer = true;

const swrOptions = {
  revalidateIfStale: enableServer,
  revalidateOnFocus: enableServer,
  revalidateOnReconnect: enableServer,
};

export function getAllRoles() {
  const url = `/roles/all`;

  const { data, isLoading } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      allRoles: data?.data || [],
      isLoading,
    }),
    [data, isLoading]
  );

  return memoizedValue;
}

export async function deleteRole(id: string) {
  try {
    const response = await axios.delete(`/roles/${id}`);
    return response;
  } catch (error: any) {
    console.error('Error deleting role:', error);
    toast.error(error?.message);
    throw error;
  }
}
