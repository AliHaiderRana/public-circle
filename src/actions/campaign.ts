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

export async function getPaignatedCampaigns(params?: string) {
  try {
    let url = `/campaigns`;
    if (params) {
      url += `/${params}`;
    }
    const response = await axios.get(url);
    return response;
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    toast.error(error?.message);
    return null;
  }
}

export function getAllCampaigns(page = 1, pageSize = 10, status?: string, search?: string) {
  const params = new URLSearchParams({
    pageNumber: page.toString(),
    pageSize: pageSize.toString(),
  });

  if (status && status !== 'all') {
    params.append('status', status);
  }

  if (search && search.trim()) {
    params.append('search', search.trim());
  }

  const url = `/campaigns?${params.toString()}`;

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      allCampaigns: Array.isArray(data?.data?.allCampaigns) ? data.data.allCampaigns : [],
      totalCount: data?.data?.totalRecords || 0,
      isLoading: isLoading,
      error: error,
    }),
    [data, error, isLoading]
  );

  return memoizedValue;
}

export function getAllGroups() {
  const url = `/company-grouping?type=CAMPAIGN`;

  const { data, error } = useSWR(url, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  const memoizedValue = useMemo(
    () => ({
      allGroups: error && (error as any).status === 404 ? [] : data?.data,
    }),
    [data, error]
  );

  return memoizedValue;
}

export async function runCampaign(params: any) {
  try {
    const response = await axios.post('/campaigns', params);
    return response;
  } catch (error: any) {
    console.error('Error running campaign:', error);
    return error;
  }
}

export async function updateCampaign(id: string, params: any) {
  try {
    const response = await axios.patch(`/campaigns/${id}`, params);
    return response;
  } catch (error: any) {
    console.error('Error updating campaign:', error);
    toast.error(error?.message);
    return null;
  }
}

export async function getCampaignById(id: string) {
  try {
    const response = await axios.get(`/campaigns/${id}`);
    return response;
  } catch (error: any) {
    console.error('Error fetching campaign:', error);
    toast.error(error?.message);
    return null;
  }
}

export async function deleteCampaign(id: string) {
  try {
    const response = await axios.delete(`/campaigns/${id}`);
    return response;
  } catch (error: any) {
    console.error('Error deleting campaign:', error);
    toast.error(error?.message);
    return null;
  }
}
