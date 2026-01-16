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

// For fetching with parameters (POST)
export async function getDashboardStats(params?: any) {
  const url = endpoints.dashboard.dashboardStats;
  try {
    const res = await axios.post(url, params || {});
    return res;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

// For initial stats fetch - defaults to daily view
export function useDashboardStats() {
  const url = endpoints.dashboard.dashboardStats;

  // Custom fetcher for POST request with default daily scope
  const customFetcher = async (url: string) => {
    const today = new Date();
    const params = {
      graphScope: {
        daily: {
          month: today.toLocaleString('default', { month: 'short' }),
          year: today.getFullYear(),
        },
      },
    };
    const res = await axios.post(url, params);
    return res.data;
  };

  const { data, error } = useSWR(url, customFetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      dashboardStats: data?.data || null,
      isLoading: !error && !data,
      error,
    }),
    [data, error]
  );

  return memoizedValue;
}
