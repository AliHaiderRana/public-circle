import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import axios, { fetcher, endpoints } from '@/lib/api';

// ----------------------------------------------------------------------

const enableServer = true;

const swrOptions = {
  revalidateIfStale: enableServer,
  revalidateOnFocus: enableServer,
  revalidateOnReconnect: enableServer,
  shouldRetryOnError: false, // Don't retry on error (like 400)
};

// ----------------------------------------------------------------------

export function getSubscriptionStatus() {
  const url = endpoints.subscription.status;

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      subscriptionStatus: data?.data || [],
      isLoading: isLoading && !error,
      error,
    }),
    [data, isLoading, error]
  );

  return memoizedValue;
}

export function getActiveSubscriptions() {
  const url = endpoints.subscription.active;

  const { data, error, isLoading } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      activeSubscriptions: data?.data || [],
      isPurchasedRemoveReference: Array.isArray(data?.data)
        ? data.data.some(
            (plan: any) => plan.productId === import.meta.env.VITE_REMOVE_REF_PLAN_ID
          )
        : false,
      isSubscriptionLoading: isLoading && !error,
      error,
    }),
    [data, isLoading, error]
  );

  return memoizedValue;
}

// Async function to check subscription status (for overlay)
export async function fetchSubscriptionStatus() {
  try {
    const response = await axios.get(endpoints.subscription.status, { timeout: 10000 });
    return response?.data?.data || [];
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return [];
  }
}
