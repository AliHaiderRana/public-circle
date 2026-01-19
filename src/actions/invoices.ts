import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import axios, { fetcher, endpoints } from '@/lib/api';

// ----------------------------------------------------------------------

const enableServer = true;

const swrOptions = {
  revalidateIfStale: enableServer,
  revalidateOnFocus: enableServer,
  revalidateOnReconnect: enableServer,
};

// ----------------------------------------------------------------------

export function getOverageQuota() {
  const url = endpoints.invoices.overageQuota;

  const { data, error } = useSWR(url, fetcher, {
    ...swrOptions,
    onError: (err) => {
      // Silently handle 404 errors - endpoint might not be available
      if (err?.response?.status !== 404) {
        console.error('Error fetching overage quota:', err);
      }
    },
  });

  const memoizedValue = useMemo(
    () => ({
      quota: data?.data || null,
      error: error?.response?.status === 404 ? null : error, // Ignore 404 errors
    }),
    [data, error]
  );

  return memoizedValue;
}
