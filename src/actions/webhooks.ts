import { useMemo } from 'react';
import useSWR from 'swr';
import axios from '@/lib/api';
import { toast } from 'sonner';

const swrOptions = {
  revalidateIfStale: true,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
};

// ----------------------------------------------------------------------

export function getAllAccessTokens() {
  const url = `/access-tokens/all`;

  const { data, mutate } = useSWR(url, (url) => axios.get(url).then((res) => res.data), swrOptions);

  const memoizedValue = useMemo(
    () => ({
      allAccessTokens: data?.data || [],
      isLoading: !data && !data,
      mutate,
    }),
    [data, mutate]
  );

  return memoizedValue;
}

export async function createAccessToken(params: { title: string }) {
  try {
    const url = '/access-tokens';
    const res = await axios.post(url, params);
    toast.success(res?.data?.message || 'API key created successfully');
    return res.data;
  } catch (error: any) {
    console.error('Error creating access token:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to create API key');
    return null;
  }
}

export async function deleteAccessToken(id: string) {
  try {
    const url = `/access-tokens/${id}`;
    const res = await axios.delete(url);
    toast.success(res?.data?.message || 'API key revoked successfully');
    return res.data;
  } catch (error: any) {
    console.error('Error deleting access token:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to revoke API key');
    return null;
  }
}
