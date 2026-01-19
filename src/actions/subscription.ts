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

export function getSubscriptionStatus() {
  const url = endpoints.subscription.status;

  const { data } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      subscriptionStatus: data?.data || [],
      isLoading: !data,
    }),
    [data]
  );

  return memoizedValue;
}

export function getActiveSubscriptions() {
  const url = endpoints.subscription.active;

  const { data, isLoading } = useSWR(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      activeSubscriptions: data?.data || [],
      isPurchasedRemoveReference: Array.isArray(data?.data)
        ? data.data.some(
            (plan: any) => plan.productId === import.meta.env.VITE_REMOVE_REF_PLAN_ID
          )
        : false,
      isSubscriptionLoading: isLoading,
    }),
    [data, isLoading]
  );

  return memoizedValue;
}
