import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import axios, { fetcher } from '@/lib/api';
import { toast } from 'sonner';

const swrOptions = {
  revalidateIfStale: true,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
};

export function getAllTemplateGroups() {
  const url = `/company-grouping?type=TEMPLATE`;

  const { data, error } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      allGroups: error && (error as any).status === 404 ? [] : data?.data || [],
      isLoading: !data && !error,
    }),
    [data, error]
  );

  return memoizedValue;
}

export function getAllCampaignGroups() {
  const url = `/company-grouping?type=CAMPAIGN`;

  const { data, error } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      allGroups: error && (error as any).status === 404 ? [] : data?.data || [],
      isLoading: !data && !error,
    }),
    [data, error]
  );

  return memoizedValue;
}

export async function createGroup(params: { groupName: string; type: 'TEMPLATE' | 'CAMPAIGN' }) {
  try {
    const response = await axios.post('/company-grouping', params);
    if (response?.status === 200) {
      toast.success('Group created successfully');
      await mutate(`/company-grouping?type=${params.type}`);
    }
    return response;
  } catch (error: any) {
    toast.error(error?.response?.data?.message || error?.message || 'Failed to create group');
    return null;
  }
}

export async function updateGroup(id: string, params: { groupName: string; type: 'TEMPLATE' | 'CAMPAIGN' }) {
  try {
    const response = await axios.put(`/company-grouping/${id}`, params);
    if (response?.status === 200) {
      toast.success('Group updated successfully');
      await mutate(`/company-grouping?type=${params.type}`);
    }
    return response;
  } catch (error: any) {
    toast.error(error?.response?.data?.message || error?.message || 'Failed to update group');
    return null;
  }
}

export async function deleteGroup(id: string, type: 'TEMPLATE' | 'CAMPAIGN') {
  try {
    const response = await axios.delete(`/company-grouping/${id}`);
    if (response?.status === 200) {
      toast.success('Group deleted successfully');
      await mutate(`/company-grouping?type=${type}`);
    }
    return response;
  } catch (error: any) {
    toast.error(error?.response?.data?.message || error?.message || 'Failed to delete group');
    return null;
  }
}
