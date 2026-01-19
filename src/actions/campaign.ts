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

export function getAllCampaigns(
  page = 1,
  pageSize = 10,
  status?: string,
  search?: string,
  sortBy?: string,
  sortOrder?: 'ASC' | 'DSC',
  companyGroupingIds?: string,
  archiveFilter?: 'active' | 'archived'
) {
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

  if (sortBy) {
    params.append('sortBy', sortBy);
  }

  if (sortOrder) {
    params.append('sortOrder', sortOrder);
  }

  if (companyGroupingIds) {
    params.append('companyGroupingIds', companyGroupingIds);
  }

  if (archiveFilter === 'archived') {
    params.append('status', 'ARCHIVED');
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

export async function archiveCampaign(id: string, isArchived: boolean) {
  try {
    const response = await axios.post(`/campaigns/${id}/archive`, { isArchived });
    return response;
  } catch (error: any) {
    console.error('Error archiving campaign:', error);
    toast.error(error?.message);
    return null;
  }
}

export async function getCampaignIdCompany() {
  try {
    const response = await axios.get(`/campaigns/company-campaign-id`);
    return response;
  } catch (error: any) {
    console.error('Error fetching campaign company ID:', error);
    toast.error(error?.message);
    return null;
  }
}

export async function getCampaignSegmentCounts(campaignId: string) {
  try {
    const response = await axios.get(`/campaigns/${campaignId}/segment-counts`);
    return response;
  } catch (error: any) {
    console.error('Error fetching segment counts:', error);
    toast.error(error?.message);
    return null;
  }
}

export async function getSegmentCounts(segmentIds: string[]) {
  try {
    const response = await axios.post('/company-contacts/get-segment-count', {
      segmentIds,
    });
    return response;
  } catch (error: any) {
    console.error('Error fetching segment counts:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to fetch segment counts');
    return null;
  }
}
