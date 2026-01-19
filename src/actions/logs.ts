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

export async function getCampaignRuns(campaignId: string, pageNumber = 1, pageSize = 10) {
  try {
    const response = await axios.get(
      `/campaigns-run/${campaignId}?pageNumber=${pageNumber}&pageSize=${pageSize}`
    );
    return response;
  } catch (error: any) {
    console.error('Error fetching campaign runs:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to fetch campaign runs');
    return null;
  }
}

export async function getCampaignRunsStats(campaignId: string, params?: any) {
  try {
    const response = await axios.post(`/campaigns-run/get-stats/${campaignId}`, params || {});
    return response;
  } catch (error: any) {
    console.error('Error fetching campaign run stats:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to fetch campaign run stats');
    return null;
  }
}

const noCacheHeaders = {
  'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
  Pragma: 'no-cache',
};

export async function getCampaignRunEmails(params: string) {
  try {
    const response = await axios.get(`/campaigns-run/emails-sent/${params}`, { headers: noCacheHeaders });
    return response;
  } catch (error: any) {
    console.error('Error fetching campaign run emails:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to fetch campaign run emails');
    return null;
  }
}

export async function getCampaignRunEmailsFromWarehouse(params: string) {
  try {
    const response = await axios.get(`/campaigns-run/emails-sent/warehouse/${params}`, { headers: noCacheHeaders });
    return response;
  } catch (error: any) {
    console.error('Error fetching warehouse emails:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to fetch warehouse emails');
    return null;
  }
}

export async function getCampaignMessageStats(runId: string, params?: any) {
  try {
    const response = await axios.post(`/campaigns-run/emails-sent/get-stats/${runId}`, params || {});
    return response;
  } catch (error: any) {
    console.error('Error fetching campaign message stats:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to fetch campaign message stats');
    return null;
  }
}

export async function resendCampaignEmails(payload: {
  campaignId: string;
  campaignRunId: string;
  toEmailAddresses: string[];
  eventType: string;
}) {
  try {
    const response = await axios.post('/campaigns/resend-email', payload);
    return response;
  } catch (error: any) {
    console.error('Error resending emails:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Failed to resend emails');
    return null;
  }
}
