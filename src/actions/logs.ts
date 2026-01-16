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

export function getAllCampaignLogs(params?: string) {
  let url = endpoints.logs.logs;
  if (params) {
    url += `?${params}`;
  }

  const { data } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => {
      // Handle paginated response structure: { totalRecords, campaignLogs }
      const responseData = data?.data;
      const logs = responseData?.campaignLogs || (Array.isArray(responseData) ? responseData : []);
      const totalRecords = responseData?.totalRecords || logs.length;
      
      return {
        allLogs: logs,
        totalRecords,
        isLoading: !data,
      };
    },
    [data]
  );

  return memoizedValue;
}

export function getCampaignLogs(params?: string) {
  let url = endpoints.logs.logs;
  if (params) {
    url += `?${params}`;
  }

  const { data } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      logs: data?.data,
    }),
    [data]
  );

  return memoizedValue;
}

export async function getCampaignLogById(id: string) {
  try {
    const response = await axios.get(`${endpoints.logs.logs}/${id}`);
    return response;
  } catch (error: any) {
    console.error('Error fetching log:', error);
    toast.error(error?.message);
    return null;
  }
}

export async function getMessageLogs(params?: string) {
  try {
    let url = `${endpoints.logs.logs}/messages`;
    if (params) {
      url += `?${params}`;
    }
    const response = await axios.get(url);
    return response;
  } catch (error: any) {
    console.error('Error fetching message logs:', error);
    toast.error(error?.message);
    return null;
  }
}
